import { useEffect, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import './App.css'
import Dashboard from './components/Dashboard'
import SIIncrements from './components/SIIncrements'
import TicketCancellation from './components/TicketCancellation'
import ShopNames from './components/ShopNames'
import UserSettings from './components/UserSettings'
import Login from './components/Login'

function App() {
  const users = useQuery((api as any).users.listUsers) as any[] | undefined
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'siIncrements' | 'ticketCancellation' | 'shopName' | 'user'>('dashboard')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [globalNotification, setGlobalNotification] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<{id: string; message: string; time: number}[]>(() => {
    try {
      const raw = localStorage.getItem('notifications')
      return raw ? JSON.parse(raw) : []
    } catch (e) {
      return []
    }
  })
  const [notifOpen, setNotifOpen] = useState(false)

  const currentUser = users?.find((user) => String(user._id ?? user.id) === currentUserId)
  const allowedComponents = Array.isArray(currentUser?.allowedComponents)
    ? currentUser?.allowedComponents
    : []
  const isActiveUser = currentUser?.status === 'Active'
  const canAccessDashboard = isActiveUser && (currentUser?.role === 'Admin' || currentUser?.role === 'Manager')
  const canAccessSI = isActiveUser && allowedComponents.includes('SIIncrements')
  const canAccessTicketCancellation = isActiveUser && allowedComponents.includes('TicketCancellation')
  const canAccessShopName = isActiveUser && allowedComponents.includes('ShopNames')
  const canAccessUserSettings = isActiveUser && allowedComponents.includes('UserSettings')

  // Ensure the active tab defaults to the first allowed component after login
  useEffect(() => {
    if (!currentUser) return
    const firstAllowed = canAccessDashboard
      ? 'dashboard'
      : canAccessSI
      ? 'siIncrements'
      : canAccessTicketCancellation
      ? 'ticketCancellation'
      : canAccessShopName
      ? 'shopName'
      : canAccessUserSettings
      ? 'user'
      : null
    if (firstAllowed) setActiveTab(firstAllowed)
  }, [currentUserId, canAccessDashboard, canAccessSI, canAccessTicketCancellation, canAccessShopName, canAccessUserSettings])

  useEffect(() => {
    const stored = localStorage.getItem('currentUserId')
    if (stored) setCurrentUserId(stored)
  }, [])

  useEffect(() => {
    const handler = (ev: any) => {
      const msg = ev?.detail?.message || 'Notification'
      const note = { id: String(Date.now()), message: msg, time: Date.now() }
      setNotifications((prev) => {
        const next = [note, ...prev]
        try { localStorage.setItem('notifications', JSON.stringify(next)) } catch (e) {}
        return next
      })
      setGlobalNotification(msg)
      setTimeout(() => setGlobalNotification(null), 4000)
    }
    window.addEventListener('siIncrementSubmitted', handler as EventListener)
    return () => window.removeEventListener('siIncrementSubmitted', handler as EventListener)
  }, [])

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== id)
      try { localStorage.setItem('notifications', JSON.stringify(next)) } catch (e) {}
      return next
    })
  }

  const handleLogin = (id: string) => {
    setCurrentUserId(id)
    localStorage.setItem('currentUserId', id)
  }

  const handleLogout = () => {
    setCurrentUserId(null)
    localStorage.removeItem('currentUserId')
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>PBR Management System</h1>
      </header>
      {globalNotification && (
        <div className="global-toast">{globalNotification}</div>
      )}

      <nav className="nav-tabs">
        <div style={{ marginRight: 'auto' }} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="notif-bell-wrap">
            <button className="notif-bell nav-tab" onClick={() => setNotifOpen(o => !o)} title="Notifications">
              🔔
            </button>
            {notifications.length > 0 && <span className="notif-badge">{notifications.length}</span>}
            {notifOpen && (
              <div className="notif-dropdown">
                <div className="notif-dropdown-list">
                  {notifications.length === 0 ? (
                    <div className="notif-empty">No notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="notif-item">
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                          <div>
                            <div className="notif-msg">{n.message}</div>
                            <div className="notif-time">{new Date(n.time).toLocaleTimeString()}</div>
                          </div>
                          <div>
                            <button className="btn-secondary" onClick={() => markNotificationRead(n.id)}>Mark read</button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="notif-actions">
                  <button className="btn-secondary" onClick={() => { setNotifications([]); localStorage.removeItem('notifications') }}>Clear</button>
                </div>
              </div>
            )}
          </div>
          {currentUserId && currentUser ? (
            <>
              <div style={{ color: '#111', fontWeight: 600 }}>
                Logged in: {currentUser.username} ({currentUser.role})
              </div>
              <button className="btn-secondary" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <button className="btn-primary" onClick={() => setActiveTab('user')}>
              Login
            </button>
          )}
        </div>
        {canAccessDashboard && (
          <button
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('dashboard')
              setIsSettingsOpen(false)
            }}
          >
            Dashboard
          </button>
        )}
        {canAccessSI && (
          <button
            className={`nav-tab ${activeTab === 'siIncrements' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('siIncrements')
              setIsSettingsOpen(false)
            }}
          >
            SI Increments
          </button>
        )}
        {canAccessTicketCancellation && (
          <button
            className={`nav-tab ${activeTab === 'ticketCancellation' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('ticketCancellation')
              setIsSettingsOpen(false)
            }}
          >
            Ticket Cancellation
          </button>
        )}
        {(canAccessShopName || canAccessUserSettings) && (
          <div
            className="nav-dropdown"
            onMouseLeave={() => setIsSettingsOpen(false)}
          >
            <button
              className={`nav-tab ${activeTab === 'shopName' || activeTab === 'user' ? 'active' : ''}`}
              onClick={() => setIsSettingsOpen((open) => !open)}
            >
              Settings
            </button>
            <div className={`dropdown-menu ${isSettingsOpen ? 'open' : ''}`}>
              {canAccessShopName && (
                <button
                  className={`dropdown-item ${activeTab === 'shopName' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('shopName')
                    setIsSettingsOpen(false)
                  }}
                >
                  Shop Name
                </button>
              )}
              {canAccessUserSettings && (
                <button
                  className={`dropdown-item ${activeTab === 'user' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('user')
                    setIsSettingsOpen(false)
                  }}
                >
                  User
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="main-content">
        {!currentUserId ? (
          <Login onLogin={handleLogin} />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <div>
                {canAccessDashboard ? (
                  <Dashboard />
                ) : (
                  <section className="settings-panel">
                    <h2>Access denied</h2>
                    <p>
                      Your current user does not have permission to access Dashboard.
                      Only Admin and Manager users can view the Dashboard.
                    </p>
                  </section>
                )}
              </div>
            )}
            {activeTab === 'siIncrements' && (
              <div>
                {canAccessSI ? (
                  <SIIncrements currentUser={currentUser} />
                ) : (
                  <section className="settings-panel">
                    <h2>Access denied</h2>
                    <p>
                      Your current user does not have permission to access SI Increments.
                      Assign access in User Settings.
                    </p>
                  </section>
                )}
              </div>
            )}
            {activeTab === 'ticketCancellation' && (
              <div>
                {canAccessTicketCancellation ? (
                  <TicketCancellation currentUser={currentUser} />
                ) : (
                  <section className="settings-panel">
                    <h2>Access denied</h2>
                    <p>
                      Your current user does not have permission to access Ticket Cancellation.
                      Assign access in User Settings.
                    </p>
                  </section>
                )}
              </div>
            )}
            {activeTab === 'shopName' && (
              <div>
                {canAccessShopName ? (
                  <ShopNames />
                ) : (
                  <section className="settings-panel">
                    <h2>Access denied</h2>
                    <p>
                      Your current user does not have permission to access Shop Names.
                      Assign access in User Settings.
                    </p>
                  </section>
                )}
              </div>
            )}
            {activeTab === 'user' && (
              <div>
                {canAccessUserSettings ? (
                  <UserSettings />
                ) : (
                  <section className="settings-panel">
                    <h2>Access denied</h2>
                    <p>
                      Your current user does not have permission to access User Settings.
                    </p>
                  </section>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App
