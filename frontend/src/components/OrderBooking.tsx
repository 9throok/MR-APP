import { useState, useEffect, useMemo } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet, apiPost } from '../services/apiService'
import './OrderBooking.css'

interface Customer {
  id: number
  name: string
  type: 'doctor' | 'pharmacy' | 'distributor'
}

interface Product {
  id: number
  name: string  // e.g. "Derise 10mg"
}

interface OrderRow {
  id: string                // local row key
  productId: number | null  // -> product_id
  brand: string             // derived from product name (first word)
  product: string           // the full product name
  sku: string               // free-text — server stores this on the line
  price: number
  qty: number
}

interface BackendOrderLine {
  id: number
  product_id: number | null
  product_name: string
  sku: string | null
  quantity: number
  unit_price: string
  line_total: string
}

interface BackendOrder {
  id: number
  user_id: string
  customer_type: 'doctor' | 'pharmacy' | 'distributor'
  customer_name: string
  doctor_id: number | null
  pharmacy_id: number | null
  distributor_id: number | null
  order_date: string
  currency: string
  status: 'draft' | 'placed' | 'fulfilled' | 'cancelled'
  total_amount: string
  notes: string | null
  line_items?: BackendOrderLine[]
}

interface OrderBookingProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
}

// Derive brand from product name's leading token. Works for the seeded
// products ("Derise 10mg" -> "Derise"). Fallback to the full name.
function brandOf(productName: string): string {
  return (productName.split(' ')[0] || productName).trim()
}

