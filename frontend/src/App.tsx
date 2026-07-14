import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

type Mode = 'login' | 'register'
type FormState = { firstname: string; lastName: string; email: string; password: string }
type NavPage = 'dashboard' | 'tasks' | 'boards' | 'calendar' | 'team' | 'reports' | 'settings'

type Workspace = { id: string; name: string; description?: string | null }
type Task = { id: string; title: string; description?: string | null; status: string; priority: string; workspaceId: string; dueDate?: string | null; assignedToId?: string | null }
type Invitation = { id: string; email: string; workspaceId: string; token: string; status: string; expiresAt: string; role?: string; workspace?: { id: string; name: string } }
type Member = { id: string; userId: string; role: string; user: { id: string; firstname: string; lastName: string; email: string; avatarUrl?: string | null } }
type UserSession = { id: string; email: string; firstname: string; lastName: string; avatarUrl?: string | null; bio?: string | null; language?: string; fontStyle?: string; colorTheme?: string }

const initialForm: FormState = { firstname: '', lastName: '', email: '', password: '' }
const statusColumns = ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']
const navItems: { page: NavPage; label: string; icon: string }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: '\u2302' },
  { page: 'tasks', label: 'My Tasks', icon: '\u2611' },
  { page: 'boards', label: 'Boards', icon: '\u2630' },
  { page: 'calendar', label: 'Calendar', icon: '\u25A6' },
  { page: 'team', label: 'Team', icon: '\u263A' },
  { page: 'reports', label: 'Reports', icon: '\u2197' },
  { page: 'settings', label: 'Settings', icon: '\u2699' },
]
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function App() {
  const [mode, setMode] = useState<Mode>('login')
  const [form, setForm] = useState<FormState>(initialForm)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info')
  const [loading, setLoading] = useState(false)
  const [sessionNotice, setSessionNotice] = useState('')
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('taskmanager_token'))
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem('taskmanager_refresh_token'))
  const [user, setUser] = useState<UserSession | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceDescription, setWorkspaceDescription] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskPriority, setTaskPriority] = useState('MEDIUM')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskAssignedTo, setTaskAssignedTo] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('MEMBER')
  const [myInvitations, setMyInvitations] = useState<Invitation[]>([])
  const [workspaceInvitations, setWorkspaceInvitations] = useState<Invitation[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [navPage, setNavPage] = useState<NavPage>('dashboard')
  const [notifCount, setNotifCount] = useState(0)
  const [notifList, setNotifList] = useState<{ id: string; message: string; isRead: boolean; createdAt: string }[]>([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calDayTasks, setCalDayTasks] = useState<Task[] | null>(null)

  // Settings state
  const [settingsName, setSettingsName] = useState('')
  const [settingsLast, setSettingsLast] = useState('')
  const [settingsAvatar, setSettingsAvatar] = useState('')
  const [settingsBio, setSettingsBio] = useState('')
  const [settingsLang, setSettingsLang] = useState('en')
  const [settingsFont, setSettingsFont] = useState('default')
  const [settingsColor, setSettingsColor] = useState('purple')

  const showMessage = useCallback((msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setMessage(msg); setMessageType(type)
  }, [])

  const persistAuth = (accessToken: string, nextRefreshToken?: string | null) => {
    localStorage.setItem('taskmanager_token', accessToken)
    setAuthToken(accessToken)
    if (nextRefreshToken) {
      localStorage.setItem('taskmanager_refresh_token', nextRefreshToken)
      setRefreshToken(nextRefreshToken)
    }
  }

  const clearSession = () => {
    localStorage.removeItem('taskmanager_token')
    localStorage.removeItem('taskmanager_refresh_token')
    setAuthToken(null); setRefreshToken(null); setUser(null); setWorkspaces([]); setTasks([]); setSelectedWorkspaceId('')
  }

  const fetchJson = async (input: string, init?: RequestInit) => {
    const headers = new Headers(init?.headers)
    const tokenToUse = authToken || localStorage.getItem('taskmanager_token')
    if (tokenToUse) headers.set('Authorization', `Bearer ${tokenToUse}`)
    let response = await fetch(input, { ...init, headers })
    if (response.status === 401 && refreshToken) {
      try {
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })
        const refreshData = await refreshResponse.json().catch(() => ({}))
        if (refreshResponse.ok && refreshData.accessToken) {
          persistAuth(refreshData.accessToken, refreshToken)
          headers.set('Authorization', `Bearer ${refreshData.accessToken}`)
          response = await fetch(input, { ...init, headers })
        } else throw new Error('Session expired')
      } catch { clearSession(); setSessionNotice('Your session expired. Please sign in again.'); throw new Error('Session expired') }
    }
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.message || 'Request failed')
    return data
  }

  const loadProfile = useCallback(async () => {
    try { const d = await fetchJson('/api/auth/me'); setUser(d.user) } catch { setUser(null) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken])

  const loadWorkspaces = useCallback(async () => {
    try {
      const d = await fetchJson('/api/workspaces')
      const ws = d.workspaces || []
      setWorkspaces(ws)
      if (!selectedWorkspaceId && ws.length) setSelectedWorkspaceId(ws[0].id)
    } catch { setWorkspaces([]) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken])

  const loadTasks = useCallback(async () => {
    if (!selectedWorkspaceId) return
    try { const d = await fetchJson(`/api/tasks?workspaceId=${selectedWorkspaceId}`); setTasks(d.tasks || []) } catch { setTasks([]) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkspaceId])

  const loadMyInvitations = useCallback(async () => {
    try { const d = await fetchJson('/api/invitations/mine'); setMyInvitations(d.invitations || []) } catch { setMyInvitations([]) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken])

  const loadWorkspaceInvitations = useCallback(async () => {
    if (!selectedWorkspaceId) return
    try { const d = await fetchJson(`/api/invitations/workspace/${selectedWorkspaceId}`); setWorkspaceInvitations(d.invitations || []) } catch { setWorkspaceInvitations([]) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkspaceId])

  const loadMembers = useCallback(async () => {
    if (!selectedWorkspaceId) return
    try { const d = await fetchJson(`/api/workspaces/${selectedWorkspaceId}/members`); setMembers(d.members || []) } catch { setMembers([]) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkspaceId])

  const loadNotifs = useCallback(async () => {
    try {
      const d = await fetchJson('/api/notifications/unread-count')
      setNotifCount(d.count ?? 0)
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken])

  const loadNotifList = useCallback(async () => {
    try { const d = await fetchJson('/api/notifications'); setNotifList(d.notifications || []) } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken])

  useEffect(() => {
    if (authToken) {
      loadProfile(); loadWorkspaces(); loadMyInvitations(); loadNotifs()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken])

  useEffect(() => { loadTasks(); loadMembers(); loadWorkspaceInvitations() }, [loadTasks, loadMembers, loadWorkspaceInvitations])

  // Poll notifications every 30s
  useEffect(() => {
    if (!authToken) return
    const interval = setInterval(loadNotifs, 30000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken])

  // Apply theme from user profile
  useEffect(() => {
    if (user?.colorTheme) {
      document.documentElement.setAttribute('data-theme', user.colorTheme)
      setSettingsColor(user.colorTheme)
    }
    if (user?.fontStyle) {
      document.documentElement.setAttribute('data-font', user.fontStyle)
      setSettingsFont(user.fontStyle)
    }
    if (user?.language) setSettingsLang(user.language)
    if (user?.firstname) setSettingsName(user.firstname)
    if (user?.lastName) setSettingsLast(user.lastName)
    if (user?.avatarUrl) setSettingsAvatar(user.avatarUrl)
    if (user?.bio) setSettingsBio(user.bio || '')
  }, [user])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setLoading(true); setMessage('')
    const payload = mode === 'register'
      ? { firstname: form.firstname, lastName: form.lastName, email: form.email, password: form.password }
      : { email: form.email, password: form.password }
    try {
      const r = await fetch(`/api/auth/${mode === 'register' ? 'register' : 'login'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.message || 'Failed')
      if (d.accessToken) persistAuth(d.accessToken, d.refreshToken)
      showMessage(d.message || 'Success', 'success'); setSessionNotice('')
      if (mode === 'register') { setMode('login'); setForm(initialForm) }
    } catch (err) { showMessage(err instanceof Error ? err.message : 'Something went wrong', 'error') }
    finally { setLoading(false) }
  }

  const handleCreateWorkspace = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const d = await fetchJson('/api/workspaces', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: workspaceName, description: workspaceDescription }),
      })
      setWorkspaceName(''); setWorkspaceDescription(''); setSelectedWorkspaceId(d.workspace.id)
      await loadWorkspaces(); showMessage('Workspace created', 'success')
    } catch (err) { showMessage(err instanceof Error ? err.message : 'Unable to create workspace', 'error') }
  }

  const handleCreateTask = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const body: Record<string, unknown> = {
        title: taskTitle, description: taskDescription, priority: taskPriority,
        dueDate: taskDueDate || null, workspaceId: selectedWorkspaceId,
      }
      if (taskAssignedTo) body.assignedToId = taskAssignedTo
      await fetchJson('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      setTaskTitle(''); setTaskDescription(''); setTaskPriority('MEDIUM'); setTaskDueDate(''); setTaskAssignedTo('')
      await loadTasks(); showMessage('Task added', 'success')
    } catch (err) { showMessage(err instanceof Error ? err.message : 'Unable to create task', 'error') }
  }

  const handleMoveTask = async (taskId: string, nextStatus: string) => {
    try {
      await fetchJson(`/api/tasks/${taskId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus }) })
      await loadTasks()
    } catch (err) { showMessage(err instanceof Error ? err.message : 'Unable to update task', 'error') }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return
    try {
      await fetchJson(`/api/tasks/${taskId}`, { method: 'DELETE' })
      await loadTasks(); showMessage('Task deleted', 'info')
    } catch (err) { showMessage(err instanceof Error ? err.message : 'Unable to delete task', 'error') }
  }

  const handleInviteMember = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedWorkspaceId) return
    try {
      const d = await fetchJson('/api/invitations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, workspaceId: selectedWorkspaceId, role: inviteRole }),
      })
      setInviteEmail(''); showMessage(d.message || 'Invitation sent', 'success'); await loadWorkspaceInvitations()
    } catch (err) { showMessage(err instanceof Error ? err.message : 'Unable to send invitation', 'error') }
  }

  const handleAcceptInvitation = async (token: string) => {
    try {
      const d = await fetchJson(`/api/invitations/${token}/accept`, { method: 'POST' })
      showMessage(d.message || 'Joined workspace', 'success'); await loadMyInvitations(); await loadWorkspaces()
    } catch (err) { showMessage(err instanceof Error ? err.message : 'Unable to accept', 'error') }
  }

  const handleCancelInvitation = async (id: string) => {
    try {
      await fetchJson(`/api/invitations/${id}`, { method: 'DELETE' })
      showMessage('Invitation cancelled', 'info'); await loadWorkspaceInvitations()
    } catch (err) { showMessage(err instanceof Error ? err.message : 'Unable to cancel', 'error') }
  }

  const handleSaveSettings = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const d = await fetchJson('/api/settings/profile', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstname: settingsName, lastName: settingsLast, avatarUrl: settingsAvatar || null,
          bio: settingsBio || null, language: settingsLang, fontStyle: settingsFont, colorTheme: settingsColor,
        }),
      })
      setUser(d.user); showMessage('Settings saved', 'success')
    } catch (err) { showMessage(err instanceof Error ? err.message : 'Unable to save', 'error') }
  }

  const handleMarkAllRead = async () => {
    try {
      await fetchJson('/api/notifications/read-all', { method: 'POST' })
      setNotifCount(0); setNotifList(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch { /* ignore */ }
  }

  const logout = () => { clearSession(); setSessionNotice('You have been signed out.') }

  const selectedWs = workspaces.find(w => w.id === selectedWorkspaceId)
  const myTasks = tasks.filter(t => t.assignedToId === user?.id)
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date())
  const upcomingDeadlines = tasks.filter(t => t.dueDate).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()).slice(0, 5)

  // ─── Calendar helpers ───
  const firstDay = new Date(calYear, calMonth, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const calDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {}
    tasks.filter(t => t.dueDate).forEach(t => {
      const key = new Date(t.dueDate!).toDateString()
      if (!map[key]) map[key] = []
      map[key].push(t)
    })
    return map
  }, [tasks])

  // ─── Reports helpers ───
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length
  const todoTasks = tasks.filter(t => t.status === 'TODO').length
  const reviewTasks = tasks.filter(t => t.status === 'REVIEW').length
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const themeClass = `theme-${settingsColor || 'purple'} font-${settingsFont || 'default'}`

  // ─── Auth screen ───
  if (!authToken || !user) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <div className="auth-header">
            <p className="eyebrow">TaskManager</p>
            <h1>{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
            <p>{mode === 'login' ? 'Use your email and password to continue.' : 'Register to start organizing your tasks.'}</p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="name-row">
                <label>First name<input value={form.firstname} onChange={e => setForm({ ...form, firstname: e.target.value })} required /></label>
                <label>Last name<input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required /></label>
              </div>
            )}
            <label>Email<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></label>
            <label>Password<input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></label>
            <button type="submit" disabled={loading}>{loading ? 'Working...' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
          </form>
          <p className="switch-copy">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            <button type="button" className="link-button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage('') }}>
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>
          {sessionNotice && <p className="token-status">{sessionNotice}</p>}
          {message && <p className="feedback">{message}</p>}
        </section>
      </main>
    )
  }

  // ─── Dashboard ───
  return (
    <main className={`dashboard-shell ${themeClass}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <p className="eyebrow">TaskManager</p>
          <h2>{user.firstname} {user.lastName}</h2>
          <p>{selectedWs?.name || 'No workspace'}</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(({ page, label, icon }) => (
            <button key={page} className={`nav-item ${navPage === page ? 'active' : ''}`} onClick={() => setNavPage(page)}>
              <span className="nav-icon">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user.firstname.charAt(0).toUpperCase()}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.firstname}</div>
              <div className="sidebar-user-email">{user.email}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={logout} title="Sign out">{'\u27A1'}</button>
        </div>
      </aside>

      <div className="main-area">
        <div className="main-topbar">
          <div>
            <h1>{navItems.find(n => n.page === navPage)?.label || 'Dashboard'}</h1>
            <p>{selectedWs?.name || 'No workspace'} &middot; {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="main-topbar-actions">
            <div className="workspace-selector">
              {workspaces.map(ws => (
                <button key={ws.id} type="button"
                  className={`workspace-chip ${selectedWorkspaceId === ws.id ? 'active' : ''}`}
                  onClick={() => setSelectedWorkspaceId(ws.id)}>
                  {ws.name}
                </button>
              ))}
            </div>
            <div className="notif-bell" onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) loadNotifList() }}>
              {'\uD83D\uDD14'}
              {notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
              {showNotifs && (
                <div className="notif-dropdown">
                  <div className="notif-dropdown-header">
                    <strong>Notifications</strong>
                    {notifCount > 0 && <button className="mini-btn" onClick={handleMarkAllRead}>Mark all read</button>}
                  </div>
                  {notifList.length === 0 ? <p className="empty-column">No notifications</p> : (
                    notifList.slice(0, 10).map(n => (
                      <div key={n.id} className={`notif-item ${n.isRead ? '' : 'unread'}`}>{n.message}</div>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="topbar-avatar" onClick={() => setNavPage('settings')} title="Profile settings">
              <div className="sidebar-avatar">{user.firstname.charAt(0).toUpperCase()}</div>
            </div>
          </div>
        </div>

        <div className="main-content">
          {/* Invitation banner */}
          {myInvitations.length > 0 && (
            <div className="invite-banner">
              <h3>Pending invitations</h3>
              {myInvitations.map(inv => (
                <div key={inv.id} className="invite-banner-item">
                  <span>Join <strong>{inv.workspace?.name || 'a workspace'}</strong></span>
                  <button type="button" className="mini-btn accept-btn" onClick={() => handleAcceptInvitation(inv.token)}>Accept</button>
                </div>
              ))}
            </div>
          )}

          {message && <div className={`message-bar ${messageType}`}>{message}</div>}
          {sessionNotice && <div className="message-bar info">{sessionNotice}</div>}

          {/* ─── DASHBOARD PAGE ─── */}
          {navPage === 'dashboard' && (
            <>
              <div className="dashboard-grid">
                <div className="panel full-width">
                  <h2>Overview</h2>
                  <div className="task-summary-grid">
                    <div className="summary-card"><strong>{totalTasks}</strong>Total tasks</div>
                    <div className="summary-card"><strong>{completedTasks}</strong>Completed</div>
                    <div className="summary-card"><strong>{inProgressTasks}</strong>In progress</div>
                    <div className="summary-card"><strong>{overdueTasks.length}</strong>Overdue</div>
                    <div className="summary-card"><strong>{myTasks.length}</strong>My tasks</div>
                    <div className="summary-card"><strong>{members.length}</strong>Team members</div>
                  </div>
                </div>
              </div>

              <div className="dashboard-grid">
                <div className="panel">
                  <h2>Recent tasks</h2>
                  {tasks.slice(0, 5).map(t => (
                    <div key={t.id} className="recent-task-item">
                      <strong>{t.title}</strong>
                      <span className={`priority-badge ${t.priority.toLowerCase()}`}>{t.priority}</span>
                      <span className={`status-badge ${t.status.toLowerCase()}`}>{t.status.replace('_', ' ')}</span>
                    </div>
                  ))}
                  {tasks.length === 0 && <p className="empty-column">No tasks yet</p>}
                </div>

                <div className="panel">
                  <h2>Upcoming deadlines</h2>
                  {upcomingDeadlines.map(t => (
                    <div key={t.id} className="recent-task-item">
                      <strong>{t.title}</strong>
                      <span>{new Date(t.dueDate!).toLocaleDateString()}</span>
                    </div>
                  ))}
                  {upcomingDeadlines.length === 0 && <p className="empty-column">No upcoming deadlines</p>}
                </div>
              </div>
            </>
          )}

          {/* ─── MY TASKS PAGE ─── */}
          {navPage === 'tasks' && (
            <div className="panel full-width">
              <h2>My Tasks</h2>
              <div className="stack-form" style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                <input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="New task title" />
                <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)}>
                  <option value="LOW">Low</option><option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option><option value="CRITICAL">Critical</option>
                </select>
                <input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} />
                <select value={taskAssignedTo} onChange={e => setTaskAssignedTo(e.target.value)}>
                  <option value="">Assign to...</option>
                  {members.filter(m => m.userId !== user.id).map(m => (
                    <option key={m.userId} value={m.userId}>{m.user.firstname} {m.user.lastName}</option>
                  ))}
                </select>
                <button className="primary-btn" onClick={() => handleCreateTask({ preventDefault: () => {} } as FormEvent<HTMLFormElement>)}>Add</button>
              </div>
              <div className="task-list">
                {tasks.map(t => (
                  <div key={t.id} className="task-list-item">
                    <div className="task-list-info">
                      <strong>{t.title}</strong>
                      {t.description && <span>{t.description}</span>}
                      <div className="task-list-meta">
                        <span className={`priority-badge ${t.priority.toLowerCase()}`}>{t.priority}</span>
                        <span className={`status-badge ${t.status.toLowerCase()}`}>{t.status.replace('_', ' ')}</span>
                        {t.dueDate && <span>Due: {new Date(t.dueDate).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="task-list-actions">
                      <select value={t.status} onChange={e => handleMoveTask(t.id, e.target.value)}>
                        {statusColumns.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select>
                      <button className="mini-btn danger-btn" onClick={() => handleDeleteTask(t.id)}>{'\u2716'}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── BOARDS PAGE (Kanban) ─── */}
          {navPage === 'boards' && (
            <>
              <div className="panel" style={{ marginBottom: 16 }}>
                <div className="stack-form" style={{ flexDirection: 'row', gap: 8 }}>
                  <input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Task title" required />
                  <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)}>
                    <option value="LOW">Low</option><option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option><option value="CRITICAL">Critical</option>
                  </select>
                  <input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} />
                  <button onClick={() => handleCreateTask({ preventDefault: () => {} } as FormEvent<HTMLFormElement>)}>Add task</button>
                </div>
              </div>
              <div className="kanban-board">
                {statusColumns.map(status => (
                  <div key={status} className="kanban-column">
                    <h3>{status.replace('_', ' ')}</h3>
                    {tasks.filter(t => t.status === status).length === 0
                      ? <p className="empty-column">No tasks</p>
                      : tasks.filter(t => t.status === status).map(t => (
                        <div key={t.id} className="task-card">
                          <strong>{t.title}</strong>
                          {t.description && <p>{t.description}</p>}
                          <p className="task-meta">Priority: {t.priority}</p>
                          {t.dueDate && <p className="task-meta">Due: {new Date(t.dueDate).toLocaleDateString()}</p>}
                          <div className="task-actions">
                            {statusColumns.filter(c => c !== status).map(ns => (
                              <button key={ns} type="button" className="mini-btn" style={{ background: '#1c1f30', color: '#94a3b8' }}
                                onClick={() => handleMoveTask(t.id, ns)}>{ns.replace('_', ' ')}</button>
                            ))}
                            <button type="button" className="mini-btn danger-btn" onClick={() => handleDeleteTask(t.id)}>{'\u2716'}</button>
                          </div>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ─── CALENDAR PAGE ─── */}
          {navPage === 'calendar' && (
            <div className="panel full-width">
              <h2>Calendar</h2>
              <div className="cal-nav">
                <button className="mini-btn" onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) } else setCalMonth(calMonth - 1) }}>{'\u25C0'}</button>
                <strong>{MONTHS[calMonth]} {calYear}</strong>
                <button className="mini-btn" onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) } else setCalMonth(calMonth + 1) }}>{'\u25B6'}</button>
              </div>
              <div className="cal-grid">
                {DAYS.map(d => <div key={d} className="cal-header">{d}</div>)}
                {Array.from({ length: firstDay }, (_, i) => <div key={`empty-${i}`} className="cal-day empty" />)}
                {calDays.map(d => {
                  const date = new Date(calYear, calMonth, d)
                  const key = date.toDateString()
                  const dayTasks = tasksByDate[key] || []
                  const isToday = date.toDateString() === new Date().toDateString()
                  return (
                    <div key={d} className={`cal-day ${isToday ? 'today' : ''} ${dayTasks.length > 0 ? 'has-tasks' : ''}`}
                      onClick={() => setCalDayTasks(calDayTasks && calDayTasks[0]?.dueDate && new Date(calDayTasks[0].dueDate!).toDateString() === key ? null : dayTasks)}>
                      <span>{d}</span>
                      {dayTasks.length > 0 && <span className="cal-dot">{dayTasks.length}</span>}
                    </div>
                  )
                })}
              </div>
              {calDayTasks && calDayTasks.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <h3>Tasks for {calDayTasks[0].dueDate ? new Date(calDayTasks[0].dueDate!).toLocaleDateString() : ''}</h3>
                  {calDayTasks.map(t => (
                    <div key={t.id} className="recent-task-item">
                      <strong>{t.title}</strong>
                      <span className={`priority-badge ${t.priority.toLowerCase()}`}>{t.priority}</span>
                      <span className={`status-badge ${t.status.toLowerCase()}`}>{t.status.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── TEAM PAGE ─── */}
          {navPage === 'team' && (
            <div className="dashboard-grid">
              <div className="panel">
                <h2>Create workspace</h2>
                <form className="stack-form" onSubmit={handleCreateWorkspace}>
                  <input value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} placeholder="Workspace name" required />
                  <input value={workspaceDescription} onChange={e => setWorkspaceDescription(e.target.value)} placeholder="Optional description" />
                  <button type="submit">Add workspace</button>
                </form>
              </div>

              <div className="panel">
                <h2>Members ({members.length})</h2>
                <div className="member-list">
                  {members.map(m => (
                    <div key={m.id} className="member-item">
                      <div className="sidebar-avatar">{m.user.firstname.charAt(0).toUpperCase()}</div>
                      <div className="member-info">
                        <strong>{m.user.firstname} {m.user.lastName}</strong>
                        <span>{m.user.email}</span>
                      </div>
                      <span className={`role-badge ${m.role.toLowerCase()}`}>{m.role}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel">
                <h2>Invite member</h2>
                <form className="stack-form" onSubmit={handleInviteMember}>
                  <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@company.com" required />
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <button type="submit">Send invite</button>
                </form>

                {workspaceInvitations.filter(i => i.status === 'PENDING').length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <h3>Pending invitations</h3>
                    <div className="invite-list">
                      {workspaceInvitations.filter(i => i.status === 'PENDING').map(inv => (
                        <div key={inv.id} className="invite-item">
                          <span>{inv.email} <span className="role-badge member">{inv.role || 'MEMBER'}</span></span>
                          <button type="button" className="mini-btn danger-btn" onClick={() => handleCancelInvitation(inv.id)}>Cancel</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── REPORTS PAGE ─── */}
          {navPage === 'reports' && (
            <div className="dashboard-grid">
              <div className="panel full-width">
                <h2>Progress overview</h2>
                <div className="task-summary-grid">
                  <div className="summary-card"><strong>{totalTasks}</strong>Total tasks</div>
                  <div className="summary-card"><strong>{completedTasks}</strong>Completed</div>
                  <div className="summary-card"><strong>{inProgressTasks}</strong>In progress</div>
                  <div className="summary-card"><strong>{reviewTasks}</strong>In review</div>
                  <div className="summary-card"><strong>{todoTasks}</strong>To do</div>
                  <div className="summary-card"><strong>{overdueTasks.length}</strong>Overdue</div>
                </div>
              </div>

              <div className="panel">
                <h2>Completion rate</h2>
                {totalTasks > 0 ? (
                  <div className="donut-chart">
                    <svg viewBox="0 0 36 36" className="donut-svg">
                      <path className="donut-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="donut-fill" strokeDasharray={`${completionPct}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <text x="18" y="20.5" className="donut-text">{completionPct}%</text>
                    </svg>
                  </div>
                ) : <p className="empty-column">No data</p>}
              </div>

              <div className="panel">
                <h2>Tasks by status</h2>
                {totalTasks > 0 ? (
                  <div className="bar-chart">
                    {[
                      { label: 'TODO', value: todoTasks, pct: totalTasks > 0 ? (todoTasks / totalTasks) * 100 : 0, color: '#64748b' },
                      { label: 'IN PROGRESS', value: inProgressTasks, pct: totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0, color: '#38bdf8' },
                      { label: 'REVIEW', value: reviewTasks, pct: totalTasks > 0 ? (reviewTasks / totalTasks) * 100 : 0, color: '#fbbf24' },
                      { label: 'COMPLETED', value: completedTasks, pct: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0, color: '#34d399' },
                    ].map(bar => (
                      <div key={bar.label} className="bar-row">
                        <span className="bar-label">{bar.label}</span>
                        <div className="bar-track"><div className="bar-fill" style={{ width: `${bar.pct}%`, background: bar.color }} /></div>
                        <span className="bar-value">{bar.value}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="empty-column">No data</p>}
              </div>
            </div>
          )}

          {/* ─── SETTINGS PAGE ─── */}
          {navPage === 'settings' && (
            <div className="dashboard-grid">
              <div className="panel">
                <h2>Profile</h2>
                <form className="stack-form" onSubmit={handleSaveSettings}>
                  {settingsAvatar && (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 4 }}>
                      <img src={settingsAvatar} alt="Avatar" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      <span>Current avatar</span>
                    </div>
                  )}
                  <input value={settingsAvatar} onChange={e => setSettingsAvatar(e.target.value)} placeholder="Avatar image URL" />
                  <div className="name-row">
                    <label>First name<input value={settingsName} onChange={e => setSettingsName(e.target.value)} /></label>
                    <label>Last name<input value={settingsLast} onChange={e => setSettingsLast(e.target.value)} /></label>
                  </div>
                  <label>Bio<textarea value={settingsBio} onChange={e => setSettingsBio(e.target.value)} rows={2} /></label>
                  <label style={{ color: '#64748b', fontSize: '0.82rem' }}>Email: {user.email}</label>
                  <button type="submit">Save profile</button>
                </form>
              </div>

              <div className="panel">
                <h2>Preferences</h2>
                <form className="stack-form" onSubmit={handleSaveSettings}>
                  <label>
                    Language
                    <select value={settingsLang} onChange={e => setSettingsLang(e.target.value)}>
                      <option value="en">English</option>
                      <option value="fr">French</option>
                      <option value="es">Spanish</option>
                    </select>
                  </label>
                  <label>
                    Font style
                    <select value={settingsFont} onChange={e => { setSettingsFont(e.target.value); document.documentElement.setAttribute('data-font', e.target.value) }}>
                      <option value="default">Default</option>
                      <option value="serif">Serif</option>
                      <option value="mono">Monospace</option>
                    </select>
                  </label>
                  <label>
                    Color theme
                    <select value={settingsColor} onChange={e => { setSettingsColor(e.target.value); document.documentElement.setAttribute('data-theme', e.target.value) }}>
                      <option value="purple">Purple</option>
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                      <option value="orange">Orange</option>
                    </select>
                  </label>
                  <div className="theme-previews">
                    {['purple', 'blue', 'green', 'orange'].map(c => (
                      <div key={c} className={`theme-swatch ${settingsColor === c ? 'active' : ''} swatch-${c}`}
                        onClick={() => { setSettingsColor(c); document.documentElement.setAttribute('data-theme', c) }} />
                    ))}
                  </div>
                  <button type="submit">Save preferences</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default App
