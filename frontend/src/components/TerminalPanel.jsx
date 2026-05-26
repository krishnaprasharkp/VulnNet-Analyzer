import React, { useState, useEffect, useRef, useCallback } from 'react';

const LOG_TYPES = [
  {
    id: 'block',
    color: '#3b82f6',
    prefix: '[FW-BLOCK]',
    msgs: [
      'Blocked TCP {ip}:{port} → 0.0.0.0:22 — SSH brute-force pattern',
      'DROP: {ip}:{port} — SYN flood on port 80',
      'Outbound C2 beacon blocked: {ip} → {ext}:{port}',
      'Geo-IP DROP: {ip} — blacklisted origin {country}',
      'Blocked UDP {ip}:53 — DNS amplification attempt',
      'DDoS mitigation: {ip} — 12,400 pps threshold exceeded',
    ],
  },
  {
    id: 'alert',
    color: '#ef4444',
    prefix: '[IDS-ALERT]',
    msgs: [
      'CRITICAL: Rootkit signature match on {host}',
      'INTRUSION: SQL injection in POST /api/auth from {ip}',
      'ANOMALY: {ip} — {mb} MB/s outbound exfiltration detected',
      'LATERAL MOVEMENT: {ip} → {ip2} via SMB port 445',
      'RANSOMWARE PRECURSOR: Bulk file encryption on {host}',
      'EXPLOIT ATTEMPT: CVE-{cve} from {ip} against {host}',
      'PRIVILEGE ESCALATION: {user}@{host} gained root access',
    ],
  },
  {
    id: 'warn',
    color: '#f59e0b',
    prefix: '[SEC-WARN]',
    msgs: [
      'Auth failure ({n}/5): {user}@{ip} via {proto}',
      'Unusual login time: {user}@{ip} — off-hours access at {hhmm}',
      'TLS certificate expired: {host} — overdue by {days}d',
      'High CPU on {host}: 94% — possible cryptominer activity',
      'Suspicious DNS query: {host} → {domain}',
      'Unpatched service exposure: CVE-{cve} on {host}',
    ],
  },
  {
    id: 'info',
    color: '#10b981',
    prefix: '[SYS-INFO]',
    msgs: [
      'Signature DB updated — {count} threat patterns loaded',
      'Heartbeat OK: {host} — response {ms}ms',
      'Traffic baseline recalibrated for {subnet}',
      'Firewall ruleset v{ver} applied to zones 1–4',
      'Scheduled scan completed on {host}: 0 threats',
      'TLS certificate renewed on {host} — valid 365d',
      'Backup integrity verified: {host} — checksum OK',
    ],
  },
  {
    id: 'threat',
    color: '#ec4899',
    prefix: '[THREAT-INT]',
    msgs: [
      'IOC match: {ip} listed in TLP:AMBER threat feed',
      'Malware hash: SHA256:{hash} — Trojan.GenericKD.{n2}',
      'APT pattern: {ip} — matches known threat actor TTPs',
      'Dark-web credential exposure: {user}@corp — reset required',
      'Zero-day probe detected on port {port} from {ip}',
      'C2 infrastructure match: {ip} — active botnet node',
    ],
  },
];

const COUNTRIES = ['RU', 'CN', 'KP', 'IR', 'BR', 'NG', 'UA'];
const HOSTS     = ['web-srv-01', 'db-primary', 'mail-relay', 'admin-ws', 'iot-hub', 'dev-station-1', 'backup-srv', 'proxy-01'];
const USERS     = ['admin', 'root', 'svc_backup', 'dev_jenkins', 'svc_monitor', 'guest'];
const PROTOS    = ['SSH', 'RDP', 'FTP', 'TELNET', 'SMB', 'VNC'];
const DOMAINS   = ['update-cdn.net', 'telemetry-svc.io', 'log-collector.xyz', 'sync-api.club', 'metrics-hub.co'];
const SUBNETS   = ['10.0.0.0/24', '10.0.1.0/24', '10.0.2.0/24', '172.16.0.0/20'];

