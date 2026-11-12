// Claude 안의 "라이더 마을" 아티팩트용 스냅샷 생성기
// byanra.com 공개 API만 읽음 (서버 접속·쓰기 없음). 결과 JSON을 stdout으로 출력.
// 사용: node ops/town-snapshot.mjs > snapshot.json

const SITE = process.env.BYANRA_URL ?? "https://byanra.com";
const DAY = 24 * 60 * 60 * 1000;

async function get(path, key) {
  const res = await fetch(`${SITE}/api/${path}`, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  const json = await res.json();
  return Array.isArray(json[key]) ? json[key] : [];
}

const within = (iso, days, now) => {
  const t = new Date(iso ?? "").getTime();
  return !Number.isNaN(t) && t <= now && now - t < days * DAY;
};
const comments = (x) => (Array.isArray(x.comments) ? x.comments : []);
const short = (s, n = 18) => {
  const v = String(s ?? "").trim();
  return v.length > n ? `${v.slice(0, n)}…` : v;
};

// 서버 건강 검진: 첫 화면 응답 속도와 https 인증서 만료일. 등대 불빛(good/warn/bad)으로 표시됨
async function checkHealth() {
  const problems = [];
  let ms = null;
  let httpStatus = null;
  const t0 = Date.now();
  try {
    const res = await fetch(SITE, { signal: AbortSignal.timeout(15000) });
    ms = Date.now() - t0;
    httpStatus = res.status;
    if (!res.ok) problems.push(`첫 화면이 HTTP ${res.status} 오류를 냄`);
    // 클라우드는 해외에서 접속해 국내보다 1초 이상 느리게 나오므로 4초를 기준으로 봄
    else if (ms > 4000) problems.push(`첫 화면 응답이 ${(ms / 1000).toFixed(1)}초로 느림`);
  } catch {
    problems.push("사이트가 응답하지 않음");
  }
  // 클라우드처럼 보안 프록시를 거치면 프록시의 인증서가 보이므로, 공인 인증기관이 발급한 것일 때만 만료일을 믿음
  let certDays = null;
  let certNote = null;
  try {
    const { connect } = await import("node:tls");
    const host = new URL(SITE).hostname;
    const cert = await new Promise((resolve, reject) => {
      const socket = connect({ host, port: 443, servername: host, timeout: 10000, rejectUnauthorized: false }, () => {
        const c = socket.getPeerCertificate();
        socket.end();
        resolve(c);
      });
      socket.on("timeout", () => socket.destroy(new Error("timeout")));
      socket.on("error", reject);
    });
    const issuer = String(cert.issuer?.O ?? "");
    if (/let's encrypt|digicert|sectigo|globalsign|google trust|zerossl|amazon|godaddy|certum|entrust|buypass|ssl\.com|harica/i.test(issuer)) {
      certDays = Math.floor((new Date(cert.valid_to).getTime() - Date.now()) / DAY);
      if (certDays < 0) problems.push("https 인증서가 만료됨");
      else if (certDays <= 14) problems.push(`https 인증서 만료까지 ${certDays}일`);
    } else {
      certNote = "이 검진 위치에서는 인증서를 직접 볼 수 없음";
    }
  } catch {
    certNote = "인증서를 확인하지 못함";
  }
  const down = httpStatus === null || httpStatus >= 500 || (certDays !== null && certDays < 0);
  return { status: down ? "bad" : problems.length ? "warn" : "good", ms, httpStatus, certDays, certNote, problems, checkedAt: new Date().toISOString() };
}
// 검색·공유 기본 점검: 첫 화면의 설명문·공유 미리보기·대표 주소·검색엔진 등록 표시, 사이트맵과 robots.txt.
// 주소가 localhost로 나오면 검색엔진·카톡이 엉뚱한 주소를 보므로 가장 먼저 고칠 일로 봄
async function seoCheck() {
  const text = async (url) => {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      return res.ok ? await res.text() : null;
    } catch {
      return null;
    }
  };
  const [html, sitemap, robots] = await Promise.all([text(SITE), text(`${SITE}/sitemap.xml`), text(`${SITE}/robots.txt`)]);
  const page = html ?? "";
  const pick = (re) => re.exec(page)?.[1] ?? null;
  const host = new URL(SITE).hostname;
  const local = (s) => /localhost|127\.0\.0\.1/.test(s ?? "");
  const desc = pick(/<meta name="description" content="([^"]*)"/i);
  const canonical = pick(/<link rel="canonical" href="([^"]*)"/i);
  const ogImage = pick(/<meta property="og:image" content="([^"]*)"/i);
  const ogUrl = pick(/<meta property="og:url" content="([^"]*)"/i);
  const items = [
    { key: "desc", label: "사이트 설명문", ok: !!desc && desc.length >= 20 },
    { key: "og", label: "공유 미리보기(제목·이미지)", ok: /property="og:title"/.test(page) && !!ogImage && !local(ogImage) && !local(ogUrl) },
    { key: "canonical", label: "대표 주소", ok: !!canonical && canonical.includes(host) },
    { key: "sitemap", label: "사이트맵 주소", ok: !!sitemap && sitemap.includes(host) && !local(sitemap) },
    { key: "robots", label: "robots.txt", ok: !!robots && !local(robots) },
    { key: "naver", label: "네이버 등록 표시", ok: /naver-site-verification/.test(page) },
    { key: "google", label: "구글 등록 표시", ok: /google-site-verification/.test(page) },
  ];
  return { items, localhost: [canonical, ogImage, ogUrl, sitemap, robots].some(local) };
}
const healthQuest = (h) => (h.status === "good" ? [] : [{ kind: "health", text: `서버 확인하기: ${h.problems.join(", ")}`, url: SITE, exp: 30 }]);
// 급한 일(서버·광고·청소)을 위로. 지난 갱신에 있던 퀘스트가 사라졌으면 완료로 봄
const URGENT = new Set(["health", "spam", "cleanup"]);
const questKey = (q) => `${q.kind}|${q.url}`;
const rank = (list) => list.map((q) => ({ ...q, urgent: URGENT.has(q.kind) })).sort((a, b) => b.urgent - a.urgent);
const finished = (oldQuests, list, stillOpen = []) => {
  const open = new Set([...list.map(questKey), ...stillOpen]);
  return (oldQuests ?? []).filter((q) => !open.has(questKey(q))).map(({ kind, text, exp }) => ({ kind, text, exp }));
};

