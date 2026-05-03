// Centralised mapping from domain status/severity tokens → visual Badge tones.
// Single source of truth; replaces the per-file STATUS_COLOR / SEVERITY_COLOR
// hex-code objects that used to live in each Phase B/C admin page.

export type BadgeTone =
  | 'neutral'
  | 'muted'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'purple';

// ── Compliance findings ────────────────────────────────────────────────────
export const findingStatusTone: Record<string, BadgeTone> = {
  open: 'danger',
  acknowledged: 'warning',
  dismissed: 'muted',
  escalated: 'danger',
  resolved: 'success',
};

export const severityTone: Record<string, BadgeTone> = {
  low: 'muted',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
};

export const detectedByTone: Record<string, BadgeTone> = {
  ai: 'purple',
  rule: 'info',
  human: 'neutral',
};

// ── Medical queries ────────────────────────────────────────────────────────
export const queryStatusTone: Record<string, BadgeTone> = {
  open: 'danger',
  in_review: 'warning',
  answered: 'info',
  sent: 'success',
  closed_no_action: 'muted',
};

export const urgencyTone: Record<string, BadgeTone> = {
  low: 'muted',
  standard: 'neutral',
  high: 'warning',
  critical: 'danger',
};

// ── KOL profiles ───────────────────────────────────────────────────────────
export const kolTierTone: Record<string, BadgeTone> = {
  T1: 'success',
  T2: 'info',
  T3: 'neutral',
  emerging: 'purple',
};

export const sentimentTone = (score: number | null | undefined): BadgeTone => {
  if (score == null) return 'muted';
  if (score >= 1) return 'success';
  if (score <= -1) return 'danger';
  return 'neutral';
};

// ── Engagements ────────────────────────────────────────────────────────────
export const engagementStatusTone: Record<string, BadgeTone> = {
  planned: 'info',
  confirmed: 'success',
  completed: 'neutral',
  cancelled: 'muted',
};

// ── Consent ────────────────────────────────────────────────────────────────
export const consentStatusTone: Record<string, BadgeTone> = {
  granted: 'success',
  revoked: 'danger',
  withdrawn: 'warning',
};

// ── Regulatory documents ───────────────────────────────────────────────────
export const docStatusTone: Record<string, BadgeTone> = {
  active: 'success',
  superseded: 'muted',
  retired: 'muted',
  archived: 'muted',
};

// ── Adverse events ─────────────────────────────────────────────────────────
export const aeStatusTone: Record<string, BadgeTone> = {
  pending: 'warning',
  reviewed: 'info',
  confirmed: 'danger',
  dismissed: 'muted',
};

// ── Generic helpers ────────────────────────────────────────────────────────
/**
 * Format an enum-style token (e.g. "in_review", "T1", "marketing_email")
 * into a human label ("In Review", "T1", "Marketing email").
 */
export function humanise(token: string | null | undefined): string {
  if (!token) return '—';
  return token
    .toString()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
