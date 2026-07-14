/* eslint-disable react-hooks/set-state-in-effect */
import { type FormEvent, useCallback, useEffect, useState } from 'react'
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
  members?: WorkspaceMember[]
}

type WorkspaceMember = {
  id: string
  userId: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
}

type WorkspaceInvitation = {
  id: string
  email: string
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED'
  createdAt: string
  expiresAt: string
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

type ActivityItem = {
  id: string
  action: string
  createdAt: string
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

function App() {
  const [mode, setMode] = useState<Mode>('login')
  const [form, setForm] = useState<FormState>(initialForm)
  const [message, setMessage] = useState('')
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
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitationToken, setInvitationToken] = useState('')

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

  const fetchJson = useCallback(async (input: string, init?: RequestInit) => {
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
  }, [authToken, refreshToken])

  const loadProfile = useCallback(async () => {
    try {
      const data = await fetchJson('/api/auth/me')
      setUser(data.user)
    } catch {
      setUser(null)
    }
  }, [fetchJson])

  const loadWorkspaces = useCallback(async () => {
    try {
      const data = await fetchJson('/api/workspaces')
      const nextWorkspaces = data.workspaces || []
      setWorkspaces(nextWorkspaces)
      setSelectedWorkspaceId((previousWorkspaceId) =>
        previousWorkspaceId || (nextWorkspaces[0]?.id ?? ''),
      )
    } catch {
      setWorkspaces([])
    }
  }, [fetchJson])

  const loadTasks = useCallback(async () => {
    if (!selectedWorkspaceId) return
    try {
      const data = await fetchJson(`/api/tasks?workspaceId=${selectedWorkspaceId}`)
      setTasks(data.tasks || [])
    } catch {
      setTasks([])
    }
  }, [fetchJson, selectedWorkspaceId])

  const loadComments = useCallback(async (taskId: string) => {
    try {
      const data = await fetchJson(`/api/comments/${taskId}`)
      setComments(data.comments || [])
    } catch {
      setComments([])
    }
  }, [fetchJson])

  const loadActivity = useCallback(async () => {
    try {
      const data = await fetchJson('/api/activity')
      setActivity(data.activity || [])
    } catch {
      setActivity([])
    }
  }, [fetchJson])

  const loadInvitations = useCallback(async () => {
    if (!selectedWorkspaceId) {
      setInvitations([])
      return
    }
    try {
      const data = await fetchJson(`/api/workspaces/${selectedWorkspaceId}/invitations`)
      setInvitations(data.invitations || [])
    } catch {
      setInvitations([])
    }
  }, [fetchJson, selectedWorkspaceId])

  useEffect(() => {
    if (authToken) {
      void loadProfile()
      void loadWorkspaces()
      void loadActivity()
      void loadInvitations()
    }
  }, [authToken, loadActivity, loadInvitations, loadProfile, loadWorkspaces])

  useEffect(() => {
    void loadTasks()
  }, [loadTasks])

  useEffect(() => {
    if (selectedTaskId) {
      void loadComments(selectedTaskId)
    }
  }, [loadComments, selectedTaskId])

  useEffect(() => {
    void loadInvitations()
  }, [loadInvitations])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    const payload =
      mode === 'register'
        ? {
          firstname: form.firstname,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
        }
        : {
          email: form.email,
          password: form.password,
        }

    try {
      const response = await fetch(`/api/auth/${mode === 'register' ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Request failed')
      }

      const token = data.accessToken || data.token
      const nextRefreshToken = data.refreshToken
      if (token) {
        persistAuth(token, nextRefreshToken)
      }

      setMessage(data.message || 'Success')
      setSessionNotice('')

      if (mode === 'register') {
        setMode('login')
        setForm(initialForm)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong')
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
      setMessage('Workspace created')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create workspace')
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
      setMessage('Task added')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create task')
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
      setMessage(error instanceof Error ? error.message : 'Unable to update task')
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
      setMessage(error instanceof Error ? error.message : 'Unable to add comment')
    }
  }

  const handleInviteMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedWorkspaceId) return
    try {
      await fetchJson(`/api/workspaces/${selectedWorkspaceId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      })
      setInviteEmail('')
      await loadInvitations()
      setMessage('Invitation sent')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to send invitation')
    }
  }

  const handleResendInvitation = async (invitationId: string) => {
    if (!selectedWorkspaceId) return
    try {
      await fetchJson(`/api/workspaces/${selectedWorkspaceId}/invitations/${invitationId}/resend`, {
        method: 'POST',
      })
      await loadInvitations()
      setMessage('Invitation resent')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to resend invitation')
    }
  }

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!selectedWorkspaceId) return
    try {
      await fetchJson(`/api/workspaces/${selectedWorkspaceId}/invitations/${invitationId}/revoke`, {
        method: 'POST',
      })
      await loadInvitations()
      setMessage('Invitation revoked')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to revoke invitation')
    }
  }

  const handleAcceptInvitation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await fetchJson('/api/workspaces/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: invitationToken }),
      })
      setInvitationToken('')
      await loadWorkspaces()
      await loadInvitations()
      setMessage('Invitation accepted')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to accept invitation')
    }
  }

  const selectedWorkspace = workspaces.find((workspace) => workspace.id === selectedWorkspaceId)
  const canManageInvites = Boolean(
    selectedWorkspace &&
    user &&
    selectedWorkspace.members?.some((member) => member.userId === user.id && member.role === 'OWNER'),
  )

  const logout = () => {
    clearSession()
    setSessionNotice('You have been signed out.')
  }

  if (!authToken || !user) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <div className="auth-header">
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setMode('login')
                setMessage('')
                setSessionNotice('')
              }}
            >
              ← Back
            </button>
            <p className="eyebrow">TaskManager</p>
            <h1>{mode === 'login' ? 'Sign in to your workspace' : 'Create your account'}</h1>
            <p>
              {mode === 'login'
                ? 'Use your email and password to continue.'
                : 'Register quickly and start organizing your tasks.'}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="name-row">
                <label>
                  First name
                  <input
                    value={form.firstname}
                    onChange={(event) => setForm({ ...form, firstname: event.target.value })}
                    required
                  />
                </label>
                <label>
                  Last name
                  <input
                    value={form.lastName}
                    onChange={(event) => setForm({ ...form, lastName: event.target.value })}
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
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
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
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setMessage('')
              }}
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>

          {sessionNotice && <p className="feedback">{sessionNotice}</p>}
          {message && <p className="feedback">{message}</p>}
        </section>
      </main>
    )
  }

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">TaskManager</p>
          <h1>Welcome back, {user.firstname}</h1>
          <p>Organize work, track progress, and keep your team moving.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="secondary-btn" onClick={() => window.history.back()}>
            ← Back
          </button>
          <button type="button" className="secondary-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <section className="panel-grid">
        <div className="panel">
          <h2>Create workspace</h2>
          <form className="stack-form" onSubmit={handleCreateWorkspace}>
            <input
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              placeholder="Workspace name"
              required
            />
            <input
              value={workspaceDescription}
              onChange={(event) => setWorkspaceDescription(event.target.value)}
              placeholder="Optional description"
            />
            <button type="submit">Add workspace</button>
          </form>
        </div>

        <div className="panel">
          <h2>Your workspaces</h2>
          <div className="workspace-list">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                type="button"
                className={`workspace-chip ${selectedWorkspaceId === workspace.id ? 'active' : ''}`}
                onClick={() => setSelectedWorkspaceId(workspace.id)}
              >
                {workspace.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="panel-grid">
        <div className="panel">
          <h2>Workspace invitations</h2>
          {canManageInvites ? (
            <>
              <form className="stack-form" onSubmit={handleInviteMember}>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="member@company.com"
                  required
                />
                <button type="submit" disabled={!selectedWorkspaceId}>Invite member</button>
              </form>
              <div className="invitation-list">
                {invitations.length === 0 ? (
                  <p className="empty-column">No invitations yet</p>
                ) : (
                  invitations.map((invitation) => (
                    <article key={invitation.id} className="invitation-item">
                      <div>
                        <strong>{invitation.email}</strong>
                        <p className="task-meta">Status: {invitation.status}</p>
                      </div>
                      {invitation.status === 'PENDING' && (
                        <div className="task-actions">
                          <button type="button" className="mini-btn" onClick={() => handleResendInvitation(invitation.id)}>
                            Resend
                          </button>
                          <button type="button" className="mini-btn" onClick={() => handleRevokeInvitation(invitation.id)}>
                            Revoke
                          </button>
                        </div>
                      )}
                    </article>
                  ))
                )}
              </div>
            </>
          ) : (
            <p className="empty-column">Only workspace owners can invite and manage members.</p>
          )}
        </div>
        <div className="panel">
          <h2>Accept invite</h2>
          <form className="stack-form" onSubmit={handleAcceptInvitation}>
            <input
              value={invitationToken}
              onChange={(event) => setInvitationToken(event.target.value)}
              placeholder="Paste invitation token"
              required
            />
            <button type="submit">Accept invitation</button>
          </form>
        </div>
      </section>

      <section className="panel">
        <h2>Add task</h2>
        <form className="stack-form" onSubmit={handleCreateTask}>
          <input
            value={taskTitle}
            onChange={(event) => setTaskTitle(event.target.value)}
            placeholder="Task title"
            required
          />
          <input
            value={taskDescription}
            onChange={(event) => setTaskDescription(event.target.value)}
            placeholder="Task description"
          />
          <select value={taskPriority} onChange={(event) => setTaskPriority(event.target.value)}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
          <input type="date" value={taskDueDate} onChange={(event) => setTaskDueDate(event.target.value)} />
          <button type="submit" disabled={!selectedWorkspaceId}>Add task</button>
        </form>
      </section>

      <section className="panel">
        <h2>Task overview</h2>
        <select value={taskFilter} onChange={(event) => setTaskFilter(event.target.value)}>
          <option value="ALL">All</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="REVIEW">Review</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <div className="task-summary-grid">
          <div className="summary-card">Total: {tasks.length}</div>
          <div className="summary-card">Completed: {tasks.filter((task) => task.status === 'COMPLETED').length}</div>
          <div className="summary-card">In progress: {tasks.filter((task) => task.status === 'IN_PROGRESS').length}</div>
          <div className="summary-card">Overdue: {tasks.filter((task) => task.dueDate && new Date(task.dueDate) < new Date()).length}</div>
        </div>
      </section>

      {sessionNotice && <p className="feedback">{sessionNotice}</p>}
      {message && <p className="feedback">{message}</p>}

      <section className="kanban-board">
        {statusColumns.map((status) => (
          <div key={status} className="kanban-column">
            <h3>{status.replace('_', ' ')}</h3>
            {tasks.filter((task) => task.status === status && (taskFilter === 'ALL' || task.status === taskFilter)).length === 0 ? (
              <p className="empty-column">No tasks</p>
            ) : (
              tasks.filter((task) => task.status === status && (taskFilter === 'ALL' || task.status === taskFilter)).map((task) => (
                <article key={task.id} className="task-card">
                  <strong>{task.title}</strong>
                  {task.description && <p>{task.description}</p>}
                  <p className="task-meta">Priority: {task.priority}</p>
                  {task.dueDate && <p className="task-meta">Due: {task.dueDate}</p>}
                  <div className="task-actions">
                    {statusColumns
                      .filter((column) => column !== status)
                      .map((nextStatus) => (
                        <button
                          key={nextStatus}
                          type="button"
                          className="mini-btn"
                          onClick={() => handleMoveTask(task.id, nextStatus)}
                        >
                          Move to {nextStatus.replace('_', ' ')}
                        </button>
                      ))}
                    <button type="button" className="mini-btn" onClick={() => setSelectedTaskId(task.id)}>
                      Comments
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        ))}
      </section>

      <section className="panel comments-panel">
        <h2>Task discussions</h2>
        {selectedTaskId ? (
          <>
            <form className="stack-form" onSubmit={handleAddComment}>
              <input
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Write a comment"
                required
              />
              <button type="submit">Add comment</button>
            </form>
            <div className="comment-list">
              {comments.map((comment) => (
                <div key={comment.id} className="comment-item">{comment.content}</div>
              ))}
            </div>
          </>
        ) : (
          <p className="empty-column">Select a task to view comments</p>
        )}
      </section>

      <section className="panel">
        <h2>Recent activity</h2>
        <div className="activity-list">
          {activity.map((item) => (
            <div key={item.id} className="activity-item">
              <span>{item.action}</span>
              <small>{new Date(item.createdAt).toLocaleString()}</small>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
