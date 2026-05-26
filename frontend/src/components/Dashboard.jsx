import React from 'react';
import {
  Server, AlertTriangle, ShieldCheck, CheckCircle,
  Zap, TrendingUp, Activity, Wifi, Target,
} from 'lucide-react';
import { generateReport, RISK_COLORS, STATUS_META } from '../utils/riskAnalysis.js';

// ── Helpers for SVG charts ────────────────────────────────────────────────
function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSlice(cx, cy, outerR, innerR, startA, endA) {
  const os = polarToCartesian(cx, cy, outerR, startA);
  const oe = polarToCartesian(cx, cy, outerR, endA);
  const is = polarToCartesian(cx, cy, innerR, endA);
  const ie = polarToCartesian(cx, cy, innerR, startA);
  const large = (endA - startA) > 180 ? 1 : 0;
  return [
    `M ${os.x} ${os.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${oe.x} ${oe.y}`,
    `L ${is.x} ${is.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${ie.x} ${ie.y}`,
    'Z',
  ].join(' ');
}

// ── Sub-components ────────────────────────────────────────────────────────
function StatCard({ label, value, sub, Icon, color, borderGlow }) {
  return (
    <div className="cyber-card p-5 flex flex-col gap-3 animate-fade-in"
         style={{ borderColor: borderGlow ? `${color}44` : undefined,
                  boxShadow: borderGlow ? `0 0 20px ${color}10` : undefined }}>
      <div className="flex items-start justify-between">
        <div className="text-[11px] text-cyber-muted uppercase tracking-widest">{label}</div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
             style={{ background: `${color}14`, border: `1px solid ${color}40` }}>
          <Icon size={15} style={{ color }} />
        </div>
      </div>
      <div className="text-3xl font-bold" style={{ color }}>{value}</div>
      {sub && <div className="text-[11px] text-cyber-muted">{sub}</div>}
    </div>
  );
}

function ThreatMeter({ score, level }) {
  const rc = RISK_COLORS[level] ?? RISK_COLORS.LOW;
  const barColor =
    level === 'CRITICAL' ? '#ec4899' :
    level === 'HIGH'     ? '#ef4444' :
    level === 'MEDIUM'   ? '#f59e0b' : '#10b981';

  return (
    <div className="cyber-card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] text-cyber-muted uppercase tracking-widest">Network Threat Level</div>
        <span className="text-xs font-bold px-2 py-0.5 rounded"
              style={{ background: rc.bg, border: `1px solid ${rc.border}`, color: rc.text }}>
          {level}
        </span>
      </div>
      <div className="text-2xl font-bold mb-3" style={{ color: barColor }}>
        {score}<span className="text-base text-cyber-muted font-normal"> / 100</span>
      </div>
      <div className="risk-bar-bg">
        <div className="threat-bar-fill" style={{ width: `${Math.min(score, 100)}%`, background: barColor }} />
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-cyber-muted">
        <span>0 — Safe</span><span>25 — Med</span><span>50 — High</span><span>100 — Crit</span>
      </div>
    </div>
  );
}

