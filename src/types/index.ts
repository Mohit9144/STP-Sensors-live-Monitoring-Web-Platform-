export interface SensorMaster {
  sensor_id: string;
  sensor_name: string;
  parameter_name: string;
  unit: string;
  plant_section: string;
  min_threshold: number;
  max_threshold: number;
  status: 'active' | 'inactive';
}

export interface SensorReading {
  id?: number;
  event_time: string;
  ingestion_time: string;
  sensor_name: string;
  plant_section: string;
  value: number;
  unit: string;
  quality_flag: 'good' | 'bad' | 'suspect';
  status_flag: string;
  delay_seconds: number;
}

export interface Alert {
  alert_id: string;
  timestamp: string;
  sensor_id: string;
  value: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  sensor_name?: string; // Joined
}

export interface SensorAction {
  id?: string;
  timestamp: string;
  sensor_id: string;
  action_type: 'maintenance' | 'adjust' | 'ignore';
  notes?: string;
}

export type SensorHealth = 'Healthy' | 'Warning' | 'Critical' | 'Malfunction';
