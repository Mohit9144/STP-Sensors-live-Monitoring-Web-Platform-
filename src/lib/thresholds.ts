export const thresholds = {
  BOD: { min: 0, max: 12 },
  COD: { min: 0, max: 60 },
  TSS: { min: 0, max: 24 },
  pH: { min: 6.0, max: 9.0 },
  temperature: { min: 15, max: 40 },
  DO: { min: 1.0, max: 4.0 },
  ammonia: { min: 0, max: 6 },
  MLSS: { min: 2500, max: 4500 },
  airflow: { min: 60, max: 120 },
  OTE: { min: 10, max: 40 },
  TN: { min: 0, max: 12 },
  phosphorus: { min: 0, max: 1.5 },
  sludge_level: { min: 5, max: 35 },
  SVI: { min: 80, max: 130 },
  RAS_flow: { min: 20, max: 120 },
  WAS_flow: { min: 5, max: 55 },
  chlorine_dose: { min: 0.5, max: 3.5 },
  residual_chlorine: { min: 0.3, max: 1.2 },
  energy: { min: 0.1, max: 0.4 },
  vibration: { min: 0, max: 10 },
} as const;

export type ThresholdRange = { min: number; max: number };

const normalizeKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const thresholdByNormalizedKey = Object.entries(thresholds).reduce<Record<string, ThresholdRange>>(
  (acc, [key, range]) => {
    acc[normalizeKey(key)] = { ...range };
    return acc;
  },
  {},
);

export function getThresholdForSensor(...candidates: Array<string | undefined>): ThresholdRange | undefined {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const normalized = normalizeKey(candidate);
    if (!normalized) continue;

    const direct = thresholdByNormalizedKey[normalized];
    if (direct) return direct;

    // Handle identifiers like M1_DO by checking trailing token.
    const trailingToken = normalized.split(/\d+/).pop();
    if (trailingToken && thresholdByNormalizedKey[trailingToken]) {
      return thresholdByNormalizedKey[trailingToken];
    }
  }

  return undefined;
}
