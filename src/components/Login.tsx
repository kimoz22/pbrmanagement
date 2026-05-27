import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import './Login.css'

const getInitials = (username: string): string => {
  return username
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?'
}

const getAvatarColor = (username: string): string => {
  const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#fee140']
  const hash = username.charCodeAt(0) + username.length
  return colors[hash % colors.length]
}

export default function Login({ onLogin }: { onLogin: (userId: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const authenticate = useMutation((api as any).users.authenticateUser)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const user = await authenticate({ username: username.trim(), password: password.trim() })
      setLoading(false)
      if (!user) {
        setError('Invalid credentials or inactive user')
        return
      }
      const id = String(user._id ?? user.id)
      if (remember) localStorage.setItem('currentUserId', id)
      onLogin(id)
    } catch (err) {
      console.error('Auth error', err)
      setLoading(false)
      setError('Authentication failed')
    }
  }

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="login-brand">
          <div className="logo">🔐</div>
          <div>
            <h1>PBR Management</h1>
            <p style={{ margin: 0, fontSize: 12, color: '#888' }}>Secure Access</p>
          </div>
        </div>
        <p className="login-sub">Sign in to your dashboard</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <div className="row-between">
            <label className="remember">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Remember me
            </label>
            <a className="forgot" href="#">Forgot?</a>
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          {error && <div className="login-error">{error}</div>}
        </form>
      </div>
    </div>
  )
}
