"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { TownBuilding, TownBuildingKey, TownSnapshot } from "@/lib/ops-town";

const REFRESH_MS = 60_000;
const TICK_MS = 90;
const ROAD_LENGTH = 428;

const C = {
  ink: "#1a1c2c",
  cream: "#fff8e1",
  paper: "#f4e4bc",
  wood: "#5a3a1a",
  woodLight: "#7a4e26",
  grass: "#7ec850",
  grassDark: "#5fa83a",
  sky: "#8fd3ff",
  road: "#9a9a9a",
  roadEdge: "#6b6b6b",
  line: "#f2f2f2",
  window: "#ffe27a",
  windowFrame: "#e0b84a",
  door: "#6b3e1e",
  knob: "#ffd34d",
  red: "#e34948",
  green: "#7ee36b",
};

const RIDER_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#e87ba4", "#6250d6", "#eda100", "#008300", "#e34948"];

type Px = [x: number, y: number, w: number, h: number, fill: string];

function rects(list: Px[], keyPrefix: string) {
  return list.map(([x, y, w, h, fill], i) => (
    <rect key={`${keyPrefix}-${i}`} x={x} y={y} width={w} height={h} fill={fill} />
  ));
}

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function scenery(): Px[] {
  const rnd = seeded(7);
  const px: Px[] = [[0, 0, 170, 12, C.sky], [0, 12, 170, 88, C.grass]];
  for (let i = 0; i < 90; i++) {
    px.push([Math.floor(rnd() * 170), 12 + Math.floor(rnd() * 88), rnd() > 0.5 ? 2 : 1, 1, C.grassDark]);
  }
  for (const [x, y, w, h] of [[10, 14, 150, 7], [10, 85, 150, 7]]) {
    px.push([x, y, w, h, C.roadEdge], [x, y + 1, w, h - 2, C.road]);
  }
  for (const [x, y, w, h] of [[10, 14, 7, 78], [153, 14, 7, 78]]) {
    px.push([x, y, w, h, C.roadEdge], [x + 1, y, w - 2, h, C.road]);
  }
  for (const [x, y] of [[11, 15], [154, 15], [11, 86], [154, 86]]) px.push([x, y, 5, 5, C.road]);
  for (let x = 22; x < 150; x += 6) px.push([x, 17, 3, 1, C.line], [x, 88, 3, 1, C.line]);
  for (let y = 26; y < 82; y += 6) px.push([13, y, 1, 3, C.line], [156, y, 1, 3, C.line]);
  for (const [x, y] of [[19, 23], [144, 24], [130, 63], [19, 64], [143, 72]]) {
    px.push([x + 2, y + 5, 2, 3, "#7a4a22"], [x + 1, y, 4, 1, "#2f7a2a"], [x, y + 1, 6, 4, "#3c9a35"], [x + 1, y + 1, 2, 1, "#5cc24f"]);
  }
  for (const [x, y, c] of [[60, 60, "#ff7aa8"], [80, 58, "#ffe14d"], [115, 60, "#ff7aa8"], [26, 80, "#ffe14d"], [122, 80, "#ffffff"], [140, 56, "#ffe14d"], [56, 28, "#ffffff"]] as const) {
    px.push([x, y, 1, 1, c], [x, y + 1, 1, 1, "#2f7a2a"]);
  }
  return px;
}

function house(x: number, y: number, w: number, h: number, roof: string, roofDark: string, wall: string, wallDark: string): Px[] {
  const px: Px[] = [];
  const step = Math.max(1, Math.floor(w / 12));
  for (let j = 0; j < 5; j++) {
    const inset = (4 - j) * step;
    px.push([x - 1 + inset, y - 5 + j, w + 2 - 2 * inset, 1, j === 4 ? roofDark : roof]);
  }
  px.push([x, y, w, h, wallDark], [x + 1, y, w - 2, h - 1, wall]);
  const doorX = x + Math.floor(w / 2) - 2;
  for (const wy of h >= 16 ? [y + 3, y + 9] : [y + 3]) {
    for (let wx = x + 3; wx + 3 <= x + w - 3; wx += 6) {
      if (wy > y + 6 && wx + 3 > doorX - 1 && wx < doorX + 5) continue;
      px.push([wx, wy, 3, 3, C.window], [wx + 1, wy, 1, 3, C.windowFrame]);
    }
  }
  px.push([doorX, y + h - 6, 4, 6, C.door], [doorX + 3, y + h - 3, 1, 1, C.knob]);
  return px;
}

function shops(x: number, y: number): Px[] {
  const px: Px[] = [];
  const awnings = ["#eda100", "#3d7bd9", "#e34948"];
  awnings.forEach((color, k) => {
    const sx = x + k * 12;
    px.push([sx, y + 3, 11, 7, "#c9b88a"], [sx + 1, y + 3, 9, 6, C.paper]);
    for (let s = 0; s < 11; s++) px.push([sx + s, y, 1, 3, s % 2 ? C.cream : color]);
    px.push([sx + 2, y + 5, 3, 3, C.sky], [sx + 7, y + 5, 2, 4, C.door]);
  });
  return px;
}

