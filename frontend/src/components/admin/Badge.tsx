import type { ReactNode } from 'react';
import type { BadgeTone } from './tones';

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/**
 * Pill component for status / severity / tier / category labels.
 * Tone defaults to "neutral". Pass an icon (e.g. lucide <Check size={11} />)
 * to render to the left of the label.
 */
export default function Badge({ tone = 'neutral', children, icon, className = '' }: BadgeProps) {
  return (
    <span className={`admin-badge tone-${tone} ${className}`.trim()}>
      {icon}
      {children}
    </span>
  );
}
