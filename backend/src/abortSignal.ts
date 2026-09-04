// Shared AbortSignal.timeout guard: older runtimes / edge environments may
// lack AbortSignal.timeout. Degrade to no timeout (undefined signal) instead
// of throwing TypeError during fetch argument evaluation.
export const timeoutSignal = (timeoutMs: number): AbortSignal | undefined => {
  if (typeof AbortSignal === 'undefined') return undefined;
  if (typeof AbortSignal.timeout !== 'function') return undefined;
  return AbortSignal.timeout(timeoutMs);
};
