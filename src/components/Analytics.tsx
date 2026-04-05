import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, Zap, Activity, ShieldCheck, Clock } from 'lucide-react';
import { useSupabase } from '../hooks/useSupabase';
import { cn } from '../lib/utils';

const COLORS = ['#2563eb', '#0ea5a3', '#f59e0b', '#94a3b8', '#10b981'];

export const Analytics: React.FC = () => {
  const { sensors, readings, alerts } = useSupabase();

  // Mock efficiency data
  const efficiencyData = [
    { name: 'Mon', efficiency: 92 },
    { name: 'Tue', efficiency: 89 },
    { name: 'Wed', efficiency: 94 },
    { name: 'Thu', efficiency: 91 },
    { name: 'Fri', efficiency: 95 },
    { name: 'Sat', efficiency: 97 },
    { name: 'Sun', efficiency: 96 },
  ];

  // Mock energy consumption
  const energyData = [
    { time: '00:00', aeration: 450, pumps: 200, lighting: 50 },
    { time: '04:00', aeration: 420, pumps: 180, lighting: 40 },
    { time: '08:00', aeration: 580, pumps: 350, lighting: 20 },
    { time: '12:00', aeration: 650, pumps: 400, lighting: 10 },
    { time: '16:00', aeration: 600, pumps: 380, lighting: 30 },
    { time: '20:00', aeration: 520, pumps: 250, lighting: 60 },
  ];

  // Sensor health distribution
  const healthData = [
    { name: 'Healthy', value: sensors.length - 2 },
    { name: 'Warning', value: 1 },
    { name: 'Critical', value: 1 },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="section-title text-2xl">Advanced Analytics</h2>
          <p className="section-subtitle">Plant performance metrics and predictive insight snapshots.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">
          <Clock className="w-3.5 h-3.5" />
          Last updated: Just now
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Overall Efficiency', value: '94.2%', trend: '+2.1%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Energy Intensity', value: '0.85 kWh/m3', trend: '-5.4%', icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'System Uptime', value: '99.98%', trend: 'Stable', icon: ShieldCheck, color: 'text-cyan-600', bg: 'bg-cyan-50' },
          { label: 'Active Alerts', value: alerts.length.toString(), trend: '-2', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className="panel-surface p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={stat.bg + " p-2 rounded-xl " + stat.color}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                stat.trend.startsWith('+') ? "bg-emerald-50 text-emerald-600" : 
                stat.trend.startsWith('-') ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-600"
              )}>
                {stat.trend}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plant Efficiency Trend */}
        <div className="panel-surface p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Weekly Efficiency Trend (%)
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={efficiencyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[80, 100]} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="efficiency" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Energy Consumption Breakdown */}
        <div className="panel-surface p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-500" />
            Energy Consumption (kWh)
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={energyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Line type="monotone" dataKey="aeration" stroke="#3b82f6" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="pumps" stroke="#10b981" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="lighting" stroke="#f59e0b" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sensor Health Distribution */}
        <div className="panel-surface p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            Sensor Network Health
          </h3>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="h-[200px] w-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={healthData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {healthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-4">
              {healthData.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-sm font-medium text-slate-600">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{item.value} units</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Predictive Insights */}
        <div className="panel-surface p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-500" />
            Predictive Maintenance Insights
          </h3>
          <div className="space-y-4">
            {[
              { title: 'Blower #3 Vibration', desc: 'Slight increase in vibration detected. Schedule inspection within 7 days.', severity: 'medium' },
              { title: 'Membrane Cleaning', desc: 'Flux rate decreasing. Recommended backwash cycle in 48 hours.', severity: 'low' },
              { title: 'RAS Pump #1 Efficiency', desc: 'Operating 12% below baseline. Check for impeller wear.', severity: 'high' },
            ].map((insight, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex gap-4">
                <div className={cn(
                  "w-1 h-full rounded-full shrink-0",
                  insight.severity === 'high' ? "bg-rose-500" : 
                  insight.severity === 'medium' ? "bg-amber-500" : "bg-blue-500"
                )} />
                <div>
                  <p className="text-sm font-bold text-slate-900 mb-1">{insight.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{insight.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