function ri()       { return `${10 + ~~(Math.random() * 245)}.${~~(Math.random() * 256)}.${~~(Math.random() * 256)}.${~~(Math.random() * 256)}`; }
function rp()       { return [22, 80, 443, 3389, 8080, 8443, 3306, 5432, 6379, 53][~~(Math.random() * 10)]; }
function rnd(arr)   { return arr[~~(Math.random() * arr.length)]; }
function rHash()    { return [...Array(14)].map(() => (~~(Math.random() * 16)).toString(16)).join(''); }
function rCve()     { return `${2020 + ~~(Math.random() * 5)}-${10000 + ~~(Math.random() * 55000)}`; }

function fillMsg(msg) {
  const hour = ~~(Math.random() * 5) + 1;
  const min  = ~~(Math.random() * 60);
  return msg
    .replace(/{ip}/g,      ri())
    .replace(/{ip2}/g,     ri())
    .replace(/{ext}/g,     ri())
    .replace(/{port}/g,    rp())
    .replace(/{host}/g,    rnd(HOSTS))
    .replace(/{user}/g,    rnd(USERS))
    .replace(/{proto}/g,   rnd(PROTOS))
    .replace(/{country}/g, rnd(COUNTRIES))
    .replace(/{domain}/g,  rnd(DOMAINS))
    .replace(/{subnet}/g,  rnd(SUBNETS))
    .replace(/{cve}/g,     rCve())
    .replace(/{hash}/g,    rHash())
    .replace(/{n}/g,       1 + ~~(Math.random() * 4))
    .replace(/{n2}/g,      100 + ~~(Math.random() * 900))
    .replace(/{count}/g,   45000 + ~~(Math.random() * 10000))
    .replace(/{ms}/g,      1 + ~~(Math.random() * 9))
    .replace(/{mb}/g,      (1 + Math.random() * 5).toFixed(1))
    .replace(/{ver}/g,     `${5 + ~~(Math.random() * 3)}.${~~(Math.random() * 15)}.${~~(Math.random() * 30)}`)
    .replace(/{days}/g,    1 + ~~(Math.random() * 60))
    .replace(/{hhmm}/g,    `0${hour}:${min < 10 ? '0' + min : min}`);
}

let _lid = 0;
function makeLog() {
  const type = LOG_TYPES[~~(Math.random() * LOG_TYPES.length)];
  const msg  = type.msgs[~~(Math.random() * type.msgs.length)];
  return {
    id:     ++_lid,
    type:   type.id,
    color:  type.color,
    prefix: type.prefix,
    msg:    fillMsg(msg),
    time:   new Date().toLocaleTimeString('en', { hour12: false }),
  };
}

const FILTERS = [
  { id: 'all',    label: 'All',      color: '#64748b' },
  { id: 'alert',  label: 'Alerts',   color: '#ef4444' },
  { id: 'block',  label: 'Blocked',  color: '#3b82f6' },
  { id: 'warn',   label: 'Warnings', color: '#f59e0b' },
  { id: 'threat', label: 'Threats',  color: '#ec4899' },
  { id: 'info',   label: 'Info',     color: '#10b981' },
];