const docIndex = process.argv.indexOf("--doc");
const docFile = docIndex > -1 ? process.argv[docIndex + 1] : null;
const { readFileSync, writeFileSync, existsSync } = await import("node:fs");
let oldSnapshot = null;
if (docFile && existsSync(docFile)) {
  try {
    oldSnapshot = JSON.parse(readFileSync(docFile, "utf8")).snapshot ?? null;
  } catch {}
}

const now = Date.now();
const health = await checkHealth();
let data;
try {
  data = await Promise.all([
    get("board", "posts"),
    get("gallery", "posts"),
    get("videos", "videos"),
    get("meetups", "entries"),
    get("promo", "posts"),
    get("marketplace", "items"),
    get("ranking", "rankings"),
  ]);
} catch (err) {
  // 공개 API를 못 읽으면 직전 마을은 그대로 두고 등대만 빨간불로 바꿈
  if (!docFile || !oldSnapshot) throw err;
  if (health.status === "good") health.status = "bad";
  health.problems.push(`공개 데이터 읽기 실패 (${err.message})`);
  const quests = rank([...healthQuest(health), ...(oldSnapshot.quests ?? []).filter((q) => q.kind !== "health")]).slice(0, 6);
  const healthLog = [...(oldSnapshot.healthLog ?? []), { t: health.checkedAt, s: health.status, ms: health.ms }].slice(-90);
  writeFileSync(docFile, JSON.stringify({ snapshot: { ...oldSnapshot, health, healthLog, quests, done: [] }, previous: null }));
  console.log(`saved ${docFile} (site problem: ${health.problems.join(", ")})`);
  process.exit(0);
}
const [board, gallery, videos, meetups, promo, marketplace, rankings] = data;

const quests = [];
const alerts = new Set();

// 의미 없는 댓글: 기호만 있음("...", "?"), 같은 영문·숫자 반복("gg", "aaa", "111"), 테스트 문구.
// "ㅋㅋ", "ㄳ", "굿", "👍", "^^", ";;"처럼 짧아도 흔한 반응은 정상으로 봄.
const TEST_WORDS = new Set(["test", "테스트", "ㅌㅅㅌ", "asdf", "qwer"]);
const EMOTICON = /^[\^_;~\-\s]+$/;
function isMeaningless(text) {
  const t = String(text ?? "").trim();
  if (!t) return true;
  if (EMOTICON.test(t)) return false;
  if (!/\p{Extended_Pictographic}/u.test(t) && /^[\p{P}\p{S}\s]+$/u.test(t)) return true;
  if (/^([a-z0-9])\1*$/i.test(t)) return true;
  return TEST_WORDS.has(t.toLowerCase());
}

