import React from 'react';
import {
  FileText, AlertTriangle, ShieldCheck, TrendingUp,
  CheckCircle, Download,
} from 'lucide-react';
import { generateReport, RISK_COLORS, STATUS_META } from '../utils/riskAnalysis.js';

function RiskBadge({ level }) {
  const rc = RISK_COLORS[level] ?? RISK_COLORS.LOW;
  return (
    <span className="text-sm font-bold px-3 py-1 rounded-lg"
          style={{ background: rc.bg, border: `1px solid ${rc.border}`, color: rc.text }}>
      {level}
    </span>
  );
}

function SummaryCard({ label, value, color, Icon }) {
  return (
    <div className="cyber-card p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
           style={{ background: `${color}1a`, border: `1px solid ${color}33` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <div className="text-[10px] text-cyber-muted uppercase tracking-widest">{label}</div>
        <div className="text-xl font-bold mt-0.5" style={{ color }}>{value}</div>
      </div>
    </div>
  );
}

export default function SecurityReport({ devices, connections }) {
  const report = generateReport(devices, connections);
  const { counts, avgRisk, riskLevel, highRiskDevices, mostVulnerable, infectionPct, protectedBlocked, timestamp, devices: scored } = report;

  const handleExport = () => {
    const lines = [
      '============================================================',
      '        VULNNET ANALYZER — SECURITY REPORT (Frontend)',
      '============================================================',
      `Timestamp      : ${timestamp}`,
      `Total Devices  : ${counts.total}`,
      `Infected       : ${counts.infected}`,
      `Safe           : ${counts.safe}`,
      `Protected      : ${counts.protected}`,
      `Vulnerable     : ${counts.vulnerable}`,
      `Network Risk   : ${avgRisk} / 100`,
      `Risk Level     : ${riskLevel}`,
      `Infection %    : ${infectionPct}%`,
      `Protected Blocked: ${protectedBlocked}`,
      '------------------------------------------------------------',
      ...scored
        .sort((a, b) => b.riskScore - a.riskScore)
        .map(d =>
          `  [${String(d.id).padStart(3)}] ${d.name.padEnd(22)} | ${d.type.padEnd(8)} | ${d.status.padEnd(10)} | Risk: ${d.riskScore}`
        ),
      '============================================================',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `vulnnet_report_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 h-full flex flex-col gap-5 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-100 tracking-wide">Security Report</h1>
          <p className="text-[11px] text-cyber-muted mt-0.5">Generated: {timestamp}</p>
        </div>
        <button className="btn btn-cyan" onClick={handleExport}>
          <Download size={13} /> Export .txt
        </button>
      </div>

      {/* Risk headline */}
      <div className="cyber-card p-5 flex items-center gap-4 animate-fade-in"
           style={{ borderColor: (RISK_COLORS[riskLevel] ?? RISK_COLORS.LOW).border }}>
        <div>
          <div className="text-[11px] text-cyber-muted mb-1">Overall Network Risk</div>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold" style={{ color: (RISK_COLORS[riskLevel] ?? RISK_COLORS.LOW).text }}>
              {avgRisk}
            </span>
            <span className="text-cyber-muted text-lg">/ 100</span>
            <RiskBadge level={riskLevel} />
          </div>
        </div>
        <div className="ml-auto flex-1 max-w-64">
          <div className="risk-bar-bg" style={{ height: 10 }}>
            <div className="risk-bar-fill" style={{
              width: `${avgRisk}%`,
              background: (RISK_COLORS[riskLevel] ?? RISK_COLORS.LOW).text,
            }} />
          </div>
          <div className="flex justify-between text-[10px] text-cyber-muted mt-1">
            <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard label="Infection Rate"     value={`${infectionPct}%`}       color="#ef4444" Icon={AlertTriangle} />
        <SummaryCard label="Protected Blocked"  value={protectedBlocked}         color="#3b82f6" Icon={ShieldCheck} />
        <SummaryCard label="High-Risk Devices"  value={highRiskDevices.length}   color="#f59e0b" Icon={TrendingUp} />
        <SummaryCard label="Safe Devices"       value={counts.safe}              color="#10b981" Icon={CheckCircle} />
      </div>

      {/* Two-column: Most Vulnerable + High Risk list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Most vulnerable device */}
        <div className="cyber-card p-5">
          <div className="text-[11px] text-cyber-muted uppercase tracking-widest mb-4">
            Most Vulnerable Device
          </div>
          {mostVulnerable ? (
            <div className="space-y-3">
              <div className="text-base font-bold text-slate-100">{mostVulnerable.name}</div>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                {[
                  { label: 'Device ID', value: `#${mostVulnerable.id}` },
                  { label: 'Type', value: mostVulnerable.type },
                  { label: 'Status', value: mostVulnerable.status },
                  { label: 'Risk Score', value: mostVulnerable.riskScore },
                ].map(item => (
                  <div key={item.label}>
                    <div className="text-cyber-muted">{item.label}</div>
                    <div className="font-semibold text-slate-300 mt-0.5">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-[11px] text-cyber-muted mb-1">Risk Score</div>
                <div className="risk-bar-bg">
                  <div className="risk-bar-fill" style={{
                    width: `${mostVulnerable.riskScore}%`,
                    background: mostVulnerable.riskScore > 70 ? '#ef4444' : '#f59e0b',
                  }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-cyber-muted text-[12px] py-4 text-center">No high-risk devices</div>
          )}
        </div>

        {/* High risk list */}
        <div className="cyber-card p-5">
          <div className="text-[11px] text-cyber-muted uppercase tracking-widest mb-4">
            High-Risk Devices (score &gt; 70)
          </div>
          {highRiskDevices.length === 0 ? (
            <div className="text-cyber-muted text-[12px] py-4 text-center flex flex-col items-center gap-2">
              <CheckCircle size={24} color="#10b981" />
              No critical-risk devices detected
            </div>
          ) : (
            <div className="space-y-2">
              {highRiskDevices.map(d => {
                const meta = STATUS_META[d.status];
                return (
                  <div key={d.id} className="flex items-center gap-3 p-2 rounded-lg bg-cyber-surface2">
                    <div className="w-2 h-2 rounded-full shrink-0"
                         style={{ background: d.riskScore > 85 ? '#ec4899' : '#ef4444' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-slate-200 truncate">{d.name}</div>
                      <div className="text-[10px] text-cyber-muted">{d.type}</div>
                    </div>
                    <div className="shrink-0">
                      <span className="text-[10px] font-bold" style={{ color: meta.color }}>
                        {meta.label}
                      </span>
                    </div>
                    <div className="shrink-0 text-[13px] font-bold text-red-400">{d.riskScore}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Full device table */}
      <div className="cyber-card overflow-hidden">
        <div className="px-5 py-3 border-b border-cyber-border flex items-center gap-2">
          <FileText size={13} color="#06b6d4" />
          <span className="text-[11px] text-cyber-muted uppercase tracking-widest">
            Complete Device Report
          </span>
          <span className="ml-auto text-[10px] text-cyber-muted">{scored.length} devices</span>
        </div>
        <div className="overflow-x-auto">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Type</th><th>Status</th>
                <th>Risk Score</th><th>Risk Level</th><th>Connections</th>
              </tr>
            </thead>
            <tbody>
              {scored
                .sort((a, b) => b.riskScore - a.riskScore)
                .map(d => {
                  const meta = STATUS_META[d.status];
                  const connCount = connections.filter(c => c.from === d.id || c.to === d.id).length;
                  const devRiskLabel =
                    d.riskScore >= 75 ? 'CRITICAL' :
                    d.riskScore >= 50 ? 'HIGH' :
                    d.riskScore >= 25 ? 'MEDIUM' : 'LOW';
                  const rc = RISK_COLORS[devRiskLabel];
                  return (
                    <tr key={d.id}>
                      <td className="text-cyber-muted">#{d.id}</td>
                      <td className="font-medium text-slate-200">{d.name}</td>
                      <td className="text-cyber-muted">{d.type}</td>
                      <td>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded"
                              style={{ background: `${meta.color}1a`, color: meta.color, border: `1px solid ${meta.color}33` }}>
                          {meta.emoji} {meta.label}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="risk-bar-bg w-14">
                            <div className="risk-bar-fill" style={{
                              width: `${d.riskScore}%`,
                              background: d.riskScore > 70 ? '#ef4444' : d.riskScore > 40 ? '#f59e0b' : '#10b981',
                            }} />
                          </div>
                          <span className="text-[11px] font-semibold text-slate-300">{d.riskScore}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                              style={{ background: rc.bg, color: rc.text, border: `1px solid ${rc.border}` }}>
                          {devRiskLabel}
                        </span>
                      </td>
                      <td className="text-cyber-muted">{connCount}</td>
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
