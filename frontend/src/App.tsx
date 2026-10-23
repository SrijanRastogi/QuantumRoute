import React, { useState, useEffect, useCallback } from 'react';
import type { 
  NetworkGraphData, 
  NetworkEdge,
  LinkOverride,
  RouteResponse, 
  SimulationResult, 
  EducationalExplanation 
} from './types';
import { 
  fetchTopologies, 
  fetchTopologyGraph, 
  calculateRoute, 
  runSimulation, 
  fetchExplanation 
} from './api';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import type { NavItem } from './components/Sidebar';
import { NetworkGraph } from './components/NetworkGraph';
import { RouteMetrics } from './components/RouteMetrics';
import { SelectedRoute } from './components/SelectedRoute';
import { AlgorithmComparison } from './components/AlgorithmComparison';
import { SimulationModal } from './components/SimulationModal';
import { LinkEditorModal } from './components/LinkEditorModal';
import { HeroLanding } from './components/HeroLanding';
import { ExperimentsLab } from './components/ExperimentsLab';
import { PhysicalChannelsLab } from './components/PhysicalChannelsLab';
import { PurificationLab } from './components/PurificationLab';
import { QasmExportLab } from './components/QasmExportLab';
import { ValidationLab } from './components/ValidationLab';
import { StateAnalysisLab } from './components/StateAnalysisLab';
import { DocumentationLab } from './components/DocumentationLab';
import { Play, Settings2, Sparkles, X, RotateCcw, AlertCircle, Sliders } from 'lucide-react';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'lab'>('lab');
  const [activeTab, setActiveTab] = useState<string>('network');

  // Topology & Graph
  const [presets, setPresets] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('Generic Mesh (6 nodes · 10 links)');
  const [graph, setGraph] = useState<NetworkGraphData | null>(null);
  const [defaultGraph, setDefaultGraph] = useState<NetworkGraphData | null>(null);

  // Link Overrides State (Milestone 1.2 Editable Links)
  const [linkOverrides, setLinkOverrides] = useState<Record<string, LinkOverride>>({});
  const [selectedEdge, setSelectedEdge] = useState<NetworkEdge | null>(null);
  const [isLinkEditorOpen, setIsLinkEditorOpen] = useState<boolean>(false);

  // Endpoints & Strategy
  const [sourceNode, setSourceNode] = useState<string>('Alice');
  const [targetNode, setTargetNode] = useState<string>('Bob');
  const [strategy, setStrategy] = useState<string>('quality_aware');
  const [alpha, setAlpha] = useState<number>(0.35);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Route Results
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Simulation & Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [explanation, setExplanation] = useState<EducationalExplanation | null>(null);

  // Roadmap Notice Banner for unreleased milestones (Navigation truthfulness)
  const [roadmapNotice, setRoadmapNotice] = useState<NavItem | null>(null);

  // 1. Initial Load of Topology Presets
  useEffect(() => {
    fetchTopologies()
      .then((data) => {
        setPresets(data.presets);
        if (data.default) setSelectedPreset(data.default);
      })
      .catch((err) => console.error('Failed to load topologies', err));
  }, []);

  // 2. Fetch Graph when Preset Changes
  useEffect(() => {
    if (!selectedPreset) return;
    setLinkOverrides({}); // Clear link overrides on preset change
    fetchTopologyGraph(selectedPreset)
      .then((data) => {
        setGraph(data);
        setDefaultGraph(JSON.parse(JSON.stringify(data)));
        const nodeIds = data.nodes.map((n) => n.id);
        if (nodeIds.includes('Alice')) setSourceNode('Alice');
        else if (nodeIds.length > 0) setSourceNode(nodeIds[0]);

        if (nodeIds.includes('Bob')) setTargetNode('Bob');
        else if (nodeIds.length > 1) setTargetNode(nodeIds[nodeIds.length - 1]);
      })
      .catch((err) => console.error('Failed to load topology graph', err));
  }, [selectedPreset]);

  // 3. Stale Simulation Invalidation:
  // Changing topology, source, target, algorithm, or link parameters immediately invalidates previous simulation results
  useEffect(() => {
    setSimResult(null);
    setSimError(null);
    setExplanation(null);
    setIsModalOpen(false);
  }, [selectedPreset, sourceNode, targetNode, strategy, alpha, linkOverrides]);

  // 4. Compute Route when Source, Target, Strategy, Preset, or Link Overrides Change
  const updateRoute = useCallback(async () => {
    if (!selectedPreset || !sourceNode || !targetNode) return;
    if (sourceNode === targetNode) {
      setRouteError('Source and destination nodes must be distinct.');
      setRouteData(null);
      return;
    }
    setIsLoadingRoute(true);
    setRouteError(null);
    try {
      const overridesList = Object.values(linkOverrides);
      const data = await calculateRoute({
        topology: selectedPreset,
        source: sourceNode,
        target: targetNode,
        strategy,
        alpha,
        link_overrides: overridesList.length > 0 ? overridesList : undefined,
      });
      setRouteData(data);
    } catch (err: any) {
      setRouteError(err.message || 'Route calculation failed');
      setRouteData(null);
    } finally {
      setIsLoadingRoute(false);
    }
  }, [selectedPreset, sourceNode, targetNode, strategy, alpha, linkOverrides]);

  useEffect(() => {
    updateRoute();
  }, [updateRoute]);

  // 5. Link Editing Handlers
  const handleSaveLink = (source: string, target: string, distance_km: number, w: number) => {
    const key = [source, target].sort().join('-');
    const newOverrides: Record<string, LinkOverride> = {
      ...linkOverrides,
      [key]: { source, target, distance_km, w },
    };
    setLinkOverrides(newOverrides);

    // Update active graph in state so visual edge labels and hover reflects the edits immediately
    if (graph) {
      const updatedEdges = graph.edges.map((e) => {
        const eKey = [e.source, e.target].sort().join('-');
        if (eKey === key) {
          return {
            ...e,
            distance_km,
            w,
            bell_fidelity: (1.0 + 3.0 * w) / 4.0,
            delay_ms: distance_km * 0.005,
          };
        }
        return e;
      });
      setGraph({ ...graph, edges: updatedEdges });
    }
  };

  const handleResetLink = (source: string, target: string) => {
    const key = [source, target].sort().join('-');
    const newOverrides = { ...linkOverrides };
    delete newOverrides[key];
    setLinkOverrides(newOverrides);

    if (graph && defaultGraph) {
      const orig = defaultGraph.edges.find(
        (e) => [e.source, e.target].sort().join('-') === key
      );
      if (orig) {
        const updatedEdges = graph.edges.map((e) => {
          if ([e.source, e.target].sort().join('-') === key) {
            return { ...orig };
          }
          return e;
        });
        setGraph({ ...graph, edges: updatedEdges });
      }
    }
  };

  const handleResetAllLinks = () => {
    setLinkOverrides({});
    if (defaultGraph) {
      setGraph(JSON.parse(JSON.stringify(defaultGraph)));
    }
  };

  // 6. Consolidated Single Primary Simulation Action
  const handleRunSimulation = async () => {
    if (isSimulating) return;

    if (!routeData?.selected_route) {
      setSimError('No valid path exists between selected nodes to simulate.');
      setIsModalOpen(true);
      return;
    }

    setSimError(null);
    setSimResult(null);
    setIsSimulating(true);
    setIsModalOpen(true);

    try {
      const overridesList = Object.values(linkOverrides);
      const [simRes, expRes] = await Promise.all([
        runSimulation({
          path: routeData.selected_route.path,
          topology: selectedPreset,
          theta: 1.05,
          phi: 0.79,
          link_overrides: overridesList.length > 0 ? overridesList : undefined,
        }),
        fetchExplanation({
          source: sourceNode,
          target: targetNode,
          preset: selectedPreset,
        }),
      ]);
      setSimResult(simRes);
      setExplanation(expRes);
    } catch (err: any) {
      console.error('Simulation execution failed', err);
      setSimError(err.message || 'Quantum simulation execution failed on backend server.');
    } finally {
      setIsSimulating(false);
    }
  };

  const resetToDefaults = () => {
    setSelectedPreset('Generic Mesh (6 nodes · 10 links)');
    setSourceNode('Alice');
    setTargetNode('Bob');
    setStrategy('quality_aware');
    setAlpha(0.35);
    setLinkOverrides({});
    if (defaultGraph) {
      setGraph(JSON.parse(JSON.stringify(defaultGraph)));
    }
    setRoadmapNotice(null);
  };

  const nodeOptions = graph ? graph.nodes.map((n) => n.id) : [];
  const targetOptions = nodeOptions.filter((n) => n !== sourceNode);
  const isNetworkModified = Object.keys(linkOverrides).length > 0;

  const strategyNameMap: Record<string, string> = {
    quality_aware: 'Quality-Aware (Dijkstra)',
    shortest_hop: 'Shortest-Hop (BFS)',
    multi_metric: 'Multi-Metric (α trade-off)',
  };

  return (
    <div style={{ minHeight: '100vh', padding: '1.25rem 1.75rem' }}>
      
      {/* Top Navigation Header */}
      <Header 
        currentView={currentView}
        onViewChange={setCurrentView}
        selectedPreset={selectedPreset}
        presets={presets}
        onPresetChange={setSelectedPreset}
      />

      {currentView === 'home' ? (
        <HeroLanding onExplore={() => setCurrentView('lab')} />
      ) : (
        <div style={{ display: 'flex', gap: '1.25rem' }}>
          
          {/* Truthful Left Navigation Rail */}
          <Sidebar 
            activeTab={activeTab} 
            onTabChange={(tab) => {
              setActiveTab(tab);
              setRoadmapNotice(null);
            }} 
            onLockedFeatureClick={(item) => {
              setRoadmapNotice(item);
            }}
          />

          {/* Main Workspace: 8 Full Functional Labs */}
          <main style={{ flex: 1, minWidth: 0 }}>
            {activeTab === 'experiments' ? (
              <ExperimentsLab />
            ) : activeTab === 'channels' ? (
              <PhysicalChannelsLab />
            ) : activeTab === 'purification' ? (
              <PurificationLab />
            ) : activeTab === 'qasm' ? (
              <QasmExportLab />
            ) : activeTab === 'validation' ? (
              <ValidationLab />
            ) : activeTab === 'analysis' ? (
              <StateAnalysisLab />
            ) : activeTab === 'docs' ? (
              <DocumentationLab />
            ) : (
              <>
                {/* Top Workspace Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.0rem' }}>
                  <div>
                    <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                      Network Lab
                    </h1>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Build and simulate quantum communication networks across customizable repeaters
                    </p>
                  </div>

              {/* Functional Workspace Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {isNetworkModified && (
                  <span 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: 'rgba(234, 179, 8, 0.15)',
                      border: '1px solid rgba(234, 179, 8, 0.4)',
                      borderRadius: '8px',
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      color: '#facc15',
                    }}
                  >
                    <span>Modified network ({Object.keys(linkOverrides).length} custom {Object.keys(linkOverrides).length === 1 ? 'link' : 'links'})</span>
                  </span>
                )}

                <button 
                  onClick={resetToDefaults}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '0.45rem 0.85rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title="Reset network to generic default mesh"
                >
                  <RotateCcw size={13} />
                  Reset to Defaults
                </button>
              </div>
            </div>

            {/* Roadmap Notice Banner if unreleased sidebar item was clicked */}
            {roadmapNotice && (
              <div 
                style={{ 
                  background: 'linear-gradient(90deg, rgba(147, 51, 234, 0.2) 0%, rgba(192, 38, 211, 0.1) 100%)', 
                  border: '1px solid rgba(168, 85, 247, 0.4)', 
                  borderRadius: '10px', 
                  padding: '0.85rem 1.15rem', 
                  marginBottom: '1.15rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1.0rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Sparkles size={18} color="var(--accent-fuchsia)" />
                  <div>
                    <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.86rem' }}>
                      {roadmapNotice.label} ({roadmapNotice.milestone})
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: '0.6rem' }}>
                      {roadmapNotice.description} — <i>Network Lab is currently active.</i>
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setRoadmapNotice(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* 3-Column Desktop Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 340px', gap: '1.15rem', alignItems: 'start' }}>
              
              {/* LEFT COLUMN: Configuration Panel with Single Primary Simulation Action */}
              <div className="glass-panel" style={{ padding: '1.15rem' }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginBottom: '1.0rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Settings2 size={16} color="var(--accent-fuchsia)" />
                    Network Configuration
                  </div>
                  {isNetworkModified && (
                    <span style={{ fontSize: '0.65rem', color: '#facc15', background: 'rgba(234, 179, 8, 0.15)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                      Custom Links
                    </span>
                  )}
                </div>

                {/* Topology Preset Select */}
                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                    Topology Preset
                  </label>
                  <select 
                    className="custom-select"
                    value={selectedPreset}
                    onChange={(e) => setSelectedPreset(e.target.value)}
                  >
                    {presets.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Source Node Select */}
                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ fontSize: '0.74rem', color: 'var(--color-alice)', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                    🔵 Source Node (Alice)
                  </label>
                  <select 
                    className="custom-select"
                    value={sourceNode}
                    onChange={(e) => setSourceNode(e.target.value)}
                  >
                    {nodeOptions.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                {/* Destination Node Select */}
                <div style={{ marginBottom: '1.1rem' }}>
                  <label style={{ fontSize: '0.74rem', color: 'var(--color-bob)', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                    🟠 Destination Node (Bob)
                  </label>
                  <select 
                    className="custom-select"
                    value={targetNode}
                    onChange={(e) => setTargetNode(e.target.value)}
                  >
                    {targetOptions.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                {/* Routing Algorithm Radio Group */}
                <div style={{ marginBottom: '1.15rem' }}>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.45rem' }}>
                    Routing Algorithm
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {[
                      { id: 'quality_aware', label: 'Quality-Aware (Dijkstra)' },
                      { id: 'shortest_hop', label: 'Shortest-Hop (BFS)' },
                      { id: 'multi_metric', label: 'Multi-Metric (α trade-off)' },
                    ].map((opt) => (
                      <label 
                        key={opt.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          background: strategy === opt.id ? 'rgba(192, 38, 211, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                          border: strategy === opt.id ? '1px solid var(--accent-fuchsia)' : '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          padding: '0.55rem 0.75rem',
                          fontSize: '0.82rem',
                          color: strategy === opt.id ? '#fff' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontWeight: strategy === opt.id ? 600 : 400,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <input 
                          type="radio" 
                          name="routingStrategy" 
                          value={opt.id}
                          checked={strategy === opt.id}
                          onChange={() => setStrategy(opt.id)}
                          style={{ accentColor: 'var(--accent-fuchsia)' }}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Advanced Parameters Collapsible */}
                <div style={{ marginBottom: '1.15rem' }}>
                  <button 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--accent-violet)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: 0,
                    }}
                  >
                    <span>{showAdvanced ? '▼' : '▶'} Advanced Parameters</span>
                  </button>

                  {showAdvanced && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '0.3rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Multi-Metric α:</span>
                        <span style={{ color: '#fff', fontWeight: 600 }}>{alpha.toFixed(2)}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.05" 
                        value={alpha}
                        onChange={(e) => setAlpha(parseFloat(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--accent-fuchsia)' }}
                      />
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                        Telecom Delay: 5.0 µs/km standard
                      </div>
                    </div>
                  )}
                </div>

                {/* Link Quick-Edit Fallback Action Button */}
                <div style={{ marginBottom: '1.15rem' }}>
                  <button 
                    onClick={() => {
                      if (graph && graph.edges.length > 0) {
                        setSelectedEdge(graph.edges[0]);
                        setIsLinkEditorOpen(true);
                      }
                    }}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px dashed var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '0.55rem',
                      color: 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Sliders size={14} color="var(--accent-fuchsia)" />
                    <span>Edit a Network Link (Distance / Quality)</span>
                  </button>
                </div>

                {/* Single Primary Action Button with Loading & Error States */}
                <button 
                  onClick={handleRunSimulation}
                  disabled={isSimulating || !routeData?.selected_route}
                  className="btn-primary"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem',
                    opacity: (isSimulating || !routeData?.selected_route) ? 0.6 : 1,
                    cursor: (isSimulating || !routeData?.selected_route) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {isSimulating ? (
                    <>
                      <span 
                        style={{ 
                          width: '15px', 
                          height: '15px', 
                          border: '2px solid rgba(255,255,255,0.3)', 
                          borderTopColor: '#fff', 
                          borderRadius: '50%', 
                          animation: 'spin 0.8s linear infinite',
                          display: 'inline-block' 
                        }} 
                      />
                      Simulating Circuit...
                    </>
                  ) : (
                    <>
                      <Play size={16} fill="#fff" />
                      Run Simulation ▶
                    </>
                  )}
                </button>
              </div>

              {/* CENTER COLUMN: Large Interactive Network Graph Centerpiece */}
              <div>
                <NetworkGraph 
                  graph={graph}
                  selectedRoute={routeData?.selected_route || null}
                  sourceNode={sourceNode}
                  targetNode={targetNode}
                  selectedEdge={selectedEdge}
                  onNodeClick={(nodeId) => {
                    if (nodeId === sourceNode) return;
                    setTargetNode(nodeId);
                  }}
                  onEdgeClick={(edge) => {
                    setSelectedEdge(edge);
                    setIsLinkEditorOpen(true);
                  }}
                  isNetworkModified={isNetworkModified}
                  onResetAllLinks={handleResetAllLinks}
                />

                {isLoadingRoute && (
                  <div style={{ marginTop: '0.65rem', padding: '0.4rem 0.8rem', background: 'rgba(147, 51, 234, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '6px', color: '#d8b4fe', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-fuchsia)' }} />
                    Evaluating optimal quantum routes across topology...
                  </div>
                )}

                {routeError && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', color: '#f87171', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} />
                    {routeError}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Calculated Metrics & Selected Route */}
              <div>
                <RouteMetrics 
                  route={routeData?.selected_route || null}
                  strategyLabel={strategyNameMap[strategy] || strategy}
                  improvementPct={routeData?.werner_improvement_pct || 0}
                />

                <SelectedRoute 
                  route={routeData?.selected_route || null}
                  hops={routeData?.hops_breakdown || []}
                />
              </div>

            </div>

            {/* BOTTOM ROW: Routing Algorithm Comparison Section */}
            <AlgorithmComparison 
              bfsRoute={routeData?.comparison?.shortest_hop || null}
              dijkstraRoute={routeData?.comparison?.quality_aware || null}
              multiRoute={routeData?.comparison?.multi_metric || null}
              currentStrategy={strategy}
              onStrategySelect={setStrategy}
              alpha={alpha}
            />
              </>
            )}

          </main>
        </div>
      )}

      {/* Simulation Execution Modal */}
      <SimulationModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSimError(null);
        }}
        result={simResult}
        isLoading={isSimulating}
        error={simError}
        explanation={explanation}
        path={routeData?.selected_route?.path || []}
      />

      {/* Link Settings Editor Modal (Milestone 1.2) */}
      <LinkEditorModal 
        isOpen={isLinkEditorOpen}
        onClose={() => {
          setIsLinkEditorOpen(false);
          setSelectedEdge(null);
        }}
        edge={selectedEdge}
        defaultEdge={
          selectedEdge && defaultGraph
            ? defaultGraph.edges.find(
                (e) => [e.source, e.target].sort().join('-') === [selectedEdge.source, selectedEdge.target].sort().join('-')
              ) || null
            : null
        }
        onSave={handleSaveLink}
        onResetLink={handleResetLink}
      />

    </div>
  );
};

export default App;
