import type { ReactNode, CSSProperties } from 'react';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'right' | 'center';
  className?: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  loading?: boolean;
}

/**
 * Generic, typed table used across the admin pages. Replaces the bespoke
 * `<table style={{ borderCollapse: 'collapse' }}>` blocks.
 */
export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  empty,
  loading,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="admin-empty">
        <div className="admin-empty-title">Loading…</div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="admin-empty">
        {typeof empty === 'string' || empty == null ? (
          <>
            <div className="admin-empty-title">Nothing to show</div>
            <p className="admin-empty-hint">{empty || 'No matching rows for the current filters.'}</p>
          </>
        ) : (
          empty
        )}
      </div>
    );
  }

  return (
    <div className="admin-table-wrap">
      <table className={`admin-table${onRowClick ? ' row-clickable' : ''}`}>
        <thead>
          <tr>
            {columns.map(col => {
              const style: CSSProperties = {};
              if (col.width) style.width = col.width;
              if (col.align) style.textAlign = col.align;
              return (
                <th key={col.key} style={style}>{col.label}</th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map(col => {
                const style: CSSProperties = {};
                if (col.align) style.textAlign = col.align;
                return (
                  <td key={col.key} className={col.className} style={style}>
                    {col.render
                      ? col.render(row)
                      : (row as unknown as Record<string, ReactNode>)[col.key] ?? '—'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
