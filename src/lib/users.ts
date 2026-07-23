export type UserRole = "member" | "operator";

export type User = {
  id: string;
  loginId: string;
  nickname: string;
  passwordHash: string;
  createdAt: string;
  role?: UserRole;
};

export type PublicUser = {
  id: string;
  loginId: string;
  nickname: string;
  isAdmin?: boolean;
  isOperator?: boolean;
};

export type RegisterUserInput = {
  loginId: string;
  nickname: string;
  password: string;
};

export type UpdateUserProfileInput = {
  nickname?: string;
  currentPassword: string;
  newPassword?: string;
};

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    loginId: user.loginId,
    nickname: user.nickname,
    isOperator: user.role === "operator",
  };
}

export function validateLoginId(loginId: string): string | null {
  const value = loginId.trim();
  if (value.length < 3 || value.length > 20) {
    return "아이디는 3~20자여야 합니다.";
  }
  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    return "아이디는 영문, 숫자, 밑줄(_)만 사용할 수 있습니다.";
  }
  return null;
}

export function validateNickname(nickname: string): string | null {
  const value = nickname.trim();
  if (value.length < 2 || value.length > 24) {
    return "닉네임은 2~24자여야 합니다.";
  }
  if (!/^[a-zA-Z0-9가-힣_]+$/.test(value)) {
    return "닉네임은 한글, 영문, 숫자, 밑줄(_)만 사용할 수 있습니다.";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "비밀번호는 8자 이상이어야 합니다.";
  }
  if (password.length > 72) {
    return "비밀번호는 72자 이하여야 합니다.";
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "비밀번호는 영문과 숫자를 모두 포함해야 합니다.";
  }
  return null;
}
