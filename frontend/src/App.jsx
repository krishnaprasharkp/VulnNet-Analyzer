import React, { useState, useEffect, useRef, useCallback } from 'react';
import LoginScreen from './components/LoginScreen.jsx';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import NetworkGraph from './components/NetworkGraph.jsx';
import SimulationPanel from './components/SimulationPanel.jsx';
import DeviceManager from './components/DeviceManager.jsx';
import SecurityReport from './components/SecurityReport.jsx';
import TerminalPanel from './components/TerminalPanel.jsx';
import { demoDevices, demoConnections } from './data/demoNetwork.js';
import {
  startInfection, spreadStep, riskBasedAttackStep, resetSimulation,
} from './utils/malwareSimulation.js';
import { refreshRiskScores, generateReport } from './utils/riskAnalysis.js';
import { Database, Terminal } from 'lucide-react';

let _nextId = 20;

function Header({ view, onLoadDemo, loaded }) {
  return (
    <header className="h-12 border-b border-cyber-border bg-cyber-surface flex items-center px-5 gap-4 shrink-0">
      <div className="flex items-center gap-1.5 text-[11px] text-cyber-muted">
        <Terminal size={13} color="#06b6d4" />
        <span className="text-cyan-400">vulnnet</span>
        <span>›</span>
        <span className="text-slate-300 capitalize">{view}</span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        {!loaded && (
          <button className="btn btn-cyan text-[10px] py-1 px-3" onClick={onLoadDemo}>
            <Database size={12} /> Load Demo Network
          </button>
        )}
        {loaded && (
          <span className="text-[10px] text-green-400 border border-green-400/30 bg-green-400/10 px-2 py-0.5 rounded">
            ✓ Demo Loaded
          </span>
        )}
        <div className="text-[10px] text-slate-700">C++ Backend · React Frontend</div>
      </div>
    </header>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn]      = useState(false);
  const [view, setView]              = useState('dashboard');
  const [devices, setDevices]        = useState([]);
  const [connections, setConns]      = useState([]);
  const [demoLoaded, setDemoLoaded]  = useState(false);
  const [selectedDev, setSelectedDev] = useState(null);

  // Simulation state
  const [simStarted, setSimStarted]   = useState(false);
  const [simRunning, setSimRunning]   = useState(false);
  const [simStep,    setSimStep]      = useState(0);
  const [patientZero, setPatientZero] = useState(null);
  const [simMode,    setSimMode]      = useState('bfs');
  const [simSpeed,   setSimSpeed]     = useState(800);
  const [newlyInfected, setNewlyInfected] = useState([]);
  const originalStatusesRef = useRef({});

  const intervalRef = useRef(null);
  const devicesRef  = useRef(devices);
  const connsRef    = useRef(connections);
  useEffect(() => { devicesRef.current = devices; },     [devices]);
  useEffect(() => { connsRef.current   = connections; }, [connections]);

  const loadDemo = useCallback(() => {
    const scored = refreshRiskScores(demoDevices, demoConnections);
    setDevices(scored);
    setConns(demoConnections);
    setDemoLoaded(true);
    setSimStarted(false);
    setSimRunning(false);
    setSimStep(0);
    setPatientZero(null);
    setNewlyInfected([]);
    const map = {};
    scored.forEach(d => { map[d.id] = d.status; });
    originalStatusesRef.current = map;
  }, []);

  const addDevice = useCallback((name, type) => {
    const id = _nextId++;
    setDevices(prev => {
      const d = { id, name, type, status: 'SAFE', riskScore: 0 };
      const next = refreshRiskScores([...prev, d], connsRef.current);
      originalStatusesRef.current[id] = 'SAFE';
      return next;
    });
  }, []);

  const removeDevice = useCallback((id) => {
    setDevices(prev => refreshRiskScores(prev.filter(d => d.id !== id), connsRef.current));
    setConns(prev => prev.filter(c => c.from !== id && c.to !== id));
  }, []);

  const markProtected = useCallback((id) => {
    setDevices(prev => {
      const next = prev.map(d => d.id === id ? { ...d, status: 'PROTECTED' } : d);
      originalStatusesRef.current[id] = 'PROTECTED';
      return refreshRiskScores(next, connsRef.current);
    });
  }, []);

  const markVulnerable = useCallback((id) => {
    setDevices(prev => {
      const next = prev.map(d => d.id === id ? { ...d, status: 'VULNERABLE' } : d);
      originalStatusesRef.current[id] = 'VULNERABLE';
      return refreshRiskScores(next, connsRef.current);
    });
  }, []);

  const addConnection = useCallback((from, to) => {
    const exists = connsRef.current.some(
      c => (c.from === from && c.to === to) || (c.from === to && c.to === from)
    );
    if (exists) return;
    setConns(prev => [...prev, { from, to }]);
    setDevices(prev => refreshRiskScores(prev, [...connsRef.current, { from, to }]));
  }, []);

  const removeConnection = useCallback((from, to) => {
    setConns(prev => prev.filter(
      c => !((c.from === from && c.to === to) || (c.from === to && c.to === from))
    ));
  }, []);

  const handleStart = useCallback((deviceId, mode) => {
    const result = startInfection(devicesRef.current, deviceId);
    if (!result.success) return;
    const scored = refreshRiskScores(result.devices, connsRef.current);
    setDevices(scored);
    setSimStarted(true);
    setSimStep(0);
    setNewlyInfected([deviceId]);
  }, []);

  const doStep = useCallback(() => {
    const devs  = devicesRef.current;
    const conns = connsRef.current;
    const { newlyInfected: newly, devices: next } =
      simMode === 'risk'
        ? riskBasedAttackStep(devs, conns)
        : spreadStep(devs, conns);

    const scored = refreshRiskScores(next, conns);
    setDevices(scored);
    setSimStep(s => s + 1);
    setNewlyInfected(newly);
    return newly;
  }, [simMode]);

  const toggleRun = useCallback(() => {
    setSimRunning(r => !r);
  }, []);

  const resetSim = useCallback(() => {
    clearInterval(intervalRef.current);
    setSimRunning(false);
    setSimStarted(false);
    setSimStep(0);
    setPatientZero(null);
    setNewlyInfected([]);
    setDevices(prev => {
      const restored = resetSimulation(prev, originalStatusesRef.current);
      return refreshRiskScores(restored, connsRef.current);
    });
  }, []);

  useEffect(() => {
    clearInterval(intervalRef.current);
    if (!simRunning) return;
    intervalRef.current = setInterval(() => {
      const newly = doStep();
      if (newly.length === 0) setSimRunning(false);
    }, simSpeed);
    return () => clearInterval(intervalRef.current);
  }, [simRunning, simSpeed, doStep]);

  const report = generateReport(devices, connections);

  useEffect(() => {
    setDevices(prev => refreshRiskScores(prev, connections));
  }, [connections]);

  if (!loggedIn) {
    return <LoginScreen onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden grid-bg" style={{ background: '#030712' }}>
      <Sidebar
        view={view}
        setView={setView}
        riskLevel={report.riskLevel}
        infectedCount={report.counts.infected}
        totalDevices={report.counts.total}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header view={view} onLoadDemo={loadDemo} loaded={demoLoaded} />

        <main className="flex-1 overflow-hidden">
          {view === 'dashboard' && (
            <Dashboard devices={devices} connections={connections} />
          )}
          {view === 'network' && (
            <NetworkGraph
              devices={devices}
              connections={connections}
              selectedDevice={selectedDev}
              onDeviceClick={d => setSelectedDev(prev => prev?.id === d.id ? null : d)}
              newlyInfected={newlyInfected}
            />
          )}
          {view === 'simulation' && (
            <SimulationPanel
              devices={devices}
              connections={connections}
              simStarted={simStarted}
              simRunning={simRunning}
              simStep={simStep}
              patientZero={patientZero}
              simMode={simMode}
              simSpeed={simSpeed}
              onStart={handleStart}
              onStep={doStep}
              onToggleRun={toggleRun}
              onReset={resetSim}
              onSetPatientZero={setPatientZero}
              onSetMode={setSimMode}
              onSetSpeed={setSimSpeed}
            />
          )}
          {view === 'terminal' && <TerminalPanel />}
          {view === 'devices' && (
            <DeviceManager
              devices={devices}
              connections={connections}
              onAddDevice={addDevice}
              onRemoveDevice={removeDevice}
              onMarkProtected={markProtected}
              onMarkVulnerable={markVulnerable}
              onAddConnection={addConnection}
              onRemoveConnection={removeConnection}
            />
          )}
          {view === 'report' && (
            <SecurityReport devices={devices} connections={connections} />
          )}
        </main>
      </div>
    </div>
  );
}
