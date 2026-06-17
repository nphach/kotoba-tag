export const BASE_POINTS = 10;

export function pointsEarned(multiplier: number) {
  return BASE_POINTS * multiplier;
}

export function pointsEarnedMessage(multiplier: number) {
  return `+${pointsEarned(multiplier)} points`;
}
