import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet, apiPost, apiPatch } from '../services/apiService'
import './KnowledgeUpload.css'

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

function HCPDataQuality({ onLogout, onBack, userName, onNavigate }: HCPDataQualityProps) {
  const [counters, setCounters] = useState<Counters | null>(null)
  const [missingAffil, setMissingAffil] = useState<DoctorRow[]>([])
  const [missingSpec, setMissingSpec] = useState<DoctorRow[]>([])
  // missingSpec is shown alongside freeText in the same section because both
  // share the same fix (run AI enrichment to assign specialty_code).
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

  return (
    <div className="knowledge-page">
      <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} onNavigateHome={onBack} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} onNavigate={onNavigate} onLogout={onLogout} currentPage="hcp-data-quality" />

      <div className="knowledge-content">
        <div className="entries-section">
          <h2 style={{ marginTop: 0 }}>HCP Data Quality</h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Curation dashboard for the doctor master data — flags missing affiliations, free-text specialties, duplicate candidates, and stale profiles. AI enrichment suggests fixes.</p>

          {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}
          {loading && <div>Loading…</div>}

          {counters && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
              <Counter label="Total doctors" value={counters.total_doctors} />
              <Counter label="No affiliation" value={counters.doctors_without_affiliation} warn />
              <Counter label="No taxonomy code" value={counters.doctors_without_taxonomy_code} warn />
              <Counter label="Never enriched" value={counters.doctors_never_enriched} warn />
              <Counter label="Total institutions" value={counters.total_institutions} />
            </div>
          )}

          <Section title={`Missing affiliation (${missingAffil.length})`} hint="Doctors with no row in hcp_affiliations.">
            <DoctorTable rows={missingAffil} onEnrich={runEnrich} />
          </Section>

          <Section title={`Free-text specialty (${freeText.length})`} hint="Existing specialty string doesn't map to taxonomy. Run AI enrichment to normalise.">
            <DoctorTable rows={freeText} onEnrich={runEnrich} showSpecialty />
          </Section>

          <Section title={`No specialty at all (${missingSpec.length})`} hint="Doctors with neither a specialty string nor a taxonomy code.">
            <DoctorTable rows={missingSpec} onEnrich={runEnrich} />
          </Section>

          <Section title={`Duplicate candidates (${dupes.length})`} hint="Doctors sharing (name, territory). Manually merge via the Clients page.">
            {dupes.length === 0 ? <div style={{ color: '#6b7280' }}>None detected.</div> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}><th style={{ padding: 6 }}>Name (lower)</th><th style={{ padding: 6 }}>Territory</th><th style={{ padding: 6 }}>Count</th><th style={{ padding: 6 }}>Doctor IDs</th></tr></thead>
                <tbody>{dupes.map((g, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: 6 }}>{g.name_key}</td>
                    <td style={{ padding: 6 }}>{g.territory || '—'}</td>
                    <td style={{ padding: 6 }}>{g.occurrences}</td>
                    <td style={{ padding: 6 }}>{g.doctor_ids.join(', ')}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </Section>

          <Section title={`Stale profiles (${stale.length})`} hint="Never enriched, or enriched > 180 days ago.">
            <DoctorTable rows={stale} onEnrich={runEnrich} showLastEnriched />
          </Section>
        </div>

        {/* Enrich modal */}
        {enrichDoctor && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setEnrichDoctor(null)}>
            <div style={{ background: 'white', maxWidth: 600, width: '100%', maxHeight: '90vh', overflow: 'auto', borderRadius: 8, padding: 24 }} onClick={ev => ev.stopPropagation()}>
              <h3 style={{ marginTop: 0 }}>AI Enrichment — {enrichDoctor.name}</h3>
              {enrichError && <div style={{ color: '#b91c1c', marginBottom: 12, fontSize: 13 }}>{enrichError}</div>}
              {enrichLoading && <div>Calling LLM…</div>}
              {suggestion && (
                <div>
                  <div style={{ marginBottom: 12 }}><strong>Specialty code:</strong> {suggestion.specialty_code} <span style={{ color: '#6b7280' }}>(confidence {suggestion.confidence})</span></div>
                  <div style={{ marginBottom: 12 }}><strong>Likely hospital type:</strong> {suggestion.likely_hospital_type}</div>
                  <div style={{ marginBottom: 12 }}><strong>Likely credentials:</strong> {(suggestion.likely_credentials || []).join(', ') || '—'}</div>
                  <div style={{ marginBottom: 12 }}><strong>Notes:</strong> {suggestion.enrichment_notes}</div>
                  {suggestion.data_quality_flags && suggestion.data_quality_flags.length > 0 && (
                    <div style={{ marginBottom: 12, fontSize: 13, color: '#b45309' }}>Flags: {suggestion.data_quality_flags.join(', ')}</div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                    <button onClick={() => persistEnrich(true)} disabled={enrichLoading} style={{ padding: '8px 14px', background: '#15803d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Apply specialty + persist</button>
                    <button onClick={() => persistEnrich(false)} disabled={enrichLoading} style={{ padding: '8px 14px', background: '#374151', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Persist notes only</button>
                    <button onClick={() => setEnrichDoctor(null)} style={{ padding: '8px 14px', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer', marginLeft: 'auto' }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Counter({ label, value, warn = false }: { label: string; value: number; warn?: boolean }) {
  return (
    <div style={{ padding: 12, background: '#f9fafb', border: `1px solid ${warn && value > 0 ? '#fcd34d' : '#e5e7eb'}`, borderRadius: 6 }}>
      <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: warn && value > 0 ? '#b45309' : '#111827' }}>{value}</div>
    </div>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ marginBottom: 4 }}>{title}</h3>
      {hint && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{hint}</div>}
      {children}
    </div>
  )
}

function DoctorTable({ rows, onEnrich, showSpecialty = false, showLastEnriched = false }: {
  rows: DoctorRow[]
  onEnrich: (d: DoctorRow) => void
  showSpecialty?: boolean
  showLastEnriched?: boolean
}) {
  if (rows.length === 0) return <div style={{ color: '#6b7280' }}>None.</div>
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
          <th style={{ padding: 6 }}>Name</th>
          <th style={{ padding: 6 }}>Territory</th>
          {showSpecialty && <th style={{ padding: 6 }}>Specialty (free-text)</th>}
          {showLastEnriched && <th style={{ padding: 6 }}>Last enriched</th>}
          <th style={{ padding: 6 }}></th>
        </tr>
      </thead>
      <tbody>
        {rows.map(d => (
          <tr key={d.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
            <td style={{ padding: 6 }}>{d.name}</td>
            <td style={{ padding: 6 }}>{d.territory || '—'}</td>
            {showSpecialty && <td style={{ padding: 6 }}>{d.specialty || '—'}</td>}
            {showLastEnriched && <td style={{ padding: 6 }}>{d.last_enriched_at ? new Date(d.last_enriched_at).toLocaleDateString('en-IN') : 'never'}</td>}
            <td style={{ padding: 6 }}>
              <button onClick={() => onEnrich(d)} style={{ background: 'none', border: '1px solid #d1d5db', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>AI enrich</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default HCPDataQuality
