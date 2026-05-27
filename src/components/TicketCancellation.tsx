import { useState, useEffect } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { TicketCancellation } from '../types'
import './TicketCancellation.css'

export default function TicketCancellationComponent({ currentUser }: { currentUser?: any }) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<TicketCancellation>>({
    status: 'Pending',
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All')

  const tickets = useQuery(api.ticketCancellation.listTicketCancellations)
  const createTicket = useMutation(api.ticketCancellation.createTicketCancellation)
  const updateTicket = useMutation(api.ticketCancellation.updateTicketCancellation)
  const deleteTicket = useMutation(api.ticketCancellation.deleteTicketCancellation)
  const [editingId, setEditingId] = useState<string | null>(null)

  const isStaff = currentUser?.role === 'Staff'

  useEffect(() => {
    if (isStaff) setStatusFilter('Pending')
  }, [isStaff])

  // Helper function to get current date and time in Tanzania timezone (EAT - UTC+3)
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
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '2026')
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '1') - 1
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '1')
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0')
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0')
    const second = parseInt(parts.find(p => p.type === 'second')?.value || '0')
    return new Date(year, month, day, hour, minute, second)
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

  const handleOpenNewForm = () => {
    setEditingId(null)
    setFormData({
      requestee: currentUser?.username || '',
      status: 'Pending',
      requestedDate: getTanzaniaDateTime(),
    })
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        requestee: formData.requestee || '',
        requestedDate: getTanzaniaDateTime().getTime(),
        tpmNo: formData.tpmNo || '',
        retailerID: formData.retailerID || '',
        toCancel: formData.toCancel || '',
        replacement: formData.replacement || '',
        amount: formData.amount || 0,
        reason: formData.reason || '',
        customerNo: formData.customerNo || '',
        approver: '',
        status: formData.status as 'Pending' | 'Approved' | 'Rejected',
        approverComments: formData.approverComments || '',
        dateApproved: formData.dateApproved ? (formData.dateApproved as Date).getTime() : undefined,
      }
      if (editingId) {
        await updateTicket({ id: editingId as any, ...payload })
      } else {
        await createTicket(payload)
      }
      setFormData({ status: 'Pending' })
      setEditingId(null)
      setIsFormOpen(false)
    } catch (error) {
      console.error('Error creating Ticket Cancellation:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this ticket cancellation?')) {
      try {
        await deleteTicket({ id: id as any })
      } catch (error) {
        console.error('Error deleting Ticket Cancellation:', error)
      }
    }
  }

  const handleEdit = (item: any) => {
    setIsFormOpen(true)
    setEditingId(String(item._id ?? item.id))
    setFormData({
      requestee: item.requestee,
      tpmNo: item.tpmNo,
      retailerID: item.retailerID,
      toCancel: item.toCancel,
      replacement: item.replacement,
      amount: item.amount,
      reason: item.reason,
      customerNo: item.customerNo,
      status: item.status,
      approverComments: item.approverComments,
      dateApproved: item.dateApproved ? new Date(item.dateApproved) : undefined,
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TZS' }).format(value)
  }

  const visibleItems = (tickets || []).filter((item: any) => {
    const q = searchTerm.trim().toLowerCase()
    const matchesSearch = !q || [item.requestee, item.tpmNo, item.retailerID, item.customerNo]
      .some((f) => (f || '').toString().toLowerCase().includes(q))
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter
    const isToday = isCurrentDate(item.requestedDate)
    return matchesSearch && matchesStatus && isToday
  })

  return (
    <div className="ticket-cancellation-container">
      <div className="header-section">
        <div>
          <h2>Ticket Cancellations</h2>
          <p className="muted">Create and manage ticket cancellation requests</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <input
              placeholder="Search requestee, TPM, retailer or customer"
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
            {isFormOpen ? 'Cancel' : '+ New Cancellation'}
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
                onChange={(e) =>
                  setFormData({ ...formData, requestee: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>TPM No</label>
              <input
                type="text"
                value={formData.tpmNo || ''}
                onChange={(e) =>
                  setFormData({ ...formData, tpmNo: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Retailer ID</label>
              <input
                type="text"
                value={formData.retailerID || ''}
                onChange={(e) =>
                  setFormData({ ...formData, retailerID: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>To Cancel</label>
              <input
                type="text"
                value={formData.toCancel || ''}
                onChange={(e) =>
                  setFormData({ ...formData, toCancel: e.target.value.replace(/\D/g, '') })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Replacement</label>
              <input
                type="text"
                value={formData.replacement || ''}
                onChange={(e) =>
                  setFormData({ ...formData, replacement: e.target.value.replace(/\D/g, '') })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Amount</label>
              <input
                type="number"
                value={formData.amount || ''}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseFloat(e.target.value) })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Customer No</label>
              <input
                type="text"
                value={formData.customerNo || ''}
                onChange={(e) =>
                  setFormData({ ...formData, customerNo: e.target.value.replace(/\D/g, '') })
                }
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
              >
                {(isStaff ? ['Pending'] : ['Pending', 'Approved', 'Rejected']).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="form-group full-width">
              <label>Reason</label>
              <textarea
                value={formData.reason || ''}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
              />
            </div>
            <div className="form-group full-width">
              <label>Approver's Comments</label>
              <textarea
                value={formData.approverComments || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    approverComments: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              Submit
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsFormOpen(false)}
            >
              Cancel
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
              <th>TPM No</th>
              <th>Retailer ID</th>
              <th>Customer No</th>
              <th>Amount</th>
              <th>Status</th>
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
                  <td>{item.tpmNo}</td>
                  <td>{item.retailerID}</td>
                  <td>{item.customerNo}</td>
                  <td>{formatCurrency(item.amount)}</td>
                  <td>
                    <span className={`badge badge-${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="icon-btn"
                      title="Edit"
                      onClick={() => handleEdit(item)}
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
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center">
                  No Ticket Cancellations found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