// 스팸·광고 감시: 전화번호, 광고 단어, 같은 내용 반복, 1시간 안 5개 이상 도배, 댓글 속 외부 링크.
// 본문 속 외부 링크는 다른 신호와 겹칠 때만 봄. 홍보거리(제휴 가게)는 검사하지 않음. 퀘스트에는 이유만 적음
const PHONE = /01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/;
const LINK = /(https?:\/\/|www\.)(?!(?:www\.)?byanra\.com)\S+/i;
const AD_WORDS = /(카톡|카카오톡|텔레그램|오픈\s*채팅|대출|도박|카지노|토토|바카라|수익\s*보장|고수익|부업)/;
const writings = [];
for (const [key, base, items] of [["board", "/board", board], ["gallery", "/gallery", gallery], ["videos", "/videos", videos]]) {
  for (const item of items) {
    const url = `${SITE}${key === "videos" ? base : `${base}/${item.id}`}`;
    if (key !== "videos") {
      const body = String(item.content ?? item.caption ?? "");
      writings.push({ key, url, title: item.title, comment: false, author: item.author, body, text: `${item.title ?? ""} ${body}`, createdAt: item.createdAt });
    }
    for (const c of comments(item)) {
      const body = String(c.content ?? "");
      writings.push({ key, url, title: item.title, comment: true, author: c.author, body, text: body, createdAt: c.createdAt });
    }
  }
}
const squash = (t) => t.replace(/\s+/g, "").toLowerCase();
const repeats = new Map();
for (const w of writings) {
  const n = squash(w.body);
  if (n.length >= 15) repeats.set(n, (repeats.get(n) ?? 0) + 1);
}
const times = new Map();
for (const w of writings) {
  const t = new Date(w.createdAt ?? "").getTime();
  if (!w.author || Number.isNaN(t)) continue;
  if (!times.has(w.author)) times.set(w.author, []);
  times.get(w.author).push(t);
}
const flooders = new Set();
for (const [name, list] of times) {
  list.sort((a, b) => a - b);
  for (let i = 4; i < list.length; i++) {
    if (list[i] - list[i - 4] <= 60 * 60 * 1000) {
      flooders.add(name);
      break;
    }
  }
}
const suspects = new Map();
for (const w of writings) {
  const reasons = [];
  if (PHONE.test(w.text)) reasons.push("전화번호 포함");
  if (AD_WORDS.test(w.text)) reasons.push("광고 단어");
  if ((repeats.get(squash(w.body)) ?? 0) >= 2) reasons.push("같은 내용 반복");
  if (flooders.has(w.author)) reasons.push("짧은 시간 도배");
  if (LINK.test(w.text) && (w.comment || reasons.length)) reasons.push("외부 링크");
  if (!reasons.length) continue;
  const s = suspects.get(w.url) ?? { key: w.key, url: w.url, title: w.title, comment: false, post: false, reasons: new Set() };
  if (w.comment) s.comment = true;
  else s.post = true;
  reasons.forEach((r) => s.reasons.add(r));
  suspects.set(w.url, s);
}
for (const s of suspects.values()) {
  alerts.add(s.key);
  const what = s.post && s.comment ? "글과 댓글" : s.post ? "글" : "댓글";
  quests.push({ kind: "spam", text: `광고 의심: "${short(s.title)}" ${what} (${[...s.reasons].join(", ")}) 확인하기`, url: s.url, exp: 25 });
}

for (const [key, base, items] of [["board", "/board", board], ["gallery", "/gallery", gallery], ["videos", "/videos", videos]]) {
  for (const item of items) {
    const junk =comments(item).filter((c) => isMeaningless(c.content));
    if (!junk.length) continue;
    alerts.add(key);
    quests.push({ kind: "cleanup", text: `"${short(item.title)}"의 의미 없는 댓글 ${junk.length}개 확인하기`, url: `${SITE}${key === "videos" ? base : `${base}/${item.id}`}`, exp: 20 });
  }
}

// 첫 댓글 퀘스트는 최근 2주 글만. 급한 일이 아니므로 빨간 ! 표시는 켜지 않음
const lonely = board
  .filter((p) => comments(p).length === 0 && within(p.createdAt, 14, now))
  .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  .slice(0, 2);
for (const p of lonely) {
  quests.push({ kind: "welcome", text: `"${short(p.title)}" 글에 첫 댓글 남기기`, url: `${SITE}/board/${p.id}`, exp: 15 });
}

const bare = videos.find((v) => !String(v.description ?? "").trim());
if (bare) quests.push({ kind: "polish", text: `영상 "${short(bare.title)}"에 소개글 달기`, url: `${SITE}/videos`, exp: 10 });

if (marketplace.length === 0) quests.push({ kind: "polish", text: "장터가 비어 있어요. 첫 매물 올려 보기", url: `${SITE}/marketplace`, exp: 10 });

// 2주 동안 새 글이 없는 메뉴 (여러 곳이면 한 줄로 묶음, 링크는 첫 번째 메뉴)
const quiet = [["게시판", "/board", board], ["모임", "/meetups", meetups], ["사진관", "/gallery", gallery], ["극장", "/videos", videos]].filter(
  ([, , items]) => items.length && !items.some((x) => within(x.createdAt, 14, now)),
);
if (quiet.length) quests.push({ kind: "polish", text: `${quiet.map(([label]) => label).join("·")}에 2주째 새 글이 없어요. 새 글 하나 올려 보기`, url: `${SITE}${quiet[0][1]}`, exp: 10 });