function stall(x: number, y: number): Px[] {
  const px: Px[] = [];
  for (let s = 0; s < 26; s++) px.push([x + s, y, 1, 3, s % 2 ? C.cream : "#eb6834"]);
  px.push(
    [x + 1, y + 3, 1, 6, "#7a4a22"], [x + 24, y + 3, 1, 6, "#7a4a22"], [x, y + 7, 26, 2, "#8b5a2b"],
    [x + 4, y + 6, 2, 1, "#3d7bd9"], [x + 9, y + 5, 3, 2, C.red], [x + 15, y + 6, 2, 1, C.knob], [x + 19, y + 5, 2, 2, "#555555"]
  );
  return px;
}

type Lot = {
  key: TownBuildingKey;
  hit: [number, number, number, number];
  signX: number;
  signY: number;
  bubble: [number, number];
  art: Px[];
};

const LOTS: Lot[] = [
  { key: "board", hit: [23, 29, 32, 31], signX: 39, signY: 55, bubble: [35, 21], art: house(24, 34, 30, 20, "#3d7bd9", "#2a5aa8", "#e8e4d8", "#b8b2a0") },
  { key: "meetups", hit: [61, 33, 24, 27], signX: 73, signY: 55, bubble: [70, 25], art: house(62, 38, 22, 16, "#1baf7a", "#12805a", C.paper, "#c9b88a") },
  { key: "gallery", hit: [91, 35, 20, 25], signX: 101, signY: 55, bubble: [98, 27], art: house(92, 40, 18, 14, "#8a63d2", "#6246a8", C.paper, "#c9b88a") },
  { key: "videos", hit: [117, 35, 24, 25], signX: 129, signY: 55, bubble: [126, 27], art: house(118, 40, 22, 14, "#e8679a", "#b84a76", "#e8e4d8", "#b8b2a0") },
  { key: "promo", hit: [30, 63, 36, 20], signX: 47.5, signY: 77, bubble: [44, 57], art: shops(30, 66) },
  { key: "marketplace", hit: [85, 63, 28, 20], signX: 99, signY: 77, bubble: [96, 57], art: stall(86, 66) },
];

function Sign({ x, y, text }: { x: number; y: number; text: string }) {
  const w = Math.round(text.length * 3.3 + 4);
  return (
    <g>
      <rect x={x - w / 2} y={y} width={w} height={5} fill={C.wood} />
      <rect x={x - w / 2 + 0.5} y={y + 0.5} width={w - 1} height={4} fill={C.woodLight} />
      <text x={x} y={y + 3.9} fontSize={3.4} fill={C.cream} textAnchor="middle" className="pixel-font">
        {text}
      </text>
    </g>
  );
}

function Bubble({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      {rects([[0, 0, 7, 7, C.ink], [1, 1, 5, 5, "#ffffff"], [3, 2, 1, 2, color], [3, 5, 1, 1, color], [3, 7, 1, 1, C.ink]], "b")}
    </g>
  );
}

function roadPosition(distance: number): [number, number, 1 | -1] {
  const d = ((distance % ROAD_LENGTH) + ROAD_LENGTH) % ROAD_LENGTH;
  if (d < 143) return [11 + d, 16, 1];
  if (d < 214) return [154, 16 + (d - 143), 1];
  if (d < 357) return [154 - (d - 214), 87, -1];
  return [11, 87 - (d - 357), -1];
}

function useTicker(ms: number) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return tick;
}

function useTypewriter(initial: string) {
  const [state, setState] = useState({ text: initial, shown: 0 });
  useEffect(() => {
    if (state.shown >= state.text.length) return;
    const id = window.setTimeout(() => setState((s) => ({ ...s, shown: s.shown + 1 })), 28);
    return () => window.clearTimeout(id);
  }, [state]);
  const say = (text: string) => setState({ text, shown: 0 });
  return [state.text.slice(0, state.shown), say] as const;
}

function Panel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="pixel-panel">
      <div className="pixel-label">{label}</div>
      <div className="pixel-value">{children}</div>
    </div>
  );
}

const SAFETY = {
  peace: { text: "평화 ♥", color: C.green },
  caution: { text: "주의 !", color: "#ffd34d" },
  danger: { text: "위험 !!", color: "#ff7a7a" },
};

