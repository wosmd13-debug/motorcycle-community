/** 법적 고지·푸터. 배포 시 NEXT_PUBLIC_* 환경 변수로 덮어쓰세요. */
export const siteLegalInfo = {
  serviceName: "Byanra",
  serviceNameEn: "Byanra",
  operatorName: process.env.NEXT_PUBLIC_SITE_OPERATOR_NAME ?? "Byanra 운영팀",
  contactEmail:
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "wosmd13@naver.com",
  contactPhone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://byanra.com",
  effectiveDate: "2026-07-07",
  lastUpdated: "2026-07-24",
} as const;

export const legalDocuments = [
  {
    href: "/legal/terms",
    title: "이용약관",
    description: "서비스 이용에 관한 기본 약관",
  },
  {
    href: "/legal/privacy",
    title: "개인정보처리방침",
    description: "개인정보 수집·이용·보호에 관한 안내",
  },
  {
    href: "/legal/community",
    title: "커뮤니티 운영정책",
    description: "게시물·댓글·홍보 등 이용 규칙",
  },
  {
    href: "/legal/youth",
    title: "청소년 보호정책",
    description: "청소년 유해 정보 차단 및 보호 조치",
  },
] as const;
