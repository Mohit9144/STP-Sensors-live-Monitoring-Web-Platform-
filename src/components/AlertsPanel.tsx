import React from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { Alert } from '../types';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface AlertsPanelProps {
  alerts: Alert[];
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts }) => {
  return (
    <div className="bg-white rounded-[16px] overflow-hidden border-2 border-red-300 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          Recent Alerts
        </h3>
        <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
          {alerts.length} Active
        </span>
      </div>
      
      <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-400">No active alerts</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.alert_id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-bold text-slate-900">{alert.sensor_name || alert.sensor_id}</span>
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase",
                  alert.severity === 'critical'
                    ? "bg-red-100 text-red-700 alert-blink"
                    : alert.severity === 'high'
                      ? "bg-orange-100 text-orange-700 alert-blink-soft"
                      : "bg-yellow-100 text-yellow-700"
                )}>
                  {alert.severity}
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-2">{alert.message}</p>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <Clock className="w-3 h-3" />
                {format(new Date(alert.timestamp), 'MMM d, HH:mm:ss')}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
