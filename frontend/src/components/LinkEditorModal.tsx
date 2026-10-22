import React, { useState, useEffect } from 'react';
import type { NetworkEdge } from '../types';
import { X, Sliders, RotateCcw, Check, Sparkles, AlertCircle } from 'lucide-react';

interface LinkEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  edge: NetworkEdge | null;
  defaultEdge: NetworkEdge | null;
  onSave: (source: string, target: string, distance_km: number, w: number) => void;
  onResetLink: (source: string, target: string) => void;
}

export const LinkEditorModal: React.FC<LinkEditorModalProps> = ({
  isOpen,
  onClose,
  edge,
  defaultEdge,
  onSave,
  onResetLink,
}) => {
  const [distance, setDistance] = useState<number>(100);
  const [w, setW] = useState<number>(0.95);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync internal form state whenever selected edge changes
  useEffect(() => {
    if (edge) {
      setDistance(edge.distance_km);
      setW(edge.w);
      setValidationError(null);
    }
  }, [edge]);

  if (!isOpen || !edge) return null;

  // Compare against saved edge values
  const hasUnsavedChanges = Math.abs(distance - edge.distance_km) > 1e-4 || Math.abs(w - edge.w) > 1e-4;

  // Compare against original preset defaults
  const isModifiedFromDefault = defaultEdge
    ? Math.abs(edge.distance_km - defaultEdge.distance_km) > 1e-4 || Math.abs(edge.w - defaultEdge.w) > 1e-4
    : false;

  const estimatedDelayMs = distance * 0.005; // 5.0 µs/km = 0.005 ms/km
  const bellFidelity = (1.0 + 3.0 * w) / 4.0;

  const handleSave = () => {
    if (isNaN(distance) || distance <= 0) {
      setValidationError('Distance must be a positive number greater than 0 km.');
      return;
    }
    if (isNaN(w) || w < 0.0 || w > 1.0) {
      setValidationError('Werner quality parameter w must be between 0.00 and 1.00.');
      return;
    }
    setValidationError(null);
    onSave(edge.source, edge.target, distance, w);
    onClose();
  };

  const handleResetToDefault = () => {
    if (defaultEdge) {
      setDistance(defaultEdge.distance_km);
      setW(defaultEdge.w);
      onResetLink(edge.source, edge.target);
      onClose();
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 110,
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'rgba(18, 11, 36, 0.96)',
          border: '1px solid var(--accent-fuchsia)',
          boxShadow: '0 0 50px rgba(192, 38, 211, 0.35)',
          padding: '1.75rem',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#fff',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
          <div 
            style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '8px', 
              background: 'var(--gradient-primary)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(192, 38, 211, 0.5)'
            }}
          >
            <Sliders size={18} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                Edit Network Link
              </span>
              {isModifiedFromDefault && (
                <span 
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '10px',
                    background: 'rgba(234, 179, 8, 0.15)',
                    border: '1px solid rgba(234, 179, 8, 0.4)',
                    color: '#facc15'
                  }}
                >
                  Customized
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--accent-fuchsia)', fontWeight: 600 }}>
              {edge.source} ↔ {edge.target}
            </div>
          </div>
        </div>

        {validationError && (
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.65rem 0.85rem',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '0.8rem',
              marginBottom: '1.0rem'
            }}
          >
            <AlertCircle size={16} />
            <span>{validationError}</span>
          </div>
        )}

        {/* Form Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', marginBottom: '1.5rem' }}>
          
          {/* Parameter 1: Distance (km) */}
          <div style={{ background: 'var(--bg-card-alt)', padding: '1.0rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                Link Distance
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <input 
                  type="number"
                  min="1"
                  max="5000"
                  step="5"
                  value={distance}
                  onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '0.35rem 0.55rem',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.9rem',
                    width: '85px',
                    textAlign: 'right'
                  }}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>km</span>
              </div>
            </div>

            <input 
              type="range"
              min="10"
              max="1000"
              step="5"
              value={distance}
              onChange={(e) => setDistance(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-fuchsia)', margin: '0.4rem 0' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span>Estimated Propagation Delay: <b style={{ color: '#fff' }}>{estimatedDelayMs.toFixed(2)} ms</b></span>
              <span>Model: 5.0 µs/km</span>
            </div>
          </div>

          {/* Parameter 2: Werner Quality Parameter w_e */}
          <div style={{ background: 'var(--bg-card-alt)', padding: '1.0rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', display: 'block' }}>
                  Werner Quality Parameter (w<sub>e</sub>)
                </label>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  State quality of shared Bell pair ρ<sub>W</sub>(w)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <input 
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={w}
                  onChange={(e) => setW(parseFloat(e.target.value))}
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '0.35rem 0.55rem',
                    color: '#34d399',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    width: '75px',
                    textAlign: 'right'
                  }}
                />
              </div>
            </div>

            <input 
              type="range"
              min="0.0"
              max="1.0"
              step="0.01"
              value={w}
              onChange={(e) => setW(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#34d399', margin: '0.4rem 0' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '0.45rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>
                Resulting Bell Fidelity: <b style={{ color: 'var(--accent-fuchsia)' }}>{bellFidelity.toFixed(4)}</b>
              </span>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                F<sub>e</sub> = (1 + 3w) / 4
              </span>
            </div>

            {/* Beginner-friendly explanation */}
            <div 
              style={{ 
                background: 'rgba(147, 51, 234, 0.1)', 
                border: '1px solid rgba(168, 85, 247, 0.2)', 
                borderRadius: '6px', 
                padding: '0.55rem 0.75rem', 
                fontSize: '0.74rem', 
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
                display: 'flex',
                gap: '0.45rem',
                alignItems: 'flex-start'
              }}
            >
              <Sparkles size={14} color="var(--accent-fuchsia)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <b>Understanding w<sub>e</sub>:</b> A value closer to <b>1.00</b> represents a higher-quality entangled link with low noise. Values near <b>0.00</b> represent complete decoherence (unusable link).
              </div>
            </div>
          </div>

        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div>
            {defaultEdge && (
              <button 
                onClick={handleResetToDefault}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '0.6rem 0.9rem',
                  color: 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Restore this link's default preset values"
              >
                <RotateCcw size={13} />
                Reset to Default
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button 
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '0.6rem 1.0rem',
                color: 'var(--text-secondary)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button 
              onClick={handleSave}
              className="btn-primary"
              style={{
                padding: '0.6rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.82rem'
              }}
            >
              <Check size={16} />
              Save Changes {hasUnsavedChanges && '•'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LinkEditorModal;
