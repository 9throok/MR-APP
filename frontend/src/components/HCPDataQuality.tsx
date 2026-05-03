import { useState, useEffect } from 'react'
import { Sparkles, Users, AlertTriangle, FileWarning, Building2 } from 'lucide-react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet, apiPost, apiPatch } from '../services/apiService'
import './KnowledgeUpload.css'
import './admin/AdminUI.css'
import {
  Badge,
  Banner,
  DataTable,
  Modal,
  StatCard,
  type DataTableColumn,
} from './admin'

interface HCPDataQualityProps {
  onLogout: () => void
  onBack: () => void
  userName: string
  onNavigate: (page: string) => void
}

interface Counters {
  total_doctors: number
  doctors_without_affiliation: number
  doctors_without_taxonomy_code: number
  doctors_never_enriched: number
  total_institutions: number
}

interface DoctorRow {
  id: number
  name: string
  specialty?: string | null
  territory?: string | null
  last_enriched_at?: string | null
}

interface DupeGroup {
  name_key: string
  territory: string | null
  occurrences: number
  doctor_ids: number[]
}

interface EnrichSuggestion {
  specialty_code: string
  confidence: 'high' | 'medium' | 'low'
  likely_credentials: string[]
  likely_hospital_type: string
  enrichment_notes: string
  data_quality_flags: string[]
}

const confidenceTone = (c: string) => c === 'high' ? 'success' : c === 'medium' ? 'warning' : 'muted'