const top = (items) => [...items].sort((a, b) => (b.views ?? 0) - (a.views ?? 0))[0];
const building = (key, label, items, summary) => ({
  key,
  label,
  count: items.length,
  comments: items.reduce((s, x) => s + comments(x).length, 0),
  views: items.reduce((s, x) => s + (x.views ?? 0), 0),
  newThisWeek: items.filter((x) => within(x.createdAt, 7, now)).length,
  alert: alerts.has(key),
  summary,
});
const topLine = (items, what) => {
  const t = top(items);
  return t ? `인기 ${what}은 "${short(t.title)}" (조회 ${t.views ?? 0})` : `아직 ${what}이 없어요.`;
};

const upcoming = meetups.filter((m) => !m.cancelled && new Date(m.meetupDate).getTime() >= now).length;
const buildings = [
  building("board", "게시판", board, topLine(board, "글")),
  building("meetups", "모임", meetups, `다가오는 모임 ${upcoming}개`),
  building("gallery", "사진관", gallery, topLine(gallery, "사진")),
  building("videos", "극장", videos, topLine(videos, "영상")),
  building("promo", "홍보거리", promo, `제휴 가게 ${promo.length}곳 입점`),
  building("marketplace", "장터", marketplace, marketplace.length ? `매물 ${marketplace.length}개` : "아직 매물이 없어요."),
];

const posts = buildings.reduce((s, b) => s + b.count, 0);
const totalComments = buildings.reduce((s, b) => s + b.comments, 0);
const exp = posts * 10 + totalComments * 3;

const activity = new Map();
const bump = (name, iso) => {
  if (name && within(iso, 30, now)) activity.set(name, (activity.get(name) ?? 0) + 1);
};
for (const items of [board, gallery, videos, promo]) {
  for (const x of items) {
    bump(x.author ?? x.submitter, x.createdAt);
    for (const c of comments(x)) bump(c.author, c.createdAt);
  }
}
let riders = [...activity.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n);
if (!riders.length) riders = rankings.slice(0, 8).map((r) => r.nickname);

