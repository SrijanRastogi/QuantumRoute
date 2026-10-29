import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Play, Check } from 'lucide-react';
import { Reveal } from '../Reveal';

interface ProductPreviewSectionProps {
  onLaunchSimulator: (tab?: string) => void;
}

const STEPS = [
  {
    id: 'configure',
    index: '01',
    title: 'Configure the topology',
    body: 'Pick a preset or draw your own repeaters, then edit each link’s distance and initial Werner parameter directly on the canvas. Every edit updates the routing cost in real time.',
    caption: 'Live link editing · distance and Werner parameter',
  },
  {
    id: 'route',
    index: '02',
    title: 'Route on quality, not hops',
    body: 'Dijkstra minimises −ln(wₑ) across the path, so the selected route maximises the end-to-end Werner product. BFS and multi-metric trade-offs are computed side by side for comparison.',
    caption: 'Dijkstra · 3 hops · optimal Werner product',
  },
  {
    id: 'inspect',
    index: '03',
    title: 'Inspect and export',
    body: 'Read the composed Werner parameter, Bell fidelity, teleportation fidelity, and delay for the chosen path, then replay the exact circuit in Aer or export OpenQASM 3.0.',
    caption: 'Verified metrics · Aer 0.18 · OpenQASM 3.0',
  },
];

const METRICS = [
  { label: 'Werner parameter', value: '0.8574', hint: 'w = ∏ w_e', accent: 'var(--accent-violet)' },
  { label: 'Bell fidelity', value: '0.8931', hint: 'threshold 0.50', accent: 'var(--color-success)' },
  { label: 'Teleport fidelity', value: '0.9287', hint: 'classical 0.6667', accent: 'var(--color-info)' },
  { label: 'Delay', value: '2.55 ms', hint: '5.0 µs / km', accent: 'var(--accent-magenta)' },
];

const HOPS = [
  { label: 'Alice → R₁', w: 0.95 },
  { label: 'R₁ → R₂', w: 0.96 },
  { label: 'R₂ → Bob', w: 0.94 },
];

const NODES = [
  { label: 'A', name: 'Alice', meta: 'source', color: 'var(--color-alice)' },
  { label: 'R₁', name: 'Rep A', meta: '120 km', color: 'var(--color-repeater)' },
  { label: 'R₂', name: 'Rep D', meta: '180 km', color: 'var(--accent-magenta)' },
  { label: 'B', name: 'Bob', meta: 'target', color: 'var(--color-bob)' },
];

