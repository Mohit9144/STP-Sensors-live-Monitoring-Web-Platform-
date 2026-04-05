import { SensorReading } from '../types';

export interface DisplayBounds {
  minDomain: number;
  maxDomain: number;
}

export function computeAdaptiveDisplayBounds(
  readings: SensorReading[],
  threshold: { min: number; max: number },
): DisplayBounds {
  const thresholdMin = threshold.min >= 0 ? threshold.min : 0;
  const thresholdMax = threshold.max > thresholdMin ? threshold.max : thresholdMin + 0.01;
  const thresholdRange = thresholdMax - thresholdMin;

  let baseMin = thresholdMin - thresholdRange * 0.12;
  if (baseMin < 0) baseMin = 0;
  let baseMax = thresholdMax + thresholdRange * 0.12;

  if (readings.length === 0) {
    return { minDomain: baseMin, maxDomain: baseMax };
  }

  let observedMin = Number.POSITIVE_INFINITY;
  let observedMax = Number.NEGATIVE_INFINITY;

  for (const reading of readings) {
    const value = reading.value;
    if (!Number.isFinite(value)) continue;
    if (value < observedMin) observedMin = value;
    if (value > observedMax) observedMax = value;
  }

  if (!Number.isFinite(observedMin) || !Number.isFinite(observedMax)) {
    return { minDomain: baseMin, maxDomain: baseMax };
  }

  const nearEdgeBand = thresholdRange * 0.05;

  // If the trend sticks to upper side, increase the display max to move the line toward center.
  if (observedMax >= thresholdMax - nearEdgeBand) {
    const overshoot = observedMax - thresholdMax;
    const growTopBy = overshoot + thresholdRange * 0.35;
    const candidate = thresholdMax + growTopBy;
    if (candidate > baseMax) baseMax = candidate;
  }

  // If the trend sticks to lower side, decrease the display min to move the line toward center.
  if (observedMin <= thresholdMin + nearEdgeBand) {
    const undershoot = thresholdMin - observedMin;
    const growBottomBy = undershoot + thresholdRange * 0.35;
    const candidate = thresholdMin - growBottomBy;
    baseMin = candidate > 0 ? candidate : 0;
  }

  if (baseMax <= baseMin) {
    baseMax = baseMin + 0.01;
  }

  return { minDomain: baseMin, maxDomain: baseMax };
}
