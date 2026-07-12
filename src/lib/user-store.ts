import { promises as fs } from "fs";
import path from "path";
import { hashPassword, verifyPassword } from "@/lib/password";
import { isOperatorUser, shouldAssignOperatorRole } from "@/lib/admin";
import {
  toPublicUser,
  validateLoginId,
  validateNickname,
  validatePassword,
  type PublicUser,
  type RegisterUserInput,
  type UpdateUserProfileInput,
  type User,
} from "@/lib/users";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "users.json");

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

export async function readUsers(): Promise<User[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(raw) as User[];
}

async function writeUsers(users: User[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2), "utf8");
}

export async function findUserByLoginId(loginId: string): Promise<User | null> {
  const users = await readUsers();
  return users.find((user) => user.loginId === loginId.trim()) ?? null;
}

export async function findUserByNickname(nickname: string): Promise<User | null> {
  const users = await readUsers();
  return users.find((user) => user.nickname === nickname.trim()) ?? null;
}

export async function findUserById(id: string): Promise<User | null> {
  const users = await readUsers();
  return users.find((user) => user.id === id) ?? null;
}

export async function registerUser(
  input: RegisterUserInput
): Promise<{ user?: PublicUser; error?: string }> {
  const loginId = input.loginId.trim();
  const nickname = input.nickname.trim();
  const password = input.password;

  const loginIdError = validateLoginId(loginId);
  if (loginIdError) return { error: loginIdError };

  const nicknameError = validateNickname(nickname);
  if (nicknameError) return { error: nicknameError };

  const passwordError = validatePassword(password);
  if (passwordError) return { error: passwordError };

  const users = await readUsers();

  if (users.some((user) => user.loginId === loginId)) {
    return { error: "이미 사용 중인 아이디입니다." };
  }

  if (users.some((user) => user.nickname === nickname)) {
    return { error: "이미 사용 중인 닉네임입니다." };
  }

  const user: User = {
    id: crypto.randomUUID(),
    loginId,
    nickname,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
    ...(shouldAssignOperatorRole(loginId) ? { role: "operator" as const } : {}),
  };

  users.push(user);
  await writeUsers(users);
  return { user: toPublicUser(user) };
}

export async function authenticateUser(
  loginId: string,
  password: string
): Promise<{ user?: PublicUser; error?: string }> {
  const user = await findUserByLoginId(loginId.trim());
  if (!user) {
    return { error: "아이디 또는 비밀번호가 올바르지 않습니다." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "아이디 또는 비밀번호가 올바르지 않습니다." };
  }

  if (shouldAssignOperatorRole(user.loginId) && user.role !== "operator") {
    const users = await readUsers();
    const index = users.findIndex((item) => item.id === user.id);
    if (index !== -1) {
      users[index] = { ...users[index], role: "operator" };
      await writeUsers(users);
      user.role = "operator";
    }
  }

  return { user: toPublicUser(user) };
}

export async function updateUserProfile(
  userId: string,
  input: UpdateUserProfileInput
): Promise<{ user?: PublicUser; error?: string; oldNickname?: string }> {
  const currentPassword = input.currentPassword;
  if (!currentPassword) {
    return { error: "현재 비밀번호를 입력해 주세요." };
  }

  const users = await readUsers();
  const index = users.findIndex((user) => user.id === userId);
  if (index === -1) {
    return { error: "회원 정보를 찾을 수 없습니다." };
  }

  const user = users[index];
  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    return { error: "현재 비밀번호가 올바르지 않습니다." };
  }

  const nextNickname = input.nickname?.trim();
  const nicknameChanged =
    nextNickname !== undefined && nextNickname !== user.nickname;

  if (nicknameChanged) {
    const nicknameError = validateNickname(nextNickname);
    if (nicknameError) return { error: nicknameError };

    if (users.some((item) => item.id !== userId && item.nickname === nextNickname)) {
      return { error: "이미 사용 중인 닉네임입니다." };
    }
  }

  const nextPassword = input.newPassword;
  if (nextPassword !== undefined) {
    const passwordError = validatePassword(nextPassword);
    if (passwordError) return { error: passwordError };
  }

  if (!nicknameChanged && nextPassword === undefined) {
    return { error: "변경할 정보를 입력해 주세요." };
  }

  const oldNickname = user.nickname;

  if (nicknameChanged) {
    user.nickname = nextNickname!;
  }

  if (nextPassword !== undefined) {
    user.passwordHash = await hashPassword(nextPassword);
  }

  users[index] = user;
  await writeUsers(users);

  return {
    user: toPublicUser(user),
    ...(nicknameChanged ? { oldNickname } : {}),
  };
}

export async function deleteUserAccount(
  userId: string,
  password: string
): Promise<{ nickname?: string; error?: string }> {
  if (!password) {
    return { error: "비밀번호를 입력해 주세요." };
  }

  const users = await readUsers();
  const index = users.findIndex((user) => user.id === userId);
  if (index === -1) {
    return { error: "회원 정보를 찾을 수 없습니다." };
  }

  const user = users[index];

  if (isOperatorUser(user)) {
    return { error: "운영자 계정은 탈퇴할 수 없습니다." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "비밀번호가 올바르지 않습니다." };
  }

  const nickname = user.nickname;
  users.splice(index, 1);
  await writeUsers(users);

  return { nickname };
}
