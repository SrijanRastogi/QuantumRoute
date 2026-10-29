import React from 'react';

interface AmbientBackdropProps {
  variant?: 'landing' | 'lab';
}

/**
 * Decorative hairline field with slow travelling light pulses. Purely CSS so it
 * stays on the compositor; hidden from assistive tech and static when the user
 * asks for reduced motion.
 */
export const AmbientBackdrop: React.FC<AmbientBackdropProps> = ({ variant = 'landing' }) => {
  return (
    <div className={`qr-ambient qr-ambient--${variant}`} aria-hidden="true">
      <div className="qr-ambient-lines" />
      <div className="qr-ambient-rows" />
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div key={n} className={`qr-ambient-beam qr-ambient-beam--${n}`} />
      ))}
      <div className="qr-ambient-horizon" />
      <div className="qr-ambient-grain" />
    </div>
  );
};

export default AmbientBackdrop;
