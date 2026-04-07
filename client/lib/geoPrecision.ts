/** Coordinates stored in Firestore (privacy / consistency). */
const DECIMALS = 2;
const SCALE = 10 ** DECIMALS;

export function roundGeoCoordinate(value: number): number {
  return Math.round(value * SCALE) / SCALE;
}
