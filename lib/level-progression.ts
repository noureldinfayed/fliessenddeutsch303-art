const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export function nextLevel(level: string | null | undefined) {
  const index = LEVELS.indexOf(String(level ?? "").toUpperCase());
  return index >= 0 && index < LEVELS.length - 1 ? LEVELS[index + 1] : null;
}

export function isPromotionCandidate(currentLevel: string | null | undefined, resultLevel: string | null | undefined, score: number | null | undefined) {
  const current = String(currentLevel ?? "").toUpperCase();
  const result = String(resultLevel ?? "").toUpperCase();
  const expected = nextLevel(current);
  return Boolean(expected && result === expected && Number(score ?? 0) >= 70);
}
