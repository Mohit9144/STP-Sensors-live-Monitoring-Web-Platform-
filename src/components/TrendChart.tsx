import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ReferenceLine
} from 'recharts';
import { SensorReading, SensorMaster } from '../types';
import { format } from 'date-fns';
import { getThresholdForSensor } from '../lib/thresholds';
import { computeAdaptiveDisplayBounds } from '../lib/chartBounds';

interface TrendChartProps {
  sensor: SensorMaster;
  readings: SensorReading[];
}

export const TrendChart: React.FC<TrendChartProps> = ({ sensor, readings }) => {
  const chartReadings = useMemo(() => readings.slice(-120), [readings]);
  const threshold = useMemo(
    () =>
      getThresholdForSensor(sensor.sensor_name, sensor.parameter_name, sensor.sensor_id) ?? {
        min: sensor.min_threshold,
        max: sensor.max_threshold,
      },
    [sensor.max_threshold, sensor.min_threshold, sensor.parameter_name, sensor.sensor_id, sensor.sensor_name],
  );

  const { minDomain, maxDomain } = useMemo(() => {
    return computeAdaptiveDisplayBounds(chartReadings, threshold);
  }, [chartReadings, threshold]);

  const clampedChartReadings = useMemo(
    () =>
      chartReadings.map((reading) => ({
        ...reading,
        chartValue: Math.min(maxDomain, Math.max(minDomain, reading.value)),
      })),
    [chartReadings, maxDomain, minDomain],
  );

  const formatThreshold = (value: number) => {
    if (value >= 1000) return value.toFixed(0);
    if (value >= 100) return value.toFixed(1);
    return value.toFixed(2);
  };

  const renderBoundLabel = (kind: 'MAX' | 'MIN', value: number, viewBox: any) => {
    const text = `${kind}: ${formatThreshold(value)}`;
    const width = Math.max(84, text.length * 6.2);

    return (
      <g>
        <rect
          x={viewBox.width + 8}
          y={viewBox.y - 9}
          width={width}
          height={18}
          rx={6}
          fill="#fee2e2"
          stroke="#ef4444"
          strokeWidth={1}
        />
        <text
          x={viewBox.width + 13}
          y={viewBox.y + 4.5}
          fill="#b91c1c"
          fontSize={9}
          fontWeight="700"
        >
          {text}
        </text>
      </g>
    );
  };

  return (
    <div className="bg-white p-6 rounded-[16px] border-2 border-blue-300 shadow-sm h-[400px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{sensor.sensor_name}</h3>
          <p className="text-sm text-gray-500">Real-time trend analysis ({sensor.unit})</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-900 rounded-lg">1 Hour</button>
          <button className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 rounded-lg">24 Hours</button>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={clampedChartReadings} margin={{ top: 10, right: 122, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3674B5" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#A1E3F9" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="event_time" 
              tickFormatter={(time) => format(new Date(time), 'HH:mm')}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
              minTickGap={30}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
              domain={[minDomain, maxDomain]}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '16px', 
                border: 'none', 
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                fontSize: '12px',
                padding: '12px'
              }}
              labelFormatter={(label) => format(new Date(label), 'MMM d, HH:mm:ss')}
            />
            
            <Area 
              type="linear" 
              dataKey="chartValue" 
              stroke="#3674B5" 
              fillOpacity={1} 
              fill="url(#colorValue)" 
              baseValue={minDomain}
              strokeWidth={1.8}
              isAnimationActive={false}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#3674B5' }}
            />
            <ReferenceLine 
              y={threshold.max}
              stroke="#ef4444" 
              strokeDasharray="3 3" 
              strokeWidth={1}
              label={({ viewBox }) => renderBoundLabel('MAX', threshold.max, viewBox)}
            />
            <ReferenceLine 
              y={threshold.min}
              stroke="#ef4444" 
              strokeDasharray="3 3" 
              strokeWidth={1}
              label={({ viewBox }) => renderBoundLabel('MIN', threshold.min, viewBox)}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
