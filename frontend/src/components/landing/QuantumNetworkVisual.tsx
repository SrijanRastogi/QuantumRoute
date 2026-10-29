import React from 'react';

export const QuantumNetworkVisual: React.FC = () => {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '480px',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #140b26 0%, #050505 100%)',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.55), inset 0 0 35px rgba(147, 51, 234, 0.16)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.25rem',
      }}
      className="dotted-grid-bg qr-dark-surface"
    >
      {/* Ambient Sweeping Glow in Background */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-20%',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(217, 70, 239, 0.25) 0%, rgba(147, 51, 234, 0.12) 50%, transparent 70%)',
          filter: 'blur(45px)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Header Card Inside Visual */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 2,
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--surface-inset)',
            border: '1px solid rgba(147, 51, 234, 0.35)',
            borderRadius: '20px',
            padding: '4px 12px',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: 'var(--color-success)',
              boxShadow: '0 0 8px var(--color-success)',
            }}
          />
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
            Live Dijkstra Optimal Path
          </span>
        </div>

        <div
          style={{
            background: 'var(--surface-inset)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '20px',
            padding: '4px 10px',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-info)',
            backdropFilter: 'blur(8px)',
          }}
        >
          w_path = 0.8574 · F_e = 0.8931
        </div>
      </div>

      {/* Central SVG Quantum Network Canvas */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
        }}
      >
        <svg
          viewBox="0 0 520 380"
          style={{
            width: '100%',
            height: '100%',
            maxHeight: '360px',
            overflow: 'visible',
          }}
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="activeRouteGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-info)" />
              <stop offset="50%" stopColor="var(--accent-violet)" />
              <stop offset="100%" stopColor="var(--color-warning)" />
            </linearGradient>

            <radialGradient id="nodeAliceGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--color-info)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--color-info)" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="nodeBobGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--color-warning)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--color-warning)" stopOpacity="0" />
            </radialGradient>

            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Inactive Topology Links (Faint dashed lines) */}
          <g stroke="rgba(147, 51, 234, 0.22)" strokeWidth="1.5" strokeDasharray="4 4">
            <line x1="60" y1="210" x2="160" y2="310" /> {/* Alice -> RepB */}
            <line x1="180" y1="90" x2="160" y2="310" />  {/* RepA -> RepB */}
            <line x1="180" y1="90" x2="330" y2="80" />   {/* RepA -> RepC */}
            <line x1="160" y1="310" x2="460" y2="210" /> {/* RepB -> Bob */}
            <line x1="330" y1="80" x2="350" y2="300" />  {/* RepC -> RepD */}
            <line x1="330" y1="80" x2="460" y2="210" />  {/* RepC -> Bob */}
          </g>

          {/* Active Optimal Route Links: Alice (60, 210) -> RepA (180, 90) -> RepD (350, 300) -> Bob (460, 210) */}
          <g filter="url(#glowEffect)">
            {/* Background solid route stroke */}
            <path
              id="activeRoutePath"
              d="M 60 210 L 180 90 L 350 300 L 460 210"
              fill="none"
              stroke="url(#activeRouteGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />

            {/* Glowing animated pulse stroke */}
            <path
              d="M 60 210 L 180 90 L 350 300 L 460 210"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeDasharray="20 180"
              strokeLinecap="round"
              style={{
                animation: 'packetTravel 2.4s linear infinite',
              }}
            />
          </g>

          {/* Traveling Photon Wave Packet 1 */}
          <circle r="4.5" fill="var(--color-info)" filter="url(#glowEffect)">
            <animateMotion
              path="M 60 210 L 180 90 L 350 300 L 460 210"
              dur="2.8s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Traveling Photon Wave Packet 2 (Offset phase) */}
          <circle r="4.0" fill="var(--accent-magenta)" filter="url(#glowEffect)">
            <animateMotion
              path="M 60 210 L 180 90 L 350 300 L 460 210"
              dur="2.8s"
              begin="1.4s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Nodes */}

          {/* Intermediate Relay: Repeater B */}
          <g transform="translate(160, 310)">
            <circle r="14" fill="rgba(139, 92, 246, 0.15)" />
            <circle r="7" fill="var(--accent-violet)" />
            <text x="0" y="22" textAnchor="middle" fill="currentColor" fontSize="9" fontFamily="var(--font-mono)">
              Repeater β
            </text>
          </g>

          {/* Intermediate Relay: Repeater C */}
          <g transform="translate(330, 80)">
            <circle r="14" fill="rgba(217, 70, 239, 0.15)" />
            <circle r="7" fill="var(--accent-magenta)" />
            <text x="0" y="-14" textAnchor="middle" fill="currentColor" fontSize="9" fontFamily="var(--font-mono)">
              Repeater γ
            </text>
          </g>

          {/* Active Route Relay: Repeater A */}
          <g transform="translate(180, 90)">
            <circle r="22" fill="rgba(168, 85, 247, 0.2)" className="pulse-blue" />
            <circle r="15" fill="rgba(168, 85, 247, 0.35)" />
            <circle r="9" fill="var(--accent-violet)" filter="url(#glowEffect)" />
            <circle r="3.5" fill="currentColor" />
            <text x="0" y="-18" textAnchor="middle" fill="var(--accent-magenta)" fontSize="10.5" fontWeight="700" fontFamily="var(--font-mono)">
              Repeater α
            </text>
            <text x="0" y="-7" textAnchor="middle" fill="currentColor" fontSize="8" fontFamily="var(--font-mono)">
              w=0.95 · BSM
            </text>
          </g>

          {/* Active Route Relay: Repeater D */}
          <g transform="translate(350, 300)">
            <circle r="22" fill="rgba(192, 38, 211, 0.2)" className="pulse-blue" />
            <circle r="15" fill="rgba(192, 38, 211, 0.35)" />
            <circle r="9" fill="var(--accent-magenta)" filter="url(#glowEffect)" />
            <circle r="3.5" fill="currentColor" />
            <text x="0" y="24" textAnchor="middle" fill="var(--accent-magenta)" fontSize="10.5" fontWeight="700" fontFamily="var(--font-mono)">
              Repeater δ
            </text>
            <text x="0" y="35" textAnchor="middle" fill="currentColor" fontSize="8" fontFamily="var(--font-mono)">
              w=0.95 · BSM
            </text>
          </g>

          {/* Endpoint Source: Alice */}
          <g transform="translate(60, 210)">
            {/* Outer animated halo */}
            <circle r="30" fill="url(#nodeAliceGlow)" className="pulse-blue" />
            <circle r="18" fill="rgba(56, 189, 248, 0.25)" />
            <circle r="11" fill="var(--color-info)" filter="url(#glowEffect)" />
            <circle r="4.5" fill="currentColor" />

            {/* Label badge */}
            <text x="0" y="27" textAnchor="middle" fill="var(--color-info)" fontSize="12" fontWeight="800">
              Alice
            </text>
            <text x="0" y="39" textAnchor="middle" fill="currentColor" fontSize="8.5" fontFamily="var(--font-mono)">
              Source |ψ⟩
            </text>
          </g>

          {/* Endpoint Destination: Bob */}
          <g transform="translate(460, 210)">
            {/* Outer animated halo */}
            <circle r="30" fill="url(#nodeBobGlow)" className="pulse-amber" />
            <circle r="18" fill="rgba(245, 158, 11, 0.25)" />
            <circle r="11" fill="var(--color-warning)" filter="url(#glowEffect)" />
            <circle r="4.5" fill="currentColor" />

            {/* Label badge */}
            <text x="0" y="27" textAnchor="middle" fill="var(--color-warning)" fontSize="12" fontWeight="800">
              Bob
            </text>
            <text x="0" y="39" textAnchor="middle" fill="currentColor" fontSize="8.5" fontFamily="var(--font-mono)">
              Target |ψ'⟩
            </text>
          </g>
        </svg>
      </div>

      {/* Bottom Status Bar Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.65rem',
          zIndex: 2,
          position: 'relative',
        }}
      >
        <div
          style={{
            background: 'var(--surface-inset)',
            border: '1px solid rgba(147, 51, 234, 0.25)',
            borderRadius: '10px',
            padding: '0.45rem 0.65rem',
          }}
        >
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Route Distance</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            3 Hops · 510 km
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface-inset)',
            border: '1px solid rgba(147, 51, 234, 0.25)',
            borderRadius: '10px',
            padding: '0.45rem 0.65rem',
          }}
        >
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Teleport Fidelity</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-info)', fontFamily: 'var(--font-mono)' }}>
            F_tel = 0.9287
          </div>
        </div>

        <div
          style={{
            background: 'var(--surface-inset)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            padding: '0.45rem 0.65rem',
          }}
        >
          <div style={{ fontSize: '0.65rem', color: 'var(--color-success)' }}>BSM Verification</div>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--color-success)' }} />
            Qiskit Aer Verified
          </div>
        </div>
      </div>
    </div>
  );
};
