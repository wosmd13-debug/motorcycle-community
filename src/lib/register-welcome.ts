export const REGISTER_WELCOME_KEY = "mc-register-welcome";

export function setRegisterWelcomePending(nickname: string): void {
  try {
    sessionStorage.setItem(REGISTER_WELCOME_KEY, nickname);
  } catch {
    // ignore storage errors (private mode, etc.)
  }
}

export function peekRegisterWelcome(): string | null {
  try {
    return sessionStorage.getItem(REGISTER_WELCOME_KEY);
  } catch {
    return null;
  }
}

export function clearRegisterWelcome(): void {
  try {
    sessionStorage.removeItem(REGISTER_WELCOME_KEY);
  } catch {
    // ignore
  }
}