function OrderBooking({ onLogout, onBack, userName, onNavigate }: OrderBookingProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [customerType, setCustomerType] = useState<'doctor' | 'pharmacy' | 'distributor' | ''>('')
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [orderRows, setOrderRows] = useState<OrderRow[]>([])
  const [showOrderTable, setShowOrderTable] = useState(false)

  const [doctors, setDoctors] = useState<Customer[]>([])
  const [pharmacies, setPharmacies] = useState<Customer[]>([])
  const [distributors, setDistributors] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [orderHistory, setOrderHistory] = useState<BackendOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [docsRes, pharmRes, distRes, prodRes, ordersRes] = await Promise.all([
        apiGet('/doctors'),
        apiGet('/pharmacies').catch(() => ({ data: [] })),
        apiGet('/distributors').catch(() => ({ data: [] })),
        apiGet('/products'),
        apiGet('/orders'),
      ])
      setDoctors((docsRes.data || []).map((d: { id: number; name: string }) => ({ id: d.id, name: d.name, type: 'doctor' as const })))
      setPharmacies((pharmRes.data || []).map((p: { id: number; name: string }) => ({ id: p.id, name: p.name, type: 'pharmacy' as const })))
      setDistributors((distRes.data || []).map((d: { id: number; name: string }) => ({ id: d.id, name: d.name, type: 'distributor' as const })))
      setProducts(prodRes.data || [])
      setOrderHistory(ordersRes.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  const handleMenuClick = () => setSidebarOpen(true)
  const handleSidebarClose = () => setSidebarOpen(false)

  // Distinct brand list derived from product names.
  const brands = useMemo(() => {
    const set = new Set<string>()
    for (const p of products) set.add(brandOf(p.name))
    return Array.from(set).sort()
  }, [products])

  const productsForBrand = (brand: string): Product[] =>
    products.filter(p => brandOf(p.name) === brand)

  const filteredCustomers: Customer[] = customerType === 'doctor'
    ? doctors
    : customerType === 'pharmacy'
      ? pharmacies
      : customerType === 'distributor'
        ? distributors
        : []

  const handleCustomerTypeChange = (type: 'doctor' | 'pharmacy' | 'distributor' | '') => {
    setCustomerType(type)
    setSelectedCustomer('')
    setShowOrderTable(false)
    setOrderRows([])
  }

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomer(customerId)
    setShowOrderTable(false)
    setOrderRows([])
  }

  const handleTakeOrder = () => {
    if (!selectedCustomer) return
    setShowOrderTable(true)
    if (orderRows.length === 0) {
      addOrderRow()
    }
  }

  const addOrderRow = () => {
    const newRow: OrderRow = {
      id: `row-${Date.now()}-${Math.random()}`,
      productId: null,
      brand: '',
      product: '',
      sku: '',
      price: 0,
      qty: 0,
    }
    setOrderRows(prev => [...prev, newRow])
  }

  const handleRowChange = (id: string, field: keyof OrderRow, value: string | number | null) => {
    setOrderRows(prev =>
      prev.map(row => {
        if (row.id !== id) return row
        const updated = { ...row, [field]: value } as OrderRow
        if (field === 'brand') {
          updated.product = ''
          updated.productId = null
          updated.sku = ''
        } else if (field === 'product') {
          // Resolve productId by name within this brand.
          const found = products.find(p => p.name === value)
          updated.productId = found?.id ?? null
          // Default the SKU to the product name unless user has typed one.
          if (!updated.sku) updated.sku = String(value)
        }
        return updated
      })
    )
  }

  const handleDeleteRow = (id: string) => {
    setOrderRows(prev => prev.filter(row => row.id !== id))
  }

  const handleConfirmOrder = async () => {
    if (!selectedCustomer || orderRows.length === 0) return

    const invalidRows = orderRows.filter(row => !row.brand || !row.product || row.price <= 0 || row.qty <= 0)
    if (invalidRows.length > 0) {
      setError('Each row needs a brand, product, price, and quantity.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const customerId = parseInt(selectedCustomer, 10)
      const body = {
        customer_type: customerType,
        customer_id: customerId,
        order_date: new Date().toISOString().slice(0, 10),
        currency: 'INR',
        notes: 'Created via mobile order booking',
        line_items: orderRows.map(row => ({
          product_id: row.productId ?? undefined,
          product_name: row.product,
          sku: row.sku || undefined,
          quantity: row.qty,
          unit_price: row.price,
        })),
      }
      const res = await apiPost('/orders', body)
      if ('queued' in res) {
        // Optimistic: prepend a synthetic queued row so the user sees it.
        const customer = filteredCustomers.find(c => c.id === customerId)
        const total = orderRows.reduce((sum, r) => sum + r.price * r.qty, 0)
        setOrderHistory(prev => [
          {
            id: -Date.now(),
            user_id: '',
            customer_type: customerType as 'doctor' | 'pharmacy' | 'distributor',
            customer_name: customer?.name || '',
            doctor_id: null, pharmacy_id: null, distributor_id: null,
            order_date: new Date().toISOString().slice(0, 10),
            currency: 'INR',
            status: 'placed',
            total_amount: String(total),
            notes: 'queued offline',
            line_items: orderRows.map((r, i) => ({
              id: -i,
              product_id: r.productId,
              product_name: r.product,
              sku: r.sku,
              quantity: r.qty,
              unit_price: String(r.price),
              line_total: String(r.price * r.qty),
            })),
          },
          ...prev,
        ])
      } else {
        await loadAll()
      }
      // Clear form
      setOrderRows([])
      setShowOrderTable(false)
      setSelectedCustomer('')
      setCustomerType('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div className="order-booking-container">
      <Header onLogout={onLogout} onMenuClick={handleMenuClick} onNavigateHome={() => onNavigate?.('home')} onNavigateOfflineRequests={() => onNavigate?.('offline-requests')} />
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} userName={userName} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="order-booking-content">
        <div className="order-booking-header">
          <button className="back-button" onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="order-booking-title">Order Booking</h1>
        </div>

        {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: 10, borderRadius: 6, margin: '8px 0' }}>{error}</div>}
        {loading && <div style={{ color: '#64748b', padding: 8 }}>Loading…</div>}

        <div className="order-booking-form">
          {/* Customer Type Selection */}
          <div className="form-section">
            <label className="form-label">Select Customer Type</label>
            <select
              className="form-select"
              value={customerType}
              onChange={(e) => handleCustomerTypeChange(e.target.value as 'doctor' | 'pharmacy' | 'distributor' | '')}
            >
              <option value="">Select Customer Type</option>
              <option value="doctor">Doctor</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="distributor">Distributor</option>
            </select>
          </div>

          {/* Customer Selection */}
          {customerType && (
            <div className="form-section">
              <label className="form-label">Select {customerType.charAt(0).toUpperCase() + customerType.slice(1)}</label>
              <select
                className="form-select"
                value={selectedCustomer}
                onChange={(e) => handleCustomerChange(e.target.value)}
              >
                <option value="">Select {customerType.charAt(0).toUpperCase() + customerType.slice(1)}</option>
                {filteredCustomers.map((customer) => (
                  <option key={customer.id} value={customer.id.toString()}>
                    {customer.name}
                  </option>
                ))}
              </select>
              {filteredCustomers.length === 0 && (
                <p style={{ marginTop: 6, color: '#64748b', fontSize: 13 }}>No {customerType}s found in your territory.</p>
              )}
            </div>
          )}

          {/* Take Order Button */}
          {selectedCustomer && !showOrderTable && (
            <div className="form-section">
              <button
                type="button"
                className="take-order-btn"
                onClick={handleTakeOrder}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11M5 9H19L20 21H4L5 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Take Order</span>
              </button>
            </div>
          )}

          {/* Order Table */}
          {showOrderTable && (
            <div className="form-section">
              <div className="order-table-wrapper">
                <table className="order-table">
                  <thead>
                    <tr>
                      <th>Brand</th>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Price</th>
                      <th>Qty</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderRows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <select
                            className="order-select"
                            value={row.brand}
                            onChange={(e) => handleRowChange(row.id, 'brand', e.target.value)}
                          >
                            <option value="">Select Brand</option>
                            {brands.map((brand) => (
                              <option key={brand} value={brand}>{brand}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            className="order-select"
                            value={row.product}
                            onChange={(e) => handleRowChange(row.id, 'product', e.target.value)}
                            disabled={!row.brand}
                          >
                            <option value="">Select Product</option>
                            {row.brand && productsForBrand(row.brand).map((product) => (
                              <option key={product.id} value={product.name}>{product.name}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="order-input"
                            value={row.sku}
                            onChange={(e) => handleRowChange(row.id, 'sku', e.target.value)}
                            placeholder="SKU"
                            disabled={!row.product}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="order-input"
                            min="0"
                            step="0.01"
                            value={row.price || ''}
                            onChange={(e) => handleRowChange(row.id, 'price', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="order-input"
                            min="0"
                            step="1"
                            value={row.qty || ''}
                            onChange={(e) => handleRowChange(row.id, 'qty', parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </td>
                        <td>
                          <div className="action-buttons">
                            {orderRows.length > 1 && (
                              <button
                                type="button"
                                className="delete-btn"
                                onClick={() => handleDeleteRow(row.id)}
                                title="Delete Row"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                            )}
                            {row.id === orderRows[orderRows.length - 1].id && (
                              <button
                                type="button"
                                className="add-row-btn"
                                onClick={addOrderRow}
                                title="Add Row"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Confirm Order Button */}
          {showOrderTable && orderRows.length > 0 && (
            <div className="form-actions">
              <button
                type="button"
                className="confirm-order-btn"
                onClick={handleConfirmOrder}
                disabled={submitting}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{submitting ? 'Placing…' : 'Confirm Order'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Order History Section */}
        {orderHistory.length > 0 && (
          <div className="order-history-section">
            <h2 className="section-title">Order History</h2>
            <div className="order-history-list">
              {orderHistory.map((order) => {
                const items = order.line_items || []
                const total = parseFloat(order.total_amount) || 0
                return (
                  <div key={order.id} className="order-history-item">
                    <div className="order-history-header">
                      <div>
                        <h3 className="order-history-customer">{order.customer_name}</h3>
                        <p className="order-history-type">
                          {order.customer_type.charAt(0).toUpperCase() + order.customer_type.slice(1)} · {order.status}
                        </p>
                        <p className="order-history-date">{formatDate(order.order_date)}</p>
                      </div>
                      <div className="order-total">
                        <span className="total-label">Total:</span>
                        <span className="total-value">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    {items.length > 0 && (
                      <div className="order-history-table-wrapper">
                        <table className="order-history-table">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>SKU</th>
                              <th>Price</th>
                              <th>Qty</th>
                              <th>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item) => (
                              <tr key={item.id}>
                                <td>{item.product_name}</td>
                                <td>{item.sku || '-'}</td>
                                <td>₹{parseFloat(item.unit_price).toFixed(2)}</td>
                                <td>{item.quantity}</td>
                                <td>₹{parseFloat(item.line_total).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default OrderBooking
