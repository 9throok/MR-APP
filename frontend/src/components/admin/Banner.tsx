import type { ReactNode } from 'react';

interface BannerProps {
  tone?: 'info' | 'warning' | 'success' | 'danger';
  icon?: ReactNode;
  title?: ReactNode;
  children: ReactNode;
}

/**
 * Inline alert / callout used for "expiring within 60 days" / AI-draft
 * highlight / safety-flag patterns.
 */
export default function Banner({ tone = 'info', icon, title, children }: BannerProps) {
  return (
    <div className={`admin-banner tone-${tone}`}>
      {icon && <span className="admin-banner-icon">{icon}</span>}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <div className="admin-banner-title">{title}</div>}
        <div>{children}</div>
      </div>
    </div>
  );
}
