import type { ReactNode } from 'react';

type StatTone = 'default' | 'warning' | 'danger' | 'success';

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: StatTone;
}

/**
 * Single counter card for the top-of-page stats grid.
 * Auto-applies a tone (border + background tint) when value is "warning"
 * or "danger" via the parent's choice.
 */
export default function StatCard({ label, value, hint, icon, tone = 'default' }: StatCardProps) {
  const toneClass = tone !== 'default' ? `tone-${tone}` : '';
  return (
    <div className={`admin-stat-card ${toneClass}`.trim()}>
      <div className="admin-stat-label">
        {icon}
        {label}
      </div>
      <div className="admin-stat-value">{value}</div>
      {hint != null && <div className="admin-stat-hint">{hint}</div>}
    </div>
  );
}
