import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import './OrderBooking.css'

interface Customer {
  id: number
  name: string
  type: 'doctor' | 'pharmacy' | 'distributor'
}

interface OrderRow {
  id: string
  brand: string
  product: string
  sku: string
  price: number
  qty: number
}

interface OrderHistoryItem {
  id: string
  customerType: string
  customerName: string
  items: OrderRow[]
  date: string
  total: number
}

interface OrderBookingProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
}

// Customer data - same as Clients component
const customers: Customer[] = [
  // Doctors
  { id: 1, name: 'Dr. Anil Doshi', type: 'doctor' },
  { id: 2, name: 'Dr. Navin Chaddha', type: 'doctor' },
  { id: 3, name: 'Dr. Surbhi Rel', type: 'doctor' },
  { id: 4, name: 'Dr. Naresh Patil', type: 'doctor' },
  { id: 5, name: 'Dr. Surekha Rane', type: 'doctor' },
  { id: 6, name: 'Dr. Rajesh Kumar', type: 'doctor' },
  { id: 7, name: 'Dr. Priya Sharma', type: 'doctor' },
  { id: 8, name: 'Dr. Amit Verma', type: 'doctor' },
  // Pharmacy
  { id: 9, name: 'MedPlus Pharmacy', type: 'pharmacy' },
  { id: 10, name: 'Apollo Pharmacy', type: 'pharmacy' },
  { id: 11, name: 'Wellness Forever', type: 'pharmacy' },
  { id: 12, name: 'Guardian Pharmacy', type: 'pharmacy' },
  { id: 13, name: 'Health Plus Pharmacy', type: 'pharmacy' },
  { id: 14, name: 'Care Pharmacy', type: 'pharmacy' },
  // Distributors
  { id: 15, name: 'MediDistributors Pvt Ltd', type: 'distributor' },
  { id: 16, name: 'HealthCare Supplies', type: 'distributor' },
  { id: 17, name: 'Pharma Distributors', type: 'distributor' },
  { id: 18, name: 'MedEquip Distributors', type: 'distributor' },
  { id: 19, name: 'Global Medical Supplies', type: 'distributor' },
]

// Brand, Product, SKU data structure
const brands = ['Derise', 'Rilast', 'Bevaas']

const productsByBrand: Record<string, string[]> = {
  'Derise': ['Derise 10mg', 'Derise 20mg', 'Derise 50mg'],
  'Rilast': ['Rilast Tablet', 'Rilast Capsule', 'Rilast Syrup'],
  'Bevaas': ['Bevaas 5mg', 'Bevaas 10mg', 'Bevaas 20mg'],
}

const skusByProduct: Record<string, string[]> = {
  'Derise 10mg': ['SKU-DER-10-001', 'SKU-DER-10-002', 'SKU-DER-10-003'],
  'Derise 20mg': ['SKU-DER-20-001', 'SKU-DER-20-002', 'SKU-DER-20-003'],
  'Derise 50mg': ['SKU-DER-50-001', 'SKU-DER-50-002', 'SKU-DER-50-003'],
  'Rilast Tablet': ['SKU-RIL-TAB-001', 'SKU-RIL-TAB-002'],
  'Rilast Capsule': ['SKU-RIL-CAP-001', 'SKU-RIL-CAP-002'],
  'Rilast Syrup': ['SKU-RIL-SYR-001', 'SKU-RIL-SYR-002'],
  'Bevaas 5mg': ['SKU-BEV-5-001', 'SKU-BEV-5-002'],
  'Bevaas 10mg': ['SKU-BEV-10-001', 'SKU-BEV-10-002'],
  'Bevaas 20mg': ['SKU-BEV-20-001', 'SKU-BEV-20-002'],
}

