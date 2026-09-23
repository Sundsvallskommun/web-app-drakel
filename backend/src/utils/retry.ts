/**
 * Runs `attempt` up to `times` times, until it succeeds. Resolves true when one attempt succeeded and
 * false when all of them failed — for work that must not be given up on after a single hiccup but whose
 * failure the caller handles itself, like handing a Lifecare outcome back to careM.
 */
export const succeedsWithin = async (
  times: number,
  attempt: () => Promise<unknown>,
  onFailure?: (attemptNumber: number) => void,
): Promise<boolean> => {
  for (let attemptNumber = 1; attemptNumber <= times; attemptNumber++) {
    try {
      await attempt();
      return true;
    } catch {
      onFailure?.(attemptNumber);
    }
  }
  return false;
};