// 성장 기록: 이번 주·지난주 비교, 최근 30일 하루별 글·댓글 수(한국 시간 기준),
// 조회수 흐름(날짜 기록이 없어 갱신마다 하루 한 점씩 저장, 30일 보관)
const kstDay = (ms) => new Date(ms + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
const postItems = [board, gallery, videos, promo, meetups].flat();
const commentItems = [board, gallery, videos].flatMap((items) => items.flatMap(comments));
const daysAgo = (iso) => (now - new Date(iso ?? "").getTime()) / DAY;
const week = (list, dateOf) => {
  const ages = list.map((x) => daysAgo(dateOf(x)));
  return [ages.filter((a) => a >= 0 && a < 7).length, ages.filter((a) => a >= 7 && a < 14).length];
};
const weekly = { posts: week(postItems, (x) => x.createdAt), comments: week(commentItems, (x) => x.createdAt), members: week(rankings, (x) => x.joinedAt) };
const countByDay = (list) => {
  const m = new Map();
  for (const x of list) {
    const t = new Date(x.createdAt ?? "").getTime();
    if (!Number.isNaN(t)) m.set(kstDay(t), (m.get(kstDay(t)) ?? 0) + 1);
  }
  return m;
};
const postDays = countByDay(postItems);
const commentDays = countByDay(commentItems);
const daily = Array.from({ length: 30 }, (_, i) => {
  const d = kstDay(now - (29 - i) * DAY);
  return { d, posts: postDays.get(d) ?? 0, comments: commentDays.get(d) ?? 0 };
});
// 주민 소식: 새 주민(7일 안 가입), 이번 주 열심 주민 TOP 3, 돌아온 주민(이번 주 활동, 그 전 30일은 조용, 더 예전엔 활동),
// 조용해진 단골(14~60일 전에 3번 이상 활동, 최근 14일은 없음). 공개된 닉네임만 씀
const events = [];
for (const items of [board, gallery, videos, promo]) {
  for (const x of items) {
    const author = x.author ?? x.submitter;
    if (author) events.push({ name: author, age: daysAgo(x.createdAt) });
    for (const c of comments(x)) if (c.author) events.push({ name: c.author, age: daysAgo(c.createdAt) });
  }
}
const byName = new Map();
for (const e of events) {
  if (Number.isNaN(e.age) || e.age < 0) continue;
  if (!byName.has(e.name)) byName.set(e.name, []);
  byName.get(e.name).push(e.age);
}
const newMembers = rankings
  .filter((r) => within(r.joinedAt, 7, now))
  .sort((a, b) => String(b.joinedAt).localeCompare(String(a.joinedAt)))
  .slice(0, 8)
  .map((r) => ({ name: r.nickname, joinedAt: r.joinedAt }));
const newNames = new Set(newMembers.map((m) => m.name));
const people = [...byName.entries()].map(([name, ages]) => ({
  name,
  week: ages.filter((a) => a < 7).length,
  gap: ages.filter((a) => a >= 7 && a < 37).length,
  older: ages.filter((a) => a >= 37).length,
  recent14: ages.filter((a) => a < 14).length,
  mid: ages.filter((a) => a >= 14 && a < 60).length,
  last: Math.min(...ages),
}));
const residents = {
  newMembers,
  top: people.filter((p) => p.week > 0).sort((a, b) => b.week - a.week).slice(0, 3).map((p) => ({ name: p.name, count: p.week })),
  returning: people.filter((p) => p.week > 0 && p.gap === 0 && p.older > 0 && !newNames.has(p.name)).slice(0, 5).map((p) => ({ name: p.name })),
  dozing: people.filter((p) => p.recent14 === 0 && p.mid >= 3).sort((a, b) => b.mid - a.mid).slice(0, 5).map((p) => ({ name: p.name, days: Math.floor(p.last) })),
};
if (newMembers.length) {
  const names = newMembers.slice(0, 3).map((m) => m.name).join(", ") + (newMembers.length > 3 ? " 등" : "");
  quests.push({ kind: "welcome", text: `새 주민 ${newMembers.length}명 환영하기 (${names})`, url: `${SITE}/ranking`, exp: 15 });
}

const coins = buildings.reduce((s, b) => s + b.views, 0);
const today = kstDay(now);
const history = [...(oldSnapshot?.history ?? []).filter((h) => h.d !== today), { d: today, coins, members: rankings.length }].slice(-30);
// 서버 가동 기록: 갱신마다 상태와 응답 속도를 남겨 30일(하루 3번 × 30) 보관
const healthLog = [...(oldSnapshot?.healthLog ?? []), { t: health.checkedAt, s: health.status, ms: health.ms }].slice(-90);

// 주간 리포트: 직전 한 주(한국 시간 월~일)를 정리. 그 주 리포트가 아직 없을 때 한 번 만들고 최근 8주 보관
const kstNow = new Date(now + 9 * 60 * 60 * 1000);
const thisMonday = Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate()) - ((kstNow.getUTCDay() + 6) % 7) * DAY - 9 * 60 * 60 * 1000;
const weekStart = thisMonday - 7 * DAY;
const weekKey = kstDay(weekStart);
let reports = oldSnapshot?.reports ?? [];
if (!reports.some((r) => r.week === weekKey)) {
  const inRange = (iso, from, to) => {
    const t = new Date(iso ?? "").getTime();
    return !Number.isNaN(t) && t >= from && t < to;
  };
  const count = (list, dateOf, from, to) => list.filter((x) => inRange(dateOf(x), from, to)).length;
  const span = (from, to) => ({
    posts: count(postItems, (x) => x.createdAt, from, to),
    comments: count(commentItems, (x) => x.createdAt, from, to),
    members: count(rankings, (x) => x.joinedAt, from, to),
  });
  const cur = span(weekStart, thisMonday);
  const prev = span(weekStart - 7 * DAY, weekStart);
  const coinPoints = history.filter((h) => h.d >= weekKey && h.d < kstDay(thisMonday));
  const coinsGain = coinPoints.length >= 2 ? coinPoints[coinPoints.length - 1].coins - coinPoints[0].coins : null;
  const tally = new Map();
  for (const items of [board, gallery, videos, promo]) {
    for (const x of items) {
      const author = x.author ?? x.submitter;
      if (author && inRange(x.createdAt, weekStart, thisMonday)) tally.set(author, (tally.get(author) ?? 0) + 1);
      for (const c of comments(x)) if (c.author && inRange(c.createdAt, weekStart, thisMonday)) tally.set(c.author, (tally.get(c.author) ?? 0) + 1);
    }
  }
  const star = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
  const good = [];
  const bad = [];
  const diff = (n, label, unit) => {
    if (n > 0) good.push(`${label}이 지난주보다 ${n}${unit} 늘었어요`);
    else if (n < 0) bad.push(`${label}이 지난주보다 ${-n}${unit} 줄었어요`);
  };
  diff(cur.posts - prev.posts, "새 글", "개");
  diff(cur.comments - prev.comments, "새 댓글", "개");
  if (cur.members) good.push(`새 회원 ${cur.members}명이 가입했어요`);
  if (star) good.push(`이번 주 열심 주민: ${star[0]} (글·댓글 ${star[1]}개)`);
  if (suspects.size) bad.push(`광고 의심 ${suspects.size}건이 남아 있어요`);
  const weekHealth = healthLog.filter((h) => inRange(h.t, weekStart, thisMonday));
  const red = weekHealth.filter((h) => h.s === "bad").length;
  const yellow = weekHealth.filter((h) => h.s === "warn").length;
  if (red) bad.push(`등대 빨간불 ${red}회 (서버 문제)`);
  if (yellow) bad.push(`등대 노란불 ${yellow}회 (서버 주의)`);
  if (quiet.length) bad.push(`${quiet.map(([label]) => label).join("·")}에 2주째 새 글이 없어요`);
  reports = [
    ...reports,
    {
      week: weekKey,
      end: kstDay(thisMonday - DAY),
      createdAt: new Date(now).toISOString(),
      cur,
      prev,
      coinsGain,
      checks: weekHealth.length,
      good: good.length ? good : ["조용한 한 주였어요"],
      bad: bad.length ? bad : ["특별한 문제는 없었어요"],
      todo: rank([...healthQuest(health), ...quests]).slice(0, 3).map(({ kind, text, url }) => ({ kind, text, url })),
    },
  ].slice(-8);
}

