import React from 'react';
import {
  Server, Network, AlertTriangle, ShieldCheck, WifiOff,
  Activity, BookOpen
} from 'lucide-react';
import { STATUS_META } from '../utils/riskAnalysis.js';

export default function NetworkStats({ devices = [], connections = [] }) {
  const totalNodes = devices.length;
  const totalEdges = connections.length;

  const infectedNodes = devices.filter(d => d.status === 'INFECTED');
  const infectedCount = infectedNodes.length;
  const protectedCount = devices.filter(d => d.status === 'PROTECTED').length;
  const vulnerableCount = devices.filter(d => d.status === 'VULNERABLE').length;
  const safeCount = devices.filter(d => d.status === 'SAFE').length;

  const infectionPct = totalNodes > 0 ? ((infectedCount / totalNodes) * 100) : 0;
  const infectionPctStr = infectionPct.toFixed(1);

  // Isolated Nodes: degree is 0 (no connections in connection list)
  const isolatedNodes = devices.filter(d => {
    return !connections.some(c => c.from === d.id || c.to === d.id);
  });
  const isolatedCount = isolatedNodes.length;

  // Additional Network Graph Metrics
  // Density: 2E / (V(V-1))
  const density = totalNodes > 1
    ? ((2 * totalEdges) / (totalNodes * (totalNodes - 1)) * 100)
    : 0;

  // Average Degree: 2E / V
  const avgDegree = totalNodes > 0 ? (2 * totalEdges) / totalNodes : 0;

  // Device type counts
  const typeCounts = devices.reduce((acc, d) => {
    const t = d.type || 'Unknown';
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

  // Degree Distribution (0, 1, 2, 3, 4+)
  const degreeCounts = { 0: 0, 1: 0, 2: 0, 3: 0, '4+': 0 };
  devices.forEach(d => {
    const deg = connections.filter(c => c.from === d.id || c.to === d.id).length;
    if (deg >= 4) degreeCounts['4+']++;
    else degreeCounts[deg]++;
  });

  // Circular gauge config
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (infectionPct / 100) * circumference;

  // Infection color mapping
  const gaugeColor =
    infectionPct === 0 ? '#10b981' : // safe green
    infectionPct <= 20  ? '#3b82f6' : // low blue
    infectionPct <= 50  ? '#f59e0b' : // warning amber
    infectionPct <= 85  ? '#ef4444' : // high red
    '#ec4899'; // critical pink

  if (totalNodes === 0) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center text-center animate-fade-in">
        <div className="cyber-card-glow max-w-md p-8 border border-cyber-border bg-cyber-surface/60 backdrop-blur flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-cyan-500/10 border border-cyan-500/40 text-cyan-400">
            <Network size={24} className="animate-pulse" />
          </div>
          <h2 className="text-base font-bold text-slate-100 uppercase tracking-widest">No Network Data</h2>
          <p className="text-xs text-cyber-muted leading-relaxed">
            The network simulator database is currently empty. Load the demo network or add custom devices using the Device Manager to begin generating real-time statistics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full grid-bg">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-100 tracking-wide">Network Statistics</h1>
          <p className="text-[11px] text-cyber-muted mt-0.5">
            Topology analytics and vulnerability metrics overview
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-cyber-muted bg-cyber-surface border border-cyber-border px-3 py-1.5 rounded-lg select-none">
          <Activity size={12} className="text-green-500 animate-pulse" />
          <span>REAL-TIME GRAPH METRICS ENABLED</span>
        </div>
      </div>

      {/* Primary 5-Card Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Nodes */}
        <div className="cyber-card p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <span className="text-[10px] text-cyber-muted uppercase tracking-widest font-semibold">Total Nodes</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Server size={15} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-cyan-400">{totalNodes}</div>
            <div className="text-[10px] text-cyber-muted mt-1 truncate">
              {Object.entries(typeCounts).map(([type, count]) => `${count} ${type}s`).join(', ')}
            </div>
          </div>
        </div>

        {/* Total Edges */}
        <div className="cyber-card p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <span className="text-[10px] text-cyber-muted uppercase tracking-widest font-semibold">Total Edges</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-500/10 border border-violet-500/30 text-violet-400">
              <Network size={15} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-violet-400">{totalEdges}</div>
            <div className="text-[10px] text-cyber-muted mt-1">
              Network Density: <span className="font-semibold text-slate-300">{density.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Infection Percentage */}
        <div className="cyber-card p-5 flex flex-col gap-3" style={{ borderColor: `${gaugeColor}33` }}>
          <div className="flex items-start justify-between">
            <span className="text-[10px] text-cyber-muted uppercase tracking-widest font-semibold">Infection Rate</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${gaugeColor}15`, border: `1px solid ${gaugeColor}40` }}>
              <AlertTriangle size={15} style={{ color: gaugeColor }} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold" style={{ color: gaugeColor }}>{infectionPctStr}%</div>
            <div className="text-[10px] text-cyber-muted mt-1">
              <span className="font-semibold" style={{ color: gaugeColor }}>{infectedCount}</span> of {totalNodes} infected
            </div>
          </div>
        </div>

        {/* Protected Nodes */}
        <div className="cyber-card p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <span className="text-[10px] text-cyber-muted uppercase tracking-widest font-semibold">Protected Nodes</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <ShieldCheck size={15} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-400">{protectedCount}</div>
            <div className="text-[10px] text-cyber-muted mt-1">
              Coverage: <span className="font-semibold text-slate-300">{totalNodes > 0 ? Math.round((protectedCount / totalNodes) * 100) : 0}%</span> of network
            </div>
          </div>
        </div>

        {/* Isolated Nodes */}
        <div className="cyber-card p-5 flex flex-col gap-3" style={{ borderColor: isolatedCount > 0 ? 'rgba(245,158,11,0.2)' : undefined }}>
          <div className="flex items-start justify-between">
            <span className="text-[10px] text-cyber-muted uppercase tracking-widest font-semibold">Isolated Nodes</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isolatedCount > 0 ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 animate-pulse' : 'bg-slate-500/10 border border-slate-500/30 text-slate-400'}`}>
              <WifiOff size={15} />
            </div>
          </div>
          <div>
            <div className={`text-3xl font-bold ${isolatedCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>{isolatedCount}</div>
            <div className="text-[10px] text-cyber-muted mt-1">
              Nodes offline/unconnected
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Infection Circular Gauge + Density Metric */}
        <div className="cyber-card p-5 flex flex-col items-center justify-center gap-6">
          <div className="w-full">
            <span className="text-[10px] text-cyber-muted uppercase tracking-widest font-semibold block mb-4">
              Malware Infection Load
            </span>
          </div>

          <div className="relative flex items-center justify-center">
            {/* SVG Circular Progress Bar */}
            <svg className="w-36 h-36 transform -rotate-90">
              {/* Backing Track */}
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="8"
                fill="transparent"
              />
              {/* Value Stroke */}
              <circle
                cx="72"
                cy="72"
                r={radius}
                style={{ stroke: gaugeColor, strokeDasharray: circumference, strokeDashoffset }}
                strokeWidth="8"
                fill="transparent"
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-2xl font-bold text-slate-100 tracking-tighter">
                {infectionPctStr}%
              </span>
              <span className="text-[9px] text-cyber-muted uppercase tracking-widest block font-bold mt-0.5">
                Infected
              </span>
            </div>
          </div>

          <div className="w-full grid grid-cols-3 text-center gap-2 border-t border-cyber-border/40 pt-4 text-xs font-mono">
            <div>
              <div className="text-green-400 font-bold">{safeCount}</div>
              <div className="text-[9px] text-cyber-muted">Safe</div>
            </div>
            <div>
              <div className="text-blue-400 font-bold">{protectedCount}</div>
              <div className="text-[9px] text-cyber-muted">Protected</div>
            </div>
            <div>
              <div className="text-amber-400 font-bold">{vulnerableCount}</div>
              <div className="text-[9px] text-cyber-muted">Vulnerable</div>
            </div>
          </div>
        </div>

        {/* Middle Column: Topology Insights & Degree Distribution */}
        <div className="cyber-card p-5 flex flex-col gap-4">
          <div>
            <span className="text-[10px] text-cyber-muted uppercase tracking-widest font-semibold block mb-1">
              Network Topology Metrics
            </span>
            <span className="text-[9px] text-slate-500">Degree distribution and link statistics</span>
          </div>

          <div className="space-y-3 font-mono text-xs flex-1">
            <div className="flex justify-between items-center py-1.5 border-b border-cyber-border/30">
              <span className="text-cyber-muted">Average Node Degree</span>
              <span className="font-semibold text-slate-200">{avgDegree.toFixed(2)} links</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-cyber-border/30">
              <span className="text-cyber-muted">Theoretical Max Connections</span>
              <span className="font-semibold text-slate-200">
                {totalNodes > 1 ? (totalNodes * (totalNodes - 1)) / 2 : 0} edges
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-cyber-border/30">
              <span className="text-cyber-muted">Network Topology Density</span>
              <span className="font-semibold text-slate-200">{density.toFixed(2)}%</span>
            </div>
          </div>

          {/* Degree Distribution Visual Bar list */}
          <div className="space-y-2 mt-2">
            <span className="text-[9px] text-cyber-muted uppercase tracking-widest block font-bold mb-1">
              Degree Distribution (Connections/Device)
            </span>
            {Object.entries(degreeCounts).map(([degree, count]) => {
              const maxCount = Math.max(...Object.values(degreeCounts), 1);
              const pct = (count / maxCount) * 100;
              return (
                <div key={degree} className="flex items-center gap-3 text-[10px]">
                  <span className="w-6 text-cyber-muted font-mono">{degree} deg:</span>
                  <div className="flex-1 risk-bar-bg" style={{ height: 6 }}>
                    <div
                      className="risk-bar-fill bar-animate"
                      style={{
                        width: `${pct}%`,
                        background: degree === '0' ? '#f59e0b' : '#06b6d4',
                      }}
                    />
                  </div>
                  <span className="w-5 text-right font-bold text-slate-300 font-mono">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Isolated Nodes Inspector */}
        <div className="cyber-card p-5 flex flex-col gap-4">
          <div>
            <span className="text-[10px] text-cyber-muted uppercase tracking-widest font-semibold block mb-1">
              Isolated Devices Inspector
            </span>
            <span className="text-[9px] text-slate-500">Nodes detached from the main network topology</span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-56 pr-1 space-y-2">
            {isolatedCount === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-8 text-center text-cyber-muted text-xs">
                <ShieldCheck size={28} className="text-green-500 opacity-60 mb-2" />
                <span>All devices are fully connected.</span>
                <span className="text-[10px] text-slate-600 mt-1">No isolated threat vectors.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {isolatedNodes.map(node => {
                  const statusMeta = STATUS_META[node.status] || { color: '#64748b', label: node.status };
                  return (
                    <div
                      key={node.id}
                      className="flex items-center justify-between p-2.5 rounded border border-cyber-border bg-slate-900/40 text-xs font-mono"
                    >
                      <div className="min-w-0">
                        <div className="text-slate-200 font-semibold truncate">{node.name}</div>
                        <div className="text-[10px] text-cyber-muted truncate">{node.type} • ID: #{node.id}</div>
                      </div>
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ml-2"
                        style={{
                          background: `${statusMeta.color}15`,
                          color: statusMeta.color,
                          border: `1px solid ${statusMeta.color}30`
                        }}
                      >
                        {statusMeta.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-cyber-border/40 pt-3 text-[10px] text-cyber-muted leading-relaxed">
            <BookOpen size={12} className="inline mr-1 text-cyan-400" />
            <span>
              <strong>Note:</strong> Isolated nodes cannot be infected by neighbor propagation steps. To establish links, use the **Device Manager** menu to add connections between IDs.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
