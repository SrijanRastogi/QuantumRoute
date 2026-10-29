import React, { useEffect, useRef, useState } from 'react';

type RevealVariant = 'up' | 'fade' | 'scale' | 'left' | 'right';

interface RevealProps {
  children: React.ReactNode;
  /** Delay in milliseconds, useful for staggering siblings. */
  delay?: number;
  variant?: RevealVariant;
  className?: string;
  /** Render as a different element, e.g. `li` or `section`. */
  as?: 'div' | 'section' | 'article' | 'li' | 'span' | 'header' | 'footer';
  once?: boolean;
  style?: React.CSSProperties;
  id?: string;
}

/**
 * View-triggered entrance. Uses IntersectionObserver as the baseline (works in
 * every browser) and only animates opacity/translate, so it stays cheap even
 * with dozens of revealed blocks.
 */
export const Reveal: React.FC<RevealProps> = ({
  children,
  delay = 0,
  variant = 'up',
  className,
  as = 'div',
  once = true,
  style,
  id,
}) => {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  const Tag = as as React.ElementType;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once]);

  return (
    <Tag
      ref={ref}
      id={id}
      className={`qr-reveal ${className ?? ''}`.trim()}
      data-variant={variant}
      data-inview={inView}
      style={{ ...style, ['--reveal-delay' as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
