import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, Zap, Activity, ShieldCheck, Clock } from 'lucide-react';
import { useSupabase } from '../hooks/useSupabase';
import { cn } from '../lib/utils';

const HEALTH_COLORS = ['#3b82f6', '#14b8a6', '#f59e0b']; // Blue, Teal, Amber matching image

export const Analytics: React.FC = () => {
  const { sensors, alerts } = useSupabase();

  // Mock efficiency data based on image
  const efficiencyData = [
    { name: 'Mon', efficiency: 92 },
    { name: 'Tue', efficiency: 89 },
    { name: 'Wed', efficiency: 94 },
    { name: 'Thu', efficiency: 91 },
    { name: 'Fri', efficiency: 95 },
    { name: 'Sat', efficiency: 97 },
    { name: 'Sun', efficiency: 96 },
  ];

  // Mock energy consumption based on image
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
    { name: 'Healthy', value: Math.max(18, sensors.length - 2) },
    { name: 'Warning', value: 1 },
    { name: 'Critical', value: 1 },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="section-title text-[28px] text-slate-900 tracking-tight">Advanced Analytics</h2>
          <p className="section-subtitle text-[15px] mt-1">Plant performance metrics and predictive insight snapshots.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold shadow-sm border border-blue-100">
          <Clock className="w-3.5 h-3.5" />
          Last updated: Just now
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Overall Efficiency', value: '94.2%', trend: '+2.1%', trendType: 'positive', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Energy Intensity', value: '0.85 kWh/m3', trend: '-5.4%', trendType: 'neutral', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'System Uptime', value: '99.98%', trend: 'Stable', trendType: 'stable', icon: ShieldCheck, color: 'text-cyan-500', bg: 'bg-cyan-50' },
          { label: 'Active Alerts', value: alerts.length > 0 ? alerts.length.toString() : '2', trend: '-2', trendType: 'neutral', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-[24px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
            <div className="flex justify-between items-start mb-6">
              <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", stat.bg, stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-bold",
                stat.trendType === 'positive' ? "bg-emerald-50 text-emerald-600" :
                stat.trendType === 'neutral' ? "bg-blue-50 text-blue-600" :
                "bg-slate-100 text-slate-600"
              )}>
                {stat.trend}
              </div>
            </div>
            <div>
              <h4 className="text-slate-500 font-medium text-[13px] mb-1">{stat.label}</h4>
              <p className="text-[28px] leading-none font-bold text-slate-900 tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Plant Efficiency Trend */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100">
          <h3 className="text-[15px] font-bold text-slate-900 mb-8 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Weekly Efficiency Trend (%)
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={efficiencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }} domain={[80, 100]} dx={-10} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="efficiency" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Energy Consumption Breakdown */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100">
          <h3 className="text-[15px] font-bold text-slate-900 mb-8 flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-500" />
            Energy Consumption (kWh)
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={energyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748b', paddingTop: '20px' }} />
                <Line type="monotone" dataKey="aeration" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }} />
                <Line type="monotone" dataKey="lighting" stroke="#f59e0b" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#f59e0b' }} />
                <Line type="monotone" dataKey="pumps" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sensor Network Health */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100">
          <h3 className="text-[15px] font-bold text-slate-900 mb-8 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            Sensor Network Health
          </h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 mt-4">
            <div className="h-[200px] w-[200px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={healthData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    {healthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={HEALTH_COLORS[index]} stroke="#ffffff" strokeWidth={4} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-auto min-w-[200px] space-y-5">
              {healthData.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: HEALTH_COLORS[i] }} />
                    <span className="text-[14px] font-medium text-slate-500">{item.name}</span>
                  </div>
                  <span className="text-[14px] font-bold text-slate-900">{item.value} units</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Predictive Insights */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100">
          <h3 className="text-[15px] font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-500" />
            Predictive Maintenance Insights
          </h3>
          <div className="space-y-3">
            {[
              { title: 'Blower #3 Vibration', desc: 'Slight increase in vibration detected. Schedule inspection within 7 days.' },
              { title: 'Membrane Cleaning', desc: 'Flux rate decreasing. Recommended backwash cycle in 48 hours.' },
              { title: 'RAS Pump #1 Efficiency', desc: 'Operating 12% below baseline. Check for impeller wear.' },
            ].map((insight, i) => (
              <div key={i} className="p-5 bg-slate-50/50 rounded-[16px] border border-slate-100 flex flex-col gap-1.5 transition-colors hover:bg-slate-50">
                <p className="text-[14px] font-bold text-slate-900">{insight.title}</p>
                <p className="text-[12.5px] font-medium text-slate-500 leading-relaxed">{insight.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
