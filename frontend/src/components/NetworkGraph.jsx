import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, ZoomIn, ZoomOut, Maximize2, Move } from 'lucide-react';
import { STATUS_META } from '../utils/riskAnalysis.js';

const W = 860;
const H = 520;

const TYPE_SYMBOL = { Router: '⬡', Server: '▪', PC: '◈', IoT: '◉' };

const STATUS_GLOW = {
  SAFE:       { stroke: '#10b981', fill: '#0f2e22', ring: '#10b98133' },
  INFECTED:   { stroke: '#ef4444', fill: '#2e0f0f', ring: '#ef444444' },
  PROTECTED:  { stroke: '#3b82f6', fill: '#0f1e3a', ring: '#3b82f633' },
  VULNERABLE: { stroke: '#f59e0b', fill: '#2e220f', ring: '#f59e0b33' },
};

function runForceLayout(devices, connections) {
  if (devices.length === 0) return {};

  const pos = {}, vel = {};
  devices.forEach((d, i) => {
    const angle = (i / devices.length) * 2 * Math.PI - Math.PI / 2;
    const r = Math.min(W, H) * 0.3;
    pos[d.id] = { x: W / 2 + r * Math.cos(angle), y: H / 2 + r * Math.sin(angle) };
    vel[d.id] = { vx: 0, vy: 0 };
  });

  const ids = devices.map(d => d.id);

  for (let iter = 0; iter < 320; iter++) {
    const forces = {};
    ids.forEach(id => { forces[id] = { fx: 0, fy: 0 }; });

    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i], b = ids[j];
        const dx = pos[b].x - pos[a].x;
        const dy = pos[b].y - pos[a].y;
        const d2 = dx * dx + dy * dy + 1;
        const dist = Math.sqrt(d2);
        const f = 5500 / d2;
        forces[a].fx -= (f * dx) / dist;
        forces[a].fy -= (f * dy) / dist;
        forces[b].fx += (f * dx) / dist;
        forces[b].fy += (f * dy) / dist;
      }
    }

    connections.forEach(({ from, to }) => {
      if (!pos[from] || !pos[to]) return;
      const dx = pos[to].x - pos[from].x;
      const dy = pos[to].y - pos[from].y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
      const f = 0.035 * (dist - 130);
      forces[from].fx += (f * dx) / dist;
      forces[from].fy += (f * dy) / dist;
      forces[to].fx -= (f * dx) / dist;
      forces[to].fy -= (f * dy) / dist;
    });

    ids.forEach(id => {
      forces[id].fx += 0.012 * (W / 2 - pos[id].x);
      forces[id].fy += 0.012 * (H / 2 - pos[id].y);
    });

    const damping = iter < 120 ? 0.87 : 0.92;
    ids.forEach(id => {
      vel[id].vx = (vel[id].vx + forces[id].fx) * damping;
      vel[id].vy = (vel[id].vy + forces[id].fy) * damping;
      pos[id].x = Math.max(55, Math.min(W - 55, pos[id].x + vel[id].vx));
      pos[id].y = Math.max(55, Math.min(H - 55, pos[id].y + vel[id].vy));
    });
  }

  return pos;
}

function NodeTooltip({ device, connections, x, y }) {
  if (!device) return null;
  const meta      = STATUS_META[device.status];
  const connCount = connections.filter(c => c.from === device.id || c.to === device.id).length;

  const tipX = x + 20;
  const tipY = y - 10;

  return (
    <foreignObject x={tipX} y={tipY} width="170" height="110">
      <div xmlns="http://www.w3.org/1999/xhtml"
           style={{
             background: '#0c1624',
             border: `1px solid ${meta.color}44`,
             borderRadius: 8,
             padding: '8px 10px',
             fontSize: 11,
             fontFamily: '"JetBrains Mono", monospace',
             pointerEvents: 'none',
             boxShadow: `0 0 20px ${meta.color}18`,
           }}>
        <div style={{ color: meta.color, fontWeight: 700, marginBottom: 5 }}>
          {TYPE_SYMBOL[device.type] ?? '●'} {device.name}
        </div>
        <div style={{ color: '#475569', lineHeight: 1.7 }}>
          <div>Type: <span style={{ color: '#94a3b8' }}>{device.type}</span></div>
          <div>Status: <span style={{ color: meta.color }}>{meta.label}</span></div>
          <div>Risk: <span style={{ color: device.riskScore > 70 ? '#ef4444' : '#94a3b8' }}>{device.riskScore}</span></div>
          <div>Links: <span style={{ color: '#94a3b8' }}>{connCount}</span></div>
        </div>
      </div>
    </foreignObject>
  );
}

