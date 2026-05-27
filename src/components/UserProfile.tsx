import { useState } from 'react'
import './UserProfile.css'

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

type UserProfileProps = {
  username: string
  role: string
  onLogout: () => void
}

export default function UserProfile({ username, role, onLogout }: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false)
  const initials = getInitials(username)
  const avatarColor = getAvatarColor(username)

  return (
    <div className="user-profile-wrapper">
      <button
        className="user-profile-button"
        onClick={() => setIsOpen(!isOpen)}
        style={{ '--avatar-color': avatarColor } as any}
      >
        <div className="avatar">{initials}</div>
        <div className="user-info">
          <span className="username">{username}</span>
          <span className="role">{role}</span>
        </div>
        <span className="chevron">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="user-profile-menu">
          <div className="profile-header">
            <div className="avatar-large" style={{ backgroundColor: avatarColor }}>
              {initials}
            </div>
            <div className="profile-details">
              <p className="profile-name">{username}</p>
              <p className="profile-role">{role}</p>
            </div>
          </div>
          <div className="profile-divider" />
          <button className="profile-logout" onClick={onLogout}>
            🚪 Logout
          </button>
        </div>
      )}
    </div>
  )
}
