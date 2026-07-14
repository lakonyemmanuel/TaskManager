import { type FormEvent, useEffect, useState } from 'react'
import './App.css'

type Mode = 'login' | 'register'

type FormState = {
  firstname: string
  lastName: string
  email: string
  password: string
}

type Workspace = {
  id: string
  name: string
  description?: string | null
}

type Task = {
  id: string
  title: string
  description?: string | null
  status: string
  priority: string
  workspaceId: string
  dueDate?: string | null
}

type Comment = {
  id: string
  content: string
  taskId: string
}

type Invitation = {
  id: string
  email: string
  workspaceId: string
  token: string
  status: string
  expiresAt: string
  workspace?: { id: string; name: string }
}

type UserSession = {
  id: string
  email: string
  firstname: string
  lastName: string
}

const initialForm: FormState = {
  firstname: '',
  lastName: '',
  email: '',
  password: '',
}

const statusColumns = ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']
type NavPage = 'tasks' | 'workspace'

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
  const [taskFilter, setTaskFilter] = useState('ALL')
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [myInvitations, setMyInvitations] = useState<Invitation[]>([])
  const [workspaceInvitations, setWorkspaceInvitations] = useState<Invitation[]>([])
  const [navPage, setNavPage] = useState<NavPage>('tasks')

  const showMessage = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setMessage(msg)
    setMessageType(type)
  }

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
    setAuthToken(null)
    setRefreshToken(null)
    setUser(null)
    setWorkspaces([])
    setTasks([])
    setSelectedWorkspaceId('')
  }

  const fetchJson = async (input: string, init?: RequestInit) => {
    const headers = new Headers(init?.headers)
    const tokenToUse = authToken || localStorage.getItem('taskmanager_token')

    if (tokenToUse) {
      headers.set('Authorization', `Bearer ${tokenToUse}`)
    }

    let response = await fetch(input, { ...init, headers })

    if (response.status === 401 && refreshToken) {
      try {
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })
        const refreshData = await refreshResponse.json().catch(() => ({}))

        if (refreshResponse.ok && refreshData.accessToken) {
          persistAuth(refreshData.accessToken, refreshToken)
          headers.set('Authorization', `Bearer ${refreshData.accessToken}`)
          response = await fetch(input, { ...init, headers })
        } else {
          throw new Error(refreshData.message || 'Session expired')
        }
      } catch {
        clearSession()
        setSessionNotice('Your session expired. Please sign in again.')
        throw new Error('Session expired. Please sign in again.')
      }
    }

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data.message || 'Request failed')
    }
    return data
  }

  const loadProfile = async () => {
    try {
      const data = await fetchJson('/api/auth/me')
      setUser(data.user)
    } catch {
      setUser(null)
    }
  }

  const loadWorkspaces = async () => {
    try {
      const data = await fetchJson('/api/workspaces')
      const nextWorkspaces = data.workspaces || []
      setWorkspaces(nextWorkspaces)
      if (!selectedWorkspaceId && nextWorkspaces.length) {
        setSelectedWorkspaceId(nextWorkspaces[0].id)
      }
    } catch {
      setWorkspaces([])
    }
  }

  const loadTasks = async () => {
    if (!selectedWorkspaceId) return
    try {
      const data = await fetchJson(`/api/tasks?workspaceId=${selectedWorkspaceId}`)
      setTasks(data.tasks || [])
    } catch {
      setTasks([])
    }
  }

  const loadComments = async (taskId: string) => {
    try {
      const data = await fetchJson(`/api/comments/${taskId}`)
      setComments(data.comments || [])
    } catch {
      setComments([])
    }
  }

  const loadMyInvitations = async () => {
    try {
      const data = await fetchJson('/api/invitations/mine')
      setMyInvitations(data.invitations || [])
    } catch {
      setMyInvitations([])
    }
  }

  const loadWorkspaceInvitations = async () => {
    if (!selectedWorkspaceId) return
    try {
      const data = await fetchJson(`/api/invitations/workspace/${selectedWorkspaceId}`)
      setWorkspaceInvitations(data.invitations || [])
    } catch {
      setWorkspaceInvitations([])
    }
  }

  useEffect(() => {
    if (authToken) {
      void loadProfile()
      void loadWorkspaces()
      void loadMyInvitations()
    }
  }, [authToken])

  useEffect(() => {
    void loadTasks()
  }, [selectedWorkspaceId])

  useEffect(() => {
    void loadWorkspaceInvitations()
  }, [selectedWorkspaceId])

  useEffect(() => {
    if (selectedTaskId) {
      void loadComments(selectedTaskId)
    }
  }, [selectedTaskId])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    const payload =
      mode === 'register'
        ? { firstname: form.firstname, lastName: form.lastName, email: form.email, password: form.password }
        : { email: form.email, password: form.password }

    try {
      const response = await fetch(`/api/auth/${mode === 'register' ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.message || 'Request failed')

      const token = data.accessToken || data.token
      const nextRefreshToken = data.refreshToken
      if (token) persistAuth(token, nextRefreshToken)

      showMessage(data.message || 'Success', 'success')
      setSessionNotice('')

      if (mode === 'register') {
        setMode('login')
        setForm(initialForm)
      }
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Something went wrong', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWorkspace = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const data = await fetchJson('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: workspaceName, description: workspaceDescription }),
      })
      setWorkspaceName('')
      setWorkspaceDescription('')
      setSelectedWorkspaceId(data.workspace.id)
      await loadWorkspaces()
      showMessage('Workspace created', 'success')
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Unable to create workspace', 'error')
    }
  }

  const handleCreateTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await fetchJson('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          priority: taskPriority,
          dueDate: taskDueDate || null,
          workspaceId: selectedWorkspaceId,
        }),
      })
      setTaskTitle('')
      setTaskDescription('')
      setTaskPriority('MEDIUM')
      setTaskDueDate('')
      await loadTasks()
      showMessage('Task added', 'success')
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Unable to create task', 'error')
    }
  }

  const handleMoveTask = async (taskId: string, nextStatus: string) => {
    try {
      await fetchJson(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      await loadTasks()
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Unable to update task', 'error')
    }
  }

  const handleAddComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedTaskId) return
    try {
      await fetchJson('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: selectedTaskId, content: commentText }),
      })
      setCommentText('')
      await loadComments(selectedTaskId)
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Unable to add comment', 'error')
    }
  }

  const handleInviteMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedWorkspaceId) return
    try {
      const data = await fetchJson('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, workspaceId: selectedWorkspaceId }),
      })
      setInviteEmail('')
      showMessage(data.message || 'Invitation sent', 'success')
      await loadWorkspaceInvitations()
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Unable to send invitation', 'error')
    }
  }

  const handleAcceptInvitation = async (token: string) => {
    try {
      const data = await fetchJson(`/api/invitations/${token}/accept`, { method: 'POST' })
      showMessage(data.message || 'Joined workspace', 'success')
      await loadMyInvitations()
      await loadWorkspaces()
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Unable to accept invitation', 'error')
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await fetchJson(`/api/invitations/${invitationId}`, { method: 'DELETE' })
      showMessage('Invitation cancelled', 'info')
      await loadWorkspaceInvitations()
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Unable to cancel invitation', 'error')
    }
  }

  const logout = () => {
    clearSession()
    setSessionNotice('You have been signed out.')
  }

  const selectedWs = workspaces.find((w) => w.id === selectedWorkspaceId)

  // ─── Auth screen ───
  if (!authToken || !user) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <div className="auth-header">
            <p className="eyebrow">TaskManager</p>
            <h1>{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
            <p>
              {mode === 'login'
                ? 'Use your email and password to continue.'
                : 'Register to start organizing your tasks.'}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="name-row">
                <label>
                  First name
                  <input
                    value={form.firstname}
                    onChange={(e) => setForm({ ...form, firstname: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Last name
                  <input
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    required
                  />
                </label>
              </div>
            )}

            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </label>

            <button type="submit" disabled={loading}>
              {loading ? 'Working...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="switch-copy">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            <button
              type="button"
              className="link-button"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage(''); }}
            >
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
    <main className="dashboard-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <p className="eyebrow">TaskManager</p>
          <h2>{user.firstname} {user.lastName}</h2>
          <p>{selectedWs?.name || 'No workspace'}</p>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>

          <button
            className={`nav-item ${navPage === 'tasks' ? 'active' : ''}`}
            onClick={() => setNavPage('tasks')}
          >
            <span className="nav-icon">&#9776;</span>
            <span>Tasks</span>
          </button>

          <button
            className={`nav-item ${navPage === 'workspace' ? 'active' : ''}`}
            onClick={() => setNavPage('workspace')}
          >
            <span className="nav-icon">&#9881;</span>
            <span>Workspace</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user.firstname.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.firstname}</div>
              <div className="sidebar-user-email">{user.email}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={logout} title="Sign out">
            &#10140;
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="main-area">
        <div className="main-topbar">
          <div>
            <h1>
              {navPage === 'tasks' ? 'Tasks' : 'Workspace Settings'}
            </h1>
            <p>
              {navPage === 'tasks'
                ? 'Manage and track your tasks across columns.'
                : 'Manage your workspace and invite members.'}
            </p>
          </div>
          <div className="main-topbar-actions">
            <div className="workspace-selector">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  type="button"
                  className={`workspace-chip ${selectedWorkspaceId === ws.id ? 'active' : ''}`}
                  onClick={() => setSelectedWorkspaceId(ws.id)}
                >
                  {ws.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="main-content">
          {/* Pending invitation banner */}
          {myInvitations.length > 0 && (
            <div className="invite-banner">
              <h3>Pending workspace invitations</h3>
              {myInvitations.map((inv) => (
                <div key={inv.id} className="invite-banner-item">
                  <span>
                    Join <strong>{inv.workspace?.name || 'a workspace'}</strong>
                  </span>
                  <button
                    type="button"
                    className="mini-btn"
                    style={{ background: '#c084fc', color: '#0f0a1a' }}
                    onClick={() => handleAcceptInvitation(inv.token)}
                  >
                    Accept
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Message bar */}
          {message && (
            <div className={`message-bar ${messageType}`}>
              {message}
            </div>
          )}

          {sessionNotice && <div className="message-bar info">{sessionNotice}</div>}

          {/* ─── TASKS PAGE ─── */}
          {navPage === 'tasks' && (
            <>
              {/* Add task + Task overview grid */}
              <div className="dashboard-grid">
                <div className="panel">
                  <h2>Add task</h2>
                  <form className="stack-form" onSubmit={handleCreateTask}>
                    <input
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="Task title"
                      required
                    />
                    <input
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      placeholder="Task description"
                    />
                    <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                    <input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
                    <button type="submit" disabled={!selectedWorkspaceId}>Add task</button>
                  </form>
                </div>

                <div className="panel">
                  <h2>Task overview</h2>
                  <select
                    value={taskFilter}
                    onChange={(e) => setTaskFilter(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid #2a2d3e',
                      background: '#0a0b12',
                      color: '#e2e8f0',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  >
                    <option value="ALL">All statuses</option>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="REVIEW">Review</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                  <div className="task-summary-grid">
                    <div className="summary-card">
                      <strong>{tasks.length}</strong>
                      Total
                    </div>
                    <div className="summary-card">
                      <strong>{tasks.filter((t) => t.status === 'COMPLETED').length}</strong>
                      Completed
                    </div>
                    <div className="summary-card">
                      <strong>{tasks.filter((t) => t.status === 'IN_PROGRESS').length}</strong>
                      In progress
                    </div>
                    <div className="summary-card">
                      <strong>{tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date()).length}</strong>
                      Overdue
                    </div>
                  </div>
                </div>
              </div>

              {/* Kanban board */}
              <div className="kanban-board">
                {statusColumns.map((status) => (
                  <div key={status} className="kanban-column">
                    <h3>{status.replace('_', ' ')}</h3>
                    {tasks.filter(
                      (task) => task.status === status && (taskFilter === 'ALL' || task.status === taskFilter)
                    ).length === 0 ? (
                      <p className="empty-column">No tasks</p>
                    ) : (
                      tasks
                        .filter(
                          (task) => task.status === status && (taskFilter === 'ALL' || task.status === taskFilter)
                        )
                        .map((task) => (
                          <div key={task.id} className="task-card">
                            <strong>{task.title}</strong>
                            {task.description && <p>{task.description}</p>}
                            <p className="task-meta">Priority: {task.priority}</p>
                            {task.dueDate && <p className="task-meta">Due: {task.dueDate}</p>}
                            <div className="task-actions">
                              {statusColumns
                                .filter((col) => col !== status)
                                .map((nextStatus) => (
                                  <button
                                    key={nextStatus}
                                    type="button"
                                    className="mini-btn"
                                    style={{ background: '#1c1f30', color: '#94a3b8' }}
                                    onClick={() => handleMoveTask(task.id, nextStatus)}
                                  >
                                    {nextStatus.replace('_', ' ')}
                                  </button>
                                ))}
                              <button
                                type="button"
                                className="mini-btn"
                                style={{ background: '#1c1f30', color: '#94a3b8' }}
                                onClick={() => setSelectedTaskId(task.id)}
                              >
                                Comments
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                ))}
              </div>

              {/* Comments section */}
              <div className="panel comments-section">
                <h2>Task discussions</h2>
                {selectedTaskId ? (
                  <>
                    <form className="stack-form" onSubmit={handleAddComment}>
                      <input
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a comment"
                        required
                      />
                      <button type="submit">Add comment</button>
                    </form>
                    <div className="comment-list">
                      {comments.map((comment) => (
                        <div key={comment.id} className="comment-item">
                          {comment.content}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p style={{ color: '#475569', fontSize: '0.85rem', padding: '8px 0' }}>
                    Select a task to view comments
                  </p>
                )}
              </div>
            </>
          )}

          {/* ─── WORKSPACE PAGE ─── */}
          {navPage === 'workspace' && (
            <div className="dashboard-grid">
              <div className="panel">
                <h2>Create workspace</h2>
                <form className="stack-form" onSubmit={handleCreateWorkspace}>
                  <input
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="Workspace name"
                    required
                  />
                  <input
                    value={workspaceDescription}
                    onChange={(e) => setWorkspaceDescription(e.target.value)}
                    placeholder="Optional description"
                  />
                  <button type="submit">Add workspace</button>
                </form>
              </div>

              <div className="panel">
                <h2>Your workspaces</h2>
                <div className="workspace-list">
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      type="button"
                      className={`workspace-chip ${selectedWorkspaceId === ws.id ? 'active' : ''}`}
                      onClick={() => setSelectedWorkspaceId(ws.id)}
                    >
                      {ws.name}
                    </button>
                  ))}
                </div>

                {selectedWorkspaceId && (
                  <div className="invite-section">
                    <h3>Invite a member</h3>
                    <form className="stack-form" onSubmit={handleInviteMember}>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@company.com"
                        required
                      />
                      <button type="submit">Send invite</button>
                    </form>

                    {workspaceInvitations.filter((inv) => inv.status === 'PENDING').length > 0 && (
                      <div>
                        <h3 style={{ marginTop: 16 }}>Pending invitations</h3>
                        <div className="invite-list">
                          {workspaceInvitations
                            .filter((inv) => inv.status === 'PENDING')
                            .map((inv) => (
                              <div key={inv.id} className="invite-item">
                                <span>{inv.email}</span>
                                <button
                                  type="button"
                                  className="mini-btn"
                                  style={{ background: 'rgba(248,113,113,0.15)', color: '#fca5a5' }}
                                  onClick={() => handleCancelInvitation(inv.id)}
                                >
                                  Cancel
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default App