function HCPDataQuality({ onLogout, onBack, userName, onNavigate }: HCPDataQualityProps) {
  const [counters, setCounters] = useState<Counters | null>(null)
  const [missingAffil, setMissingAffil] = useState<DoctorRow[]>([])
  const [missingSpec, setMissingSpec] = useState<DoctorRow[]>([])
  const [freeText, setFreeText] = useState<DoctorRow[]>([])
  const [dupes, setDupes] = useState<DupeGroup[]>([])
  const [stale, setStale] = useState<DoctorRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // enrich modal state
  const [enrichDoctor, setEnrichDoctor] = useState<DoctorRow | null>(null)
  const [enrichLoading, setEnrichLoading] = useState(false)
  const [enrichError, setEnrichError] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState<EnrichSuggestion | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiGet('/hcp/data-quality')
      setCounters(res.data?.counters || null)
      setMissingAffil(res.data?.missing_affiliation || [])
      setMissingSpec(res.data?.missing_specialty || [])
      setFreeText(res.data?.free_text_specialty || [])
      setDupes(res.data?.duplicate_candidates || [])
      setStale(res.data?.stale_profiles || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const runEnrich = async (doc: DoctorRow) => {
    setEnrichDoctor(doc)
    setSuggestion(null)
    setEnrichError(null)
    setEnrichLoading(true)
    try {
      const res = await apiPost(`/hcp/enrich/${doc.id}`, {})
      setSuggestion(res.data?.suggestion || null)
    } catch (err) {
      setEnrichError(err instanceof Error ? err.message : 'Enrichment failed')
    } finally {
      setEnrichLoading(false)
    }
  }

  const persistEnrich = async (apply: boolean) => {
    if (!enrichDoctor || !suggestion) return
    setEnrichLoading(true)
    setEnrichError(null)
    try {
      await apiPatch(`/hcp/enrich/${enrichDoctor.id}`, { suggestion, apply_specialty: apply })
      setEnrichDoctor(null)
      await load()
    } catch (err) {
      setEnrichError(err instanceof Error ? err.message : 'Failed to persist')
    } finally {
      setEnrichLoading(false)
    }
  }

  const baseDoctorColumns = (showSpecialty: boolean, showLastEnriched: boolean): DataTableColumn<DoctorRow>[] => {
    const cols: DataTableColumn<DoctorRow>[] = [
      {
        key: 'name',
        label: 'Name',
        render: d => <span style={{ fontWeight: 600 }}>{d.name}</span>,
      },
      {
        key: 'territory',
        label: 'Territory',
        width: '160px',
        render: d => <span className="cell-muted">{d.territory || '—'}</span>,
      },
    ]
    if (showSpecialty) {
      cols.push({
        key: 'specialty',
        label: 'Specialty (free-text)',
        render: d => <span className="cell-muted">{d.specialty || '—'}</span>,
      })
    }
    if (showLastEnriched) {
      cols.push({
        key: 'last_enriched_at',
        label: 'Last enriched',
        width: '140px',
        render: d => d.last_enriched_at
          ? <span className="cell-muted">{new Date(d.last_enriched_at).toLocaleDateString('en-IN')}</span>
          : <Badge tone="warning">Never</Badge>,
      })
    }
    cols.push({
      key: 'action',
      label: '',
      width: '110px',
      align: 'right',
      render: d => (
        <button onClick={e => { e.stopPropagation(); runEnrich(d) }} className="btn btn-secondary btn-sm">
          <Sparkles size={12} /> AI enrich
        </button>
      ),
    })
    return cols
  }

  const dupeColumns: DataTableColumn<DupeGroup>[] = [
    {
      key: 'name_key',
      label: 'Name (lower)',
      render: g => <span style={{ fontWeight: 600 }}>{g.name_key}</span>,
    },
    {
      key: 'territory',
      label: 'Territory',
      width: '160px',
      render: g => <span className="cell-muted">{g.territory || '—'}</span>,
    },
    {
      key: 'occurrences',
      label: 'Count',
      width: '90px',
      align: 'right',
      className: 'cell-num',
      render: g => g.occurrences,
    },
    {
      key: 'doctor_ids',
      label: 'Doctor IDs',
      render: g => <span className="cell-muted">{g.doctor_ids.join(', ')}</span>,
    },
  ]

  return (
    <div className="knowledge-page">
      <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} onNavigateHome={onBack} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} onNavigate={onNavigate} onLogout={onLogout} currentPage="hcp-data-quality" />

      <div className="knowledge-content">
        <div className="admin-page-intro">
          <div>
            <h2 className="admin-page-title">HCP Data Quality</h2>
            <p className="admin-page-lead">
              Curation dashboard for the doctor master data — flags missing affiliations, free-text specialties, duplicate candidates, and stale profiles. AI enrichment suggests fixes.
            </p>
          </div>
        </div>

        {error && <div className="admin-error">{error}</div>}

        {counters && (
          <div className="admin-stat-grid">
            <StatCard
              label="Total doctors"
              value={counters.total_doctors}
              icon={<Users size={12} />}
            />
            <StatCard
              label="No affiliation"
              value={counters.doctors_without_affiliation}
              icon={<AlertTriangle size={12} />}
              tone={counters.doctors_without_affiliation > 0 ? 'warning' : 'default'}
            />
            <StatCard
              label="No taxonomy code"
              value={counters.doctors_without_taxonomy_code}
              icon={<FileWarning size={12} />}
              tone={counters.doctors_without_taxonomy_code > 0 ? 'warning' : 'default'}
            />
            <StatCard
              label="Never enriched"
              value={counters.doctors_never_enriched}
              icon={<Sparkles size={12} />}
              tone={counters.doctors_never_enriched > 0 ? 'warning' : 'default'}
            />
            <StatCard
              label="Total institutions"
              value={counters.total_institutions}
              icon={<Building2 size={12} />}
            />
          </div>
        )}

        <div className="admin-stack">
          <Section title="Missing affiliation" hint="Doctors with no row in hcp_affiliations." count={missingAffil.length}>
            <DataTable
              columns={baseDoctorColumns(false, false)}
              rows={missingAffil}
              rowKey={d => d.id}
              empty="All doctors have at least one affiliation."
            />
          </Section>

          <Section title="Free-text specialty" hint="Existing specialty string doesn't map to taxonomy. Run AI enrichment to normalise." count={freeText.length}>
            <DataTable
              columns={baseDoctorColumns(true, false)}
              rows={freeText}
              rowKey={d => d.id}
              empty="All specialties resolve to the taxonomy."
            />
          </Section>

          <Section title="No specialty at all" hint="Doctors with neither a specialty string nor a taxonomy code." count={missingSpec.length}>
            <DataTable
              columns={baseDoctorColumns(false, false)}
              rows={missingSpec}
              rowKey={d => d.id}
              empty="Every doctor has a specialty recorded."
            />
          </Section>

          <Section title="Duplicate candidates" hint="Doctors sharing (name, territory). Manually merge via the Clients page." count={dupes.length}>
            <DataTable
              columns={dupeColumns}
              rows={dupes}
              rowKey={g => g.name_key + (g.territory || '')}
              empty="No duplicate candidates detected."
            />
          </Section>

          <Section title="Stale profiles" hint="Never enriched, or enriched more than 180 days ago." count={stale.length}>
            <DataTable
              columns={baseDoctorColumns(false, true)}
              rows={stale}
              rowKey={d => d.id}
              empty="All profiles are recent."
            />
          </Section>
        </div>

        {loading && <div className="admin-helper-text" style={{ marginTop: 12 }}>Loading…</div>}
      </div>

      <Modal
        open={!!enrichDoctor}
        onClose={() => setEnrichDoctor(null)}
        title={enrichDoctor ? `AI Enrichment — ${enrichDoctor.name}` : ''}
        subtitle={enrichDoctor ? `${enrichDoctor.specialty || 'no specialty'} · ${enrichDoctor.territory || 'no territory'}` : undefined}
        footer={suggestion ? (
          <>
            <button onClick={() => persistEnrich(true)} disabled={enrichLoading} className="btn btn-primary btn-sm">
              Apply specialty + persist
            </button>
            <button onClick={() => persistEnrich(false)} disabled={enrichLoading} className="btn btn-secondary btn-sm">
              Persist notes only
            </button>
            <span className="admin-modal-footer-spacer" />
            <button onClick={() => setEnrichDoctor(null)} className="btn btn-ghost btn-sm">Cancel</button>
          </>
        ) : (
          <>
            <span className="admin-modal-footer-spacer" />
            <button onClick={() => setEnrichDoctor(null)} className="btn btn-secondary btn-sm">Close</button>
          </>
        )}
      >
        {enrichError && <div className="admin-error">{enrichError}</div>}
        {enrichLoading && !suggestion && <div className="admin-helper-text">Calling LLM…</div>}
        {suggestion && (
          <div className="admin-stack-sm">
            <Banner tone="info" icon={<Sparkles size={16} />}>
              <div className="admin-stack-sm">
                <div className="admin-row" style={{ gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Specialty code</div>
                    <Badge tone="info">{suggestion.specialty_code}</Badge>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Confidence</div>
                    <Badge tone={confidenceTone(suggestion.confidence)}>{suggestion.confidence}</Badge>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Hospital type</div>
                    <span style={{ fontSize: 13 }}>{suggestion.likely_hospital_type}</span>
                  </div>
                </div>
                <div>
                  <strong>Likely credentials:</strong> {(suggestion.likely_credentials || []).join(', ') || '—'}
                </div>
                <div>
                  <strong>Notes:</strong> {suggestion.enrichment_notes}
                </div>
                {suggestion.data_quality_flags && suggestion.data_quality_flags.length > 0 && (
                  <div>
                    <strong>Flags:</strong> {suggestion.data_quality_flags.join(', ')}
                  </div>
                )}
              </div>
            </Banner>
          </div>
        )}
      </Modal>
    </div>
  )
}

function Section({ title, hint, count, children }: { title: string; hint?: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="admin-card">
      <div className="admin-row-spread" style={{ marginBottom: 4 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{title}</h3>
        {count != null && <span className="admin-count-pill">{count}</span>}
      </div>
      {hint && <div className="admin-helper-text">{hint}</div>}
      {children}
    </div>
  )
}

export default HCPDataQuality