export default function TerminalPanel() {
  const [logs, setLogs]     = useState(() => Array.from({ length: 18 }, makeLog));
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState('all');

  const addLog = useCallback(() => {
    setLogs(prev => [makeLog(), ...prev].slice(0, 400));
  }, []);

  useEffect(() => {
    if (paused) return;
    const delay = 700 + Math.random() * 2300;
    const t = setTimeout(addLog, delay);
    return () => clearTimeout(t);
  }, [logs, paused, addLog]);

  const filtered = filter === 'all' ? logs : logs.filter(l => l.type === filter);

  const countsByType = LOG_TYPES.reduce((acc, t) => {
    acc[t.id] = logs.filter(l => l.type === t.id).length;
    return acc;
  }, {});

  const today = new Date().toLocaleDateString('en', { month: 'short', day: '2-digit', year: 'numeric' });

  return (
    <div className="p-6 h-full flex flex-col gap-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-100 tracking-wide">Security Terminal</h1>
          <p className="text-[11px] text-cyber-muted mt-0.5">
            Live IDS/IPS · Firewall · Intrusion Detection · Threat Intelligence
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded font-mono text-[10px]"
               style={{
                 background: paused ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
                 border: `1px solid ${paused ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.25)'}`,
                 color: paused ? '#f59e0b' : '#10b981',
               }}>
            <div className={`w-1.5 h-1.5 rounded-full ${paused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`} />
            {paused ? 'PAUSED' : 'LIVE'}
          </div>
          <button className="btn btn-ghost text-[10px] py-1.5"
                  onClick={() => setPaused(p => !p)}>
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button className="btn btn-ghost text-[10px] py-1.5"
                  onClick={() => setLogs([])}>
            Clear
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 flex-wrap shrink-0">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="px-3 py-1 text-[10px] font-mono rounded transition-all"
            style={filter === f.id ? {
              background: `${f.color}18`,
              border: `1px solid ${f.color}50`,
              color: f.color,
            } : {
              background: 'transparent',
              border: '1px solid transparent',
              color: '#475569',
            }}
          >
            {f.label}
            {f.id !== 'all' && countsByType[f.id] > 0 && (
              <span className="ml-1.5 opacity-55">({countsByType[f.id]})</span>
            )}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-slate-600 font-mono">
          {filtered.length} events
        </span>
      </div>

      {/* Terminal window */}
      <div className="flex-1 overflow-hidden rounded-xl flex flex-col"
           style={{ background: '#020b13', border: '1px solid #0d2132' }}>
        {/* macOS-style chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b shrink-0"
             style={{ background: '#04101a', borderColor: '#0d2132' }}>
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff5f57' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ffbd2e' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#28c941' }} />
          <span className="ml-3 text-[10px] font-mono" style={{ color: '#1b3448' }}>
            root@vulnnet-ids — /var/log/vulnnet/live.log
          </span>
          <span className="ml-auto text-[10px] font-mono" style={{ color: '#1b3448' }}>
            {today}
          </span>
        </div>

        {/* Scrollable log output */}
        <div className="flex-1 overflow-y-auto p-3"
             style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          {filtered.length === 0 ? (
            <div className="text-[11px] py-8 text-center" style={{ color: '#1b3448' }}>
              No events match filter.
            </div>
          ) : (
            filtered.map((log, i) => (
              <div
                key={log.id}
                className="flex items-start gap-2 px-2 py-[3px] rounded transition-colors hover:bg-white/[0.015] terminal-line"
                style={{ animationDelay: `${Math.min(i, 8) * 0.015}s` }}
              >
                <span className="text-[10px] shrink-0 w-16 mt-[1px]"
                      style={{ color: '#1b3448' }}>
                  {log.time}
                </span>
                <span className="text-[10px] font-bold shrink-0 w-[100px]"
                      style={{ color: `${log.color}bb` }}>
                  {log.prefix}
                </span>
                <span className="text-[11px] leading-relaxed"
                      style={{ color: `${log.color}88` }}>
                  {log.msg}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-3 px-4 py-1.5 border-t shrink-0"
             style={{ background: '#04101a', borderColor: '#0d2132' }}>
          {[
            { label: 'IDS ENGINE: ACTIVE', color: '#10b981' },
            { label: `RULES: 47,291`,      color: '#1b3448' },
            { label: `EVENTS: ${logs.length}`, color: '#1b3448' },
          ].map((item, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-[9px] font-mono" style={{ color: '#0d2132' }}>|</span>}
              <span className="text-[9px] font-mono" style={{ color: item.color }}>
                {item.label}
              </span>
            </React.Fragment>
          ))}
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-green-900 animate-pulse" />
            <span className="text-[9px] font-mono" style={{ color: '#1b3448' }}>MONITORING</span>
          </div>
        </div>
      </div>
    </div>
  );
}
