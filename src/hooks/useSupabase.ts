import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getThresholdForSensor } from '../lib/thresholds';
import { getSensorStatus, getStatusSeverity } from '../lib/sensorStatus';
import { SensorMaster, SensorReading, Alert } from '../types';
import { MOCK_SENSORS, generateMockReadings, MOCK_ALERTS } from '../mockData';

const normalizeKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const mockSensorByKey = new Map<string, SensorMaster>();
MOCK_SENSORS.forEach((sensor) => {
  [sensor.sensor_name, sensor.parameter_name, sensor.sensor_id].forEach((raw) => {
    const key = normalizeKey(raw);
    if (key && !mockSensorByKey.has(key)) {
      mockSensorByKey.set(key, sensor);
    }
  });
});

const resolveMockSensor = (value?: string): SensorMaster | undefined => {
  if (!value) return undefined;
  return mockSensorByKey.get(normalizeKey(value));
};

function normalizeReading(row: any): SensorReading | null {
  const eventTime = row?.event_time ?? row?.timestamp;
  const sensorName = row?.sensor_name;
  if (!eventTime || !sensorName) return null;

  const matchedMock = resolveMockSensor(String(sensorName));

  return {
    id: row?.id ?? row?.Record_id,
    event_time: String(eventTime),
    ingestion_time: String(row?.ingestion_time ?? eventTime),
    sensor_name: String(sensorName),
    plant_section: String(row?.plant_section ?? matchedMock?.plant_section ?? 'Unknown'),
    value: Number(row?.value ?? 0),
    unit: String(row?.unit ?? matchedMock?.unit ?? ''),
    quality_flag: (row?.quality_flag ?? 'good') as SensorReading['quality_flag'],
    status_flag: String(row?.status_flag ?? 'active'),
    delay_seconds: Number(row?.delay_seconds ?? 0),
  };
}

function groupReadingsBySensor(readingRows: SensorReading[]): Record<string, SensorReading[]> {
  const grouped: Record<string, SensorReading[]> = {};
  readingRows.forEach((r) => {
    if (!grouped[r.sensor_name]) grouped[r.sensor_name] = [];
    grouped[r.sensor_name].push(r);
  });

  Object.keys(grouped).forEach((sensorName) => {
    grouped[sensorName].sort(
      (a, b) => new Date(a.event_time).getTime() - new Date(b.event_time).getTime(),
    );
    grouped[sensorName] = grouped[sensorName].slice(-50);
  });

  return grouped;
}

function buildSensorsFromReadings(readingRows: SensorReading[]): SensorMaster[] {
  const names = Array.from(new Set(readingRows.map((r) => r.sensor_name)));

  return names.map((name) => {
    const matchedMock = resolveMockSensor(name);
    const rows = readingRows.filter((r) => r.sensor_name === name);
    const fixedThreshold = getThresholdForSensor(name, matchedMock?.parameter_name, matchedMock?.sensor_id);
    const fallbackThreshold = {
      min: matchedMock?.min_threshold ?? 0,
      max: matchedMock?.max_threshold ?? 1,
    };
    const resolvedThreshold = fixedThreshold ?? fallbackThreshold;

    return {
      sensor_id: matchedMock?.sensor_id ?? name,
      sensor_name: name,
      parameter_name: matchedMock?.parameter_name ?? name,
      unit: rows[rows.length - 1]?.unit ?? matchedMock?.unit ?? '',
      plant_section: rows[rows.length - 1]?.plant_section ?? matchedMock?.plant_section ?? 'Unknown',
      min_threshold: resolvedThreshold.min,
      max_threshold: resolvedThreshold.max,
      status: 'active',
    };
  });
}

function buildDerivedAlerts(
  sensors: SensorMaster[],
  groupedReadings: Record<string, SensorReading[]>,
): Alert[] {
  const derived: Alert[] = [];

  sensors.forEach((sensor) => {
    const latest = groupedReadings[sensor.sensor_name]?.at(-1);
    if (!latest) return;

    const threshold =
      getThresholdForSensor(sensor.sensor_name, sensor.parameter_name, sensor.sensor_id) ??
      { min: sensor.min_threshold, max: sensor.max_threshold };

    const status =
      latest.quality_flag === 'bad'
        ? 'MALFUNCTION'
        : getSensorStatus(latest.value, threshold.min, threshold.max);

    if (status === 'MALFUNCTION') {
      derived.push({
        alert_id: `derived-bad-${sensor.sensor_id}`,
        timestamp: latest.event_time,
        sensor_id: sensor.sensor_id,
        sensor_name: sensor.sensor_name,
        value: latest.value,
        severity: 'critical',
        message: `${sensor.sensor_name} reported malformed or invalid data.`,
      });
      return;
    }

    if (status !== 'HEALTHY') {
      derived.push({
        alert_id: `derived-threshold-${sensor.sensor_id}`,
        timestamp: latest.event_time,
        sensor_id: sensor.sensor_id,
        sensor_name: sensor.sensor_name,
        value: latest.value,
        severity: getStatusSeverity(status),
        message: `${sensor.sensor_name} is ${status} against threshold (${threshold.min} - ${threshold.max} ${sensor.unit}).`,
      });
    }
  });

  return derived.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20);
}

