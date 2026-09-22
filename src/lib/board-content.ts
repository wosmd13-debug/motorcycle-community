/**
 * 게시글 본문 안에 사진을 끼워 넣기 위한 토큰 처리.
 * 본문은 여전히 평범한 텍스트이고, [[사진1]] 같은 토큰만 이미지로 치환해서 그립니다.
 * (raw HTML을 저장/렌더링하지 않으므로 XSS 걱정 없이 안전합니다.)
 */

export type BoardContentSegment =
  | { type: "text"; value: string }
  | { type: "image"; url: string; index: number };

const TOKEN_PATTERN = /\[\[사진(\d+)\]\]/g;

export function buildImageToken(index: number): string {
  return `[[사진${index}]]`;
}

/** content 안의 [[사진N]] 토큰을 순서대로 찾아 imageUrls[N-1]로 치환한 세그먼트 배열을 만든다. */
export function parseBoardContent(
  content: string,
  imageUrls: string[]
): BoardContentSegment[] {
  const segments: BoardContentSegment[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(TOKEN_PATTERN)) {
    const start = match.index ?? 0;
    const n = Number(match[1]);
    const url = imageUrls[n - 1];

    if (start > lastIndex) {
      segments.push({ type: "text", value: content.slice(lastIndex, start) });
    }

    if (url) {
      segments.push({ type: "image", url, index: n });
    } else {
      // 토큰이 가리키는 사진이 없으면(옛날 글 등) 글자 그대로 남겨둔다.
      segments.push({ type: "text", value: match[0] });
    }

    lastIndex = start + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({ type: "text", value: content.slice(lastIndex) });
  }

  return segments;
}

/** 본문 안에서 토큰으로 쓰이지 않은 이미지들 (예전 글처럼 본문과 별도로 첨부된 사진). */
export function unusedImageUrls(content: string, imageUrls: string[]): string[] {
  const used = new Set<number>();
  for (const match of content.matchAll(TOKEN_PATTERN)) {
    used.add(Number(match[1]));
  }
  return imageUrls.filter((_, i) => !used.has(i + 1));
}

/** textarea 커서 위치에 토큰을 끼워 넣은 새 문자열과, 그 뒤로 옮겨야 할 커서 위치를 돌려준다. */
export function insertTokenAtCursor(
  content: string,
  cursorPos: number,
  token: string
): { content: string; cursor: number } {
  const before = content.slice(0, cursorPos);
  const after = content.slice(cursorPos);
  // 앞뒤에 이미 공백/줄바꿈이 없으면 한 줄 띄워서 자연스럽게 끼운다.
  const prefix = before.length > 0 && !/\n\n?$/.test(before) ? "\n" : "";
  const suffix = after.length > 0 && !/^\n\n?/.test(after) ? "\n" : "";
  const inserted = `${prefix}${token}${suffix}`;
  return {
    content: before + inserted + after,
    cursor: before.length + inserted.length,
  };
}

/** id 기반 임시 토큰(예: [[사진:ab12cd]])을 본문에서 전부 지운다 (사진 제거 시 사용). */
export function stripTempToken(content: string, tempToken: string): string {
  return content.split(tempToken).join("").replace(/\n{3,}/g, "\n\n");
}

// --- 작성 중(제출 전) 미리보기용: id 기반 임시 토큰 ---

const TEMP_TOKEN_PATTERN = /\[\[사진:([a-z0-9]+)\]\]/g;

export function buildTempToken(id: string): string {
  return `[[사진:${id}]]`;
}

export type DraftContentSegment =
  | { type: "text"; value: string }
  | { type: "image"; previewUrl: string; id: string };

/** 작성 중인 본문을 미리보기용으로 쪼갠다. attachments에 없는 임시 토큰은 글자 그대로 남긴다. */
export function parseDraftContent(
  content: string,
  attachments: { id: string; previewUrl: string }[]
): DraftContentSegment[] {
  const byId = new Map(attachments.map((item) => [item.id, item.previewUrl]));
  const segments: DraftContentSegment[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(TEMP_TOKEN_PATTERN)) {
    const start = match.index ?? 0;
    const id = match[1];
    const previewUrl = byId.get(id);

    if (start > lastIndex) {
      segments.push({ type: "text", value: content.slice(lastIndex, start) });
    }

    if (previewUrl) {
      segments.push({ type: "image", previewUrl, id });
    } else {
      segments.push({ type: "text", value: match[0] });
    }

    lastIndex = start + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({ type: "text", value: content.slice(lastIndex) });
  }

  return segments;
}

/**
 * 제출 시: 본문에 등장하는 순서대로 임시 토큰을 [[사진1]], [[사진2]]…로 바꾸고,
 * 그 순서에 맞는 최종 이미지 URL 배열을 함께 돌려준다.
 * resolveUrl이 URL을 못 찾아주면(파일이 사라진 경우 등) 그 토큰은 통째로 지운다.
 */
export async function finalizeContentTokens(
  content: string,
  resolveUrl: (id: string) => Promise<string | null>,
  startIndex = 1
): Promise<{ content: string; imageUrls: string[] }> {
  const matches = [...content.matchAll(TEMP_TOKEN_PATTERN)];
  const imageUrls: string[] = [];
  let result = "";
  let lastIndex = 0;
  let nextIndex = startIndex;

  for (const match of matches) {
    const start = match.index ?? 0;
    const id = match[1];
    result += content.slice(lastIndex, start);

    const url = await resolveUrl(id);
    if (url) {
      imageUrls.push(url);
      result += buildImageToken(nextIndex);
      nextIndex += 1;
    }
    // url이 null이면 토큰을 그냥 건너뛰어(=지워) 결과에 남기지 않는다.

    lastIndex = start + match[0].length;
  }

  result += content.slice(lastIndex);
  return { content: result.replace(/\n{3,}/g, "\n\n").trim(), imageUrls };
}
