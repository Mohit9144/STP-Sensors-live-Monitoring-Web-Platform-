import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Database, 
  Globe, 
  Save, 
  RefreshCw,
  Trash2,
  Plus,
  Info
} from 'lucide-react';
import { cn } from '../lib/utils';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'User Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'system', label: 'System Configuration', icon: Database },
    { id: 'integrations', label: 'Integrations', icon: Globe },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="hero-shell rounded-3xl p-5 md:p-6 border border-slate-200/70 shadow-sm">
        <span className="brand-chip">Control Center</span>
        <h2 className="section-title text-2xl mt-2">System Settings</h2>
        <p className="section-subtitle">Manage your account, threshold policies, and notification preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-72 shrink-0 panel-surface p-3 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all border",
                activeTab === tab.id 
                  ? "bg-blue-50 text-blue-600 border-blue-100 shadow-sm" 
                  : "text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 panel-surface p-8">
          {activeTab === 'profile' && (
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border-4 border-white shadow-md overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                    alt="Profile"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">John Doe</h3>
                  <p className="text-sm text-slate-500">System Administrator • Plant 01</p>
                  <button className="mt-2 text-xs font-bold text-blue-600 hover:underline">Change Avatar</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                  <input 
                    type="text" 
                    defaultValue="John Doe"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    defaultValue="john.doe@stp-enterprise.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all">
                    <option>Administrator</option>
                    <option>Operator</option>
                    <option>Viewer</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Timezone</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all">
                    <option>UTC (Coordinated Universal Time)</option>
                    <option>EST (Eastern Standard Time)</option>
                    <option>IST (Indian Standard Time)</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
                <button className="px-6 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-8">
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900">Alert Preferences</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Critical Threshold Alerts', desc: 'Immediate notification when sensors exceed critical limits.', enabled: true },
                    { label: 'System Malfunction', desc: 'Alert when sensor quality flag is reported as BAD.', enabled: true },
                    { label: 'Weekly Performance Report', desc: 'Summary of plant efficiency and energy consumption.', enabled: false },
                    { label: 'Maintenance Reminders', desc: 'Predictive maintenance notifications based on analytics.', enabled: true },
                  ].map((notif, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="max-w-md">
                        <p className="text-sm font-bold text-slate-900">{notif.label}</p>
                        <p className="text-xs text-slate-500 leading-relaxed">{notif.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={notif.enabled} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button className="px-6 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Update Preferences
                </button>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Threshold Configuration</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Tune control limits used by health status and alert logic.</p>
                </div>
                <button className="px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-100 transition-all flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Custom Rule
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Default Rules</p>
                  <p className="text-xl font-extrabold text-slate-900 mt-1">4</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Custom Rules</p>
                  <p className="text-xl font-extrabold text-blue-700 mt-1">0</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Sync</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">Just now</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/70">
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sensor</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Min</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unit</th>
                      <th className="px-6 py-4 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {[
                      { name: 'BOD', min: 0, max: 10, unit: 'mg/L' },
                      { name: 'COD', min: 0, max: 50, unit: 'mg/L' },
                      { name: 'pH', min: 6.5, max: 8.5, unit: 'pH' },
                      { name: 'DO', min: 1.5, max: 4.0, unit: 'mg/L' },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-white transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{row.name}</span>
                            <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded-md text-[9px] font-bold text-slate-500 uppercase">core</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input type="number" defaultValue={row.min} className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none" />
                        </td>
                        <td className="px-6 py-4">
                          <input type="number" defaultValue={row.max} className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none" />
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-500">{row.unit}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
                <Info className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  Changes to system thresholds will trigger a re-calculation of historical health data and may generate new alerts for current readings.
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button className="px-6 py-2.5 text-sm font-bold text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all">
                  Reset Defaults
                </button>
                <button className="px-6 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Apply and Sync
                </button>
              </div>
            </div>
          )}

          {activeTab !== 'profile' && activeTab !== 'notifications' && activeTab !== 'system' && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-4">
                <RefreshCw className="w-8 h-8 animate-spin-slow" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Module Loading</h3>
              <p className="text-sm text-slate-500 max-w-xs">This configuration module is being synchronized with the central server.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