// 이달 목표용 숫자: 이달 1일(한국 시간)부터 지금까지 새 글·댓글·회원, 조회수 증가.
// 조회수는 날짜 기록이 없어 이달이 시작될 때의 합계(baseCoins)를 한 번 정해 두고 계속 씀
const monthStart = Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), 1) - 9 * 60 * 60 * 1000;
const monthKey = today.slice(0, 7);
const since = (list, dateOf) => list.filter((x) => new Date(dateOf(x) ?? "").getTime() >= monthStart).length;
const baseCoins =
  oldSnapshot?.month?.key === monthKey
    ? oldSnapshot.month.baseCoins
    : ([...history].reverse().find((h) => h.d < `${monthKey}-01`) ?? history.find((h) => h.d.startsWith(monthKey)) ?? { coins }).coins;
const month = {
  key: monthKey,
  posts: since(postItems, (x) => x.createdAt),
  comments: since(commentItems, (x) => x.createdAt),
  members: since(rankings, (x) => x.joinedAt),
  baseCoins,
  viewsGain: coins - baseCoins,
};

// 요일·시간대별 활동: 최근 90일 글·댓글을 한국 시간 요일(월=0) × 3시간 칸(8개)으로 셈
const rhythm = { days: 90, grid: Array.from({ length: 7 }, () => Array(8).fill(0)) };
for (const x of [...postItems, ...commentItems]) {
  const t = new Date(x.createdAt ?? "").getTime();
  if (Number.isNaN(t) || t > now || now - t >= 90 * DAY) continue;
  const k = new Date(t + 9 * 60 * 60 * 1000);
  rhythm.grid[(k.getUTCDay() + 6) % 7][Math.floor(k.getUTCHours() / 3)] += 1;
}

