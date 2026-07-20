"use client";

function redirectToLoginOn401(response: Response) {
  if (response.status === 401 && typeof window !== "undefined") {
    const next = encodeURIComponent(
      window.location.pathname + window.location.search
    );
    window.location.href = `/login?next=${next}`;
  }
}

/**
 * 좋아요/댓글투표 등 로그인 필요 액션의 공통 fetch.
 * 401이면 로그인 페이지로 보내고, 기능 자체는 유지합니다.
 */
export async function fetchEngagementAction(
  url: string,
  body: Record<string, unknown>
): Promise<Response> {
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  redirectToLoginOn401(response);

  return response;
}

/** 댓글 등록 POST — 401 시 로그인 페이지로 이동 */
export async function fetchEngagementPost(
  url: string,
  body: Record<string, unknown>
): Promise<Response> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  redirectToLoginOn401(response);

  return response;
}
