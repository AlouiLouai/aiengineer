/**
 * Next-token odds from logits in descending order: after temperature (`before`), and after the
 * top-p cut and renormalising (`after`).
 */
export function sample(logits: number[], temperature: number, topP: number): { before: number[]; after: number[] } {
  const max = Math.max(...logits);
  const weights = logits.map((l) => (temperature === 0 ? Number(l === max) : Math.exp((l - max) / temperature)));
  const total = weights.reduce((a, b) => a + b, 0);
  const before = weights.map((w) => w / total);

  // In descending order, the nucleus is a prefix: stop once the mass so far reaches top-p.
  const kept: number[] = [];
  let mass = 0;
  for (const p of before) {
    kept.push(mass < topP - 1e-9 ? p : 0);
    mass += p;
  }
  const keptMass = kept.reduce((a, b) => a + b, 0);
  return { before, after: kept.map((p) => p / keptMass) };
}
