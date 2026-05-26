import { getNeighbors } from './malwareSimulation.js';

export function calculateRiskScore(device, connections) {
  if (device.status === 'PROTECTED') return 5;
  if (device.status === 'INFECTED')  return 100;

  const connCount = getNeighbors(device.id, connections).length;
  let score = connCount * 8;
  if (device.status === 'VULNERABLE') score += 30;
  return Math.min(score, 100);
}

export function refreshRiskScores(devices, connections) {
  return devices.map(d => ({
    ...d,
    riskScore: calculateRiskScore(d, connections),
  }));
}

export function generateReport(devices, connections) {
  const scored = refreshRiskScores(devices, connections);

  const counts = {
    total:      scored.length,
    infected:   scored.filter(d => d.status === 'INFECTED').length,
    safe:       scored.filter(d => d.status === 'SAFE').length,
    protected:  scored.filter(d => d.status === 'PROTECTED').length,
    vulnerable: scored.filter(d => d.status === 'VULNERABLE').length,
  };

  const avgRisk = scored.length
    ? scored.reduce((s, d) => s + d.riskScore, 0) / scored.length
    : 0;

  const riskLevel =
    avgRisk >= 75 ? 'CRITICAL' :
    avgRisk >= 50 ? 'HIGH' :
    avgRisk >= 25 ? 'MEDIUM' : 'LOW';

  const highRiskDevices = scored.filter(d => d.riskScore > 70);

  const mostVulnerable = scored
    .filter(d => d.status !== 'PROTECTED')
    .sort((a, b) => b.riskScore - a.riskScore)[0] ?? null;

  const infectionPct = counts.total
    ? Math.round((counts.infected / counts.total) * 100)
    : 0;

  const protectedBlocked = scored.filter(d => {
    if (d.status !== 'PROTECTED') return false;
    return getNeighbors(d.id, connections).some(nbId => {
      const nb = scored.find(x => x.id === nbId);
      return nb && nb.status === 'INFECTED';
    });
  }).length;

  return {
    counts,
    avgRisk:          Math.round(avgRisk * 10) / 10,
    riskLevel,
    highRiskDevices,
    mostVulnerable,
    infectionPct,
    protectedBlocked,
    timestamp:        new Date().toLocaleString(),
    devices:          scored,
  };
}

export const RISK_COLORS = {
  LOW:      { text: '#10b981', bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.4)' },
  MEDIUM:   { text: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)' },
  HIGH:     { text: '#ef4444', bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)' },
  CRITICAL: { text: '#ec4899', bg: 'rgba(236,72,153,0.15)', border: 'rgba(236,72,153,0.5)' },
};

export const STATUS_META = {
  SAFE:       { color: '#10b981', label: 'Safe',      emoji: '✓' },
  INFECTED:   { color: '#ef4444', label: 'Infected',  emoji: '✕' },
  PROTECTED:  { color: '#3b82f6', label: 'Protected', emoji: '⬡' },
  VULNERABLE: { color: '#f59e0b', label: 'Vulnerable',emoji: '⚠' },
};
