import { useState } from 'react'
import {
  PAGE_CONTENT,
  BACK_BUTTON,
  PAGE_TITLE,
  CARD,
  SEARCH_INPUT,
  TABLE_WRAPPER,
  TABLE,
  TABLE_HEAD,
  TABLE_TH,
  TABLE_TD,
  TABLE_ROW,
  EMPTY_STATE,
  EMPTY_TITLE,
} from '../styles/designSystem'

interface InventoryItem {
  id: number
  brand: string
  product: string
  quantity: number
  batchNumber: string
  expiryDate: string
  distributor: string
}

const inventoryData: InventoryItem[] = [
  {
    id: 1,
    brand: 'ZenApp',
    product: 'CardioMax 500mg',
    quantity: 150,
    batchNumber: 'ZA-2025-001',
    expiryDate: '2027-06-30',
    distributor: 'MediDistributors Pvt Ltd',
  },
  {
    id: 2,
    brand: 'ZenApp',
    product: 'AntibioPro 250mg',
    quantity: 200,
    batchNumber: 'ZA-2025-002',
    expiryDate: '2026-12-31',
    distributor: 'HealthCare Supplies',
  },
  {
    id: 3,
    brand: 'Virbac',
    product: 'DiabetoCare 1000mg',
    quantity: 180,
    batchNumber: 'VB-2025-015',
    expiryDate: '2027-03-15',
    distributor: 'Pharma Distributors',
  },
  {
    id: 4,
    brand: 'Virbac',
    product: 'RespiraMax 400mg',
    quantity: 120,
    batchNumber: 'VB-2025-016',
    expiryDate: '2026-11-20',
    distributor: 'MedEquip Distributors',
  },
  {
    id: 5,
    brand: 'ZenApp',
    product: 'PainRelief 200mg',
    quantity: 95,
    batchNumber: 'ZA-2025-003',
    expiryDate: '2027-01-10',
    distributor: 'MediDistributors Pvt Ltd',
  },
  {
    id: 6,
    brand: 'Virbac',
    product: 'NeuroCare 500mg',
    quantity: 110,
    batchNumber: 'VB-2025-017',
    expiryDate: '2027-08-25',
    distributor: 'HealthCare Supplies',
  },
  {
    id: 7,
    brand: 'ZenApp',
    product: 'PediatriCare 100mg',
    quantity: 175,
    batchNumber: 'ZA-2025-004',
    expiryDate: '2026-09-30',
    distributor: 'Pharma Distributors',
  },
  {
    id: 8,
    brand: 'Virbac',
    product: 'GastroRelief 300mg',
    quantity: 140,
    batchNumber: 'VB-2025-018',
    expiryDate: '2027-04-18',
    distributor: 'MedEquip Distributors',
  },
  {
    id: 9,
    brand: 'ZenApp',
    product: 'DermatoCare 250mg',
    quantity: 85,
    batchNumber: 'ZA-2025-005',
    expiryDate: '2026-10-15',
    distributor: 'MediDistributors Pvt Ltd',
  },
  {
    id: 10,
    brand: 'Virbac',
    product: 'OncoCare 1000mg',
    quantity: 60,
    batchNumber: 'VB-2025-019',
    expiryDate: '2027-07-22',
    distributor: 'HealthCare Supplies',
  },
]

interface SamplesProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
}

function Samples({ onLogout: _onLogout, onBack, userName: _userName, onNavigate: _onNavigate }: SamplesProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredInventory = inventoryData.filter(item => {
    const matchesSearch =
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.distributor.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <div className={PAGE_CONTENT}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button className={BACK_BUTTON} onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className={PAGE_TITLE}>Sample Management</h1>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search by brand, product, batch number, or distributor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={SEARCH_INPUT}
          />
        </div>
      </div>

      <div className={`${CARD} overflow-hidden`}>
        <div className={TABLE_WRAPPER}>
          <table className={TABLE}>
            <thead className={TABLE_HEAD}>
              <tr>
                <th className={TABLE_TH}>Brand</th>
                <th className={TABLE_TH}>Product</th>
                <th className={TABLE_TH}>Quantity</th>
                <th className={TABLE_TH}>Batch Number</th>
                <th className={TABLE_TH}>Expiry Date</th>
                <th className={TABLE_TH}>Distributor</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className={EMPTY_STATE}>
                      <p className={EMPTY_TITLE}>No inventory found matching your search criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr key={item.id} className={TABLE_ROW}>
                    <td className={TABLE_TD}>{item.brand}</td>
                    <td className={TABLE_TD}>{item.product}</td>
                    <td className={TABLE_TD}>{item.quantity}</td>
                    <td className={TABLE_TD}>{item.batchNumber}</td>
                    <td className={TABLE_TD}>{item.expiryDate}</td>
                    <td className={TABLE_TD}>{item.distributor}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Samples