export const ProductPreviewSection: React.FC<ProductPreviewSectionProps> = ({ onLaunchSimulator }) => {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const nodes = stepRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!nodes.length || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = nodes.indexOf(visible.target as HTMLDivElement);
        if (index >= 0) setActive(index);
      },
      { rootMargin: '-42% 0px -42% 0px', threshold: [0, 0.25, 0.5, 1] }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="qr-section" style={{ paddingTop: 0 }}>
      <div className="qr-section-head">
        <Reveal>
          <span className="qr-eyebrow">Workspace</span>
          <h2 className="qr-section-title" style={{ marginTop: '1rem' }}>
            The actual
            <br />
            interface.
          </h2>
        </Reveal>
        <Reveal variant="left" delay={120}>
          <p className="qr-section-head-copy">
            No static mockups or fabricated dashboards. Every panel below mirrors the live
            simulator, where each number comes from a verified Aer run.
          </p>
        </Reveal>
      </div>

      <div className="qr-showcase-grid">
        <div className="qr-showcase-sticky">
          <Reveal variant="scale">
            <div className="qr-mock qr-dark-surface">
              {/* Window chrome */}
              <div className="qr-mock-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="qr-mock-dot" style={{ background: '#ff5f57' }} />
                  <span className="qr-mock-dot" style={{ background: '#febc2e' }} />
                  <span className="qr-mock-dot" style={{ background: '#28c840' }} />
                  <span className="qr-mock-path">quantumroute / simulator</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <span className="qr-mock-badge">
                    <span className="qr-status-dot" aria-hidden="true" />
                    Aer active
                  </span>
                  <button
                    type="button"
                    onClick={() => onLaunchSimulator('network')}
                    className="qr-mock-launch"
                  >
                    Launch
                    <ArrowRight size={11} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="qr-mock-body">
                {/* Topology */}
                <div className="qr-mock-panel qr-mock-topo" data-focus={active === 1}>
                  <div className="qr-mock-panel-head">
                    <span>Route preview</span>
                    <span className="qr-mock-ok">
                      <Check size={11} aria-hidden="true" />
                      3 hops · optimal
                    </span>
                  </div>

                  <div className="qr-mock-nodes">
                    {NODES.map((node, index) => (
                      <React.Fragment key={node.label}>
                        <div className="qr-mock-node-wrap">
                          <span className="qr-mock-node" style={{ borderColor: node.color, color: node.color }}>
                            {node.label}
                          </span>
                          <span className="qr-mock-node-name" style={{ color: node.color }}>
                            {node.name}
                          </span>
                          <span className="qr-mock-node-meta">{node.meta}</span>
                        </div>
                        {index < NODES.length - 1 && (
                          <span
                            className="qr-mock-link"
                            aria-hidden="true"
                            style={{
                              background: `linear-gradient(90deg, ${node.color}, ${
                                NODES[index + 1].color
                              })`,
                            }}
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="qr-mock-route">
                    <span>Alice → Rep A → Rep D → Bob</span>
                    <span style={{ color: 'var(--color-success)' }}>510 km</span>
                  </div>
                </div>

                <div className="qr-mock-row">
                  {/* Controls */}
                  <div className="qr-mock-panel" data-focus={active === 0}>
                    <div className="qr-mock-label">Topology</div>
                    <div className="qr-mock-value">Generic Mesh</div>
                    <div className="qr-mock-sub">6 nodes · 10 links</div>

                    <div className="qr-mock-label" style={{ marginTop: '0.7rem' }}>
                      Strategy
                    </div>
                    <div className="qr-mock-strategy" data-selected="true">
                      Quality-aware
                    </div>
                    <div className="qr-mock-strategy">Shortest-hop</div>
                    <div className="qr-mock-strategy">Multi-metric</div>

                    <button
                      type="button"
                      className="qr-mock-run"
                      onClick={() => onLaunchSimulator('network')}
                    >
                      <Play size={11} fill="currentColor" aria-hidden="true" />
                      Run simulation
                    </button>
                  </div>

                  {/* Metrics */}
                  <div className="qr-mock-panel" data-focus={active === 2}>
                    <div className="qr-mock-panel-head">
                      <span>Route metrics</span>
                      <span className="qr-mock-ok">+75%</span>
                    </div>
                    <div className="qr-mock-metrics">
                      {METRICS.map((metric) => (
                        <div key={metric.label} className="qr-mock-metric">
                          <span className="qr-mock-metric-label">{metric.label}</span>
                          <span className="qr-mock-metric-value" style={{ color: metric.accent }}>
                            {metric.value}
                          </span>
                          <span className="qr-mock-metric-hint">{metric.hint}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="qr-mock-row">
                  <div className="qr-mock-panel" data-focus={active === 1}>
                    <div className="qr-mock-panel-head">
                      <span>Hop composition</span>
                      <span className="qr-mock-ok">∏ wₑ</span>
                    </div>
                    <div className="qr-mock-hops">
                      {HOPS.map((hop) => (
                        <div key={hop.label} className="qr-mock-hop">
                          <span className="qr-mock-hop-label">{hop.label}</span>
                          <span className="qr-mock-hop-bar">
                            <i style={{ width: `${hop.w * 100}%` }} />
                          </span>
                          <span className="qr-mock-hop-val">{hop.w.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="qr-mock-eq">
                      w<sub>path</sub> = 0.95 × 0.96 × 0.94 = 0.8574
                    </div>
                  </div>

                  <div className="qr-mock-panel" data-focus={active === 2}>
                    <div className="qr-mock-panel-head">
                      <span>OpenQASM 3.0</span>
                      <span>export</span>
                    </div>
                    <pre className="qr-mock-code">{`OPENQASM 3.0;
include "stdgates.inc";
qubit[2] q;
h q[0];
cx q[0], q[1];`}</pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="qr-showcase-caption" aria-live="polite">
              <span className="qr-showcase-caption-dot" aria-hidden="true" />
              {STEPS[active].caption}
            </div>
          </Reveal>
        </div>

        <div className="qr-showcase-steps">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              ref={(node) => {
                stepRefs.current[index] = node;
              }}
              className="qr-step"
              data-active={active === index}
              data-index={step.index}
            >
              <div className="qr-step-index">Step {step.index}</div>
              <h3 className="qr-card-title" style={{ fontSize: '1.35rem', marginTop: '0.5rem' }}>
                {step.title}
              </h3>
              <p className="qr-card-body" style={{ marginTop: '0.65rem' }}>
                {step.body}
              </p>
              <div className="qr-step-foot" aria-hidden="true">
                <div className="qr-step-meter">
                  <span />
                </div>
                <span className="qr-step-count">
                  {step.index} / 0{STEPS.length}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
