import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { SIIncrement } from '../types'
import './SIIncrements.css'

const getCurrentDateValue = (): string => {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Dar_es_Salaam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(now)
  const year = parts.find((p) => p.type === 'year')?.value || '2026'
  const month = parts.find((p) => p.type === 'month')?.value || '01'
  const day = parts.find((p) => p.type === 'day')?.value || '01'
  return `${year}-${month}-${day}`
}

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
  const [fromDate, setFromDate] = useState(getCurrentDateValue())
  const [toDate, setToDate] = useState(getCurrentDateValue())
  const [notification, setNotification] = useState<string | null>(null)

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

  const canModify = currentUser?.role && currentUser.role !== 'Staff'

  const isStaff = currentUser?.role === 'Staff'
  const isManager = currentUser?.role === 'Manager'
  const [commentsDraft, setCommentsDraft] = useState<Record<string, string>>({})
  const prevSIIncrementIds = useRef<string[]>([])
  const managerNotificationEnabled = isManager

  useEffect(() => {
    if (!siIncrements) {
      prevSIIncrementIds.current = []
      return
    }

    const currentIds = siIncrements.map((item: any) => String(item._id ?? item.id))
    if (managerNotificationEnabled && prevSIIncrementIds.current.length > 0) {
      const newIds = currentIds.filter((id) => !prevSIIncrementIds.current.includes(id))
      const newStaffRequest = newIds.some((id) => {
        const item = siIncrements.find((entry: any) => String(entry._id ?? entry.id) === id)
        return item?.requesteeRole === 'Staff' || item?.requestee !== currentUser?.username
      })
      if (newStaffRequest) {
        triggerNotification('New SI Increment request received')
      }
    }
    prevSIIncrementIds.current = currentIds
  }, [siIncrements, currentUser?.role, currentUser?.username, managerNotificationEnabled])

  const getDateTimestamp = (dateString: string, endOfDay = false): number | null => {
    if (!dateString) return null
    const time = endOfDay ? '23:59:59' : '00:00:00'
    return new Date(`${dateString}T${time}+03:00`).getTime()
  }

  const handleRowStatusChange = async (item: any, newStatus: 'Pending' | 'Approved' | 'Rejected') => {
    const now = getTanzaniaDateTime().getTime()
    const updates: any = {
      status: newStatus,
    }
    if (newStatus === 'Pending') {
      updates.dateApproved = undefined
    } else {
      updates.approver = currentUser?.username || item.approver || ''
      updates.dateApproved = now
    }
    try {
      await updateSIIncrement({ id: item._id ?? item.id, ...updates })
    } catch (error) {
      console.error('Error updating SI Increment status:', error)
    }
  }

  const handleRowCommentsChange = (itemId: string, value: string) => {
    setCommentsDraft((prev) => ({ ...prev, [itemId]: value }))
  }

  const commitRowComments = async (item: any) => {
    const itemId = String(item._id ?? item.id)
    const comments = commentsDraft[itemId] ?? item.approverComments ?? ''
    try {
      await updateSIIncrement({ id: item._id ?? item.id, approverComments: comments })
    } catch (error) {
      console.error('Error updating SI Increment comments:', error)
    }
  }

  const playNotificationSound = () => {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = 880
      g.gain.value = 0.05
      o.connect(g)
      g.connect(ctx.destination)
      o.start()
      setTimeout(() => {
        try { o.stop() } catch (e) {}
        try { ctx.close() } catch (e) {}
      }, 250)
    } catch (err) {
      // ignore audio errors
    }
  }

  const triggerNotification = (msg: string) => {
    setNotification(msg)
    try {
      window.dispatchEvent(new CustomEvent('siIncrementSubmitted', { detail: { message: msg } }))
    } catch (e) {
      // ignore
    }
    playNotificationSound()
    setTimeout(() => setNotification(null), 4000)
  }

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

  const handleStatusChange = (newStatus: 'Pending' | 'Approved' | 'Rejected') => {
    setFormData((prev) => ({
      ...prev,
      status: newStatus,
      approver: newStatus === 'Rejected' ? (currentUser?.username || prev?.approver || '') : prev?.approver,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const normalizedStatus = formData.status as 'Pending' | 'Approved' | 'Rejected'
      const approverName =
        normalizedStatus !== 'Pending'
          ? currentUser?.username || formData.approver || ''
          : formData.approver || ''

      const basePayload: any = {
        requestee: formData.requestee || '',
        requestedDate:
          (formData.requestedDate as Date | undefined)?.getTime() ||
          getTanzaniaDateTime().getTime(),
        shopName: formData.shopName || '',
        amount: formData.amount || 0,
        approver: approverName,
        status: normalizedStatus,
        approverComments: formData.approverComments || '',
        dateApproved: formData.dateApproved
          ? (formData.dateApproved as Date).getTime()
          : undefined,
      }
      if (editingId) {
        const updatePayload = {
          id: editingId as any,
          ...basePayload,
        }
        await updateSIIncrement(updatePayload)
      } else {
        await createSIIncrement(basePayload)
      }
      // notify manager dashboard and play sound only when staff submits
      if (isStaff) {
        triggerNotification('SI Increment submitted')
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
      requesteeRole: item.requesteeRole,
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
    const fromTimestamp = getDateTimestamp(fromDate)
    const toTimestamp = getDateTimestamp(toDate, true)
    const matchesDateRange =
      (!fromTimestamp || item.requestedDate >= fromTimestamp) &&
      (!toTimestamp || item.requestedDate <= toTimestamp)

    return matchesSearch && matchesStatus && matchesDateRange
  }).sort((a: any, b: any) => b.requestedDate - a.requestedDate)

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
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              title="From date"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              title="To date"
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
              {isStaff ? (
                <>
                  <option value="All" hidden>All</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                </>
              ) : (
                ['All', 'Pending', 'Approved', 'Rejected'].map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))
              )}
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
      {notification && (
        <div className="toast">{notification}</div>
      )}

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
              <select
                value={formData.amount ?? ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                disabled={viewOnly}
                required
              >
                <option value="" disabled>Select amount</option>
                {[100000,200000,300000,400000,500000,1000000,2000000,3000000,4000000,5000000,6000000].map((value) => (
                  <option key={value} value={value}>{new Intl.NumberFormat('en-US').format(value)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status || 'Pending'}
                onChange={(e) => handleStatusChange(e.target.value as 'Pending' | 'Approved' | 'Rejected')}
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
                    {isManager ? (
                      <select
                        className={`status-select status-${item.status.toLowerCase()}`}
                        value={item.status}
                        onChange={(e) => handleRowStatusChange(item, e.target.value as 'Pending' | 'Approved' | 'Rejected')}
                      >
                        {['Pending', 'Approved', 'Rejected'].map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`badge badge-${item.status.toLowerCase()} status-badge status-${item.status.toLowerCase()}`}>
                        {item.status}
                      </span>
                    )}
                  </td>
                  <td>
                    {isManager ? (
                      <input
                        type="text"
                        value={commentsDraft[String(item._id ?? item.id)] ?? item.approverComments ?? ''}
                        onChange={(e) => handleRowCommentsChange(String(item._id ?? item.id), e.target.value)}
                        onBlur={() => commitRowComments(item)}
                        placeholder="Manager comments"
                      />
                    ) : (
                      item.approverComments || '-'
                    )}
                  </td>
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
