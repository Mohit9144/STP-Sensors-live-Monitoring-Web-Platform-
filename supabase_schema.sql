/*
  RUN THIS SQL IN YOUR SUPABASE SQL EDITOR TO SET UP THE TABLES
*/

-- 1. sensor_master
CREATE TABLE sensor_master (
  sensor_id TEXT PRIMARY KEY,
  sensor_name TEXT NOT NULL,
  parameter_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  plant_section TEXT NOT NULL,
  min_threshold FLOAT NOT NULL,
  max_threshold FLOAT NOT NULL,
  status TEXT DEFAULT 'active'
);

-- 2. sensor_readings
CREATE TABLE sensor_readings (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  sensor_id TEXT REFERENCES sensor_master(sensor_id),
  value FLOAT NOT NULL,
  quality_flag TEXT DEFAULT 'good'
);

-- 3. alerts
CREATE TABLE alerts (
  alert_id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  sensor_id TEXT REFERENCES sensor_master(sensor_id),
  value FLOAT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL
);

-- 4. sensor_actions
CREATE TABLE sensor_actions (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  sensor_id TEXT REFERENCES sensor_master(sensor_id),
  action_type TEXT NOT NULL,
  notes TEXT
);

-- ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE sensor_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;

-- INSERT INITIAL DATA
INSERT INTO sensor_master (sensor_id, sensor_name, parameter_name, unit, plant_section, min_threshold, max_threshold)
VALUES 
('DO_01', 'DO Sensor - Aeration Tank 1', 'Dissolved Oxygen', 'mg/L', 'Aeration', 1.5, 4.0),
('PH_01', 'pH Sensor - Inlet', 'pH', 'pH', 'Inlet', 6.5, 8.5),
('TEMP_01', 'Temperature - Digester', 'Temperature', '°C', 'Digester', 30, 40),
('TURB_01', 'Turbidity - Final Effluent', 'Turbidity', 'NTU', 'Effluent', 0, 10);