function DeviceStatusRow({ devices }) {
  const byStatus = devices.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="cyber-card p-5 animate-fade-in">
      <div className="text-[11px] text-cyber-muted uppercase tracking-widest mb-4">Status Breakdown</div>
      <div className="space-y-3">
        {['SAFE', 'PROTECTED', 'VULNERABLE', 'INFECTED'].map(s => {
          const meta  = STATUS_META[s];
          const count = byStatus[s] ?? 0;
          const pct   = devices.length ? Math.round((count / devices.length) * 100) : 0;
          return (
            <div key={s}>
              <div className="flex justify-between text-[11px] mb-1">
                <span style={{ color: meta.color }}>{meta.emoji} {meta.label}</span>
                <span className="text-cyber-muted">{count} ({pct}%)</span>
              </div>
              <div className="risk-bar-bg">
                <div className="risk-bar-fill" style={{ width: `${pct}%`, background: meta.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecentActivity({ devices }) {
  const infected = devices.filter(d => d.status === 'INFECTED');
  const highRisk = devices.filter(d => d.riskScore > 70 && d.status !== 'INFECTED');

  const items = [
    ...infected.map(d => ({ text: `${d.name} is INFECTED`, color: '#ef4444' })),
    ...highRisk.map(d => ({ text: `${d.name} — risk score ${d.riskScore}`, color: '#f59e0b' })),
  ].slice(0, 6);

  return (
    <div className="cyber-card p-5 animate-fade-in">
      <div className="text-[11px] text-cyber-muted uppercase tracking-widest mb-4">
        <Activity size={12} className="inline mr-1.5" />Alert Feed
      </div>
      {items.length === 0 ? (
        <div className="text-[12px] text-cyber-muted py-4 text-center">No active threats detected</div>
      ) : (
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px]">
              <div className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
                   style={{ background: it.color }} />
              <span style={{ color: it.color }}>{it.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Network Health Donut Chart ─────────────────────────────────────────────
function NetworkHealthChart({ devices }) {
  const cx = 60, cy = 60, outerR = 50, innerR = 30;
  const total = devices.length;

  const SLICES = [
    { key: 'SAFE',       color: '#10b981' },
    { key: 'PROTECTED',  color: '#3b82f6' },
    { key: 'VULNERABLE', color: '#f59e0b' },
    { key: 'INFECTED',   color: '#ef4444' },
  ].map(s => ({ ...s, count: devices.filter(d => d.status === s.key).length }))
   .filter(s => s.count > 0);

  let angle = -90;
  const paths = SLICES.map(s => {
    const sweep = total > 0 ? (s.count / total) * 360 : 0;
    if (sweep < 0.5) return null;
    const startA = angle;
    const endA   = angle + sweep;
    angle = endA;
    if (sweep >= 359.9) {
      return { ...s, fullCircle: true };
    }
    return { ...s, path: donutSlice(cx, cy, outerR, innerR, startA, endA) };
  }).filter(Boolean);

  return (
    <div className="cyber-card p-5 animate-fade-in">
      <div className="text-[11px] text-cyber-muted uppercase tracking-widest mb-4">
        Network Health
      </div>
      {total === 0 ? (
        <div className="text-center text-cyber-muted text-[12px] py-6">No devices</div>
      ) : (
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 120 120" width="120" height="120" style={{ flexShrink: 0 }}>
            {paths.length === 0 && (
              <circle cx={cx} cy={cy} r={(outerR + innerR) / 2}
                      stroke="#10b981" strokeWidth={outerR - innerR}
                      fill="none" opacity="0.8" />
            )}
            {paths.map(p =>
              p.fullCircle ? (
                <circle key={p.key} cx={cx} cy={cy}
                        r={(outerR + innerR) / 2}
                        stroke={p.color} strokeWidth={outerR - innerR}
                        fill="none" opacity="0.85" />
              ) : (
                <path key={p.key} d={p.path} fill={p.color} opacity="0.85" />
              )
            )}
            <text x={cx} y={cy - 4} textAnchor="middle" fontSize="18"
                  fontWeight="bold" fill="#f1f5f9" fontFamily="monospace">
              {total}
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" fontSize="8"
                  fill="#64748b" fontFamily="monospace">TOTAL</text>
          </svg>

          <div className="space-y-2 flex-1 min-w-0">
            {SLICES.map(s => {
              const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
              return (
                <div key={s.key} className="flex items-center gap-2 text-[11px]">
                  <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: s.color }} />
                  <span className="text-cyber-muted truncate">{STATUS_META[s.key].label}</span>
                  <div className="flex-1 risk-bar-bg ml-1" style={{ height: 3 }}>
                    <div className="risk-bar-fill"
                         style={{ width: `${pct}%`, background: s.color, height: '100%' }} />
                  </div>
                  <span className="font-bold shrink-0 w-6 text-right" style={{ color: s.color }}>
                    {s.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Risk Bar Chart ─────────────────────────────────────────────────────────
function RiskBarChart({ devices }) {
  const top = [...devices].sort((a, b) => b.riskScore - a.riskScore).slice(0, 8);

  return (
    <div className="cyber-card p-5 animate-fade-in">
      <div className="text-[11px] text-cyber-muted uppercase tracking-widest mb-4">
        Device Risk Scores
      </div>
      {top.length === 0 ? (
        <div className="text-center text-cyber-muted text-[12px] py-6">No devices</div>
      ) : (
        <div className="space-y-2.5">
          {top.map(d => {
            const color =
              d.riskScore >= 75 ? '#ec4899' :
              d.riskScore >= 50 ? '#ef4444' :
              d.riskScore >= 25 ? '#f59e0b' : '#10b981';
            return (
              <div key={d.id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] text-slate-400 truncate max-w-[130px]" title={d.name}>
                    {d.name}
                  </span>
                  <span className="text-[11px] font-bold ml-2 shrink-0" style={{ color }}>
                    {d.riskScore}
                  </span>
                </div>
                <div className="risk-bar-bg" style={{ height: 4 }}>
                  <div className="risk-bar-fill"
                       style={{ width: `${d.riskScore}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Threat Intelligence Panel ──────────────────────────────────────────────
function ThreatIntelPanel({ devices, connections }) {
  const infected    = devices.filter(d => d.status === 'INFECTED');
  const vulnerable  = devices.filter(d => d.status === 'VULNERABLE');
  const mostExposed = [...devices]
    .filter(d => d.status !== 'PROTECTED')
    .sort((a, b) => b.riskScore - a.riskScore)[0] ?? null;

  // Entry point: infected node with most connections
  const entryPoint = infected.length > 0
    ? infected.reduce((best, d) => {
        const dc = connections.filter(c => c.from === d.id || c.to === d.id).length;
        const bc = connections.filter(c => c.from === best.id || c.to === best.id).length;
        return dc > bc ? d : best;
      }, infected[0])
    : null;

  // Open spread vectors: infected → non-infected, non-protected neighbors
  const spreadVectors = infected.reduce((count, d) => {
    return count + connections.filter(c => {
      const isEdge = c.from === d.id || c.to === d.id;
      if (!isEdge) return false;
      const otherId = c.from === d.id ? c.to : c.from;
      const other   = devices.find(x => x.id === otherId);
      return other && other.status !== 'INFECTED' && other.status !== 'PROTECTED';
    }).length;
  }, 0);

  const threatColor =
    infected.length === 0 ? '#10b981' :
    infected.length <= 2  ? '#f59e0b' :
    infected.length <= 5  ? '#ef4444' : '#ec4899';

  const rows = [
    { label: 'Active Infections',  value: infected.length,        color: infected.length > 0 ? '#ef4444' : '#10b981' },
    { label: 'Primary Vector',     value: entryPoint?.name ?? '—', color: '#ec4899' },
    { label: 'Most Exposed',       value: mostExposed?.name ?? '—',color: '#f59e0b' },
    { label: 'Vulnerable Targets', value: `${vulnerable.length}`,  color: '#f59e0b' },
    { label: 'Open Spread Paths',  value: `${spreadVectors}`,      color: spreadVectors > 0 ? '#ef4444' : '#10b981' },
  ];

  return (
    <div className="cyber-card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[11px] text-cyber-muted uppercase tracking-widest">
          <Target size={12} className="inline mr-1.5" />Threat Intelligence
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse"
               style={{ background: threatColor }} />
          <span className="text-[10px] font-bold" style={{ color: threatColor }}>
            {infected.length === 0 ? 'CLEAR' :
             infected.length <= 2  ? 'ACTIVE' :
             infected.length <= 5  ? 'ELEVATED' : 'CRITICAL'}
          </span>
        </div>
      </div>

      <div className="space-y-0">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-cyber-border/40">
            <span className="text-[11px] text-cyber-muted">{r.label}</span>
            <span className="text-[11px] font-semibold truncate max-w-[130px] ml-2 text-right"
                  style={{ color: r.color }}>
              {r.value}
            </span>
          </div>
        ))}
      </div>

      {/* Infection chain mini visualization */}
      {infected.length > 0 && (
        <div className="mt-4 pt-3 border-t border-cyber-border/40">
          <div className="text-[10px] text-cyber-muted uppercase tracking-widest mb-2">
            Infected Nodes
          </div>
          <div className="flex flex-wrap gap-1.5">
            {infected.slice(0, 6).map(d => (
              <span key={d.id}
                    className="text-[10px] px-2 py-0.5 rounded font-mono"
                    style={{ background: '#ef444418', border: '1px solid #ef444440', color: '#ef4444' }}>
                {d.name}
              </span>
            ))}
            {infected.length > 6 && (
              <span className="text-[10px] px-2 py-0.5 rounded text-cyber-muted"
                    style={{ border: '1px solid #1e293b' }}>
                +{infected.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard({ devices, connections }) {
  const report = generateReport(devices, connections);
  const { counts, avgRisk, riskLevel } = report;

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <div>
        <h1 className="text-lg font-bold text-slate-100 tracking-wide">Security Dashboard</h1>
        <p className="text-[11px] text-cyber-muted mt-0.5">
          Real-time network status — {counts.total} devices monitored
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Devices"  value={counts.total}      Icon={Server}        color="#06b6d4" />
        <StatCard label="Infected"       value={counts.infected}   Icon={AlertTriangle} color="#ef4444" borderGlow={counts.infected > 0} />
        <StatCard label="Protected"      value={counts.protected}  Icon={ShieldCheck}   color="#3b82f6" />
        <StatCard label="Safe"           value={counts.safe}       Icon={CheckCircle}   color="#10b981" />
        <StatCard label="Vulnerable"     value={counts.vulnerable} Icon={Zap}           color="#f59e0b" borderGlow={counts.vulnerable > 0} />
        <StatCard label="Connections"    value={connections.length} Icon={Wifi}         color="#8b5cf6" sub="network edges" />
      </div>

      {/* Monitoring row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ThreatMeter score={avgRisk} level={riskLevel} />
        <DeviceStatusRow devices={devices} />
        <RecentActivity devices={devices} />
      </div>

      {/* Charts + Threat Intel row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <NetworkHealthChart devices={devices} />
        <RiskBarChart devices={devices} />
        <ThreatIntelPanel devices={devices} connections={connections} />
      </div>

      {/* Device risk table */}
      <div className="cyber-card overflow-hidden animate-fade-in">
        <div className="px-5 py-4 border-b border-cyber-border flex items-center gap-2">
          <TrendingUp size={14} color="#06b6d4" />
          <span className="text-[11px] text-cyber-muted uppercase tracking-widest">
            Device Risk Overview
          </span>
          <span className="ml-auto text-[10px] text-slate-700">{report.devices.length} devices</span>
        </div>
        <div className="overflow-x-auto">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Type</th><th>Status</th>
                <th>Risk Score</th><th>Connections</th>
              </tr>
            </thead>
            <tbody>
              {report.devices
                .sort((a, b) => b.riskScore - a.riskScore)
                .map(d => {
                  const meta = STATUS_META[d.status];
                  return (
                    <tr key={d.id}>
                      <td className="text-cyber-muted">#{d.id}</td>
                      <td className="font-medium text-slate-200">{d.name}</td>
                      <td className="text-cyber-muted">{d.type}</td>
                      <td>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold"
                              style={{
                                background: `${meta.color}18`,
                                color: meta.color,
                                border: `1px solid ${meta.color}40`,
                              }}>
                          {meta.label}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="risk-bar-bg w-16">
                            <div className="risk-bar-fill" style={{
                              width: `${d.riskScore}%`,
                              background: d.riskScore > 70 ? '#ef4444' : d.riskScore > 40 ? '#f59e0b' : '#10b981',
                            }} />
                          </div>
                          <span className="text-[11px]">{d.riskScore}</span>
                        </div>
                      </td>
                      <td className="text-cyber-muted">
                        {connections.filter(c => c.from === d.id || c.to === d.id).length}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