const QUEST_TAG: Record<string, [string, string]> = {
  report: ["신고", "#e34948"],
  feedback: ["건의", "#eda100"],
  cleanup: ["청소", "#eb6834"],
  welcome: ["손님맞이", "#1baf7a"],
  polish: ["꾸미기", "#3d7bd9"],
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

export default function PixelTown({ snapshot }: { snapshot: TownSnapshot }) {
  const router = useRouter();
  const tick = useTicker(TICK_MS);
  const background = useMemo(() => rects(scenery(), "s"), []);
  const [typed, say] = useTypewriter("건물을 눌러 보세요!");

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [router]);

  const byKey = new Map(snapshot.buildings.map((b) => [b.key, b]));
  const safety = SAFETY[snapshot.safety];
  const bob = Math.floor(tick / 5) % 2;
  const segments = Math.round((snapshot.expInLevel / snapshot.expForNext) * 10);

  const describe = (b: TownBuilding) => {
    const fresh = b.newThisWeek > 0 ? ` 이번 주 새 글 ${b.newThisWeek}개!` : "";
    return `${b.label} — 글 ${b.count}개, 댓글 ${b.comments}개, 조회 ${b.views}. ${b.summary}${fresh}`;
  };

  return (
    <div className="pixel-town pixel-font">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/galmuri@2.40.3/dist/galmuri.css" precedence="default" />

      <div className="pixel-hud">
        <Panel label="마을 레벨">
          Lv.{snapshot.level}
          <div className="pixel-seg" aria-hidden="true">
            {Array.from({ length: 10 }, (_, i) => (
              <i key={i} style={{ background: i < segments ? C.green : "#3d415c" }} />
            ))}
          </div>
          <div className="pixel-sub">
            EXP {snapshot.expInLevel}/{snapshot.expForNext}
          </div>
        </Panel>
        <Panel label="코인 (조회수)">{snapshot.coins.toLocaleString("ko-KR")}</Panel>
        <Panel label="주민 (회원)">
          {snapshot.members}명
          {snapshot.newMembersThisWeek > 0 && <div className="pixel-sub">이번 주 +{snapshot.newMembersThisWeek}</div>}
        </Panel>
        <Panel label="치안 (신고)">
          <span style={{ color: safety.color }}>{safety.text}</span>
          <div className="pixel-sub">대기 {snapshot.pendingReports}건</div>
        </Panel>
      </div>

      <svg
        viewBox="0 0 170 100"
        className="pixel-map"
        shapeRendering="crispEdges"
        role="img"
        aria-label="커뮤니티 메뉴를 건물로, 회원을 바이크로 표현한 픽셀 마을"
      >
        {background}
        {[20, 95, 150].map((start, i) => {
          const x = ((start + Math.floor(tick / 4)) % 182) - 12;
          return (
            <g key={`cloud-${i}`} transform={`translate(${x},${[3, 5, 2][i]})`}>
              {rects([[2, 0, 6, 1, "#ffffff"], [0, 1, 11, 2, "#ffffff"], [1, 3, 8, 1, "#ffffff"]], `c${i}`)}
            </g>
          );
        })}

        {LOTS.map((lot) => {
          const b = byKey.get(lot.key);
          if (!b) return null;
          const [hx, hy, hw, hh] = lot.hit;
          return (
            <g key={lot.key}>
              {rects(lot.art, lot.key)}
              <Sign x={lot.signX} y={lot.signY} text={`${b.label} ${b.count}`} />
              {b.alert && <Bubble x={lot.bubble[0]} y={lot.bubble[1] + bob} color={C.red} />}
              {!b.alert && b.newThisWeek > 0 && <Bubble x={lot.bubble[0]} y={lot.bubble[1] + bob} color="#1baf7a" />}
              <rect
                x={hx}
                y={hy}
                width={hw}
                height={hh}
                fill="transparent"
                style={{ cursor: "pointer" }}
                onClick={() => say(describe(b))}
              >
                <title>{b.label}</title>
              </rect>
            </g>
          );
        })}

        {snapshot.riders.map((name, i) => {
          const speed = 0.7 + (i % 5) * 0.12;
          const [x, y, dir] = roadPosition(Math.floor(i * (ROAD_LENGTH / snapshot.riders.length) + tick * speed));
          const color = RIDER_COLORS[i % RIDER_COLORS.length];
          return (
            <g key={name} transform={dir > 0 ? `translate(${x},${y})` : `translate(${x + 5},${y}) scale(-1,1)`}>
              <title>{name}</title>
              {rects([[2, -1, 1, 1, "#ffd9a8"], [1, 0, 3, 1, color], [0, 1, 5, 1, color], [4, 0, 1, 1, "#444444"], [0, 2, 1, 1, C.ink], [4, 2, 1, 1, C.ink]], `r${i}`)}
            </g>
          );
        })}
      </svg>

      <div className="pixel-dialog" aria-live="polite">
        ▶ {typed}
      </div>

      <div className="pixel-board">
        <div className="pixel-board-title">오늘의 퀘스트</div>
        {snapshot.quests.length === 0 ? (
          <div className="pixel-quest">오늘은 할 일이 없어요. 평화로운 마을이에요!</div>
        ) : (
          snapshot.quests.map((quest) => {
            const [tag, color] = QUEST_TAG[quest.kind];
            return (
              <Link key={quest.id} href={quest.href} className="pixel-quest">
                <span className="pixel-tag" style={{ background: color }}>
                  {tag}
                </span>
                <span style={{ flex: 1 }}>{quest.text}</span>
                <span>+{quest.exp}</span>
              </Link>
            );
          })
        )}
      </div>

      <p className="pixel-foot">
        {formatTime(snapshot.generatedAt)} 기준 · 화면을 열어 두면 1분마다 자동으로 새로고침돼요
      </p>
    </div>
  );
}