// 성장 코치: 성장 단계, 7가지 체크리스트 점수(0~100), 가장 약한 곳부터 고른 TOP 3 할 일
const seo = await seoCheck();
const coinAt = (d) => [...history].reverse().find((h) => h.d <= d)?.coins ?? null;
const c7 = coinAt(kstDay(now - 7 * DAY));
const c14 = coinAt(kstDay(now - 14 * DAY));
const viewsWeek = c7 === null ? null : coins - c7;
const viewsPrev = c7 === null || c14 === null ? null : c7 - c14;
const joins30 = rankings.filter((r) => within(r.joinedAt, 30, now)).length;
const active30 = new Set(events.filter((e) => e.age >= 0 && e.age < 30).map((e) => e.name)).size;
const recentPosts = [board, gallery, videos].flat().filter((p) => within(p.createdAt, 30, now));
const answered = recentPosts.filter((p) => comments(p).length > 0).length;
const postsWeek = postItems.filter((x) => within(x.createdAt, 7, now)).length;
let bestSlot = null;
rhythm.grid.forEach((row, d) => row.forEach((n, h) => { if (n && (!bestSlot || n > bestSlot.n)) bestSlot = { n, d, h }; }));
const slotText = bestSlot ? `${"월화수목금토일"[bestSlot.d]}요일 ${bestSlot.h * 3}~${bestSlot.h * 3 + 3}시` : "회원이 많이 들어오는 시간";
const seoOk = seo.items.filter((i) => i.ok).length;
const pct = (v, goal) => Math.max(0, Math.min(100, Math.round((v / goal) * 100)));
const checks = [
  { key: "seo", icon: "🔎", label: "검색 노출 기본", score: seo.localhost ? Math.min(30, pct(seoOk, seo.items.length)) : pct(seoOk, seo.items.length), detail: `점검 ${seo.items.length}개 중 ${seoOk}개 통과${seo.localhost ? " · 주소가 localhost로 나옴" : ""}` },
  { key: "views", icon: "👀", label: "방문", score: viewsWeek === null ? 50 : pct(viewsWeek, 500), detail: viewsWeek === null ? "기록이 쌓이는 중" : `최근 7일 조회수 +${viewsWeek}${viewsPrev === null ? "" : ` (지난주 +${viewsPrev})`} · 목표 주 +500` },
  { key: "signup", icon: "✍️", label: "가입", score: pct(joins30, 10), detail: `최근 30일 새 회원 ${joins30}명 · 목표 월 10명` },
  { key: "reply", icon: "💬", label: "반응", score: recentPosts.length ? pct(answered / recentPosts.length, 0.8) : 0, detail: recentPosts.length ? `최근 30일 새 글 ${recentPosts.length}개 중 ${answered}개에 댓글 · 목표 80%` : "최근 30일 새 글이 없어요" },
  { key: "active", icon: "🔥", label: "활동률", score: rankings.length ? pct(active30 / rankings.length, 0.3) : 0, detail: `회원 ${rankings.length}명 중 최근 30일 활동 ${active30}명 · 목표 30%` },
  { key: "retention", icon: "🔁", label: "재방문", score: Math.max(0, 100 - residents.dozing.length * 20), detail: residents.dozing.length ? `조용해진 단골 ${residents.dozing.length}명` : "조용해진 단골이 없어요" },
  { key: "posting", icon: "📝", label: "새 글 꾸준함", score: pct(postsWeek, 7), detail: `최근 7일 새 글 ${postsWeek}개 · 목표 주 7개` },
].map((c) => ({ ...c, status: c.score >= 80 ? "good" : c.score >= 50 ? "warn" : "bad" }));
const scoreOf = (k) => checks.find((c) => c.key === k).score;
const STAGES = [
  ["기반 다지기", "검색엔진과 공유 미리보기가 사이트를 제대로 보게 만들어요."],
  ["첫 회원 모으기", "회원 50명까지, 가입할 이유와 처음 온 사람을 반기는 분위기를 만들어요."],
  ["활동 습관 만들기", "주 10개 이상 새 글과 회원 30% 이상 활동을 목표로 해요."],
  ["입소문", "회원이 회원을 데려오도록 이벤트와 모임을 키워요."],
  ["커뮤니티 자립", "운영자 없이도 글과 모임이 꾸준히 돌아가요."],
];
const activeRate = rankings.length ? active30 / rankings.length : 0;
const stage = scoreOf("seo") < 70 ? 1 : rankings.length < 50 ? 2 : postsWeek < 10 || activeRate < 0.3 ? 3 : rankings.length < 300 ? 4 : 5;
const missing = (k) => !seo.items.find((i) => i.key === k)?.ok;
const PLAYBOOK = {
  seo: () => ({
    title: "검색에 제대로 나오게 하기",
    why: seo.localhost
      ? "사이트맵·대표 주소·공유 미리보기 주소가 localhost:3000으로 나와요. 네이버·구글이 엉뚱한 주소를 보고, 카톡 공유 미리보기도 깨져요."
      : `검색·공유 기본 점검 ${seo.items.length}개 중 ${seoOk}개만 통과했어요.`,
    steps: [
      ...(seo.localhost ? ["서버 설정의 사이트 주소(NEXT_PUBLIC_SITE_URL)를 https://byanra.com 으로 고치고 다시 배포하기 — Claude에게 \"사이트 주소 설정 고쳐줘\"라고 요청"] : []),
      ...(missing("naver") ? ["네이버 서치어드바이저에 byanra.com 등록하기"] : []),
      ...(missing("google") ? ["구글 서치 콘솔에 byanra.com 등록하기"] : []),
      ...(missing("desc") || (missing("og") && !seo.localhost) ? ["사이트 설명문과 공유 미리보기 이미지 넣기"] : []),
      "고친 뒤 네이버 서치어드바이저와 구글 서치 콘솔에 사이트맵(https://byanra.com/sitemap.xml) 다시 제출하기",
    ].slice(0, 3),
    url: "https://searchadvisor.naver.com/",
    link: "네이버 서치어드바이저",
  }),
  signup: () => ({
    title: "새 회원 모으기",
    why: `최근 30일 새 회원이 ${joins30}명이에요. 지금 단계에서는 사람이 모여야 글과 댓글도 늘어요.`,
    steps: ["지역 바이크 카페·밴드·오픈채팅 2곳에 Byanra 소개와 인기 글 링크 올리기", "공지로 \"라이딩 친구 데려오기\" 이벤트 열기 (가입 인증하면 포인트)", "모임 글에 \"Byanra 가입 후 참여\" 안내 넣기"],
    url: `${SITE}/meetups`,
    link: "모임 열기",
  }),
  views: () => ({
    title: "방문자 늘리기",
    why: viewsWeek === null ? "방문 기록이 아직 쌓이는 중이에요." : `최근 7일 조회수가 +${viewsWeek}이에요 (목표 주 +500).`,
    steps: [`인기 글을 인스타그램·블로그·카페에 공유하기`, `${slotText}에 맞춰 정보 글(코스·정비 팁) 올리기`, "글 제목에 지역 이름과 기종 넣기 (예: \"천안 근교 바리 코스\")"],
    url: `${SITE}/board`,
    link: "게시판",
  }),
  reply: () => ({
    title: "새 글에 댓글이 달리게 하기",
    why: recentPosts.length ? `최근 30일 새 글 ${recentPosts.length}개 중 ${answered}개에만 댓글이 있어요. 댓글이 없으면 글쓴이가 다시 오지 않아요.` : "최근 30일 새 글이 없어요.",
    steps: ["새 글이 올라오면 24시간 안에 운영자가 첫 댓글 달기", "운영자 글 끝에 질문 하나 넣기 (\"여러분 코스는 어디예요?\")", "업무 보드의 \"첫 댓글 남기기\" 업무부터 처리하기"],
    url: `${SITE}/board`,
    link: "게시판",
  }),
  active: () => ({
    title: "회원이 직접 글 쓰게 하기",
    why: `회원 ${rankings.length}명 중 최근 30일에 글·댓글을 쓴 사람은 ${active30}명(${Math.round(activeRate * 100)}%)이에요.`,
    steps: ["\"내 바이크 사진 한 장\" 사진관 이벤트 열기", "가입 인사·첫 글 쓰면 포인트 주기 (포인트 상점 활용)", "쉬운 질문 글 올리기 (\"첫 바이크가 뭐였어요?\")"],
    url: `${SITE}/gallery`,
    link: "사진관",
  }),
  retention: () => ({
    title: "조용해진 단골 다시 부르기",
    why: `${residents.dozing.length}명이 2주 넘게 조용해요 (${residents.dozing.slice(0, 3).map((d) => d.name).join(", ")}).`,
    steps: ["단골이 좋아할 주제(기종·지역)로 글 올리기", "다가오는 모임 만들고 단골에게 알리기", "단골 글에 다시 댓글 달기"],
    url: `${SITE}/meetups`,
    link: "모임",
  }),
  posting: () => ({
    title: "꾸준히 새 글 올리기",
    why: `최근 7일 새 글이 ${postsWeek}개예요. 새 글이 있어야 방문자가 다시 와요.`,
    steps: ["운영자가 하루 1개 짧은 글 올리기 (정비 팁·코스·질문)", `${slotText}에 글 올리기`, "한 달 글감 목록 미리 만들기"],
    url: `${SITE}/board`,
    link: "게시판",
  }),
};
const WEIGHT = { seo: seo.localhost ? 3 : stage <= 2 ? 1.5 : 1, signup: stage === 2 ? 1.4 : 1, views: 1.1, reply: 1.2, active: stage === 3 ? 1.4 : 1, retention: 0.8, posting: stage === 3 ? 1.3 : 1.1 };
const priorities = checks
  .filter((c) => c.score < 80)
  .sort((a, b) => (100 - b.score) * WEIGHT[b.key] - (100 - a.score) * WEIGHT[a.key])
  .slice(0, 3)
  .map((c) => ({ key: c.key, status: c.status, ...PLAYBOOK[c.key]() }));
