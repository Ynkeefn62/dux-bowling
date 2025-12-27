export function scoreDuckpinGame(frames: number[][]) {
  let total = 0;
  const rolls = frames.flat();

  let rollIndex = 0;

  for (let frame = 0; frame < 10; frame++) {
    const r1 = rolls[rollIndex] ?? 0;
    const r2 = rolls[rollIndex + 1] ?? 0;
    const r3 = rolls[rollIndex + 2] ?? 0;

    // Strike
    if (r1 === 10) {
      total += 10 + r2 + r3;
      rollIndex += 1;
      continue;
    }

    // Spare (2 or 3 balls)
    if (r1 + r2 === 10 || r1 + r2 + r3 === 10) {
      total += 10 + (rolls[rollIndex + 3] ?? 0);
      rollIndex += r1 + r2 === 10 ? 2 : 3;
      continue;
    }

    // Open frame
    total += r1 + r2 + r3;
    rollIndex += 3;
  }

  return total;
}