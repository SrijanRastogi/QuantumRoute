import React, { useMemo } from 'react';
import katex from 'katex';

interface MathViewProps {
  math: string;
  block?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const MathView: React.FC<MathViewProps> = ({
  math,
  block = false,
  className = '',
  style = {},
}) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
        output: 'htmlAndMathml',
      });
    } catch (e) {
      console.error('KaTeX rendering error:', e);
      return `<span class="katex-error">${math}</span>`;
    }
  }, [math, block]);

  if (block) {
    return (
      <div
        className={`math-block ${className}`}
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          padding: '0.65rem 0.85rem',
          margin: '0.35rem 0',
          textAlign: 'center',
          ...style,
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={`math-inline ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export const MathBlock: React.FC<{
  math: string;
  className?: string;
  style?: React.CSSProperties;
}> = (props) => <MathView {...props} block={true} />;

export const MathInline: React.FC<{
  math: string;
  className?: string;
  style?: React.CSSProperties;
}> = (props) => <MathView {...props} block={false} />;

interface EquationCardProps {
  title: string;
  badge?: string;
  math: string;
  description?: React.ReactNode;
  accentColor?: string;
  variables?: Array<{ symbol: string; meaning: string }>;
}

export const EquationCard: React.FC<EquationCardProps> = ({
  title,
  badge,
  math,
  description,
  accentColor = 'var(--color-info)',
  variables,
}) => {
  return (
    <div
      style={{
        background: 'linear-gradient(180deg, var(--surface-inset) 0%, rgba(10, 15, 30, 0.7) 100%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '10px',
        padding: '1.1rem 1.25rem',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: accentColor, letterSpacing: '-0.01em' }}>
          {title}
        </div>
        {badge && (
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'var(--surface-1)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            {badge}
          </span>
        )}
      </div>

      <div
        style={{
          background: 'var(--surface-inset)',
          border: '1px solid var(--border-faint)',
          borderRadius: '8px',
          padding: '0.85rem 1rem',
          margin: '0.5rem 0 0.75rem',
          color: 'var(--text-primary)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <MathBlock math={math} style={{ margin: 0, padding: 0 }} />
      </div>

      {description && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '0.5rem' }}>
          {description}
        </div>
      )}

      {variables && variables.length > 0 && (
        <div
          style={{
            marginTop: '0.75rem',
            paddingTop: '0.65rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem 1.25rem',
            fontSize: '0.72rem',
          }}
        >
          {variables.map((v, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MathInline math={v.symbol} style={{ color: 'var(--color-info)' }} />
              <span style={{ color: 'var(--text-muted)' }}>: {v.meaning}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MathView;