const growth = { stage, stageName: STAGES[stage - 1][0], focus: STAGES[stage - 1][1], stages: STAGES.map(([name]) => name), checks, priorities, seo: seo.items, checkedAt: new Date().toISOString() };

const snapshot = {
  generatedAt: new Date(now).toISOString(),
  level: Math.floor(exp / 100) + 1,
  exp,
  expInLevel: exp % 100,
  coins,
  members: rankings.length,
  newMembersThisWeek: rankings.filter((r) => within(r.joinedAt, 7, now)).length,
  postsThisWeek: buildings.reduce((s, b) => s + b.newThisWeek, 0),
  buildings,
  quests: rank([...healthQuest(health), ...quests]).slice(0, 6),
  // 기간이 지나 목록에서 빠졌을 뿐 아직 댓글이 없는 글은 완료로 치지 않음
  done: finished(oldSnapshot?.quests, [...healthQuest(health), ...quests], board.filter((p) => comments(p).length === 0).map((p) => `welcome|${SITE}/board/${p.id}`)),
  riders: riders.slice(0, 8),
  health,
  weekly,
  daily,
  history,
  residents,
  healthLog,
  reports,
  month,
  rhythm,
  growth,
};

// --doc <path>: 아티팩트 db 문서(town/current) 형태로 저장. 직전 스냅샷을 previous로 보관해 변화량 표시에 씀
if (docFile) {
  const old = oldSnapshot;
  const previous = old ? { generatedAt: old.generatedAt, coins: old.coins, exp: old.exp, members: old.members } : null;
  writeFileSync(docFile, JSON.stringify({ snapshot, previous }));
  console.log(`saved ${docFile} (Lv.${snapshot.level}, coins ${snapshot.coins}, health ${health.status})`);
} else {
  process.stdout.write(JSON.stringify(snapshot));
}
