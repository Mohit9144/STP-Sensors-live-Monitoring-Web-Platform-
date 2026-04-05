import React, { useEffect, useMemo, useState } from 'react';
import { useSupabase } from '../hooks/useSupabase';
import { SensorCard } from './SensorCard';
import { AlertsPanel } from './AlertsPanel';
import { TrendChart } from './TrendChart';
import { Filter, RefreshCw, Search, Activity, AlertCircle, ShieldCheck, Droplets } from 'lucide-react';
import { cn } from '../lib/utils';
import { getThresholdForSensor } from '../lib/thresholds';
import { getSensorStatus } from '../lib/sensorStatus';

import { MOCK_ALERTS } from '../mockData';

export const Dashboard: React.FC<{ setActiveSection?: (section: string) => void }> = ({ setActiveSection }) => {
  const { sensors, readings, alerts: rawAlerts, loading, takeAction } = useSupabase();   
  const alerts = rawAlerts.length > 0 ? rawAlerts : MOCK_ALERTS;
  
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);
  const [filterSection, setFilterSection] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoSwitchEnabled, setAutoSwitchEnabled] = useState(false);
  const [intakePumpEnabled, setIntakePumpEnabled] = useState(false);
  const [returnPumpEnabled, setReturnPumpEnabled] = useState(false);
  const [dosingPumpEnabled, setDosingPumpEnabled] = useState(false);
  const [valveControlEnabled, setValveControlEnabled] = useState(false);

  // Helper function to get equipment-specific alert
  const getEquipmentAlert = (equipmentNames: string[]) => {
    return alerts.find(alert => 
      equipmentNames.some(name => {
        // Use word boundaries for very short generic terms like 'do' or 'ph'
        if (name.length <= 2) {
          const regex = new RegExp(`\\b${name}\\b`, 'i');
          return regex.test(alert.sensor_name || '') || regex.test(alert.message || '');
        }
        return alert.sensor_name?.toLowerCase().includes(name.toLowerCase()) ||
               alert.message?.toLowerCase().includes(name.toLowerCase());
      })
    );
  };

  // Get alerts for each equipment based on related terms
  const intakePumpAlert = getEquipmentAlert(['intake', 'inlet', 'raw', 'level']);
  const returnPumpAlert = getEquipmentAlert(['return', 'sludge', 'ras', 'was', 'digester', 'temp']);
  const dosingPumpAlert = getEquipmentAlert(['dosing', 'chlorine', 'ph', 'chemical']);
  const valveAlert = getEquipmentAlert(['valve', 'discharge', 'effluent', 'outlet', 'flow']);
  const blowerAlert = getEquipmentAlert(['blower', 'air', 'aeration', 'do', 'oxygen']);

  // Auto-trigger equipment based on critical/high alerts
  useEffect(() => {
    // If critical/high alert detected, automatically enable relevant equipment for safety
    if (intakePumpAlert?.severity === 'critical' || intakePumpAlert?.severity === 'high') {
      setIntakePumpEnabled(true);
    }
    if (returnPumpAlert?.severity === 'critical' || returnPumpAlert?.severity === 'high') {
      setReturnPumpEnabled(true);
    }
    if (dosingPumpAlert?.severity === 'critical' || dosingPumpAlert?.severity === 'high') {
      setDosingPumpEnabled(true);
    }
    if (valveAlert?.severity === 'critical' || valveAlert?.severity === 'high') {
      setValveControlEnabled(true);
    }
    if (blowerAlert?.severity === 'critical' || blowerAlert?.severity === 'high') {
      setAutoSwitchEnabled(true);
    }
  }, [intakePumpAlert, returnPumpAlert, dosingPumpAlert, valveAlert, blowerAlert]);

  const formatSectionTitle = (raw: string) =>
    raw
      .replace(/[_-]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');

  // Helper to get button styling based on equipment state and alerts
      const getButtonStyles = (isEnabled: boolean, equipment: string, alert?: any) => {
      const colorMap: Record<string, { active: string; inactive: string; border: string }> = {
        blower: { active: 'bg-emerald-50 border-emerald-300 shadow-[inset_0_2px_10px_rgba(16,185,129,0.15)] text-emerald-950', inactive: 'bg-white border-slate-200 shadow-sm text-slate-500', border: 'border-emerald-300' },
        intake: { active: 'bg-blue-50 border-blue-300 shadow-[inset_0_2px_10px_rgba(59,130,246,0.15)] text-blue-950', inactive: 'bg-white border-slate-200 shadow-sm text-slate-500', border: 'border-blue-300' },
        return: { active: 'bg-cyan-50 border-cyan-300 shadow-[inset_0_2px_10px_rgba(6,182,212,0.15)] text-cyan-950', inactive: 'bg-white border-slate-200 shadow-sm text-slate-500', border: 'border-cyan-300' },
        dosing: { active: 'bg-purple-50 border-purple-300 shadow-[inset_0_2px_10px_rgba(168,85,247,0.15)] text-purple-950', inactive: 'bg-white border-slate-200 shadow-sm text-slate-500', border: 'border-purple-300' },
        valve: { active: 'bg-teal-50 border-teal-300 shadow-[inset_0_2px_10px_rgba(20,184,166,0.15)] text-teal-950', inactive: 'bg-white border-slate-200 shadow-sm text-slate-500', border: 'border-teal-300' },
      };

      const colors = colorMap[equipment];

      if (alert) {
        if (alert.severity === 'critical') {
          return {
            bg: 'bg-rose-50 shadow-[0_4px_15px_rgba(225,29,72,0.1)]',
            border: 'border-rose-300 border-2',
            text: 'text-rose-950 font-extrabold',
            statusColor: 'bg-white border rounded border-rose-200 text-rose-700 font-bold px-1.5 py-0.5',
            isAlert: true,
            severity: alert.severity,
            dotColor: 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
          };
        } else if (alert.severity === 'high') {
          return {
            bg: 'bg-amber-50 shadow-[0_4px_15px_rgba(245,158,11,0.1)]',
            border: 'border-amber-300 border-2',
            text: 'text-amber-950 font-extrabold',
            statusColor: 'bg-white border rounded border-amber-200 text-amber-700 font-bold px-1.5 py-0.5',
            isAlert: true,
            severity: alert.severity,
            dotColor: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
          };
        }
      }

      return {
        bg: isEnabled ? colors.active : colors.inactive,
        border: isEnabled ? "border-2 " + colors.border : "border border-slate-200 shadow-sm",
        text: "font-extrabold " + (isEnabled ? "" : "text-slate-600"),
        statusColor: isEnabled ? 'bg-white rounded border border-emerald-200 text-emerald-700 font-bold px-1.5 py-0.5' : 'bg-slate-50 rounded border border-slate-200 text-slate-500 font-bold px-1.5 py-0.5',
        dotColor: isEnabled ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'bg-slate-400 opacity-50',
        isAlert: false
      };
    };

  const sections = ['All', ...Array.from(new Set(sensors.map(s => s.plant_section)))];

  const filteredSensors = sensors.filter(sensor => {
    const matchesSection = filterSection === 'All' || sensor.plant_section === filterSection;
    const matchesSearch = sensor.sensor_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          sensor.parameter_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSection && matchesSearch;
  });

  const selectedSensor = sensors.find(s => s.sensor_id === (selectedSensorId || sensors[0]?.sensor_id));

  const hasAttentionState = useMemo(() => {
    const hasSensorWarningOrWorse = sensors.some((sensor) => {
      const latest = readings[sensor.sensor_name]?.[readings[sensor.sensor_name].length - 1];
      const threshold =
        getThresholdForSensor(sensor.sensor_name, sensor.parameter_name, sensor.sensor_id) ?? {
          min: sensor.min_threshold,
          max: sensor.max_threshold,
        };

      const status =
        latest?.quality_flag === 'bad'
          ? 'MALFUNCTION'
          : getSensorStatus(latest?.value, threshold.min, threshold.max);

      return status === 'WARNING' || status === 'CRITICAL' || status === 'MALFUNCTION';
    });

    const hasAlertWarningOrCritical = alerts.some(
      (alert) => alert.severity === 'high' || alert.severity === 'critical',
    );

    return hasSensorWarningOrWorse || hasAlertWarningOrCritical;
  }, [alerts, readings, sensors]);

  useEffect(() => {
    setAutoSwitchEnabled(hasAttentionState);
  }, [hasAttentionState]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-sm font-medium text-gray-500">Loading plant data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      {/* Welcome Section */}
      <div className="bg-white rounded-2xl p-4 md:p-5 border-2 border-slate-300 shadow-sm">
        {/* Header */}
        <div className="space-y-2 mb-4">
          <span className="brand-chip float-soft">Operational Intelligence</span>
          <h2 className="section-title text-2xl">Plant Overview</h2>
          <p className="section-subtitle text-sm">Real-time monitoring for all sewage treatment processes.</p>
        </div>
        
        {/* Divider */}
        <div className="w-full h-[1px] bg-slate-200 mb-4" />
        
        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 p-1 rounded-xl bg-slate-100/50">
          {/* Aeration Blower Switch - Industrial Design */}
          <button
            type="button"
            onClick={() => setAutoSwitchEnabled(!autoSwitchEnabled)}
            aria-pressed={autoSwitchEnabled}
            aria-live="polite"
            className={cn(
              'relative flex flex-col items-start gap-3 px-4 py-3 rounded-[12px] transition-all duration-300 active:scale-95 overflow-hidden group',
              (() => {
                const styles = getButtonStyles(autoSwitchEnabled, 'blower', blowerAlert);
                return `${styles.bg} ${styles.border} ${styles.text}`;
              })()
            )}
          >
            <div className="absolute inset-0 self-start opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
            <div className="flex items-start gap-3 w-full justify-between z-10">
              <div className="flex-shrink-0 p-1.5 rounded-lg bg-black/20 shadow-inner backdrop-blur-sm">
                <div className="relative w-7 h-7 flex items-center justify-center">
                  <TurbineIcon isActive={autoSwitchEnabled} hasMalfunction={!!blowerAlert} />
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {blowerAlert && (
                  <span className="text-[9px] font-black bg-red-500/20 shadow-sm border border-red-500/30 text-rose-300 px-1.5 py-0.5 rounded tracking-wider uppercase">
                    {blowerAlert.severity}
                  </span>
                )}
                {autoSwitchEnabled && !blowerAlert && (
                  <span className="text-[8px] font-black tracking-widest text-[#00f2fe]/80 uppercase">
                    Running
                  </span>
                )}
              </div>
            </div>
            
            <div className="w-full mt-auto flex items-center justify-between z-10">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">AUTO BLOWER</span>
              <div className={cn(
                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded shadow-inner backdrop-blur-md',
                (() => {
                  const styles = getButtonStyles(autoSwitchEnabled, 'blower', blowerAlert);
                  return styles.statusColor;
                })()
              )}>
                <div className={cn(
                  'w-1.5 h-1.5 rounded-full transition-all duration-300',
                  (() => {
                    const styles = getButtonStyles(autoSwitchEnabled, 'blower', blowerAlert);
                    return styles.dotColor;
                  })()
                )} />
                <span className="text-[9px] font-bold uppercase tracking-widest">
                  {blowerAlert ? `${blowerAlert.severity} ` : ''}{autoSwitchEnabled ? ON : OFF}
                </span>
              </div>
            </div>
          </button>

          {/* Intake Pump */}
          <button
            type="button"
            onClick={() => setIntakePumpEnabled(!intakePumpEnabled)}
            aria-pressed={intakePumpEnabled}
            className={cn(
              'relative flex flex-col items-start gap-3 px-4 py-3 rounded-[12px] transition-all duration-300 active:scale-95 overflow-hidden group',
              (() => {
                const styles = getButtonStyles(intakePumpEnabled, 'intake', intakePumpAlert);
                return `${styles.bg} ${styles.border} ${styles.text}`;
              })()
            )}
          >
            <div className="absolute inset-0 self-start opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
            <div className="flex items-start gap-3 w-full justify-between z-10">
              <div className="flex-shrink-0 p-1.5 rounded-lg bg-black/20 shadow-inner backdrop-blur-sm">
                <div className="relative w-7 h-7 flex items-center justify-center">
                  <PumpIcon isActive={intakePumpEnabled} hasMalfunction={!!intakePumpAlert} />
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {intakePumpAlert && (
                  <span className="text-[9px] font-black bg-red-500/20 shadow-sm border border-red-500/30 text-rose-300 px-1.5 py-0.5 rounded tracking-wider uppercase">
                    {intakePumpAlert.severity}
                  </span>
                )}
                {intakePumpEnabled && !intakePumpAlert && (
                  <span className="text-[8px] font-black tracking-widest text-orange-300/90 uppercase">
                    Pumping
                  </span>
                )}
              </div>
            </div>
            
            <div className="w-full mt-auto flex items-center justify-between z-10">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">INTAKE PUMP</span>
              <div className={cn(
                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded shadow-inner backdrop-blur-md',
                (() => {
                  const styles = getButtonStyles(intakePumpEnabled, 'intake', intakePumpAlert);
                  return styles.statusColor;
                })()
              )}>
                <div className={cn(
                  'w-1.5 h-1.5 rounded-full transition-all duration-300',
                  (() => {
                    const styles = getButtonStyles(intakePumpEnabled, 'intake', intakePumpAlert);
                    return styles.dotColor;
                  })()
                )} />
                <span className="text-[9px] font-bold uppercase tracking-widest">
                  {intakePumpAlert ? `${intakePumpAlert.severity} ` : ''}{intakePumpEnabled ? ON : OFF}
                </span>
              </div>
            </div>
          </button>

          {/* Return Pump */}
          <button
            type="button"
            onClick={() => setReturnPumpEnabled(!returnPumpEnabled)}
            aria-pressed={returnPumpEnabled}
            className={cn(
              'relative flex flex-col items-start gap-3 px-4 py-3 rounded-[12px] transition-all duration-300 active:scale-95 overflow-hidden group',
              (() => {
                const styles = getButtonStyles(returnPumpEnabled, 'return', returnPumpAlert);
                return `${styles.bg} ${styles.border} ${styles.text}`;
              })()
            )}
          >
            <div className="absolute inset-0 self-start opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
            <div className="flex items-start gap-3 w-full justify-between z-10">
              <div className="flex-shrink-0 p-1.5 rounded-lg bg-black/20 shadow-inner backdrop-blur-sm">
                <div className="relative w-7 h-7 flex items-center justify-center">
                  <PumpIcon isActive={returnPumpEnabled} hasMalfunction={!!returnPumpAlert} />
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {returnPumpAlert && (
                  <span className="text-[9px] font-black bg-red-500/20 shadow-sm border border-red-500/30 text-rose-300 px-1.5 py-0.5 rounded tracking-wider uppercase">
                    {returnPumpAlert.severity}
                  </span>
                )}
                {returnPumpEnabled && !returnPumpAlert && (
                  <span className="text-[8px] font-black tracking-widest text-orange-300/90 uppercase">
                    Pumping
                  </span>
                )}
              </div>
            </div>
            
            <div className="w-full mt-auto flex items-center justify-between z-10">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">RETURN PUMP</span>
              <div className={cn(
                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded shadow-inner backdrop-blur-md',
                (() => {
                  const styles = getButtonStyles(returnPumpEnabled, 'return', returnPumpAlert);
                  return styles.statusColor;
                })()
              )}>
                <div className={cn(
                  'w-1.5 h-1.5 rounded-full transition-all duration-300',
                  (() => {
                    const styles = getButtonStyles(returnPumpEnabled, 'return', returnPumpAlert);
                    return styles.dotColor;
                  })()
                )} />
                <span className="text-[9px] font-bold uppercase tracking-widest">
                  {returnPumpAlert ? `${returnPumpAlert.severity} ` : ''}{returnPumpEnabled ? ON : OFF}
                </span>
              </div>
            </div>
          </button>

          {/* Dosing Pump */}
          <button
            type="button"
            onClick={() => setDosingPumpEnabled(!dosingPumpEnabled)}
            aria-pressed={dosingPumpEnabled}
            className={cn(
              'relative flex flex-col items-start gap-3 px-4 py-3 rounded-[12px] transition-all duration-300 active:scale-95 overflow-hidden group',
              (() => {
                const styles = getButtonStyles(dosingPumpEnabled, 'dosing', dosingPumpAlert);
                return `${styles.bg} ${styles.border} ${styles.text}`;
              })()
            )}
          >
            <div className="absolute inset-0 self-start opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
            <div className="flex items-start gap-3 w-full justify-between z-10">
              <div className="flex-shrink-0 p-1.5 rounded-lg bg-black/20 shadow-inner backdrop-blur-sm">
                <div className="relative w-7 h-7 flex items-center justify-center">
                  <PumpIcon isActive={dosingPumpEnabled} hasMalfunction={!!dosingPumpAlert} />
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {dosingPumpAlert && (
                  <span className="text-[9px] font-black bg-red-500/20 shadow-sm border border-red-500/30 text-rose-300 px-1.5 py-0.5 rounded tracking-wider uppercase">
                    {dosingPumpAlert.severity}
                  </span>
                )}
                {dosingPumpEnabled && !dosingPumpAlert && (
                  <span className="text-[8px] font-black tracking-widest text-[#3b82f6]/90 uppercase">
                    Dosing
                  </span>
                )}
              </div>
            </div>
            
            <div className="w-full mt-auto flex items-center justify-between z-10">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">DOSING PUMP</span>
              <div className={cn(
                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded shadow-inner backdrop-blur-md',
                (() => {
                  const styles = getButtonStyles(dosingPumpEnabled, 'dosing', dosingPumpAlert);
                  return styles.statusColor;
                })()
              )}>
                <div className={cn(
                  'w-1.5 h-1.5 rounded-full transition-all duration-300',
                  (() => {
                    const styles = getButtonStyles(dosingPumpEnabled, 'dosing', dosingPumpAlert);
                    return styles.dotColor;
                  })()
                )} />
                <span className="text-[9px] font-bold uppercase tracking-widest">
                  {dosingPumpAlert ? `${dosingPumpAlert.severity} ` : ''}{dosingPumpEnabled ? ON : OFF}
                </span>
              </div>
            </div>
          </button>

          {/* Valve Control */}
          <button
            type="button"
            onClick={() => setValveControlEnabled(!valveControlEnabled)}
            aria-pressed={valveControlEnabled}
            className={cn(
              'relative flex flex-col items-start gap-3 px-4 py-3 rounded-[12px] transition-all duration-300 active:scale-95 overflow-hidden group',
              (() => {
                const styles = getButtonStyles(valveControlEnabled, 'valve', valveAlert);
                return `${styles.bg} ${styles.border} ${styles.text}`;
              })()
            )}
          >
            <div className="absolute inset-0 self-start opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
            <div className="flex items-start gap-3 w-full justify-between z-10">
              <div className="flex-shrink-0 p-1.5 rounded-lg bg-black/20 shadow-inner backdrop-blur-sm">
                <div className="relative w-7 h-7 flex items-center justify-center">
                  <ValveIcon isActive={valveControlEnabled} hasMalfunction={!!valveAlert} />
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {valveAlert && (
                  <span className="text-[9px] font-black bg-red-500/20 shadow-sm border border-red-500/30 text-rose-300 px-1.5 py-0.5 rounded tracking-wider uppercase">
                    {valveAlert.severity}
                  </span>
                )}
                {valveControlEnabled && !valveAlert && (
                  <span className="text-[8px] font-black tracking-widest text-[#a855f7]/90 uppercase">
                    Open
                  </span>
                )}
              </div>
            </div>
            
            <div className="w-full mt-auto flex items-center justify-between z-10">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">VALVE CONTROL</span>
              <div className={cn(
                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded shadow-inner backdrop-blur-md',
                (() => {
                  const styles = getButtonStyles(valveControlEnabled, 'valve', valveAlert);
                  return styles.statusColor;
                })()
              )}>
                <div className={cn(
                  'w-1.5 h-1.5 rounded-full transition-all duration-300',
                  (() => {
                    const styles = getButtonStyles(valveControlEnabled, 'valve', valveAlert);
                    return styles.dotColor;
                  })()
                )} />
                <span className="text-[9px] font-bold uppercase tracking-widest">
                  {valveAlert ? `${valveAlert.severity} ` : ''}{valveControlEnabled ? OPEN : CLOSED}
                </span>
              </div>
            </div>
          </button>
        </div>
        
        {/* Filter and Search Section */}
        <div className="w-full grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-2 items-start mt-4">
          <div className="glass-panel p-1.5 rounded-2xl border border-slate-200/70 min-w-0">
            <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {sections.map((section) => (
              <button
                key={section}
                onClick={() => setFilterSection(section)}
                className={cn(
                  "shrink-0 px-4 md:px-5 py-2 text-[11px] font-bold rounded-xl transition-all duration-300",
                  filterSection === section
                    ? "bg-blue-400 text-white shadow-md shadow-blue-400/20"
                    : "text-slate-500 hover:text-blue-600 hover:bg-white"
                )}
              >
                {formatSectionTitle(section)}
              </button>
            ))}
            </div>
          </div>
          <div className="relative group w-full xl:w-[280px] xl:justify-self-end min-w-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search sensors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-5 py-2.5 glass-panel rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Sensors', value: sensors.length, color: 'blue', icon: Activity, bg: 'bg-blue-50', text: 'text-blue-600', borderColor: 'border-blue-300' },
          { label: 'Active Alerts', value: alerts.length, color: 'red', icon: AlertCircle, bg: 'bg-rose-50', text: 'text-rose-600', isClickable: true, borderColor: 'border-rose-300' },
          { label: 'System Health', value: '98.2%', color: 'green', icon: ShieldCheck, bg: 'bg-emerald-50', text: 'text-emerald-600', borderColor: 'border-emerald-300' },
          { label: 'Average Effluent pH', value: '7.2', color: 'teal', icon: Droplets, bg: 'bg-teal-50', text: 'text-teal-600', borderColor: 'border-teal-300' },
        ].map((stat, i) => (
          <button
            key={i}
            onClick={() => stat.isClickable && setActiveSection?.('alerts')}
            className={cn("bg-white p-6 rounded-[20px] flex items-center gap-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 text-left w-full border-2 shadow-sm", stat.borderColor)}
            disabled={!stat.isClickable}
          >
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", stat.bg, stat.text)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
              <p className="text-2xl font-extrabold text-[color:var(--color-ink)]">{stat.value}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Main Dashboard Grid */}
      <div className="flex flex-col gap-8">
        {/* Sensor Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {filteredSensors.map((sensor) => (
            <div 
              key={sensor.sensor_id} 
              className={cn(
                "cursor-pointer transition-all",
                selectedSensorId === sensor.sensor_id ? "ring-2 ring-blue-500 rounded-[12px]" : ""
              )}
              onClick={() => setSelectedSensorId(sensor.sensor_id)}
            >
              <SensorCard 
                sensor={sensor} 
                readings={readings[sensor.sensor_name] || []} 
                onAction={takeAction}
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Detailed Trend Chart */}
          <div className="lg:col-span-2">
            {selectedSensor && (
              <TrendChart 
                sensor={selectedSensor} 
                readings={readings[selectedSensor.sensor_name] || []} 
              />
            )}
          </div>

          {/* Sidebar Panel */}
          <div className="space-y-8">
            <AlertsPanel alerts={alerts} />
            
            <div className="bg-white p-6 rounded-[16px] border-2 border-emerald-300 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Plant Maintenance</h3>
            <div className="space-y-4">
              {[
                { task: 'Filter Cleaning', due: 'In 2 days', progress: 0 },
                { task: 'Pump Inspection', due: 'Today', progress: 65 },
                { task: 'Chemical Refill', due: 'In 5 days', progress: 20 },
              ].map((task, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-700">{task.task}</span>
                    <span className="text-slate-400">{task.due}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-[color:var(--color-secondary)] h-full rounded-full" 
                      style={{ width: `${task.progress}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-2.5 text-xs font-bold text-blue-700 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
              View Maintenance Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

const TurbineIcon: React.FC<{ isActive: boolean; hasMalfunction?: boolean }> = ({ isActive, hasMalfunction }) => (
  <svg
    viewBox="0 0 48 48"
    className={cn("w-full h-full")}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Outer complex casing with metallic effect */}
    <defs>
      <radialGradient id="turbineActive" cx="50%" cy="50%">
        <stop offset="0%" stopColor={hasMalfunction ? '#ef4444' : isActive ? '#06b6d4' : '#e5e7eb'} />
        <stop offset="100%" stopColor={hasMalfunction ? '#dc2626' : isActive ? '#0369a1' : '#cbd5e1'} />
      </radialGradient>
    </defs>

    {/* Multi-ring casing */}
    <circle cx="24" cy="24" r="22" stroke={hasMalfunction ? '#ef4444' : isActive ? '#0ea5e9' : '#cbd5e1'} strokeWidth="2.5" opacity={hasMalfunction ? '1' : '0.9'} className={hasMalfunction ? 'animate-malfunction-blink' : ''} />
    <circle cx="24" cy="24" r="19.5" stroke={hasMalfunction ? '#f87171' : isActive ? '#06b6d4' : '#a1a5b4'} strokeWidth="1" opacity={hasMalfunction ? '0.8' : '0.6'} />
    <circle cx="24" cy="24" r="17" stroke={hasMalfunction ? '#ef4444' : isActive ? '#22d3ee' : '#cbd5e1'} strokeWidth="1.5" opacity={hasMalfunction ? '0.6' : isActive ? 0.8 : 0.4} />

    {/* Inner hub assembly */}
    <circle cx="24" cy="24" r="4.5" fill={hasMalfunction ? '#ef4444' : isActive ? '#06b6d4' : '#b0b9c3'} />
    <circle cx="24" cy="24" r="3" fill={hasMalfunction ? '#fca5a5' : isActive ? '#cffafe' : '#e5e7eb'} opacity={hasMalfunction ? '0.6' : '0.8'} />
    <circle cx="24" cy="24" r="1.5" fill={hasMalfunction ? '#7f1d1d' : isActive ? '#0369a1' : '#9ca3af'} />

    {/* Complex rotating propeller assembly - 6 blades outer */}
    <g className={isActive ? 'animate-turbine-spin-fast' : ''}>
      {/* Blade 1 */}
      <path d="M 24 24 L 24 6 Q 26 12 26 20 L 24 24 Z" fill={hasMalfunction ? '#ef4444' : isActive ? '#06b6d4' : '#cbd5e1'} opacity={hasMalfunction ? 0.7 : isActive ? 0.95 : 0.5} filter={hasMalfunction ? 'drop-shadow(0 2px 5px rgba(239, 68, 68, 0.7))' : isActive ? 'drop-shadow(0 2px 5px rgba(6, 182, 212, 0.7))' : ''} />
      {/* Blade 2 */}
      <path d="M 24 24 L 36 24 Q 30 26 24 26 L 24 24 Z" fill={hasMalfunction ? '#f87171' : isActive ? '#0ea5e9' : '#a1a5b4'} opacity={hasMalfunction ? 0.65 : isActive ? 0.9 : 0.45} filter={hasMalfunction ? 'drop-shadow(0 2px 5px rgba(248, 113, 113, 0.6))' : isActive ? 'drop-shadow(0 2px 5px rgba(14, 165, 233, 0.6))' : ''} />
      {/* Blade 3 */}
      <path d="M 24 24 L 24 42 Q 22 36 22 28 L 24 24 Z" fill={hasMalfunction ? '#ef4444' : isActive ? '#06b6d4' : '#cbd5e1'} opacity={hasMalfunction ? 0.7 : isActive ? 0.95 : 0.5} filter={hasMalfunction ? 'drop-shadow(0 2px 5px rgba(239, 68, 68, 0.7))' : isActive ? 'drop-shadow(0 2px 5px rgba(6, 182, 212, 0.7))' : ''} />
      {/* Blade 4 */}
      <path d="M 24 24 L 12 24 Q 18 22 24 22 L 24 24 Z" fill={hasMalfunction ? '#f87171' : isActive ? '#0ea5e9' : '#a1a5b4'} opacity={hasMalfunction ? 0.65 : isActive ? 0.9 : 0.45} filter={hasMalfunction ? 'drop-shadow(0 2px 5px rgba(248, 113, 113, 0.6))' : isActive ? 'drop-shadow(0 2px 5px rgba(14, 165, 233, 0.6))' : ''} />
      {/* Blade 5 - Diagonal */}
      <path d="M 24 24 L 33 31 Q 29 28 26 25 L 24 24 Z" fill={hasMalfunction ? '#ef4444' : isActive ? '#22d3ee' : '#cbd5e1'} opacity={hasMalfunction ? 0.6 : isActive ? 0.85 : 0.4} filter={hasMalfunction ? 'drop-shadow(0 2px 4px rgba(239, 68, 68, 0.5))' : isActive ? 'drop-shadow(0 2px 4px rgba(34, 211, 238, 0.5))' : ''} />
      {/* Blade 6 - Diagonal */}
      <path d="M 24 24 L 15 33 Q 18 29 22 26 L 24 24 Z" fill={hasMalfunction ? '#ef4444' : isActive ? '#22d3ee' : '#cbd5e1'} opacity={hasMalfunction ? 0.6 : isActive ? 0.85 : 0.4} filter={hasMalfunction ? 'drop-shadow(0 2px 4px rgba(239, 68, 68, 0.5))' : isActive ? 'drop-shadow(0 2px 4px rgba(34, 211, 238, 0.5))' : ''} />
    </g>

    {/* Counter-rotating inner turbine - 4 blades */}
    <g className={isActive && !hasMalfunction ? 'animate-turbine-spin-reverse-fast' : ''}>
      {/* Inner Blade 1 */}
      <path d="M 24 24 L 24 10 Q 25 16 25 21 L 24 24 Z" fill={hasMalfunction ? '#fca5a5' : isActive ? '#cffafe' : '#e0e7ff'} opacity={hasMalfunction ? 0.5 : isActive ? 0.8 : 0.25} />
      {/* Inner Blade 2 */}
      <path d="M 24 24 L 34 24 Q 28 25 24 26 L 24 24 Z" fill={hasMalfunction ? '#ef4444' : isActive ? '#22d3ee' : '#cbd5e1'} opacity={hasMalfunction ? 0.6 : isActive ? 0.75 : 0.3} />
      {/* Inner Blade 3 */}
      <path d="M 24 24 L 24 38 Q 23 32 23 27 L 24 24 Z" fill={hasMalfunction ? '#fca5a5' : isActive ? '#cffafe' : '#e0e7ff'} opacity={hasMalfunction ? 0.5 : isActive ? 0.8 : 0.25} />
      {/* Inner Blade 4 */}
      <path d="M 24 24 L 14 24 Q 20 23 24 22 L 24 24 Z" fill={hasMalfunction ? '#ef4444' : isActive ? '#22d3ee' : '#cbd5e1'} opacity={hasMalfunction ? 0.6 : isActive ? 0.75 : 0.3} />
    </g>

    {/* Complex decorative elements */}
    {(isActive || hasMalfunction) && (
      <>
        {/* Multiple layered glow rings */}
        <circle cx="24" cy="24" r="18" stroke={hasMalfunction ? '#ef4444' : '#06b6d4'} strokeWidth="0.8" opacity={hasMalfunction ? '0.5' : '0.35'} className={hasMalfunction ? 'animate-error-glow' : 'animate-turbine-glow-outer'} />
        <circle cx="24" cy="24" r="13" stroke={hasMalfunction ? '#f87171' : '#0ea5e9'} strokeWidth="0.8" opacity={hasMalfunction ? '0.6' : '0.45'} className={hasMalfunction ? 'animate-error-glow' : 'animate-turbine-glow-inner'} />
        <circle cx="24" cy="24" r="8" stroke={hasMalfunction ? '#ef4444' : '#22d3ee'} strokeWidth="0.6" opacity={hasMalfunction ? '0.4' : '0.3'} className={hasMalfunction ? 'animate-malfunction-blink' : 'animate-turbine-glow-inner'} />
        
        {/* Pulsing center dot */}
        <circle cx="24" cy="24" r="2" fill={hasMalfunction ? '#dc2626' : '#fbbf24'} opacity={hasMalfunction ? '0.8' : '0.6'} className={hasMalfunction ? 'animate-malfunction-blink' : 'animate-pulse'} />
      </>
    )}
  </svg>
);

const PumpIcon: React.FC<{ isActive: boolean; hasMalfunction?: boolean }> = ({ isActive, hasMalfunction }) => (
  <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="pumpActiveGradient" cx="50%" cy="50%">
        <stop offset="0%" stopColor={hasMalfunction ? '#f87171' : isActive ? '#fb923c' : '#e5e7eb'} />
        <stop offset="100%" stopColor={hasMalfunction ? '#dc2626' : isActive ? '#ea580c' : '#cbd5e1'} />
      </radialGradient>
    </defs>

    {/* Background Housing */}
    <circle cx="24" cy="24" r="20" fill={hasMalfunction ? 'rgba(239, 68, 68, 0.15)' : isActive ? 'rgba(234, 88, 12, 0.1)' : 'rgba(229, 231, 235, 0.2)'} stroke={hasMalfunction ? '#ef4444' : isActive ? '#ea580c' : '#cbd5e1'} strokeWidth="2" className={hasMalfunction ? 'animate-malfunction-blink' : ''} />
    
    {/* Flanges/Pipes */}
    <path d="M -2 20 L 6 20 L 6 28 L -2 28 Z" fill={hasMalfunction ? '#f87171' : isActive ? '#fdba74' : '#cbd5e1'} opacity="0.6" />
    <path d="M 42 20 L 50 20 L 50 28 L 42 28 Z" fill={hasMalfunction ? '#f87171' : isActive ? '#fdba74' : '#cbd5e1'} opacity="0.6" />

    {/* Inner Volute Casing */}
    <circle cx="24" cy="24" r="16" stroke={hasMalfunction ? '#fca5a5' : isActive ? '#fdba74' : '#a1a5b4'} strokeWidth="1.5" fill="none" opacity="0.8" />
    
    {/* Central Rotating Mechanical Impeller */}
    <g className={isActive ? 'animate-turbine-spin-fast' : ''} style={{ transformOrigin: '24px 24px' }}>
      {/* Main Blades */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <path key={i} d="M 24 21 C 28 14 27 10 24 6 C 21 10 20 14 24 21 Z" fill="url(#pumpActiveGradient)" opacity={isActive ? 0.9 : 0.5} transform={`rotate(${angle} 24 24)`} filter={isActive ? 'drop-shadow(0 2px 4px rgba(234, 88, 12, 0.4))' : ''} />
      ))}
      {/* Inner ring */}
      <circle cx="24" cy="24" r="7" fill={hasMalfunction ? '#991b1b' : isActive ? '#9a3412' : '#6b7280'} />
      <circle cx="24" cy="24" r="4" fill="#fff" opacity="0.6" />
      <circle cx="24" cy="24" r="1.5" fill={hasMalfunction ? '#7f1d1d' : isActive ? '#7c2d12' : '#4b5563'} />
    </g>

    {/* Glowing Status Effects */}
    {(isActive || hasMalfunction) && (
      <>
        <circle cx="24" cy="24" r="14" stroke={hasMalfunction ? '#ef4444' : '#ea580c'} strokeWidth="0.8" opacity={hasMalfunction ? '0.5' : '0.4'} className={hasMalfunction ? 'animate-error-glow' : 'animate-turbine-glow-outer'} />
        <circle cx="24" cy="24" r="10" stroke={hasMalfunction ? '#f87171' : '#f97316'} strokeWidth="0.8" opacity="0.5" className={hasMalfunction ? 'animate-error-glow' : 'animate-turbine-glow-inner'} />
      </>
    )}
  </svg>
);

const ValveIcon: React.FC<{ isActive: boolean; hasMalfunction?: boolean }> = ({ isActive, hasMalfunction }) => (
  <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="valveActiveGradient" cx="50%" cy="50%">
        <stop offset="0%" stopColor={hasMalfunction ? '#f87171' : isActive ? '#c084fc' : '#e5e7eb'} />
        <stop offset="100%" stopColor={hasMalfunction ? '#dc2626' : isActive ? '#9333ea' : '#cbd5e1'} />
      </radialGradient>
    </defs>

    {/* Base Pipe Line */}
    <path d="M 2 24 L 46 24" stroke={hasMalfunction ? '#fca5a5' : isActive ? '#d8b4fe' : '#cbd5e1'} strokeWidth="8" opacity="0.4" />
    <path d="M 2 18 L 8 18 L 8 30 L 2 30 Z" fill={hasMalfunction ? '#ef4444' : isActive ? '#a855f7' : '#9ca3af'} />
    <path d="M 40 18 L 46 18 L 46 30 L 40 30 Z" fill={hasMalfunction ? '#ef4444' : isActive ? '#a855f7' : '#9ca3af'} />

    {/* Valve Body / Bonnet */}
    <path d="M 14 30 L 34 30 L 28 14 L 20 14 Z" fill={hasMalfunction ? 'rgba(239, 68, 68, 0.15)' : isActive ? 'rgba(147, 51, 234, 0.15)' : 'rgba(229, 231, 235, 0.2)'} stroke={hasMalfunction ? '#ef4444' : isActive ? '#9333ea' : '#cbd5e1'} strokeWidth="2" className={hasMalfunction ? 'animate-malfunction-blink' : ''} />
    
    {/* Shaft */}
    <rect x="22" y="6" width="4" height="8" fill={hasMalfunction ? '#dc2626' : isActive ? '#7e22ce' : '#6b7280'} />

    {/* Mechanical Rotary Actuator / Wheel */}
    <g className={isActive ? 'animate-turbine-spin-fast' : ''} style={{ transformOrigin: '24px 10px' }}>
      {/* Wheel Outer Ring */}
      <circle cx="24" cy="10" r="8" stroke="url(#valveActiveGradient)" strokeWidth="2.5" fill="none" opacity={isActive ? 0.9 : 0.6} />
      <circle cx="24" cy="10" r="6" stroke={hasMalfunction ? '#fca5a5' : isActive ? '#d8b4fe' : '#d1d5db'} strokeWidth="0.5" fill="none" />
      
      {/* Mechanical Spokes */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <line key={i} x1="24" y1="10" x2="24" y2="2" stroke="url(#valveActiveGradient)" strokeWidth="2" transform={`rotate(${angle} 24 10)`} />
      ))}
      
      {/* Center Hub */}
      <circle cx="24" cy="10" r="3" fill={hasMalfunction ? '#991b1b' : isActive ? '#6b21a8' : '#4b5563'} />
      <circle cx="24" cy="10" r="1.5" fill="#fff" opacity="0.8" />
    </g>

    {/* Animated Inner Gate */}
    <g className={isActive && !hasMalfunction ? 'animate-pulse' : ''}>
      <circle cx="24" cy="22" r="4" fill={hasMalfunction ? '#dc2626' : isActive ? '#10b981' : '#9ca3af'} />
      <circle cx="24" cy="22" r="2" fill="#fff" opacity="0.6" />
    </g>

    {/* Glow */}
    {(isActive || hasMalfunction) && (
      <>
        <circle cx="24" cy="10" r="12" stroke={hasMalfunction ? '#ef4444' : '#a855f7'} strokeWidth="0.8" opacity={hasMalfunction ? '0.5' : '0.4'} className={hasMalfunction ? 'animate-error-glow' : 'animate-turbine-glow-outer'} />
        <circle cx="24" cy="22" r="8" stroke={hasMalfunction ? '#f87171' : '#10b981'} strokeWidth="0.6" opacity="0.6" className={hasMalfunction ? 'animate-error-glow' : 'animate-turbine-glow-inner'} />
      </>
    )}
  </svg>
);

