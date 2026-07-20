const lockQueues = new Map<string, Promise<unknown>>();

/** 단일 프로세스 JSON 파일 read-modify-write 직렬화 */
export function withJsonStoreLock<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  const previous = lockQueues.get(key) ?? Promise.resolve();
  const run = previous.catch(() => undefined).then(fn);
  lockQueues.set(
    key,
    run.then(
      () => undefined,
      () => undefined
    )
  );
  return run;
}