export default function NetworkGraph({ devices, connections, selectedDevice, onDeviceClick, newlyInfected }) {
  const [positions, setPositions]   = useState({});
  const [hovered, setHovered]       = useState(null);
  const [zoom, setZoom]             = useState(1);
  const lastTopologyRef             = useRef('');
  const flashTimers                 = useRef({});
  const [flashSet, setFlashSet]     = useState(new Set());

  // Drag state
  const svgRef       = useRef(null);
  const dragRef      = useRef(null);
  const dragMovedRef = useRef(false);

  // Recompute layout only when topology changes
  useEffect(() => {
    const ids   = devices.map(d => d.id).sort().join(',');
    const conns = connections
      .map(c => `${Math.min(c.from, c.to)}-${Math.max(c.from, c.to)}`)
      .sort().join(',');
    const key = `${ids}|${conns}`;
    if (key === lastTopologyRef.current) return;
    lastTopologyRef.current = key;
    setPositions(runForceLayout(devices, connections));
  }, [devices, connections]);

  // Flash animation for newly infected nodes
  useEffect(() => {
    if (!newlyInfected || newlyInfected.length === 0) return;
    setFlashSet(prev => {
      const next = new Set(prev);
      newlyInfected.forEach(id => next.add(id));
      return next;
    });
    newlyInfected.forEach(id => {
      clearTimeout(flashTimers.current[id]);
      flashTimers.current[id] = setTimeout(() => {
        setFlashSet(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 1200);
    });
  }, [newlyInfected]);

  const relayout = useCallback(() => {
    lastTopologyRef.current = '';
    setPositions(runForceLayout(devices, connections));
  }, [devices, connections]);

  // Convert screen coords → graph space
  function screenToGraph(clientX, clientY) {
    const el = svgRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const svgX = (clientX - rect.left) * (W / rect.width);
    const svgY = (clientY - rect.top)  * (H / rect.height);
    return {
      x: (svgX - W / 2) / zoom + W / 2,
      y: (svgY - H / 2) / zoom + H / 2,
    };
  }

  function handleNodeMouseDown(e, nodeId) {
    e.preventDefault();
    e.stopPropagation();
    dragMovedRef.current = false;
    const { x, y } = screenToGraph(e.clientX, e.clientY);
    const pos = positions[nodeId] ?? { x: W / 2, y: H / 2 };
    dragRef.current = { id: nodeId, offsetX: pos.x - x, offsetY: pos.y - y };
  }

  function handleSVGMouseMove(e) {
    if (!dragRef.current) return;
    dragMovedRef.current = true;
    const { id, offsetX, offsetY } = dragRef.current;
    const { x, y } = screenToGraph(e.clientX, e.clientY);
    setPositions(prev => ({
      ...prev,
      [id]: {
        x: Math.max(30, Math.min(W - 30, x + offsetX)),
        y: Math.max(30, Math.min(H - 30, y + offsetY)),
      },
    }));
  }

  function handleSVGMouseUp() {
    dragRef.current = null;
  }

  function handleNodeClick(e, d) {
    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }
    onDeviceClick(d);
  }

  const infectedSet = new Set(devices.filter(d => d.status === 'INFECTED').map(d => d.id));

  return (
    <div className="p-6 h-full flex flex-col gap-4 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-100 tracking-wide">Network Graph</h1>
          <p className="text-[11px] text-cyber-muted mt-0.5">
            {devices.length} nodes · {connections.length} edges · drag nodes to reposition
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost" title="Zoom in"
                  onClick={() => setZoom(z => Math.min(z + 0.15, 2.5))}>
            <ZoomIn size={13} />
          </button>
          <button className="btn btn-ghost" title="Zoom out"
                  onClick={() => setZoom(z => Math.max(z - 0.15, 0.4))}>
            <ZoomOut size={13} />
          </button>
          <button className="btn btn-ghost" title="Reset zoom"
                  onClick={() => setZoom(1)}>
            <Maximize2 size={13} />
          </button>
          <button className="btn btn-cyan" onClick={relayout}>
            <RefreshCw size={13} /> Relayout
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 shrink-0">
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <div key={key} className="flex items-center gap-1.5 text-[11px]">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: meta.color }} />
            <span style={{ color: meta.color }}>{meta.label}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-cyber-muted">
          <Move size={11} />
          <span>Drag nodes · Click to select · Hover for info</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="cyber-card flex-1 overflow-hidden relative"
           style={{ background: '#020b13' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height="100%"
          style={{
            display: 'block',
            cursor: dragRef.current ? 'grabbing' : 'default',
          }}
          onMouseMove={handleSVGMouseMove}
          onMouseUp={handleSVGMouseUp}
          onMouseLeave={handleSVGMouseUp}
        >
          <defs>
            {['SAFE', 'INFECTED', 'PROTECTED', 'VULNERABLE'].map(s => {
              const c = STATUS_GLOW[s].stroke;
              return (
                <filter key={s} id={`glow-${s}`} x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              );
            })}
          </defs>

          <g transform={`translate(${W / 2}, ${H / 2}) scale(${zoom}) translate(${-W / 2}, ${-H / 2})`}>
            {/* Edges */}
            {connections.map((c, i) => {
              const pa = positions[c.from];
              const pb = positions[c.to];
              if (!pa || !pb) return null;

              const fromInf = infectedSet.has(c.from);
              const toInf   = infectedSet.has(c.to);
              const isActive = fromInf || toInf;
              const bothInf  = fromInf && toInf;

              const strokeColor = bothInf  ? '#ef444466' :
                                  isActive ? '#ef444433' : '#1e293b';
              const strokeW = bothInf ? 2.5 : isActive ? 1.5 : 1;
              const pathStr = `M ${pa.x} ${pa.y} L ${pb.x} ${pb.y}`;

              // Deterministic speed based on node IDs
              const dur = `${(1.0 + ((c.from + c.to) % 7) * 0.18).toFixed(2)}s`;

              return (
                <g key={`${c.from}-${c.to}`}>
                  <line
                    x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                    stroke={strokeColor}
                    strokeWidth={strokeW}
                    strokeDasharray={!isActive ? '4 3' : '0'}
                  />
                  {/* Animated infection dot */}
                  {isActive && (
                    <circle r="2.5" fill="#ef4444" opacity="0.8">
                      <animateMotion dur={dur} repeatCount="indefinite"
                        path={pathStr} />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {devices.map(d => {
              const p = positions[d.id];
              if (!p) return null;
              const sg         = STATUS_GLOW[d.status] ?? STATUS_GLOW.SAFE;
              const isSelected = selectedDevice?.id === d.id;
              const isHovered  = hovered === d.id;
              const isFlashing = flashSet.has(d.id);
              const isInfected = d.status === 'INFECTED';

              return (
                <g
                  key={d.id}
                  transform={`translate(${p.x}, ${p.y})`}
                  style={{ cursor: 'grab' }}
                  onMouseDown={e => handleNodeMouseDown(e, d.id)}
                  onMouseEnter={() => setHovered(d.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={e => handleNodeClick(e, d)}
                >
                  {/* Infection flash ring */}
                  {isFlashing && (
                    <circle r="34" fill={sg.ring} className="node-just-infected" />
                  )}

                  {/* Pulsing ring for infected nodes */}
                  {isInfected && (
                    <circle r="24" fill="none" stroke="#ef4444" strokeWidth="1.5"
                            className="node-infected-ring" />
                  )}

                  {/* Pulsing glow for vulnerable */}
                  {d.status === 'VULNERABLE' && (
                    <circle r="22" fill="none" stroke="#f59e0b" strokeWidth="1"
                            opacity="0.4" className="node-infected-ring" />
                  )}

                  {/* Selection ring */}
                  {isSelected && (
                    <circle r="25" fill="none" stroke="#06b6d4" strokeWidth="2.5" opacity="0.9" />
                  )}

                  {/* Hover ring */}
                  {isHovered && !isSelected && (
                    <circle r="22" fill="none" stroke="#94a3b8" strokeWidth="1" opacity="0.4" />
                  )}

                  {/* Glow background */}
                  <circle
                    r="19"
                    fill={sg.ring}
                    filter={`url(#glow-${d.status})`}
                  />

                  {/* Node body */}
                  <circle
                    r="16"
                    fill={sg.fill}
                    stroke={sg.stroke}
                    strokeWidth={isSelected ? 2.5 : isInfected ? 2 : 1.8}
                  />

                  {/* Device type symbol */}
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="12"
                    fill={sg.stroke}
                    fontFamily="monospace"
                    style={{ userSelect: 'none', pointerEvents: 'none' }}
                  >
                    {TYPE_SYMBOL[d.type] ?? '●'}
                  </text>

                  {/* Name label */}
                  <text
                    y="29"
                    textAnchor="middle"
                    fontSize="9"
                    fill="#475569"
                    fontFamily="monospace"
                    style={{ userSelect: 'none', pointerEvents: 'none' }}
                  >
                    {d.name.length > 14 ? d.name.slice(0, 13) + '…' : d.name}
                  </text>

                  {/* High-risk badge */}
                  {d.riskScore > 70 && d.status !== 'INFECTED' && (
                    <g transform="translate(12, -12)">
                      <circle r="6" fill="#f59e0b" />
                      <text textAnchor="middle" dominantBaseline="central"
                            fontSize="7" fill="#000" fontWeight="bold"
                            style={{ pointerEvents: 'none' }}>!</text>
                    </g>
                  )}

                  {/* Hover tooltip */}
                  {isHovered && (
                    <NodeTooltip device={d} connections={connections} x={0} y={0} />
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Empty state */}
        {devices.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-cyber-muted">
              <div className="text-3xl mb-2 opacity-30">◈</div>
              <div className="text-sm">No devices in network</div>
              <div className="text-xs mt-1 text-slate-700">Load the demo or add devices</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
