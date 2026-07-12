import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentUserFromRequest,
  requireCurrentUserFromRequest,
} from "@/lib/auth-server";
import {
  canManageMeetup,
  meetupPaces,
  meetupRegions,
  type MeetupPace,
  type MeetupRegion,
} from "@/lib/meetup";
import {
  deleteMeetup,
  getMeetup,
  joinMeetup,
  leaveMeetup,
  updateMeetup,
  viewMeetup,
} from "@/lib/meetup-store";
import { rateLimitAnonymousView } from "@/lib/request-guards";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const postRegions = meetupRegions.filter(
  (region): region is MeetupRegion => region !== "전체"
);

async function requireManageableMeetup(request: NextRequest, id: string) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const entry = await getMeetup(id);
  if (!entry) {
    return NextResponse.json(
      { error: "모임을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (!canManageMeetup(user, entry)) {
    return NextResponse.json(
      { error: "이 모임을 관리할 권한이 없습니다." },
      { status: 403 }
    );
  }

  return { user, entry };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const entry = await getMeetup(id);
    if (!entry) {
      return NextResponse.json(
        { error: "모임을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ entry });
  } catch {
    return NextResponse.json(
      { error: "모임을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const body = await request.json();

    if (body.action === "view") {
      const limited = rateLimitAnonymousView(request);
      if (limited) return limited;

      const entry = await viewMeetup(id);
      if (!entry) {
        return NextResponse.json(
          { error: "모임을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json({ entry });
    }

    if (body.action === "join") {
      const user = await requireCurrentUserFromRequest(request);
      if (user instanceof NextResponse) return user;

      const current = await getMeetup(id);
      if (!current) {
        return NextResponse.json(
          { error: "모임을 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      if (current.cancelled) {
        return NextResponse.json(
          { error: "취소된 모임입니다." },
          { status: 400 }
        );
      }

      if (new Date(current.meetupDate).getTime() <= Date.now()) {
        return NextResponse.json(
          { error: "이미 종료된 모임입니다." },
          { status: 400 }
        );
      }

      const entry = await joinMeetup(id, {
        userId: user.id,
        nickname: user.nickname,
      });

      if (!entry) {
        return NextResponse.json(
          { error: "참가 인원이 마감되었습니다." },
          { status: 400 }
        );
      }

      return NextResponse.json({ entry });
    }

    if (body.action === "leave") {
      const user = await requireCurrentUserFromRequest(request);
      if (user instanceof NextResponse) return user;

      const entry = await leaveMeetup(id, user.id);
      if (!entry) {
        return NextResponse.json(
          { error: "모임을 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      return NextResponse.json({ entry });
    }

    if (body.action === "update") {
      const managed = await requireManageableMeetup(request, id);
      if (managed instanceof NextResponse) return managed;

      const title = body.title != null ? String(body.title).trim() : undefined;
      const description =
        body.description != null ? String(body.description).trim() : undefined;
      const region = body.region as MeetupRegion | undefined;
      const meetupDate =
        body.meetupDate != null ? String(body.meetupDate).trim() : undefined;
      const meetingPoint =
        body.meetingPoint != null ? String(body.meetingPoint).trim() : undefined;
      const meetingDetail =
        body.meetingDetail != null ? String(body.meetingDetail).trim() : undefined;
      const pace = body.pace as MeetupPace | undefined;
      const routeHint =
        body.routeHint != null ? String(body.routeHint).trim() : undefined;
      const contact =
        body.contact != null ? String(body.contact).trim() : undefined;
      const cancelled =
        body.cancelled != null ? Boolean(body.cancelled) : undefined;
      const lat = body.lat != null ? Number(body.lat) : undefined;
      const lng = body.lng != null ? Number(body.lng) : undefined;
      const maxParticipantsRaw = body.maxParticipants;

      if (region && !postRegions.includes(region)) {
        return NextResponse.json(
          { error: "올바른 지역을 선택해 주세요." },
          { status: 400 }
        );
      }

      if (pace && !meetupPaces.includes(pace)) {
        return NextResponse.json(
          { error: "올바른 페이스를 선택해 주세요." },
          { status: 400 }
        );
      }

      if (meetupDate) {
        const meetupTime = new Date(meetupDate).getTime();
        if (Number.isNaN(meetupTime)) {
          return NextResponse.json(
            { error: "올바른 일정을 입력해 주세요." },
            { status: 400 }
          );
        }
      }

      let maxParticipants: number | null | undefined;
      if (maxParticipantsRaw !== undefined) {
        if (maxParticipantsRaw === "" || maxParticipantsRaw == null) {
          maxParticipants = null;
        } else {
          const parsed = Number(maxParticipantsRaw);
          if (!Number.isFinite(parsed) || parsed < 1 || parsed > 999) {
            return NextResponse.json(
              { error: "모집 인원은 1~999 사이로 입력해 주세요." },
              { status: 400 }
            );
          }
          maxParticipants = Math.floor(parsed);
        }
      }

      const entry = await updateMeetup(id, {
        title,
        description,
        region,
        meetupDate: meetupDate
          ? new Date(meetupDate).toISOString()
          : undefined,
        meetingPoint,
        meetingDetail: meetingDetail || undefined,
        pace,
        routeHint: routeHint || undefined,
        contact: contact || undefined,
        cancelled,
        lat: Number.isFinite(lat) ? lat : undefined,
        lng: Number.isFinite(lng) ? lng : undefined,
        maxParticipants,
      });

      return NextResponse.json({ entry });
    }

    return NextResponse.json({ error: "알 수 없는 요청입니다." }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "모임 처리에 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const managed = await requireManageableMeetup(request, id);
    if (managed instanceof NextResponse) return managed;

    const ok = await deleteMeetup(id);
    if (!ok) {
      return NextResponse.json(
        { error: "모임을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "모임 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
