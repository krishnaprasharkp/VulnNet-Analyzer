import React, { useState, useEffect } from 'react';
import {
  Play, Pause, SkipForward, RotateCcw, Zap,
  AlertCircle, Terminal,
} from 'lucide-react';
import { STATUS_META } from '../utils/riskAnalysis.js';

function LogLine({ entry, index }) {
  const colors = {
    info:    '#64748b',
    warn:    '#f59e0b',
    danger:  '#ef4444',
    success: '#10b981',
    blocked: '#3b82f6',
    system:  '#8b5cf6',
  };
  return (
    <div className="log-entry flex items-start gap-2 py-1 border-b border-cyber-border/30"
         style={{ animationDelay: `${index * 0.03}s` }}>
      <span className="text-cyber-muted text-[10px] shrink-0 mt-0.5 w-16">{entry.time}</span>
      <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
            style={{ background: colors[entry.type] ?? '#64748b' }} />
      <span className="text-[11px] leading-relaxed" style={{ color: colors[entry.type] ?? '#94a3b8' }}>
        {entry.msg}
      </span>
    </div>
  );
}

// Mini sparkline of infection spread per step
function SpreadTimeline({ history, totalDevices }) {
  if (history.length < 2) return null;
  const maxH = 36;

  return (
    <div className="cyber-card p-4 shrink-0">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-cyber-muted uppercase tracking-widest">
          Infection Spread Timeline
        </span>
        <span className="text-[10px] text-cyber-muted">
          {history[history.length - 1]?.infected ?? 0}/{totalDevices} infected
        </span>
      </div>
      <div className="flex items-end gap-0.5" style={{ height: maxH }}>
        {history.map((s, i) => {
          const pct   = totalDevices > 0 ? s.infected / totalDevices : 0;
          const h     = Math.max(3, Math.round(pct * maxH));
          const color = pct > 0.6 ? '#ef4444' : pct > 0.3 ? '#f59e0b' : '#10b981';
          return (
            <div
              key={i}
              className="flex-1 rounded-sm transition-all"
              title={`Step ${s.step}: ${s.infected} infected`}
              style={{ height: h, background: color, minWidth: 4, opacity: 0.85 }}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[9px] text-cyber-muted mt-1.5">
        <span>Step 0</span>
        <span>Step {history.length}</span>
      </div>
    </div>
  );
}

export default function SimulationPanel({
  devices, connections,
  simStarted, simRunning, simStep, patientZero, simMode,
  onStart, onStep, onToggleRun, onReset,
  onSetPatientZero, onSetMode, onSetSpeed, simSpeed,
}) {
  const [log, setLog]             = useState([]);
  const [stepHistory, setStepHistory] = useState([]);

  const pushLog = (msg, type = 'info') => {
    const time = new Date().toLocaleTimeString('en', { hour12: false });
    setLog(prev => [{ msg, type, time }, ...prev].slice(0, 100));
  };

  // Track infection count per step (works for both auto and manual)
  useEffect(() => {
    if (!simStarted) return;
    const infectedCount = devices.filter(d => d.status === 'INFECTED').length;
    setStepHistory(prev => {
      if (prev.length > 0 && prev[prev.length - 1].step === simStep) return prev;
      return [...prev, { step: simStep, infected: infectedCount }];
    });
  }, [simStep, simStarted]);

  const handleStart = () => {
    if (!patientZero) { pushLog('Select a patient-zero device first.', 'warn'); return; }
    const dev = devices.find(d => d.id === patientZero);
    if (!dev) return;
    if (dev.status === 'PROTECTED') {
      pushLog(`${dev.name} is PROTECTED — cannot initiate infection.`, 'blocked');
      return;
    }
    pushLog(`▶ Simulation started — patient zero: ${dev.name}`, 'system');
    pushLog(`Mode: ${simMode === 'bfs' ? 'BFS Spread' : 'Risk-Based Attack'}`, 'system');
    onStart(patientZero, simMode);
  };

  const handleStep = () => {
    const result = onStep();
    if (!result) return;
    if (result.length === 0) {
      pushLog('◼ Halted — no further spread possible.', 'success');
    } else {
      result.forEach(id => {
        const dev = devices.find(d => d.id === id);
        pushLog(`✕ ${dev?.name ?? `Device #${id}`} infected (step ${simStep + 1})`, 'danger');
      });
    }
  };

  const handleReset = () => {
    pushLog('↺ Simulation reset.', 'system');
    setLog([]);
    setStepHistory([]);
    onReset();
  };

  const infectedCount  = devices.filter(d => d.status === 'INFECTED').length;
  const protectedCount = devices.filter(d => d.status === 'PROTECTED').length;
  const infectionPct   = devices.length ? Math.round((infectedCount / devices.length) * 100) : 0;

  const canStep = simStarted && infectedCount < devices.length;
  const canRun  = simStarted && canStep;

  return (
    <div className="p-6 h-full flex flex-col gap-4 overflow-y-auto">
      <div>
        <h1 className="text-lg font-bold text-slate-100 tracking-wide">Malware Simulation</h1>
        <p className="text-[11px] text-cyber-muted mt-0.5">
          JavaScript port of the C++ BFS/risk-based spread engine
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Configuration */}
        <div className="cyber-card p-5 space-y-5">
          <div className="text-[11px] text-cyber-muted uppercase tracking-widest">
            <Terminal size={12} className="inline mr-1.5" />Configuration
          </div>

          {/* Patient zero selector */}
          <div>
            <label className="block text-[11px] text-cyber-muted mb-1.5 uppercase tracking-wider">
              Patient Zero
            </label>
            <select
              className="cyber-select w-full"
              value={patientZero ?? ''}
              onChange={e => onSetPatientZero(Number(e.target.value) || null)}
              disabled={simStarted}
            >
              <option value="">— Select device —</option>
              {devices
                .filter(d => d.status !== 'PROTECTED')
                .map(d => (
                  <option key={d.id} value={d.id}>
                    #{d.id} {d.name} ({d.type})
                  </option>
                ))}
            </select>
          </div>

          {/* Spread mode */}
          <div>
            <label className="block text-[11px] text-cyber-muted mb-1.5 uppercase tracking-wider">
              Spread Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'bfs',  label: 'BFS Spread',   desc: 'Uniform wave expansion' },
                { id: 'risk', label: 'Risk Attack',   desc: 'Targets highest-risk neighbor' },
              ].map(m => (
                <button
                  key={m.id}
                  className="p-3 rounded-lg border text-left transition-all"
                  disabled={simStarted}
                  style={simMode === m.id ? {
                    background: 'rgba(6,182,212,0.08)',
                    borderColor: 'rgba(6,182,212,0.35)',
                    color: '#06b6d4',
                  } : {
                    background: '#1e293b',
                    borderColor: '#334155',
                    color: '#64748b',
                  }}
                  onClick={() => onSetMode(m.id)}
                >
                  <div className="text-[11px] font-semibold mb-0.5">{m.label}</div>
                  <div className="text-[10px] opacity-70">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Speed */}
          <div>
            <label className="block text-[11px] text-cyber-muted mb-1.5 uppercase tracking-wider">
              Auto-Step Speed — {simSpeed}ms
            </label>
            <input
              type="range" min="200" max="2000" step="100"
              value={simSpeed}
              onChange={e => onSetSpeed(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-cyber-muted mt-1">
              <span>Fast (0.2s)</span><span>Slow (2s)</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button className="btn btn-red" onClick={handleStart} disabled={simStarted || !patientZero}>
              <Zap size={12} /> Start
            </button>
            <button className="btn btn-cyan" onClick={handleStep} disabled={!canStep}>
              <SkipForward size={12} /> Step
            </button>
            <button className={`btn ${simRunning ? 'btn-ghost' : 'btn-green'}`}
                    onClick={onToggleRun} disabled={!canRun}>
              {simRunning ? <Pause size={12} /> : <Play size={12} />}
              {simRunning ? 'Pause' : 'Run'}
            </button>
            <button className="btn btn-ghost" onClick={handleReset}>
              <RotateCcw size={12} /> Reset
            </button>
          </div>
        </div>

        {/* Live stats */}
        <div className="cyber-card p-5 space-y-4">
          <div className="text-[11px] text-cyber-muted uppercase tracking-widest">
            <AlertCircle size={12} className="inline mr-1.5" />Live Stats
          </div>

          {[
            { label: 'Simulation Step',    value: simStep,              color: '#06b6d4' },
            { label: 'Infected Devices',   value: infectedCount,        color: '#ef4444' },
            { label: 'Protected (immune)', value: protectedCount,       color: '#3b82f6' },
            { label: 'Infection Rate',     value: `${infectionPct}%`,   color: infectionPct > 50 ? '#ef4444' : '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between py-2 border-b border-cyber-border/40">
              <span className="text-[12px] text-cyber-muted">{s.label}</span>
              <span className="text-base font-bold" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}

          {/* Spread progress bar */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-cyber-muted">Spread Progress</span>
              <span className="text-red-400">{infectionPct}%</span>
            </div>
            <div className="risk-bar-bg" style={{ height: 8 }}>
              <div className="threat-bar-fill"
                   style={{ width: `${infectionPct}%`, background: infectionPct > 50 ? '#ef4444' : '#f59e0b' }} />
            </div>
          </div>

          {/* Status mini grid */}
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(STATUS_META).map(([key, meta]) => {
              const count = devices.filter(d => d.status === key).length;
              return (
                <div key={key} className="text-center p-2 rounded-lg"
                     style={{ background: `${meta.color}10`, border: `1px solid ${meta.color}30` }}>
                  <div className="text-base font-bold" style={{ color: meta.color }}>{count}</div>
                  <div className="text-[9px] mt-0.5" style={{ color: meta.color }}>{meta.label}</div>
                </div>
              );
            })}
          </div>

          {/* Running indicator */}
          <div className="flex items-center gap-2 pt-1">
            <div className={`w-2 h-2 rounded-full ${simRunning ? 'animate-pulse bg-red-500' : simStarted ? 'bg-yellow-500' : 'bg-slate-700'}`} />
            <span className="text-[11px] text-cyber-muted">
              {simRunning
                ? 'Simulation running…'
                : simStarted
                  ? 'Paused / manual stepping'
                  : 'Idle — configure above'}
            </span>
          </div>
        </div>
      </div>

      {/* Spread timeline chart */}
      <SpreadTimeline history={stepHistory} totalDevices={devices.length} />

      {/* Event log */}
      <div className="cyber-card flex-1 flex flex-col overflow-hidden" style={{ minHeight: 200 }}>
        <div className="px-4 py-3 border-b border-cyber-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Terminal size={12} color="#06b6d4" />
            <span className="text-[11px] text-cyber-muted uppercase tracking-widest">Event Log</span>
            {log.length > 0 && (
              <span className="text-[10px] text-slate-600 ml-1">({log.length})</span>
            )}
          </div>
          <button className="btn btn-ghost text-[10px] py-1 px-2" onClick={() => setLog([])}>
            Clear
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 font-mono"
             style={{ maxHeight: 240 }}>
          {log.length === 0 ? (
            <div className="text-[11px] text-cyber-muted py-4 text-center">
              Events will appear here once the simulation starts
            </div>
          ) : (
            log.map((entry, i) => <LogLine key={i} entry={entry} index={i} />)
          )}
        </div>
      </div>
    </div>
  );
}
