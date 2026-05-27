import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

interface User {
  _id?: any
  id?: any
  username: string
  password: string
  status: 'Active' | 'Inactive'
  role: 'Admin' | 'Manager' | 'Staff'
  allowedComponents: string[]
}

const componentKeys = [
  { key: 'SIIncrements', label: 'SI Increments' },
  { key: 'TicketCancellation', label: 'Ticket Cancellation' },
  { key: 'ShopNames', label: 'Shop Names' },
  { key: 'UserSettings', label: 'User Settings' },
]

export default function UserSettings() {
  const users = useQuery((api as any).users.listUsers) as User[] | undefined
  const createUser = useMutation((api as any).users.createUser)
  const updateUser = useMutation((api as any).users.updateUser)
  const deleteUser = useMutation((api as any).users.deleteUser)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active')
  const [role, setRole] = useState<'Admin' | 'Manager' | 'Staff'>('Staff')
  const [allowedComponents, setAllowedComponents] = useState<string[]>(['SIIncrements'])
  const [editingId, setEditingId] = useState<any | null>(null)

  const resetForm = () => {
    setUsername('')
    setPassword('')
    setStatus('Active')
    setRole('Staff')
    setAllowedComponents(['SIIncrements'])
    setEditingId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) return

    try {
      const payload = {
        username: username.trim(),
        password: password.trim(),
        status,
        role,
        allowedComponents,
      }

      if (editingId) {
        await updateUser({
          id: editingId,
          ...payload,
        })
      } else {
        await createUser(payload)
      }
      resetForm()
    } catch (err) {
      console.error('Error saving user', err)
    }
  }

  const handleEdit = (user: User) => {
    setEditingId(user._id ?? user.id)
    setUsername(user.username)
    setPassword(user.password)
    setStatus(user.status)
    setRole(user.role)
    setAllowedComponents(user.allowedComponents ?? ['SIIncrements'])
  }

  const handleDelete = async (id: any) => {
    if (!confirm('Delete this user?')) return
    try {
      await deleteUser({ id })
      if (editingId === id) resetForm()
    } catch (err) {
      console.error('Error deleting user', err)
    }
  }

  return (
    <section className="settings-panel">
      <h2>User Management</h2>
      <p>Manage users and assign roles for component access.</p>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
          <div className="form-group">
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as 'Admin' | 'Manager' | 'Staff')}>
              <option>Admin</option>
              <option>Manager</option>
              <option>Staff</option>
            </select>
          </div>
          <div className="form-group full-width">
            <label>Component Access</label>
            <div className="checkbox-grid">
              {componentKeys.map((component) => (
                <label key={component.key} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={allowedComponents.includes(component.key)}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setAllowedComponents((current) =>
                        checked
                          ? [...current, component.key]
                          : current.filter((key) => key !== component.key),
                      )
                    }}
                  />
                  {component.label}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {editingId ? 'Update User' : 'Add User'}
          </button>
          {editingId && (
            <button type="button" className="btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Username</th>
              <th>Status</th>
              <th>Role</th>
              <th>Allowed Components</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center">
                  No users yet.
                </td>
              </tr>
            ) : (
              (users ?? []).map((user, idx) => {
                const recordId = user._id ?? user.id
                return (
                  <tr key={String(recordId)}>
                    <td>{idx + 1}</td>
                    <td>{user.username}</td>
                    <td>{user.status}</td>
                    <td>{user.role}</td>
                    <td>{(user.allowedComponents ?? []).join(', ') || '-'}</td>
                    <td>
                      <button className="btn-secondary" onClick={() => handleEdit(user)} style={{ marginRight: 8 }}>
                        Edit
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(recordId)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
