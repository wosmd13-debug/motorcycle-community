import { NextRequest, NextResponse } from "next/server";
import {
  meetupPaces,
  meetupRegions,
  type MeetupPace,
  type MeetupRegion,
} from "@/lib/meetup";
import { createMeetup, readMeetups } from "@/lib/meetup-store";
import { requireUserWithRateLimit } from "@/lib/request-guards";

const postRegions = meetupRegions.filter(
  (region): region is MeetupRegion => region !== "전체"
);

export async function GET() {
  try {
    const entries = await readMeetups();
    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json(
      { error: "모임 목록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUserWithRateLimit(request, "write");
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const region = body.region as MeetupRegion;
    const meetupDate = String(body.meetupDate ?? "").trim();
    const meetingPoint = String(body.meetingPoint ?? "").trim();
    const meetingDetail = String(body.meetingDetail ?? "").trim();
    const pace = body.pace as MeetupPace;
    const routeHint = String(body.routeHint ?? "").trim();
    const contact = String(body.contact ?? "").trim();
    const maxParticipantsRaw = body.maxParticipants;
    const lat = body.lat != null ? Number(body.lat) : undefined;
    const lng = body.lng != null ? Number(body.lng) : undefined;

    if (!title || !description || !meetupDate || !meetingPoint) {
      return NextResponse.json(
        { error: "제목, 일정, 집합 장소, 설명은 필수입니다." },
        { status: 400 }
      );
    }

    if (!postRegions.includes(region)) {
      return NextResponse.json(
        { error: "올바른 지역을 선택해 주세요." },
        { status: 400 }
      );
    }

    if (!meetupPaces.includes(pace)) {
      return NextResponse.json(
        { error: "올바른 페이스를 선택해 주세요." },
        { status: 400 }
      );
    }

    const meetupTime = new Date(meetupDate).getTime();
    if (Number.isNaN(meetupTime)) {
      return NextResponse.json(
        { error: "올바른 일정을 입력해 주세요." },
        { status: 400 }
      );
    }

    if (meetupTime <= Date.now()) {
      return NextResponse.json(
        { error: "모임 일정은 현재 시각 이후여야 합니다." },
        { status: 400 }
      );
    }

    let maxParticipants: number | null = null;
    if (maxParticipantsRaw != null && maxParticipantsRaw !== "") {
      const parsed = Number(maxParticipantsRaw);
      if (!Number.isFinite(parsed) || parsed < 1 || parsed > 999) {
        return NextResponse.json(
          { error: "모집 인원은 1~999 사이로 입력해 주세요." },
          { status: 400 }
        );
      }
      maxParticipants = Math.floor(parsed);
    }

    const entry = await createMeetup({
      title,
      author: user.nickname,
      authorId: user.id,
      region,
      meetupDate: new Date(meetupDate).toISOString(),
      meetingPoint,
      meetingDetail: meetingDetail || undefined,
      lat: Number.isFinite(lat) ? lat : undefined,
      lng: Number.isFinite(lng) ? lng : undefined,
      pace,
      routeHint: routeHint || undefined,
      description,
      contact: contact || undefined,
      maxParticipants,
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "모임을 등록하지 못했습니다." },
      { status: 500 }
    );
  }
}
