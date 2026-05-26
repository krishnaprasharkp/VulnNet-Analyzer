import React from 'react';
import {
  LayoutDashboard, Network, Play, Server, FileText,
  Shield, ChevronRight, Activity, Terminal,
} from 'lucide-react';
import { RISK_COLORS } from '../utils/riskAnalysis.js';

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',         Icon: LayoutDashboard },
  { id: 'network',    label: 'Network Graph',      Icon: Network },
  { id: 'simulation', label: 'Simulation',         Icon: Play },
  { id: 'terminal',   label: 'Security Terminal',  Icon: Terminal },
  { id: 'devices',    label: 'Device Manager',     Icon: Server },
  { id: 'report',     label: 'Security Report',    Icon: FileText },
];

export default function Sidebar({ view, setView, riskLevel, infectedCount, totalDevices }) {
  const rc = RISK_COLORS[riskLevel] ?? RISK_COLORS.LOW;

  return (
    <aside className="flex flex-col h-full w-64 bg-cyber-surface border-r border-cyber-border select-none shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-cyber-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{
                 background: 'rgba(6,182,212,0.12)',
                 border: '1px solid rgba(6,182,212,0.3)',
                 boxShadow: '0 0 20px rgba(6,182,212,0.1)',
               }}>
            <Shield size={16} color="#06b6d4" />
          </div>
          <div>
            <div className="text-xs font-bold text-cyan-400 tracking-widest uppercase"
                 style={{ textShadow: '0 0 15px rgba(6,182,212,0.4)' }}>
              VulnNet
            </div>
            <div className="text-[10px] text-cyber-muted tracking-wider">Analyzer v1.0</div>
          </div>
        </div>
      </div>

      {/* Live risk status */}
      <div className="mx-4 mt-4 px-3 py-2 rounded-lg border flex items-center gap-2"
           style={{ background: rc.bg, borderColor: rc.border }}>
        <Activity size={12} style={{ color: rc.text }} className="animate-pulse" />
        <span className="text-[11px] font-semibold" style={{ color: rc.text }}>
          {riskLevel} RISK
        </span>
        <span className="ml-auto text-[10px] text-cyber-muted">
          {infectedCount}/{totalDevices}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-4 space-y-0.5">
        {NAV.map(({ id, label, Icon }) => {
          const active = view === id;
          return (
            <button
              key={id}
              onClick={() => setView(id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-medium transition-all duration-150"
              style={active ? {
                background: 'rgba(6,182,212,0.1)',
                border: '1px solid rgba(6,182,212,0.28)',
                color: '#06b6d4',
                boxShadow: '0 0 15px rgba(6,182,212,0.06)',
              } : {
                background: 'transparent',
                border: '1px solid transparent',
                color: '#64748b',
              }}
            >
              <Icon size={15} />
              <span className="tracking-wide">{label}</span>
              {active && <ChevronRight size={12} className="ml-auto" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-cyber-border">
        <div className="text-[10px] text-center leading-5">
          <div className="text-[11px] text-slate-500">C++ Core · React UI</div>
          <div className="text-slate-700">krishnaprasharkp</div>
        </div>
      </div>
    </aside>
  );
}
