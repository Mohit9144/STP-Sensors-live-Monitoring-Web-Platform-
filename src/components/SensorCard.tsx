import React, { useMemo, useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Settings, 
  Wrench, 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  YAxis, 
  XAxis, 
  Tooltip, 
  ReferenceLine 
} from 'recharts';
import { SensorMaster, SensorReading, SensorHealth } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { getThresholdForSensor } from '../lib/thresholds';
import { getSensorStatus } from '../lib/sensorStatus';
import { computeAdaptiveDisplayBounds } from '../lib/chartBounds';

interface SensorCardProps {
  sensor: SensorMaster;
  readings: SensorReading[];
  onAction: (sensorId: string, action: string) => void;
}

const SensorCardComponent: React.FC<SensorCardProps> = ({ sensor, readings, onAction }) => {
  const [showActions, setShowActions] = useState(false);
  const latestReading = readings[readings.length - 1];
  const currentValue = latestReading?.value ?? 0;
  const threshold = useMemo(
    () =>
      getThresholdForSensor(sensor.sensor_name, sensor.parameter_name, sensor.sensor_id) ?? {
        min: sensor.min_threshold,
        max: sensor.max_threshold,
      },
    [sensor.max_threshold, sensor.min_threshold, sensor.parameter_name, sensor.sensor_id, sensor.sensor_name],
  );

  const chartReadings = useMemo(() => readings.slice(-40), [readings]);

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
    const text = `${kind}:${formatThreshold(value)}`;
    const width = 60;
    const height = 14;
    const x = ((viewBox?.x ?? 0) + (viewBox?.width ?? 0)) - width - 4;
    const y = kind === 'MAX'
      ? (viewBox?.y ?? 0) + 2
      : (viewBox?.y ?? 0) - height - 2;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={5}
          fill="#fee2e2"
          stroke="#ef4444"
          strokeWidth={1}
        />
        <text
          x={x + width / 2}
          y={y + 9.5}
          textAnchor="middle"
          fill="#b91c1c"
          fontSize={7}
          fontWeight="700"
        >
          {text}
        </text>
      </g>
    );
  };

  const health = useMemo((): { status: SensorHealth; color: string; icon: React.ReactNode } => {
    const latestValue = latestReading?.value;
    const derived =
      latestReading?.quality_flag === 'bad'
        ? 'MALFUNCTION'
        : getSensorStatus(latestValue, threshold.min, threshold.max);

    if (derived === 'MALFUNCTION') {
      return { status: 'Malfunction', color: 'text-slate-400 bg-slate-50 border-slate-200', icon: <XCircle className="w-3.5 h-3.5" /> };
    }

    if (derived === 'CRITICAL') {
      return { status: 'Critical', color: 'text-rose-600 bg-rose-50 border-rose-200', icon: <AlertTriangle className="w-3.5 h-3.5" /> };
    }

    if (derived === 'WARNING') {
      return { status: 'Warning', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: <AlertTriangle className="w-3.5 h-3.5" /> };
    }

    return { status: 'Healthy', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> };
  }, [latestReading, threshold.max, threshold.min]);

  return (
    <div className={cn(
      "bg-white rounded-[12px] border-2 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full",
      health.status === 'Healthy' && 'border-emerald-300',
      health.status === 'Warning' && 'border-amber-300',
      health.status === 'Critical' && 'border-rose-400',
      health.status === 'Malfunction' && 'border-slate-300',
    )}>
      <div className="p-4 flex-1">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight truncate">{sensor.plant_section}</p>
            <h3 className="text-xs font-bold text-gray-900 truncate" title={sensor.sensor_name}>{sensor.sensor_name}</h3>
          </div>
          <div className={cn("px-1.5 py-0.5 rounded-full border text-[9px] font-bold flex items-center gap-1 shrink-0", health.color)}>
            {health.icon}
            <span className="hidden sm:inline">{health.status.toUpperCase()}</span>
          </div>
        </div>

        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-xl font-extrabold text-gray-900">{currentValue.toFixed(currentValue > 100 ? 0 : 2)}</span>
          <span className="text-[10px] font-semibold text-gray-400 uppercase">{sensor.unit}</span>
        </div>

        <div className="h-28 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={clampedChartReadings} margin={{ top: 6, right: 6, left: 4, bottom: 8 }}>
              <defs>
                <linearGradient id={`colorValue-${sensor.sensor_id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop 
                    offset="5%" 
                    stopColor="#3674B5" 
                    stopOpacity={0.3}
                  />
                  <stop 
                    offset="95%" 
                    stopColor="#A1E3F9" 
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis dataKey="event_time" hide />
              <YAxis 
                hide 
                domain={[minDomain, maxDomain]}
                allowDataOverflow
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white px-2 py-1 rounded text-[10px] shadow-xl border border-slate-800">
                        <p className="font-bold">{payload[0].payload.value?.toString()} {sensor.unit}</p>
                        <p className="opacity-60">{format(new Date(payload[0].payload.event_time), 'HH:mm:ss')}</p>
                      </div>
                    );
                  }
                  return null;
                }}
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
              <Area 
                type="linear" 
                dataKey="chartValue" 
                stroke="#3674B5" 
                fillOpacity={1}
                fill={`url(#colorValue-${sensor.sensor_id})`}
                baseValue={minDomain}
                strokeWidth={2} 
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="px-4 py-2 bg-gray-50/30 border-t border-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Action</span>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
            className={cn(
              "relative inline-flex h-4 w-8 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
              showActions ? "bg-blue-500" : "bg-gray-200"
            )}
          >
            <span className={cn(
              "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
              showActions ? "translate-x-4" : "translate-x-0"
            )} />
          </button>
        </div>

        {showActions && (
          <div className="mt-2 grid grid-cols-1 gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
            <button 
              onClick={(e) => { e.stopPropagation(); onAction(sensor.sensor_id, 'maintenance'); }}
              className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-bold text-gray-600 bg-white border border-gray-100 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Wrench className="w-3 h-3 text-blue-500" />
              Maintenance
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onAction(sensor.sensor_id, 'adjust'); }}
              className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-bold text-gray-600 bg-white border border-gray-100 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-3 h-3 text-orange-500" />
              Adjust
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const SensorCard = React.memo(SensorCardComponent);