function OrderBooking({ onLogout, onBack, userName, onNavigate }: OrderBookingProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [customerType, setCustomerType] = useState<'doctor' | 'pharmacy' | 'distributor' | ''>('')
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [orderRows, setOrderRows] = useState<OrderRow[]>([])
  const [showOrderTable, setShowOrderTable] = useState(false)
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([])

  useEffect(() => {
    // Load order history from localStorage
    try {
      const savedHistory = localStorage.getItem('orderHistory')
      if (savedHistory) {
        setOrderHistory(JSON.parse(savedHistory))
      }
    } catch (error) {
      console.error('Error loading order history:', error)
    }
  }, [])

  const handleMenuClick = () => {
    setSidebarOpen(true)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  const filteredCustomers = customerType
    ? customers.filter(c => c.type === customerType)
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
    if (!selectedCustomer) {
      return
    }
    setShowOrderTable(true)
    if (orderRows.length === 0) {
      addOrderRow()
    }
  }

  const addOrderRow = () => {
    const newRow: OrderRow = {
      id: `row-${Date.now()}-${Math.random()}`,
      brand: '',
      product: '',
      sku: '',
      price: 0,
      qty: 0,
    }
    setOrderRows([...orderRows, newRow])
  }

  const handleRowChange = (id: string, field: keyof OrderRow, value: string | number) => {
    setOrderRows(prev =>
      prev.map(row => {
        if (row.id === id) {
          const updated = { ...row, [field]: value }
          // Reset dependent fields when parent changes
          if (field === 'brand') {
            updated.product = ''
            updated.sku = ''
          } else if (field === 'product') {
            updated.sku = ''
          }
          return updated
        }
        return row
      })
    )
  }

  const handleDeleteRow = (id: string) => {
    setOrderRows(prev => prev.filter(row => row.id !== id))
  }

  const getProductsForBrand = (brand: string): string[] => {
    return productsByBrand[brand] || []
  }

  const getSkusForProduct = (product: string): string[] => {
    return skusByProduct[product] || []
  }

  const handleConfirmOrder = () => {
    if (!selectedCustomer) {
      return
    }
    if (orderRows.length === 0) {
      return
    }
    
    // Validate all rows
    const invalidRows = orderRows.filter(row => !row.brand || !row.product || !row.sku || row.price <= 0 || row.qty <= 0)
    if (invalidRows.length > 0) {
      return
    }

    const customer = customers.find(c => c.id.toString() === selectedCustomer)
    const total = orderRows.reduce((sum, row) => sum + (row.price * row.qty), 0)

    const orderData: OrderHistoryItem = {
      id: `order-${Date.now()}`,
      customerType: customerType,
      customerName: customer?.name || '',
      items: [...orderRows],
      date: new Date().toISOString(),
      total: total,
    }

    // Add to history
    const newHistory = [orderData, ...orderHistory]
    setOrderHistory(newHistory)

    // Save to localStorage
    try {
      localStorage.setItem('orderHistory', JSON.stringify(newHistory))
    } catch (error) {
      console.error('Error saving order history:', error)
    }

    // Clear form
    setOrderRows([])
    setShowOrderTable(false)
    setSelectedCustomer('')
    setCustomerType('')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
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
                            {row.brand && getProductsForBrand(row.brand).map((product) => (
                              <option key={product} value={product}>{product}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            className="order-select"
                            value={row.sku}
                            onChange={(e) => handleRowChange(row.id, 'sku', e.target.value)}
                            disabled={!row.product}
                          >
                            <option value="">Select SKU</option>
                            {row.product && getSkusForProduct(row.product).map((sku) => (
                              <option key={sku} value={sku}>{sku}</option>
                            ))}
                          </select>
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
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Confirm Order</span>
              </button>
            </div>
          )}
        </div>

        {/* Order History Section */}
        {orderHistory.length > 0 && (
          <div className="order-history-section">
            <h2 className="section-title">Order History</h2>
            <div className="order-history-list">
              {orderHistory.map((order) => (
                <div key={order.id} className="order-history-item">
                  <div className="order-history-header">
                    <div>
                      <h3 className="order-history-customer">{order.customerName}</h3>
                      <p className="order-history-type">{order.customerType.charAt(0).toUpperCase() + order.customerType.slice(1)}</p>
                      <p className="order-history-date">{formatDate(order.date)}</p>
                    </div>
                    <div className="order-total">
                      <span className="total-label">Total:</span>
                      <span className="total-value">₹{order.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  <div className="order-history-table-wrapper">
                    <table className="order-history-table">
                      <thead>
                        <tr>
                          <th>Brand</th>
                          <th>Product</th>
                          <th>SKU</th>
                          <th>Price</th>
                          <th>Qty</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.brand}</td>
                            <td>{item.product}</td>
                            <td>{item.sku}</td>
                            <td>₹{item.price.toFixed(2)}</td>
                            <td>{item.qty}</td>
                            <td>₹{(item.price * item.qty).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default OrderBooking