export function useSupabase() {
  const [sensors, setSensors] = useState<SensorMaster[]>([]);
  const [readings, setReadings] = useState<Record<string, SensorReading[]>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshIntervalMs = 60_000;
  const lastRecordIdRef = useRef<number>(0);
  const readingsRef = useRef<Record<string, SensorReading[]>>({});
  const sensorsRef = useRef<SensorMaster[]>([]);
  const resolvedReadingsTableRef = useRef<string | null>(null);
  const hasCheckedSensorMasterRef = useRef(false);
  const usesSensorMasterRef = useRef(false);

  useEffect(() => {
    const configuredReadingsTable = import.meta.env.VITE_SUPABASE_READINGS_TABLE as string | undefined;
    const realtimeEnabled = import.meta.env.VITE_ENABLE_REALTIME === 'true';
    const readingsTableCandidates = Array.from(
      new Set(
        [
          configuredReadingsTable,
          'sensor_readings',
          'STP Sensors 6 months Data',
        ].filter((v): v is string => Boolean(v && v.trim())),
      ),
    );

    const applyFixedThresholds = (sensor: SensorMaster): SensorMaster => {
      const fixed = getThresholdForSensor(sensor.sensor_name, sensor.parameter_name, sensor.sensor_id);
      if (!fixed) return sensor;

      return {
        ...sensor,
        min_threshold: fixed.min,
        max_threshold: fixed.max,
      };
    };

    const loadMockState = () => {
      const normalizedMockSensors = MOCK_SENSORS.map(applyFixedThresholds);
      setSensors(normalizedMockSensors);
      const mockReadings: Record<string, SensorReading[]> = {};
      normalizedMockSensors.forEach((s) => {
        mockReadings[s.sensor_name] = generateMockReadings(s.sensor_id);
      });
      readingsRef.current = mockReadings;
      sensorsRef.current = normalizedMockSensors;
      setReadings(mockReadings);
      setAlerts(MOCK_ALERTS);
    };

    const mergeIncomingReadings = (
      prev: Record<string, SensorReading[]>,
      incoming: SensorReading[],
    ): Record<string, SensorReading[]> => {
      if (incoming.length === 0) return prev;

      const next: Record<string, SensorReading[]> = { ...prev };
      incoming.forEach((reading) => {
        const sensorRows = next[reading.sensor_name] ? [...next[reading.sensor_name]] : [];
        sensorRows.push(reading);
        sensorRows.sort((a, b) => new Date(a.event_time).getTime() - new Date(b.event_time).getTime());
        next[reading.sensor_name] = sensorRows.slice(-50);
      });

      return next;
    };

    const flattenGroupedReadings = (grouped: Record<string, SensorReading[]>): SensorReading[] =>
      Object.values(grouped).flat();

    const pickReadingsTable = async (): Promise<string> => {
      if (resolvedReadingsTableRef.current) return resolvedReadingsTableRef.current;

      let lastError: any = null;
      for (const tableName of readingsTableCandidates) {
        const probe = await supabase
          .from(tableName)
          .select('Record_id')
          .order('Record_id', { ascending: true })
          .limit(1);

        if (!probe.error) {
          resolvedReadingsTableRef.current = tableName;
          return tableName;
        }
        lastError = probe.error;
      }

      throw lastError ?? new Error('Could not resolve a readable readings table.');
    };

    const ensureSensorsLoaded = async (groupedReadings: Record<string, SensorReading[]>) => {
      if (!hasCheckedSensorMasterRef.current) {
        const sensorMasterResponse = await supabase.from('sensor_master').select('*');
        if (!sensorMasterResponse.error && sensorMasterResponse.data && sensorMasterResponse.data.length > 0) {
          const normalizedSensors: SensorMaster[] = sensorMasterResponse.data.map((s: any) => ({
            ...(function () {
              const dbSensorName = String(s.sensor_name ?? '');
              const dbParameter = String(s.parameter_name ?? '');
              const dbSensorId = String(s.sensor_id ?? '');
              const matched = resolveMockSensor(dbSensorName) ?? resolveMockSensor(dbParameter) ?? resolveMockSensor(dbSensorId);
              const fixedThreshold = getThresholdForSensor(
                dbSensorName,
                dbParameter,
                dbSensorId,
                matched?.sensor_name,
                matched?.parameter_name,
                matched?.sensor_id,
              );

              return {
                sensor_id: matched?.sensor_id ?? String(s.sensor_id ?? s.sensor_name),
                sensor_name: dbSensorName || matched?.sensor_name || dbSensorId,
                parameter_name: matched?.parameter_name ?? String(s.parameter_name ?? s.sensor_name),
                unit: matched?.unit ?? String(s.unit ?? ''),
                plant_section: matched?.plant_section ?? String(s.plant_section ?? 'Unknown'),
                min_threshold: fixedThreshold?.min ?? matched?.min_threshold ?? Number(s.min_threshold ?? 0),
                max_threshold: fixedThreshold?.max ?? matched?.max_threshold ?? Number(s.max_threshold ?? 1),
                status: (s.status ?? 'active') as SensorMaster['status'],
              };
            })(),
          }));
          sensorsRef.current = normalizedSensors;
          setSensors(normalizedSensors);
          usesSensorMasterRef.current = true;
        }
        hasCheckedSensorMasterRef.current = true;
      }

      if (!usesSensorMasterRef.current) {
        const derivedSensors = buildSensorsFromReadings(flattenGroupedReadings(groupedReadings));
        const nextSensors = (derivedSensors.length > 0 ? derivedSensors : MOCK_SENSORS).map(applyFixedThresholds);
        sensorsRef.current = nextSensors;
        setSensors(nextSensors);
      }
    };

    async function fetchData(options?: { showLoading?: boolean; fallbackToMockOnError?: boolean }) {
      const showLoading = options?.showLoading ?? true;
      const fallbackToMockOnError = options?.fallbackToMockOnError ?? true;

      try {
        if (showLoading) setLoading(true);
        setError(null);
        
        if (!isSupabaseConfigured) {
          console.info('Supabase not configured. Using mock data.');
          loadMockState();
          return;
        }

        const tableName = await pickReadingsTable();

        // Start from Record_id 1 and move forward incrementally.
        const pageSize = 1000;
        const maxPagesPerCycle = 12;
        const incomingRows: any[] = [];
        let cursor = lastRecordIdRef.current;

        for (let page = 0; page < maxPagesPerCycle; page += 1) {
          const response = await supabase
            .from(tableName)
            .select('*')
            .gt('Record_id', cursor)
            .order('Record_id', { ascending: true })
            .limit(pageSize);

          if (response.error) {
            throw response.error;
          }

          const rows = response.data ?? [];
          if (rows.length === 0) break;

          incomingRows.push(...rows);
          cursor = Number(rows[rows.length - 1]?.Record_id ?? cursor);

          if (rows.length < pageSize) break;
        }

        const normalizedReadings = incomingRows
          .map(normalizeReading)
          .filter((r): r is SensorReading => Boolean(r));

        if (normalizedReadings.length === 0 && cursor === 0) {
          console.info('No readings found in Supabase. Using mock data.');
          loadMockState();
          return;
        }

        if (cursor > lastRecordIdRef.current) {
          lastRecordIdRef.current = cursor;
        }

        const mergedReadings = mergeIncomingReadings(readingsRef.current, normalizedReadings);
        readingsRef.current = mergedReadings;
        setReadings(mergedReadings);

        await ensureSensorsLoaded(mergedReadings);
        const sensorsForAlerts = sensorsRef.current.length > 0 ? sensorsRef.current : MOCK_SENSORS;
        setAlerts(buildDerivedAlerts(sensorsForAlerts, mergedReadings));

        // If alerts table exists, prefer it and enrich with sensor_name when available.
        const alertsResponse = await supabase
          .from('alerts')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(20);

        if (!alertsResponse.error && alertsResponse.data) {
          let normalizedAlerts: Alert[] = alertsResponse.data.map((a: any) => ({
            ...(function () {
              const sensorName = a.sensor_name ? String(a.sensor_name) : String(a.sensor_id ?? 'unknown_sensor');
              const threshold = getThresholdForSensor(sensorName);
              const value = Number(a.value ?? 0);
              const status = threshold
                ? getSensorStatus(value, threshold.min, threshold.max)
                : null;

              return {
                severity: status ? getStatusSeverity(status) : ((a.severity ?? 'medium') as Alert['severity']),
              };
            })(),
            alert_id: String(a.alert_id ?? a.id ?? `${a.sensor_id}-${a.timestamp}`),
            timestamp: String(a.timestamp ?? new Date().toISOString()),
            sensor_id: String(a.sensor_id ?? a.sensor_name ?? 'unknown_sensor'),
            sensor_name: a.sensor_name ? String(a.sensor_name) : undefined,
            value: Number(a.value ?? 0),
            message: String(a.message ?? 'Threshold alert'),
          }));
          if (normalizedAlerts.length === 0) { normalizedAlerts = [...buildDerivedAlerts(sensorsForAlerts, mergedReadings), ...MOCK_ALERTS].slice(0, 20); } setAlerts(normalizedAlerts);
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message);
        // Initial load falls back to mock; background refresh keeps current UI state.
        if (fallbackToMockOnError) {
          loadMockState();
        }
      } finally {
        if (showLoading) setLoading(false);
      }
    }

    fetchData({ showLoading: true, fallbackToMockOnError: true });

    if (!isSupabaseConfigured) return;

    const refreshTimer = setInterval(() => {
      fetchData({ showLoading: false, fallbackToMockOnError: false });
    }, refreshIntervalMs);

    // Real-time subscriptions are optional; default is minute polling only.
    const readingSubscriptions = realtimeEnabled
      ? readingsTableCandidates.map((tableName) =>
          supabase
            .channel(`sensor_readings_changes_${tableName}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: tableName }, payload => {
              const newReading = normalizeReading(payload.new);
              if (!newReading) return;

              const incomingId = Number((payload.new as any)?.Record_id ?? newReading.id ?? 0);
              if (incomingId > lastRecordIdRef.current) {
                lastRecordIdRef.current = incomingId;
              }

              setReadings(prev => {
                const sensorReadings = prev[newReading.sensor_name] || [];
                const updated = [...sensorReadings, newReading].slice(-50); // Keep last 50
                const next = { ...prev, [newReading.sensor_name]: updated };
                readingsRef.current = next;
                return next;
              });

              setSensors((prev) => {
                if (prev.some((s) => s.sensor_name === newReading.sensor_name)) return prev;
                const matchedMock = resolveMockSensor(newReading.sensor_name);
                const fixedThreshold = getThresholdForSensor(
                  newReading.sensor_name,
                  matchedMock?.parameter_name,
                  matchedMock?.sensor_id,
                );
                return [
                  ...prev,
                  {
                    sensor_id: matchedMock?.sensor_id ?? newReading.sensor_name,
                    sensor_name: newReading.sensor_name,
                    parameter_name: matchedMock?.parameter_name ?? newReading.sensor_name,
                    unit: newReading.unit || matchedMock?.unit || '',
                    plant_section: newReading.plant_section || matchedMock?.plant_section || 'Unknown',
                    min_threshold: fixedThreshold?.min ?? matchedMock?.min_threshold ?? 0,
                    max_threshold: fixedThreshold?.max ?? matchedMock?.max_threshold ?? 1,
                    status: 'active',
                  },
                ];
              });
            })
            .subscribe(),
        )
      : [];

    const alertsSubscription = realtimeEnabled
      ? supabase
          .channel('alerts_changes')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, payload => {
            const newAlert = payload.new as Alert;
            setAlerts(prev => [newAlert, ...prev].slice(0, 20));
          })
          .subscribe()
      : null;

    return () => {
      clearInterval(refreshTimer);
      readingSubscriptions.forEach((subscription) => {
        supabase.removeChannel(subscription);
      });
      if (alertsSubscription) {
        supabase.removeChannel(alertsSubscription);
      }
    };
  }, []);

  const takeAction = async (sensorId: string, actionType: string) => {
    if (!isSupabaseConfigured) {
      console.log(`[Mock Action] ${actionType} recorded for sensor ${sensorId}`);
      return;
    }
    try {
      const { error } = await supabase
        .from('sensor_actions')
        .insert({
          sensor_id: sensorId,
          action_type: actionType,
          timestamp: new Date().toISOString()
        });
      
      if (error) {
        console.warn('sensor_actions table may be missing or restricted:', error.message);
      }
      console.log(`Action ${actionType} recorded for sensor ${sensorId}`);
    } catch (err) {
      console.error('Error recording action:', err);
      // Even if DB fails, we show success in UI for demo
    }
  };

  return { sensors, readings, alerts, loading, error, takeAction };
}
