import React, { useState } from 'react';
import {
  Plus, Trash2, Shield, AlertTriangle,
  Link, Unlink, Server,
} from 'lucide-react';
import { STATUS_META } from '../utils/riskAnalysis.js';

const TYPES = ['Router', 'Server', 'PC', 'IoT'];

function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.SAFE;
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-semibold"
          style={{ background: `${meta.color}1a`, color: meta.color, border: `1px solid ${meta.color}44` }}>
      {meta.emoji} {meta.label}
    </span>
  );
}

export default function DeviceManager({
  devices, connections,
  onAddDevice, onRemoveDevice, onMarkProtected, onMarkVulnerable,
  onAddConnection, onRemoveConnection,
}) {
  const [newName, setNewName]       = useState('');
  const [newType, setNewType]       = useState('PC');
  const [connFrom, setConnFrom]     = useState('');
  const [connTo, setConnTo]         = useState('');
  const [activeTab, setActiveTab]   = useState('devices');

  const handleAddDevice = () => {
    if (!newName.trim()) return;
    onAddDevice(newName.trim(), newType);
    setNewName('');
  };

  const handleAddConn = () => {
    const from = Number(connFrom), to = Number(connTo);
    if (!from || !to || from === to) return;
    onAddConnection(from, to);
    setConnFrom(''); setConnTo('');
  };

  const connectionExists = (a, b) =>
    connections.some(c => (c.from === a && c.to === b) || (c.from === b && c.to === a));

  return (
    <div className="p-6 h-full flex flex-col gap-5 overflow-y-auto">
      <div>
        <h1 className="text-lg font-bold text-slate-100 tracking-wide">Device Manager</h1>
        <p className="text-[11px] text-cyber-muted mt-0.5">
          {devices.length} devices · {connections.length} connections
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-cyber-surface2 rounded-lg p-1 w-fit">
        {[
          { id: 'devices',     label: 'Devices',     Icon: Server },
          { id: 'connections', label: 'Connections', Icon: Link },
        ].map(t => (
          <button key={t.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all"
                  style={activeTab === t.id ? {
                    background: 'rgba(6,182,212,0.15)',
                    color: '#06b6d4',
                    border: '1px solid rgba(6,182,212,0.3)',
                  } : { color: '#64748b', border: '1px solid transparent' }}
                  onClick={() => setActiveTab(t.id)}>
            <t.Icon size={12} /> {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'devices' && (
        <>
          {/* Add device form */}
          <div className="cyber-card p-5">
            <div className="text-[11px] text-cyber-muted uppercase tracking-widest mb-4">
              <Plus size={12} className="inline mr-1.5" />Add Device
            </div>
            <div className="flex gap-3 flex-wrap">
              <input
                className="cyber-input flex-1 min-w-40"
                placeholder="Device name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddDevice()}
              />
              <select
                className="cyber-select"
                value={newType}
                onChange={e => setNewType(e.target.value)}
              >
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button className="btn btn-cyan" onClick={handleAddDevice} disabled={!newName.trim()}>
                <Plus size={13} /> Add
              </button>
            </div>
          </div>

          {/* Device table */}
          <div className="cyber-card flex-1 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="cyber-table">
                <thead>
                  <tr>
                    <th>#</th><th>Name</th><th>Type</th><th>Status</th>
                    <th>Risk</th><th>Links</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-cyber-muted py-8">
                        No devices yet — load the demo or add one above
                      </td>
                    </tr>
                  ) : devices.map(d => {
                    const links = connections.filter(c => c.from === d.id || c.to === d.id).length;
                    return (
                      <tr key={d.id}>
                        <td className="text-cyber-muted">#{d.id}</td>
                        <td className="font-medium text-slate-200">{d.name}</td>
                        <td>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {d.type}
                          </span>
                        </td>
                        <td><StatusBadge status={d.status} /></td>
                        <td>
                          <span className={`text-[12px] font-semibold ${
                            d.riskScore > 70 ? 'text-red-400' :
                            d.riskScore > 40 ? 'text-yellow-400' : 'text-green-400'
                          }`}>
                            {d.riskScore}
                          </span>
                        </td>
                        <td className="text-cyber-muted">{links}</td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <button
                              title="Mark Protected"
                              className="btn btn-blue py-1 px-2"
                              onClick={() => onMarkProtected(d.id)}
                              disabled={d.status === 'PROTECTED'}
                            >
                              <Shield size={11} />
                            </button>
                            <button
                              title="Mark Vulnerable"
                              className="btn btn-ghost py-1 px-2"
                              onClick={() => onMarkVulnerable(d.id)}
                              disabled={d.status === 'PROTECTED' || d.status === 'INFECTED'}
                            >
                              <AlertTriangle size={11} style={{ color: '#f59e0b' }} />
                            </button>
                            <button
                              title="Remove Device"
                              className="btn btn-red py-1 px-2"
                              onClick={() => onRemoveDevice(d.id)}
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'connections' && (
        <>
          {/* Add connection form */}
          <div className="cyber-card p-5">
            <div className="text-[11px] text-cyber-muted uppercase tracking-widest mb-4">
              <Link size={12} className="inline mr-1.5" />Add Connection
            </div>
            <div className="flex gap-3 flex-wrap items-center">
              <select className="cyber-select flex-1"
                      value={connFrom} onChange={e => setConnFrom(e.target.value)}>
                <option value="">— From device —</option>
                {devices.map(d => (
                  <option key={d.id} value={d.id}>#{d.id} {d.name}</option>
                ))}
              </select>
              <span className="text-cyber-muted">→</span>
              <select className="cyber-select flex-1"
                      value={connTo} onChange={e => setConnTo(e.target.value)}>
                <option value="">— To device —</option>
                {devices
                  .filter(d => d.id !== Number(connFrom))
                  .map(d => (
                    <option key={d.id} value={d.id}>#{d.id} {d.name}</option>
                  ))}
              </select>
              <button
                className="btn btn-cyan"
                onClick={handleAddConn}
                disabled={!connFrom || !connTo || connectionExists(Number(connFrom), Number(connTo))}
              >
                <Link size={13} /> Connect
              </button>
            </div>
          </div>

          {/* Connections table */}
          <div className="cyber-card flex-1 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="cyber-table">
                <thead>
                  <tr>
                    <th>#</th><th>From</th><th>To</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {connections.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-cyber-muted py-8">
                        No connections yet
                      </td>
                    </tr>
                  ) : connections.map((c, i) => {
                    const devA = devices.find(d => d.id === c.from);
                    const devB = devices.find(d => d.id === c.to);
                    const isInfected = devA?.status === 'INFECTED' && devB?.status === 'INFECTED';
                    return (
                      <tr key={i}>
                        <td className="text-cyber-muted">{i + 1}</td>
                        <td>
                          <span className="font-medium" style={{ color: devA ? STATUS_META[devA.status]?.color : '#64748b' }}>
                            {devA ? `#${devA.id} ${devA.name}` : `#${c.from} (removed)`}
                          </span>
                        </td>
                        <td>
                          <span className="font-medium" style={{ color: devB ? STATUS_META[devB.status]?.color : '#64748b' }}>
                            {devB ? `#${devB.id} ${devB.name}` : `#${c.to} (removed)`}
                          </span>
                        </td>
                        <td>
                          {isInfected ? (
                            <span className="text-[10px] text-red-400 border border-red-400/30 bg-red-400/10 px-2 py-0.5 rounded">
                              INFECTED CHANNEL
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Active</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-red py-1 px-2"
                            title="Remove connection"
                            onClick={() => onRemoveConnection(c.from, c.to)}
                          >
                            <Unlink size={11} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
