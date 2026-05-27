import { useState, useEffect } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { SIIncrement } from '../types'
import './SIIncrements.css'

type Props = { currentUser?: any }

export default function SIIncrements({ currentUser }: Props) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [viewOnly, setViewOnly] = useState(false)
  const [formData, setFormData] = useState<Partial<SIIncrement>>({
    status: 'Pending',
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [shopQuery, setShopQuery] = useState('')
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All')

  const siIncrements = useQuery(api.siIncrements.listSIIncrements)
  const shopNames = useQuery(api.shopNames.listShopNames)
  const createSIIncrement = useMutation(api.siIncrements.createSIIncrement)
  const updateSIIncrement = useMutation(api.siIncrements.updateSIIncrement)
  const deleteSIIncrement = useMutation(api.siIncrements.deleteSIIncrement)

  const availableShopNames = shopNames ?? []
  const filteredShopNames = availableShopNames.filter((shop: any) => {
    const query = shopQuery.trim().toLowerCase()
    if (!query) return true
    const tokens = query.split(/\s+/)
    const label = String(shop.shopName || '').toLowerCase()
    return tokens.every((token) =>
      label.split(/\s+/).some((word: string) => word.includes(token)),
    )
  })

  const selectShopName = (shopName: string) => {
    setFormData({ ...formData, shopName })
    setShopQuery(shopName)
    setShopDropdownOpen(false)
  }

  const handleShopSearchChange = (value: string) => {
    setShopQuery(value)
    setFormData({ ...formData, shopName: value })
    setShopDropdownOpen(true)
  }

  const getTanzaniaDateTime = (): Date => {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Dar_es_Salaam',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    const parts = formatter.formatToParts(now)
    const year = parts.find((p) => p.type === 'year')?.value || '2026'
    const month = parts.find((p) => p.type === 'month')?.value || '01'
    const day = parts.find((p) => p.type === 'day')?.value || '01'
    const hour = parts.find((p) => p.type === 'hour')?.value || '00'
    const minute = parts.find((p) => p.type === 'minute')?.value || '00'
    const second = parts.find((p) => p.type === 'second')?.value || '00'
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+03:00`)
  }

  const getCurrentDateRange = () => {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Dar_es_Salaam',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour12: false,
    })
    const parts = formatter.formatToParts(now)
    const year = parseInt(parts.find((p) => p.type === 'year')?.value || '2026')
    const month = parseInt(parts.find((p) => p.type === 'month')?.value || '1') - 1
    const day = parseInt(parts.find((p) => p.type === 'day')?.value || '1')
    
    const startOfDay = new Date(year, month, day, 0, 0, 0)
    const endOfDay = new Date(year, month, day, 23, 59, 59)
    return { start: startOfDay.getTime(), end: endOfDay.getTime() }
  }

  const isCurrentDate = (timestamp: number): boolean => {
    const range = getCurrentDateRange()
    return timestamp >= range.start && timestamp <= range.end
  }

  const canModify = currentUser?.role && currentUser.role !== 'Staff'

  const isStaff = currentUser?.role === 'Staff'

  useEffect(() => {
    if (isStaff) {
      setStatusFilter('Pending')
    }
  }, [isStaff])

  const handleOpenNewForm = () => {
    setEditingId(null)
    setViewOnly(false)
    setFormData({
      requestee: currentUser?.username || '',
      status: 'Pending',
      requestedDate: getTanzaniaDateTime(),
    })
    setShopQuery('')
    setShopDropdownOpen(false)
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        requestee: formData.requestee || '',
        requestedDate:
          (formData.requestedDate as Date | undefined)?.getTime() ||
          getTanzaniaDateTime().getTime(),
        shopName: formData.shopName || '',
        amount: formData.amount || 0,
        approver: formData.approver || '',
        status: formData.status as 'Pending' | 'Approved' | 'Rejected',
        approverComments: formData.approverComments || '',
        dateApproved: formData.dateApproved
          ? (formData.dateApproved as Date).getTime()
          : undefined,
      }
      if (editingId) {
        await updateSIIncrement({ id: editingId as any, ...payload })
      } else {
        await createSIIncrement(payload)
      }
      setFormData({ status: 'Pending' })
      setEditingId(null)
      setIsFormOpen(false)
    } catch (error) {
      console.error('Error creating SI Increment:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this SI Increment?')) {
      try {
        await deleteSIIncrement({ id: id as any })
      } catch (error) {
        console.error('Error deleting SI Increment:', error)
      }
    }
  }

  const handleEdit = (item: any, readOnly = false) => {
    setIsFormOpen(true)
    setViewOnly(readOnly)
    setEditingId(String(item._id ?? item.id))
    setFormData({
      requestee: item.requestee,
      requestedDate: new Date(item.requestedDate),
      shopName: item.shopName,
      amount: item.amount,
      approver: item.approver,
      status: item.status,
      approverComments: item.approverComments,
      dateApproved: item.dateApproved ? new Date(item.dateApproved) : undefined,
    })
    setShopQuery(item.shopName)
    setShopDropdownOpen(false)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TZS' }).format(value)
  }

  const visibleItems = (siIncrements || []).filter((item: any) => {
    const q = searchTerm.trim().toLowerCase()
    const matchesSearch = !q || [item.requestee, item.shopName, item.approver]
      .some((f) => (f || '').toString().toLowerCase().includes(q))
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter
    const isToday = isCurrentDate(item.requestedDate)
    return matchesSearch && matchesStatus && isToday
  })

  return (
    <div className="si-increments-container">
      <div className="header-section">
        <div>
          <h2>SI Increments</h2>
          <p className="muted">Create and manage SI increment requests</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <input
              placeholder="Search requestee, shop or approver"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
              {(isStaff ? ['Pending'] : ['All', 'Pending', 'Approved', 'Rejected']).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <button
            className="btn-primary"
            onClick={() => (isFormOpen ? setIsFormOpen(false) : handleOpenNewForm())}
          >
            {isFormOpen ? 'Cancel' : '+ New SI Increment'}
          </button>
        </div>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="form-card">
          <div className="form-grid">
            <div className="form-group">
              <label>Requestee</label>
              <input
                type="text"
                value={formData.requestee || ''}
                onChange={(e) => setFormData({ ...formData, requestee: e.target.value })}
                readOnly={viewOnly}
                required
              />
            </div>
            <div className="form-group searchable-dropdown">
              <label>Shop Name</label>
              <input
                type="text"
                value={shopQuery}
                onChange={(e) => handleShopSearchChange(e.target.value)}
                onFocus={() => setShopDropdownOpen(true)}
                onBlur={() => setTimeout(() => setShopDropdownOpen(false), 150)}
                disabled={viewOnly}
                placeholder={
                  shopNames && shopNames.length > 0
                    ? 'Search shop name'
                    : 'No shop names available'
                }
                required
              />
              {shopDropdownOpen && (
                <ul className="searchable-dropdown-list">
                  {filteredShopNames.length > 0 ? (
                    filteredShopNames.map((shop: any) => (
                      <li
                        key={String(shop._id ?? shop.id)}
                        className="searchable-dropdown-item"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectShopName(shop.shopName)}
                      >
                        {shop.shopName}
                      </li>
                    ))
                  ) : (
                    <li className="searchable-dropdown-empty">No matching shop names</li>
                  )}
                </ul>
              )}
            </div>
            <div className="form-group">
              <label>Amount</label>
              <input
                type="number"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                readOnly={viewOnly}
                required
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status || 'Pending'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as 'Pending' | 'Approved' | 'Rejected',
                  })
                }
                disabled={viewOnly}
              >
                {(isStaff ? ['Pending'] : ['Pending', 'Approved', 'Rejected']).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="form-group full-width">
              <label>Approver's Comments</label>
              <textarea
                value={formData.approverComments || ''}
                onChange={(e) => setFormData({ ...formData, approverComments: e.target.value })}
                readOnly={viewOnly}
              />
            </div>
          </div>
          <div className="form-actions">
            {!viewOnly && (
              <button type="submit" className="btn-primary">
                Submit
              </button>
            )}
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsFormOpen(false)}
            >
              {viewOnly ? 'Close' : 'Cancel'}
            </button>
          </div>
        </form>
      )}

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Requestee</th>
              <th>Requested Date</th>
              <th>Shop Name</th>
              <th>Amount</th>
              <th>Approver</th>
              <th>Status</th>
              <th>Comments</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems && visibleItems.length > 0 ? (
              visibleItems.map((item: any) => (
                <tr key={String(item._id ?? item.id)}>
                  <td className="mono">{item.requestee}</td>
                  <td>
                    {new Date(item.requestedDate).toLocaleString('en-US', {
                      timeZone: 'Africa/Dar_es_Salaam',
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td>{item.shopName}</td>
                  <td>{formatCurrency(item.amount)}</td>
                  <td>{item.approver || '-'}</td>
                  <td>
                    <span className={`badge badge-${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>{item.approverComments || '-'}</td>
                  <td>
                    <button
                      className="icon-btn"
                      title="View"
                      onClick={() => handleEdit(item, true)}
                    >
                      🔍
                    </button>
                    {canModify && (
                      <>
                        <button
                          className="icon-btn"
                          title="Edit"
                          onClick={() => handleEdit(item, false)}
                        >
                          ✏️
                        </button>
                        <button
                          className="icon-btn delete"
                          title="Delete"
                          onClick={() => handleDelete(String(item._id ?? item.id))}
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center">
                  No SI Increments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
