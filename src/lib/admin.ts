import { loadEnvConfig } from "@next/env";
import type { PublicUser, User } from "@/lib/users";

let envLoaded = false;

function ensureEnvLoaded() {
  if (envLoaded) return;
  loadEnvConfig(process.cwd());
  envLoaded = true;
}

export function getAdminLoginIds(): string[] {
  ensureEnvLoaded();
  const raw = process.env.ADMIN_LOGIN_IDS ?? "";
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function isAdminUser(user: PublicUser | null | undefined): boolean {
  if (!user) return false;
  return getAdminLoginIds().includes(user.loginId.trim());
}

export function isOperatorUser(
  user: PublicUser | User | null | undefined
): boolean {
  if (!user) return false;
  if ("role" in user && user.role === "operator") return true;
  if ("isOperator" in user && user.isOperator) return true;
  return isAdminUser({
    id: "id" in user ? user.id : "",
    loginId: user.loginId,
    nickname: "nickname" in user ? user.nickname : "",
  });
}

export function withAdminFlag<T extends PublicUser>(
  user: T
): T & { isAdmin: boolean; isOperator: boolean } {
  const isAdmin = isAdminUser(user);
  return {
    ...user,
    isAdmin,
    isOperator: Boolean(user.isOperator) || isAdmin,
  };
}

export function shouldAssignOperatorRole(loginId: string): boolean {
  return getAdminLoginIds().includes(loginId.trim());
}

export function canModerateCommunity(
  user: PublicUser | User | null | undefined
): boolean {
  return isOperatorUser(user);
}
