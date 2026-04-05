import React, { useMemo, useState } from 'react';
import { useSupabase } from '../hooks/useSupabase';
import { Settings2, Activity, AlertCircle, CheckCircle2, XCircle, Search, Filter, ArrowUpRight, ArrowDownRight, FileText, Wrench, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';
import { getThresholdForSensor } from '../lib/thresholds';
import { getSensorStatus } from '../lib/sensorStatus';
import { format } from 'date-fns';

type SensorRowStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'MALFUNCTION';

interface SensorActionModalState {
  sensorId: string;
  sensorName: string;
  section: string;
  status: SensorRowStatus;
  value: number | null | undefined;
  unit: string;
  min: number;
  max: number;
}

const getRecommendedActions = (state: SensorActionModalState): string[] => {
  if (state.status === 'MALFUNCTION') {
    return [
      'Verify cable/telemetry link and sensor power cycle.',
      'Switch to fallback/manual sampling for this parameter.',
      'Raise maintenance ticket and mark data source as degraded.',
    ];
  }

  if (state.status === 'CRITICAL') {
    return [
      'Trigger immediate operator acknowledgement and alarm escalation.',
      'Inspect process unit and validate reading with secondary instrument.',
      'Apply corrective dosing/flow adjustment as per SOP.',
    ];
  }

  if (state.status === 'WARNING') {
    return [
      'Increase monitoring frequency for this sensor.',
      'Check trend drift against previous one-hour baseline.',
      'Prepare corrective action if threshold excursion continues.',
    ];
  }

  return [
    'Maintain normal monitoring cadence.',
    'Keep preventive maintenance schedule unchanged.',
    'No immediate intervention required.',
  ];
};

export const SensorsManagement: React.FC = () => {
  const { sensors, readings, loading } = useSupabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionModal, setActionModal] = useState<SensorActionModalState | null>(null);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredSensors = useMemo(
    () =>
      sensors.filter((sensor) => {
        if (!normalizedSearch) return true;
        return (
          sensor.sensor_name.toLowerCase().includes(normalizedSearch) ||
          sensor.parameter_name.toLowerCase().includes(normalizedSearch) ||
          sensor.plant_section.toLowerCase().includes(normalizedSearch)
        );
      }),
    [normalizedSearch, sensors],
  );

  if (loading) return <div className="p-8 text-center text-slate-500">Loading sensors...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="section-title text-2xl">Sensor Management</h2>
          <p className="section-subtitle">Configure thresholds and monitor real-time sensor health.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search sensors..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all w-64"
            />
          </div>
          <button className="p-2 bg-white border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 transition-all">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="panel-surface p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visible Sensors</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{filteredSensors.length}</p>
        </div>
        <div className="panel-surface p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Critical or Malfunction</p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">
            {
              filteredSensors.filter((sensor) => {
                const latest = readings[sensor.sensor_name]?.[readings[sensor.sensor_name].length - 1];
                const threshold = getThresholdForSensor(sensor.sensor_name, sensor.parameter_name, sensor.sensor_id) ?? {
                  min: sensor.min_threshold,
                  max: sensor.max_threshold,
                };
                const status = latest?.quality_flag === 'bad' ? 'MALFUNCTION' : getSensorStatus(latest?.value, threshold.min, threshold.max);
                return status === 'CRITICAL' || status === 'MALFUNCTION';
              }).length
            }
          </p>
        </div>
        <div className="panel-surface p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Warnings</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">
            {
              filteredSensors.filter((sensor) => {
                const latest = readings[sensor.sensor_name]?.[readings[sensor.sensor_name].length - 1];
                const threshold = getThresholdForSensor(sensor.sensor_name, sensor.parameter_name, sensor.sensor_id) ?? {
                  min: sensor.min_threshold,
                  max: sensor.max_threshold,
                };
                const status = latest?.quality_flag === 'bad' ? 'MALFUNCTION' : getSensorStatus(latest?.value, threshold.min, threshold.max);
                return status === 'WARNING';
              }).length
            }
          </p>
        </div>
      </div>

      <div className="panel-surface overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200/60">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sensor Name</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Section</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Value</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reading Time</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thresholds (Min/Max)</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSensors.map((sensor) => {
              const sensorReadings = readings[sensor.sensor_name] || [];
              const latest = sensorReadings[sensorReadings.length - 1];
              const value = latest?.value;
              const threshold =
                getThresholdForSensor(sensor.sensor_name, sensor.parameter_name, sensor.sensor_id) ?? {
                  min: sensor.min_threshold,
                  max: sensor.max_threshold,
                };
              const status =
                latest?.quality_flag === 'bad'
                  ? 'MALFUNCTION'
                  : getSensorStatus(value, threshold.min, threshold.max);
              
              return (
                <tr key={sensor.sensor_id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        status === 'MALFUNCTION' ? "bg-slate-100 text-slate-400" : "bg-blue-50 text-blue-600"
                      )}>
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{sensor.sensor_name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{sensor.parameter_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      {sensor.plant_section}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm font-bold",
                        status === 'MALFUNCTION'
                          ? 'text-slate-400'
                          : status === 'CRITICAL'
                            ? 'text-rose-600'
                            : status === 'WARNING'
                              ? 'text-amber-600'
                              : 'text-slate-900'
                      )}>
                        {status === 'MALFUNCTION' ? '---' : (value ?? 0).toFixed(2)}
                      </span>
                      {status !== 'MALFUNCTION' && <span className="text-[10px] font-medium text-slate-400 uppercase">{sensor.unit}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[10px] font-bold text-slate-900">
                        {latest?.event_time ? format(new Date(latest.event_time), 'MMM dd, yyyy') : '---'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {latest?.event_time ? format(new Date(latest.event_time), 'HH:mm:ss') : '---'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                        <ArrowDownRight className="w-3 h-3 text-rose-400" />
                        {threshold.min}
                      </div>
                      <div className="w-8 h-[1px] bg-slate-200" />
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                        <ArrowUpRight className="w-3 h-3 text-rose-400" />
                        {threshold.max}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {status === 'MALFUNCTION' ? (
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <XCircle className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Malfunction</span>
                      </div>
                    ) : status === 'CRITICAL' ? (
                      <div className="flex items-center gap-1.5 text-rose-600">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Critical</span>
                      </div>
                    ) : status === 'WARNING' ? (
                      <div className="flex items-center gap-1.5 text-amber-600">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Warning</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Healthy</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() =>
                          setActionModal({
                            sensorId: sensor.sensor_id,
                            sensorName: sensor.sensor_name,
                            section: sensor.plant_section,
                            status,
                            value,
                            unit: sensor.unit,
                            min: threshold.min,
                            max: threshold.max,
                          })
                        }
                        className="px-2.5 py-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        Action Plan
                      </button>
                      <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 transition-all">
                        <Settings2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {/* NEW SENSOR LOGS SECTION */}
      <div className="panel-surface mt-8 overflow-hidden">
        <div className="p-4 border-b border-slate-200/60 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Recent Sensor Logs</h3>
            <p className="text-xs text-slate-500">Live stream of incoming sensor readings across the plant.</p>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10 shadow-sm border-b border-slate-200/60">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sensor Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Section</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Value</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Quality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.values(readings)
                .flat()
                .sort((a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime())
                .slice(0, 50)
                .map((reading, idx) => (
                  <tr key={`${reading.sensor_name}-${reading.event_time}-${idx}`} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-3">
                      <p className="text-xs font-bold text-slate-900">{format(new Date(reading.event_time), 'HH:mm:ss')}</p>
                      <p className="text-[10px] text-slate-500">{format(new Date(reading.event_time), 'MMM dd, yyyy')}</p>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs font-bold text-slate-700">{reading.sensor_name}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium">{reading.plant_section}</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-sm font-bold text-slate-900">{Number(reading.value).toFixed(2)}</span>
                      <span className="text-[10px] text-slate-500 ml-1">{reading.unit}</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      {reading.quality_flag === 'good' ? (
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                          Good
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold uppercase tracking-wider">
                          Bad
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              {Object.values(readings).flat().length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                    No sensor logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-[1px]" onClick={() => setActionModal(null)} />
          <div className="relative w-full max-w-xl panel-surface p-6 animate-in fade-in">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recommended Action</p>
                <h3 className="text-lg font-bold text-slate-900">{actionModal.sensorName}</h3>
                <p className="text-xs text-slate-500">{actionModal.section} • Status: {actionModal.status}</p>
              </div>
              <button
                onClick={() => setActionModal(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg border border-slate-200"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Reading</p>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {actionModal.value === null || actionModal.value === undefined ? 'Unavailable' : `${actionModal.value.toFixed(2)} ${actionModal.unit}`}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Threshold Band</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{actionModal.min} - {actionModal.max} {actionModal.unit}</p>
              </div>
            </div>

            <div className="space-y-2 mb-5">
              {getRecommendedActions(actionModal).map((action, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                  {actionModal.status === 'CRITICAL' || actionModal.status === 'MALFUNCTION' ? (
                    <ShieldAlert className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                  ) : actionModal.status === 'WARNING' ? (
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  )}
                  <p className="text-xs text-slate-700 leading-relaxed">{action}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setActionModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                Close
              </button>
              <button className="px-4 py-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 inline-flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" />
                Create Work Order
              </button>
              <button className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 inline-flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Log Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
