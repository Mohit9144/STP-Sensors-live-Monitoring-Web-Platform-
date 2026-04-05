import React, { useState } from 'react';
import { useSupabase } from '../hooks/useSupabase';
import { Clock, CheckCircle2, XCircle, Wrench, Settings, ChevronRight, ShieldAlert, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { getThresholdForSensor } from '../lib/thresholds';
import { getSensorStatus } from '../lib/sensorStatus';

import { MOCK_ALERTS } from '../mockData';

export const AlertsManagement: React.FC = () => {
  const { sensors, readings, alerts: rawAlerts, takeAction, loading } = useSupabase();
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  
  // FORCE DEMO ALERTS INTO THE UI
  const alerts = rawAlerts.length > 0 ? rawAlerts : MOCK_ALERTS;
  
  const activeIncidentCount = alerts.filter((alert) => alert.severity === 'critical' || alert.severity === 'high').length;

  if (loading) return <div className="p-8 text-center text-slate-500">Loading alerts...</div>;

  // Identify malfunctioning sensors from shared sensor status logic.
  const malfunctioningSensors = sensors.filter(sensor => {
    const sensorReadings = readings[sensor.sensor_name] || [];
    const latest = sensorReadings[sensorReadings.length - 1];
    const threshold =
      getThresholdForSensor(sensor.sensor_name, sensor.parameter_name, sensor.sensor_id) ?? {
        min: sensor.min_threshold,
        max: sensor.max_threshold,
      };
    const status =
      latest?.quality_flag === 'bad'
        ? 'MALFUNCTION'
        : getSensorStatus(latest?.value, threshold.min, threshold.max);

    return status === 'MALFUNCTION';
  });

  const handleResolve = async (sensorId: string, action: string) => {
    setResolvingId(sensorId);
    await takeAction(sensorId, action);
    // Simulate resolution delay
    setTimeout(() => {
      setResolvingId(null);
    }, 1000);
  };

  return (
    <div className="space-y-8">
      <div className="panel-surface p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="section-title text-2xl">Alert Center</h2>
          <p className="section-subtitle">Monitor system failures and execute immediate counter-actions.</p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-rose-50 text-rose-700 border border-rose-100">
              {activeIncidentCount} Active Incidents
            </span>
            <span className={cn(
              'px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-50 text-amber-700 border border-amber-100',
              malfunctioningSensors.length > 0 ? 'alert-blink-soft' : '',
            )}>
              {malfunctioningSensors.length} Malfunctioning Sensors
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search alerts..." 
              className="pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all w-64"
            />
          </div>
          <button className="p-2 bg-white border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 transition-all">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Malfunctioning Sensors */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              System Failures / Active Alerts
            </h3>
            <span className={cn(
              'px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-full uppercase tracking-wider border border-rose-100',
              (malfunctioningSensors.length > 0 || alerts.length > 0) ? 'alert-blink-soft' : '',
            )}>
              {malfunctioningSensors.length + alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length} Incidents
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {malfunctioningSensors.length === 0 && alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length === 0 ? (
              <div className="col-span-full panel-surface p-12 text-center bg-gradient-to-br from-emerald-50/45 to-white">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-900">No system failures detected</p>
                <p className="text-xs text-slate-500">All sensors are currently reporting stable quality data.</p>
              </div>
            ) : (
              <>
                {malfunctioningSensors.map((sensor) => (
                  <div key={sensor.sensor_id} className="panel-surface p-5 hover:shadow-md transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
                          <XCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{sensor.sensor_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{sensor.plant_section}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[9px] font-bold rounded-full uppercase tracking-wider alert-blink-soft">
                        Malfunction
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                      Sensor is reporting <span className="font-bold text-rose-600">BAD</span> quality. Data stream may be inconsistent or temporarily unavailable.
                    </p>

                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Counter Actions</p>
                      <div className="grid grid-cols-1 gap-2">
                        <button 
                          onClick={() => handleResolve(sensor.sensor_id, 'maintenance')}
                          disabled={resolvingId === sensor.sensor_id}
                          className={cn(
                            "flex items-center justify-between px-3 py-2 text-[10px] font-bold rounded-xl border transition-all",
                            resolvingId === sensor.sensor_id 
                              ? "bg-slate-50 text-slate-400 border-slate-100" 
                              : "bg-white text-slate-700 border-slate-200 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Wrench className="w-3.5 h-3.5" />
                            Mark for Maintenance
                          </div>
                          <ChevronRight className="w-3 h-3 opacity-40" />
                        </button>
                        <button 
                          onClick={() => handleResolve(sensor.sensor_id, 'adjust')}
                          disabled={resolvingId === sensor.sensor_id}
                          className={cn(
                            "flex items-center justify-between px-3 py-2 text-[10px] font-bold rounded-xl border transition-all",
                            resolvingId === sensor.sensor_id 
                              ? "bg-slate-50 text-slate-400 border-slate-100" 
                              : "bg-white text-slate-700 border-slate-200 hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Settings className="w-3.5 h-3.5" />
                            Adjust System
                          </div>
                          <ChevronRight className="w-3 h-3 opacity-40" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Active Alerts Cards */}
                {alerts.filter(a => a.severity === 'critical' || a.severity === 'high').map((alert) => (
                  <div key={alert.alert_id} className="panel-surface p-5 hover:shadow-md transition-all duration-300 border-rose-300">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center border border-rose-200">
                          <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{alert.sensor_name || 'System Alert'}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{format(new Date(alert.timestamp), 'MMM d, yyyy HH:mm:ss')}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 text-white text-[9px] font-bold rounded-full uppercase tracking-wider",
                        alert.severity === 'critical' ? "bg-rose-600 alert-blink" : "bg-orange-500 alert-blink-soft"
                      )}>
                        {alert.severity}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mb-6 leading-relaxed bg-rose-50/50 p-2 rounded-lg border border-rose-100">
                      <span className="font-bold text-rose-600 border-b border-rose-200 pb-1 mb-1 block">Violation Detected</span>
                      {alert.message}
                    </p>

                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Automated Triggers</p>
                      <div className="grid grid-cols-1 gap-2">
                        <button className="flex items-center justify-between px-3 py-2 text-[10px] font-bold rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 transition-all cursor-default">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Safety Equipment Engaged
                          </div>
                          <span className="text-[8px] bg-white px-1.5 py-0.5 border border-emerald-100 rounded">ACTIVE</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Recent Alerts List */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
            <Clock className="w-4 h-4 text-slate-400" />
            Alert History
          </h3>
          <div className="panel-surface overflow-hidden">
            <div className="divide-y divide-slate-100">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">No recent alerts</div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.alert_id} className="p-4 hover:bg-slate-50 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                        alert.severity === 'critical'
                          ? "bg-rose-100 text-rose-700 alert-blink"
                          : alert.severity === 'high'
                            ? "bg-orange-100 text-orange-700 alert-blink-soft"
                            : "bg-yellow-100 text-yellow-700"
                      )}>
                        {alert.severity}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold">{format(new Date(alert.timestamp), 'HH:mm:ss')}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 mb-1">{alert.sensor_name || alert.sensor_id}</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed">{alert.message}</p>
                    <div className="mt-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-[9px] font-bold text-blue-600 hover:underline">Acknowledge</button>
                      <button className="text-[9px] font-bold text-slate-400 hover:text-slate-900">Details</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button className="w-full p-3 text-[10px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors border-t border-slate-100">
              View Full History
            </button>
          </div>
        </div>
      </div>

      {/* NEW SYSTEM & ALERT LOGS TABLE */}
      <div className="panel-surface mt-8 overflow-hidden">
        <div className="p-4 border-b border-slate-200/60 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Recent Alert Logs</h3>
            <p className="text-xs text-slate-500">Live chronological record of all system alerts, failures, and warnings.</p>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10 shadow-sm border-b border-slate-200/60">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Severity</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sensor Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Message</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Value recorded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                    No alert logs recorded yet. System is operating normally.
                  </td>
                </tr>
              ) : (
                alerts.map((alert, idx) => (
                  <tr key={`${alert.alert_id}-${idx}`} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-3 min-w-[120px]">
                      <p className="text-xs font-bold text-slate-900">{format(new Date(alert.timestamp), 'HH:mm:ss')}</p>
                      <p className="text-[10px] text-slate-500">{format(new Date(alert.timestamp), 'MMM dd, yyyy')}</p>
                    </td>
                    <td className="px-6 py-3">
                      <span className={cn(
                        "inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                        alert.severity === 'critical' ? "bg-rose-100 text-rose-700 alert-blink" :
                        alert.severity === 'high' ? "bg-orange-100 text-orange-700 alert-blink-soft" :
                        "bg-amber-100 text-amber-700"
                      )}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs font-bold text-slate-700">{alert.sensor_name || alert.sensor_id}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs text-slate-600 block w-full max-w-[300px] truncate" title={alert.message}>
                        {alert.message}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-sm font-bold text-slate-900">{alert.value !== null && alert.value !== undefined ? alert.value.toFixed(2) : '---'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
