// Barrel export for the shared admin UI kit. Import the CSS once at the top
// of any consuming page (or once globally), then use the components.
//
//   import './admin/AdminUI.css';
//   import { Badge, StatCard, DataTable, Modal, Banner, Toolbar } from './admin';

export { default as Badge } from './Badge';
export { default as StatCard } from './StatCard';
export { default as DataTable } from './DataTable';
export type { DataTableColumn } from './DataTable';
export { default as Modal } from './Modal';
export { default as Banner } from './Banner';
export { default as Toolbar } from './Toolbar';
export * from './tones';
