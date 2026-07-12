"use client";

import PortalModal from "@/components/portal/PortalModal";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  clearRegisterWelcome,
  peekRegisterWelcome,
} from "@/lib/register-welcome";

export default function RegisterWelcomeModal() {
  const pathname = usePathname();
  const [nickname, setNickname] = useState<string | null>(null);

  useEffect(() => {
    const pending = peekRegisterWelcome();
    if (pending) {
      setNickname(pending);
    }
  }, [pathname]);

  if (!nickname) return null;

  const handleClose = () => {
    clearRegisterWelcome();
    setNickname(null);
  };

  return (
    <PortalModal onClose={handleClose} overlayClassName="z-[100]" closeOnBackdrop={false} labelledBy="register-welcome-title">
      <div className="portal-modal-panel max-w-md overflow-hidden p-0">
        <div className="border-b border-signature/20 bg-gradient-to-br from-signature-light to-white px-6 py-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-signature text-3xl text-white shadow-lg">
            🎉
          </div>
          <h2
            id="register-welcome-title"
            className="mt-4 text-xl font-bold text-stone-800"
          >
            가입을 축하합니다!
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            <span className="font-semibold text-signature-darker">{nickname}</span>
            님, 바이크커뮤니티에 오신 것을 환영합니다.
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <p className="text-sm leading-6 text-stone-600">
            이제 자유게시판, 라이딩 모임, 갤러리, 자유홍보 등 다양한 공간에서
            라이더들과 함께 활동할 수 있습니다.
          </p>

          <ul className="space-y-2 text-xs leading-5 text-stone-500">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-signature-dark">✓</span>
              <span>게시글·댓글 작성 시 등록한 닉네임으로 표시됩니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-signature-dark">✓</span>
              <span>
                <Link href="/profile" className="font-semibold text-signature-dark hover:underline">
                  내 프로필
                </Link>
                에서 닉네임과 정보를 관리할 수 있습니다.
              </span>
            </li>
          </ul>

          <button
            type="button"
            onClick={handleClose}
            className="portal-btn w-full py-3 text-sm"
          >
            시작하기
          </button>
        </div>
      </div>
    </PortalModal>
  );
}
