import { SensorMaster, SensorReading, Alert } from './types';

export const MOCK_SENSORS: SensorMaster[] = [
  { sensor_id: 'M1_DO', sensor_name: 'DO Sensor', parameter_name: 'DO', unit: 'mg/L', plant_section: 'Aeration', min_threshold: 1.5, max_threshold: 3.5, status: 'active' },
  { sensor_id: 'M2_AIR', sensor_name: 'Aeration Demand Sensor', parameter_name: 'Air Flow', unit: '%', plant_section: 'Aeration', min_threshold: 70, max_threshold: 110, status: 'active' },
  { sensor_id: 'M3_ENERGY', sensor_name: 'Energy Sensor', parameter_name: 'Energy', unit: 'kWh/m3', plant_section: 'Equipment', min_threshold: 0.15, max_threshold: 0.30, status: 'active' },
  { sensor_id: 'M4_CHEM', sensor_name: 'Chemical Dosing Sensor', parameter_name: 'Polymer Dose', unit: 'mg/L', plant_section: 'Chemical', min_threshold: 1, max_threshold: 5, status: 'active' },
  { sensor_id: 'M5_EFF_BOD', sensor_name: 'Effluent BOD Sensor', parameter_name: 'BOD', unit: 'mg/L', plant_section: 'Outlet', min_threshold: 0, max_threshold: 10, status: 'active' },
  { sensor_id: 'M6_VIB', sensor_name: 'Equipment Vibration Sensor', parameter_name: 'Vibration', unit: 'mm/s', plant_section: 'Equipment', min_threshold: 0, max_threshold: 10, status: 'active' },
  { sensor_id: 'M7_STATUS', sensor_name: 'Operator Advisory Status', parameter_name: 'System Status', unit: 'index', plant_section: 'Control', min_threshold: 0, max_threshold: 1, status: 'active' },
  { sensor_id: 'M8_ANOMALY', sensor_name: 'Anomaly Sensor', parameter_name: 'Anomaly Score', unit: 'index', plant_section: 'Control', min_threshold: 0, max_threshold: 1, status: 'active' },
  { sensor_id: 'M9_NITRI', sensor_name: 'Nitrification Sensor', parameter_name: 'Nitrification Rate', unit: 'mg/L/hr', plant_section: 'Biology', min_threshold: 0.5, max_threshold: 2.0, status: 'active' },
  { sensor_id: 'M10_DENITRI', sensor_name: 'Denitrification Sensor', parameter_name: 'Denitrification Rate', unit: 'mg/L/hr', plant_section: 'Biology', min_threshold: 0.5, max_threshold: 2.5, status: 'active' },
  { sensor_id: 'M11_OTE', sensor_name: 'Biofilm OTE Sensor', parameter_name: 'OTE', unit: '%', plant_section: 'IFAS', min_threshold: 15, max_threshold: 35, status: 'active' },
  { sensor_id: 'M12_WASHOUT', sensor_name: 'Biofilm Washout Sensor', parameter_name: 'Washout Risk', unit: 'index', plant_section: 'IFAS', min_threshold: 0, max_threshold: 1, status: 'active' },
  { sensor_id: 'M13_MLSS', sensor_name: 'MLSS Sensor', parameter_name: 'MLSS', unit: 'mg/L', plant_section: 'Biology', min_threshold: 2500, max_threshold: 4500, status: 'active' },
  { sensor_id: 'M14_TEMP', sensor_name: 'Temperature Sensor', parameter_name: 'Temperature', unit: '°C', plant_section: 'Biology', min_threshold: 15, max_threshold: 35, status: 'active' },
  { sensor_id: 'M15_SVI', sensor_name: 'Sludge Bulking Sensor', parameter_name: 'SVI', unit: 'mL/g', plant_section: 'Sludge', min_threshold: 80, max_threshold: 120, status: 'active' },
  { sensor_id: 'M16_FILAMENT', sensor_name: 'Filament Sensor', parameter_name: 'Filament Index', unit: 'scale', plant_section: 'Sludge', min_threshold: 0, max_threshold: 5, status: 'active' },
  { sensor_id: 'M17_BIOGAS', sensor_name: 'Biogas Sensor', parameter_name: 'Biogas Production', unit: 'm3/kg VS', plant_section: 'Digester', min_threshold: 0.8, max_threshold: 1.5, status: 'active' },
  { sensor_id: 'M18_DIGESTER', sensor_name: 'Digester Health Sensor', parameter_name: 'Digester pH', unit: '-', plant_section: 'Digester', min_threshold: 6.8, max_threshold: 7.5, status: 'active' },
  { sensor_id: 'M19_NUTRIENT', sensor_name: 'Nutrient Balance Sensor', parameter_name: 'C:N Ratio', unit: '-', plant_section: 'Nutrient', min_threshold: 5, max_threshold: 10, status: 'active' },
  { sensor_id: 'M20_CHLORINE', sensor_name: 'Chlorine Residual Sensor', parameter_name: 'Residual Chlorine', unit: 'mg/L', plant_section: 'Outlet', min_threshold: 0.5, max_threshold: 1.0, status: 'active' },
];

export const generateMockReadings = (sensorId: string, count: number = 20): SensorReading[] => {
  const sensor = MOCK_SENSORS.find(s => s.sensor_id === sensorId);
  if (!sensor) return [];
  
  const baseValue = (sensor.min_threshold + sensor.max_threshold) / 2;
  const range = sensor.max_threshold - sensor.min_threshold;
  
  // Simulate some malfunctioning sensors
  const isMalfunctioning = sensorId === 'M11_OTE' || sensorId === 'M6_VIB';
  
  let currentValue = baseValue;
  const volatility = range * 0.05; // 5% of range as max step
  const meanReversion = 0.1; // Factor to pull back to baseValue
  
  return Array.from({ length: count }).map((_, i) => {
    const now = new Date(Date.now() - (count - i) * 60000).toISOString();
    
    // Random walk with mean reversion
    const step = (Math.random() - 0.5) * volatility;
    currentValue += step + (baseValue - currentValue) * meanReversion;
    
    // Clamp to thresholds with some overflow
    currentValue = Math.max(sensor.min_threshold - range * 0.1, Math.min(sensor.max_threshold + range * 0.1, currentValue));

    // Malfunction behavior: drop to near-zero with slight noise
    const finalValue = isMalfunctioning && i > count - 5 
      ? Math.random() * (range * 0.05) 
      : currentValue;

    return {
      event_time: now,
      ingestion_time: now,
      sensor_name: sensor.sensor_name,
      plant_section: sensor.plant_section,
      value: finalValue,
      unit: sensor.unit,
      quality_flag: isMalfunctioning && i > count - 5 ? 'bad' : 'good',
      status_flag: 'active',
      delay_seconds: Math.floor(Math.random() * 5),
    };
  });
};

export const MOCK_ALERTS: Alert[] = [
  {
    alert_id: '1',
    timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
    sensor_id: 'DO_01',
    sensor_name: 'DO Sensor - Aeration Tank 1',
    value: 1.2,
    severity: 'high',
    message: 'DO level below minimum threshold (1.5 mg/L)',
  },
  {
    alert_id: '2',
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    sensor_id: 'TEMP_01',
    sensor_name: 'Temperature - Digester',
    value: 41.5,
    severity: 'critical',
    message: 'Temperature exceeds critical limit (40°C)',
  },
];
