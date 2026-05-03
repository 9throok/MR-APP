import type { ReactNode } from 'react';

interface ToolbarProps {
  children: ReactNode;
}

interface ToolbarFieldProps {
  label?: string;
  children: ReactNode;
}

interface ToolbarCountProps {
  n: number;
  noun?: string;
}

/**
 * Filter / search bar that sits above admin lists. Children are arranged
 * inline with consistent spacing.
 *
 *   <Toolbar>
 *     <Toolbar.Field label="Status"><select ... /></Toolbar.Field>
 *     <Toolbar.Field label="Severity"><select ... /></Toolbar.Field>
 *     <Toolbar.Spacer />
 *     <Toolbar.Count n={42} noun="finding" />
 *   </Toolbar>
 */
function Toolbar({ children }: ToolbarProps) {
  return <div className="admin-toolbar">{children}</div>;
}

function Field({ label, children }: ToolbarFieldProps) {
  return (
    <label className="admin-row" style={{ gap: 8 }}>
      {label && <span className="admin-toolbar-label">{label}</span>}
      {children}
    </label>
  );
}

function Spacer() {
  return <span className="admin-toolbar-spacer" />;
}

function Count({ n, noun = 'item' }: ToolbarCountProps) {
  const plural = n === 1 ? noun : `${noun}s`;
  return <span className="admin-count-pill">{n} {plural}</span>;
}

Toolbar.Field = Field;
Toolbar.Spacer = Spacer;
Toolbar.Count = Count;

export default Toolbar;
