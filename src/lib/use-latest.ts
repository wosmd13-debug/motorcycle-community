import { useRef } from "react";

/** Keeps the latest callback/value without re-running effects when it changes. */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
