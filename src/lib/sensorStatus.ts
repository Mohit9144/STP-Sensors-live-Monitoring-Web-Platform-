export type SensorStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'MALFUNCTION';

export function getStatus(value: number, min: number, max: number): SensorStatus {
  if (value < min || value > max) return 'CRITICAL';

  const warningMargin = 0.1 * (max - min);

  if (value < min + warningMargin || value > max - warningMargin) {
    return 'WARNING';
  }

  return 'HEALTHY';
}

export function getSensorStatus(value: number | null | undefined, min: number, max: number): SensorStatus {
  if (value === null || value === undefined || !Number.isFinite(value) || value > max * 5) {
    return 'MALFUNCTION';
  }

  return getStatus(value, min, max);
}

export function getStatusSeverity(status: SensorStatus): 'low' | 'medium' | 'high' | 'critical' {
  if (status === 'MALFUNCTION' || status === 'CRITICAL') return 'critical';
  if (status === 'WARNING') return 'high';
  return 'low';
}
