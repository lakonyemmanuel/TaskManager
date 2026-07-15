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

// ─── Translation system ───
const LANGUAGES: Record<string, string> = {
  en: 'English', sw: 'Kiswahili', fr: 'Français', ko: '한국어', es: 'Español', zh: '中文', lg: 'Luganda'
}
type TranslationMap = Record<string, Record<string, string>>
const translations: TranslationMap = {
  dashboard: { en: 'Dashboard', sw: 'Dashibodi', fr: 'Tableau de bord', ko: '대시보드', es: 'Panel', zh: '仪表盘', lg: 'Ddaabadi' },
  myTasks: { en: 'My Tasks', sw: 'Kazi Zangu', fr: 'Mes Tâches', ko: '내 작업', es: 'Mis Tareas', zh: '我的任务', lg: 'Emirimu Gyange' },
  boards: { en: 'Boards', sw: 'Mbao', fr: 'Tableaux', ko: '보드', es: 'Tableros', zh: '看板', lg: 'Mbaao' },
  calendar: { en: 'Calendar', sw: 'Kalenda', fr: 'Calendrier', ko: '달력', es: 'Calendario', zh: '日历', lg: 'Kalenda' },
  team: { en: 'Team', sw: 'Timu', fr: 'Équipe', ko: '팀', es: 'Equipo', zh: '团队', lg: 'Ttiimu' },
  reports: { en: 'Reports', sw: 'Ripoti', fr: 'Rapports', ko: '리포트', es: 'Informes', zh: '报告', lg: 'Lipooti' },
  settings: { en: 'Settings', sw: 'Mipangilio', fr: 'Paramètres', ko: '설정', es: 'Ajustes', zh: '设置', lg: 'Enteeka' },
  signIn: { en: 'Sign in', sw: 'Ingia', fr: 'Connexion', ko: '로그인', es: 'Iniciar sesión', zh: '登录', lg: 'Yingira' },
  morning: { en: 'Good morning', sw: 'Habari za asubuhi', fr: 'Bonjour', ko: '좋은 아침', es: 'Buenos días', zh: '早上好', lg: 'Wasuze otya' },
  afternoon: { en: 'Good afternoon', sw: 'Habari za mchana', fr: 'Bon après-midi', ko: '좋은 오후', es: 'Buenas tardes', zh: '下午好', lg: 'Osiibye otya' },
  evening: { en: 'Good evening', sw: 'Habari za jioni', fr: 'Bonsoir', ko: '좋은 저녁', es: 'Buenas noches', zh: '晚上好', lg: 'Osiibye otya' },
  createAccount: { en: 'Create account', sw: 'Tengeneza akaunti', fr: 'Créer un compte', ko: '계정 만들기', es: 'Crear cuenta', zh: '创建账户', lg: 'Tonda akaunti' },
  email: { en: 'Email', sw: 'Barua pepe', fr: 'Email', ko: '이메일', es: 'Correo', zh: '邮箱', lg: 'Imeyiro' },
  password: { en: 'Password', sw: 'Nywila', fr: 'Mot de passe', ko: '비밀번호', es: 'Contraseña', zh: '密码', lg: 'Kiyi' },
  firstName: { en: 'First name', sw: 'Jina la kwanza', fr: 'Prénom', ko: '이름', es: 'Nombre', zh: '名', lg: 'Erinnya Lisooka' },
  lastName: { en: 'Last name', sw: 'Jina la mwisho', fr: 'Nom', ko: '성', es: 'Apellido', zh: '姓', lg: 'Erinnya Ekkubo' },
  logout: { en: 'Logout', sw: 'Toka', fr: 'Déconnexion', ko: '로그아웃', es: 'Cerrar sesión', zh: '退出', lg: 'Ffuluma' },
  search: { en: 'Search...', sw: 'Tafuta...', fr: 'Rechercher...', ko: '검색...', es: 'Buscar...', zh: '搜索...', lg: 'Noonya...' },
  save: { en: 'Save', sw: 'Hifadhi', fr: 'Enregistrer', ko: '저장', es: 'Guardar', zh: '保存', lg: 'Kkweka' },
  cancel: { en: 'Cancel', sw: 'Ghairi', fr: 'Annuler', ko: '취소', es: 'Cancelar', zh: '取消', lg: 'Ggyyawo' },
  delete: { en: 'Delete', sw: 'Futa', fr: 'Supprimer', ko: '삭제', es: 'Eliminar', zh: '删除', lg: 'Ssangula' },
  addTask: { en: 'Add task', sw: 'Ongeza kazi', fr: 'Ajouter une tâche', ko: '작업 추가', es: 'Añadir tarea', zh: '添加任务', lg: 'Yongera omulimu' },
  taskTitle: { en: 'Task title', sw: 'Jina la kazi', fr: 'Titre de la tâche', ko: '작업 제목', es: 'Título de la tarea', zh: '任务标题', lg: 'Omutwe gw\'omulimu' },
  taskDescription: { en: 'Description', sw: 'Maelezo', fr: 'Description', ko: '설명', es: 'Descripción', zh: '描述', lg: 'Okunnyonnyola' },
  priority: { en: 'Priority', sw: 'Kipaumbele', fr: 'Priorité', ko: '우선순위', es: 'Prioridad', zh: '优先级', lg: 'Kisooka' },
  dueDate: { en: 'Due date', sw: 'Tarehe ya mwisho', fr: 'Date echeance', ko: 'Due date', es: 'Fecha limite', zh: 'Due date', lg: 'Enaku zennaku' },
  dueTime: { en: 'Time', sw: 'Muda', fr: 'Heure', ko: '시간', es: 'Hora', zh: '时间', lg: 'Essaawa' },
  status: { en: 'Status', sw: 'Hali', fr: 'Statut', ko: '상태', es: 'Estado', zh: '状态', lg: 'Embeera' },
  assignTo: { en: 'Assign to...', sw: 'Kwa...', fr: 'Assigner à...', ko: '할당...', es: 'Asignar a...', zh: '分配给...', lg: 'Gaba eri...' },
  noTasks: { en: 'No tasks', sw: 'Hakuna kazi', fr: 'Aucune tâche', ko: '작업 없음', es: 'Sin tareas', zh: '没有任务', lg: 'Tewali mirimu' },
  overview: { en: 'Overview', sw: 'Muhtasari', fr: 'Aperçu', ko: '개요', es: 'Resumen', zh: '概览', lg: 'Endabirira' },
  total: { en: 'Total', sw: 'Jumla', fr: 'Total', ko: '합계', es: 'Total', zh: '总计', lg: 'Omuwendo' },
  completed: { en: 'Completed', sw: 'Imekamilika', fr: 'Terminé', ko: '완료됨', es: 'Completado', zh: '已完成', lg: 'Okumaliriza' },
  inProgress: { en: 'In progress', sw: 'Inaendelea', fr: 'En cours', ko: '진행 중', es: 'En progreso', zh: '进行中', lg: 'Kiri mu maaso' },
  overdue: { en: 'Overdue', sw: 'Imechelewa', fr: 'En retard', ko: '기한 초과', es: 'Vencido', zh: '已逾期', lg: 'Kiyise' },
  teamMembers: { en: 'Team members', sw: 'Wanatimu', fr: 'Membres', ko: '팀 멤버', es: 'Miembros del equipo', zh: '团队成员', lg: 'Abomu ttiimu' },
  recentTasks: { en: 'Recent tasks', sw: 'Kazi za hivi karibuni', fr: 'Taches recentes', ko: '최근 작업', es: 'Tareas recientes', zh: '最近的任务', lg: 'Emirimu ebya kumpi' },
  deadlines: { en: 'Upcoming deadlines', sw: 'Tarehe zinazokuja', fr: 'Échéances à venir', ko: '다가오는 마감', es: 'Próximos vencimientos', zh: '即将截止', lg: 'Enaku ezijja' },
  profile: { en: 'Profile', sw: 'Wasifu', fr: 'Profil', ko: '프로필', es: 'Perfil', zh: '个人资料', lg: 'Pulofayiro' },
  preferences: { en: 'Preferences', sw: 'Mapendeleo', fr: 'Préférences', ko: '환경 설정', es: 'Preferencias', zh: '偏好设置', lg: 'Okusalawo' },
  language: { en: 'Language', sw: 'Lugha', fr: 'Langue', ko: '언어', es: 'Idioma', zh: '语言', lg: 'Olulimi' },
  fontStyle: { en: 'Font style', sw: 'Mtindo wa herufi', fr: 'Style de police', ko: '글꼴 스타일', es: 'Estilo de fuente', zh: '字体风格', lg: 'Enkola y\'ennukuta' },
  colorTheme: { en: 'Color theme', sw: 'Mandhari ya rangi', fr: 'Thème de couleur', ko: '색상 테마', es: 'Tema de color', zh: '颜色主题', lg: 'Essomero l\'langi' },
  avatarUrl: { en: 'Avatar image URL', sw: 'URL ya picha', fr: 'URL de l\'avatar', ko: '아바타 이미지 URL', es: 'URL de avatar', zh: '头像图片链接', lg: 'URL y\'endabirira' },
  uploadPhoto: { en: 'Upload from device', sw: 'Pakia kutoka kifaa', fr: 'Télécharger', ko: '기기에서 업로드', es: 'Subir desde dispositivo', zh: '从设备上传', lg: 'Pulika okuva ku kifaananyi' },
  bio: { en: 'Bio', sw: 'Wasifu', fr: 'Biographie', ko: '소개', es: 'Biografía', zh: '简介', lg: 'Ebyafaayo' },
  invite: { en: 'Invite member', sw: 'Alika mwanatimu', fr: 'Inviter un membre', ko: '멤버 초대', es: 'Invitar miembro', zh: '邀请成员', lg: 'Yita omu ttiimu' },
  workspaceName: { en: 'Workspace name', sw: 'Jina la eneo la kazi', fr: 'Nom de l\'espace', ko: '워크스페이스 이름', es: 'Nombre del espacio', zh: '工作区名称', lg: 'Erinnya ly\'ekifo ky\'omulimu' },
  sendInvite: { en: 'Send invite', sw: 'Tuma mwaliko', fr: 'Envoyer l\'invitation', ko: '초대 보내기', es: 'Enviar invitación', zh: '发送邀请', lg: 'Tuma obuyito' },
  pendingInvites: { en: 'Pending invitations', sw: 'Mialiko inayosubiri', fr: 'Invitations en attente', ko: '대기 중인 초대', es: 'Invitaciones pendientes', zh: '待处理的邀请', lg: 'Obuyito obulindirira' },
  members: { en: 'Members', sw: 'Wanachama', fr: 'Membres', ko: '멤버', es: 'Miembros', zh: '成员', lg: 'Ab\'omu ttiimu' },
  createWorkspace: { en: 'Create workspace', sw: 'Tengeneza eneo la kazi', fr: 'Créer un espace', ko: '워크스페이스 만들기', es: 'Crear espacio', zh: '创建工作区', lg: 'Tonda ekifo ky\'omulimu' },
  progress: { en: 'Progress', sw: 'Maendeleo', fr: 'Progrès', ko: '진행률', es: 'Progreso', zh: '进度', lg: 'Okukulaakulana' },
  addWorkspace: { en: 'Add workspace', sw: 'Ongeza eneo', fr: 'Ajouter un espace', ko: '추가', es: 'Añadir espacio', zh: '添加', lg: 'Yongera' },
  saveProfile: { en: 'Save profile', sw: 'Hifadhi wasifu', fr: 'Enregistrer le profil', ko: '프로필 저장', es: 'Guardar perfil', zh: '保存资料', lg: 'Kkweka pulofayiro' },
  savePrefs: { en: 'Save preferences', sw: 'Hifadhi mapendeleo', fr: 'Enregistrer les préférences', ko: '환경 설정 저장', es: 'Guardar preferencias', zh: '保存偏好', lg: 'Kkweka okusalawo' },
  notifs: { en: 'Notifications', sw: 'Arifa', fr: 'Notifications', ko: '알림', es: 'Notificaciones', zh: '通知', lg: 'Okutegeesa' },
  markAllRead: { en: 'Mark all read', sw: 'Soma zote', fr: 'Tout marquer lu', ko: '모두 읽음', es: 'Marcar todo leído', zh: '全部标记已读', lg: 'Soma zonna' },
  noNotifs: { en: 'No notifications', sw: 'Hakuna arifa', fr: 'Aucune notification', ko: '알림 없음', es: 'Sin notificaciones', zh: '没有通知', lg: 'Tewali kutegeesa' },
  welcome: { en: 'Welcome back', sw: 'Karibu tena', fr: 'Bon retour', ko: '다시 오신 것을 환영합니다', es: 'Bienvenido de nuevo', zh: '欢迎回来', lg: 'Tunakwaniriza' },
  working: { en: 'Working...', sw: 'Inafanya kazi...', fr: 'En cours...', ko: '작업 중...', es: 'Trabajando...', zh: '工作中...', lg: 'Kiri ku mirimu...' },
  noAccount: { en: "Don't have an account?", sw: 'Huna akaunti?', fr: 'Pas de compte ?', ko: '계정이 없으신가요?', es: '¿No tienes cuenta?', zh: '没有账户？', lg: 'Tolina akaunti?' },
  haveAccount: { en: 'Already have an account?', sw: 'Tayari una akaunti?', fr: 'Déjà un compte ?', ko: '이미 계정이 있으신가요?', es: '¿Ya tienes cuenta?', zh: '已有账户？', lg: 'Olina akaunti?' },
  createOne: { en: 'Create one', sw: 'Tengeneza moja', fr: 'Créer un compte', ko: '만들기', es: 'Crear una', zh: '创建一个', lg: 'Tonda emu' },
  signInHere: { en: 'Sign in', sw: 'Ingia', fr: 'Se connecter', ko: '로그인', es: 'Iniciar sesión', zh: '登录', lg: 'Yingira' },
}

const greeting = (lang: string): string => {
  const hour = new Date().getHours()
  const key = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
  return t(key, lang)
}
const FONTS = ['default', 'serif', 'mono', 'georgia', 'impact', 'comic', 'courier', 'fantasy', 'trebuchet']
const COLORS = ['purple', 'blue', 'green', 'orange', 'red', 'pink', 'teal', 'yellow', 'indigo']

function t(key: string, lang: string): string {
  return translations[key]?.[lang] || translations[key]?.['en'] || key
}

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
  const [taskTime, setTaskTime] = useState('')
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
    setTimeout(() => setMessage(''), 1000)
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
      let dueDateTime = taskDueDate || null
      if (dueDateTime && taskTime) {
        dueDateTime = `${taskDueDate}T${taskTime}:00`
      }
      const body: Record<string, unknown> = {
        title: taskTitle, description: taskDescription, priority: taskPriority,
        dueDate: dueDateTime, workspaceId: selectedWorkspaceId,
      }
      if (taskAssignedTo) body.assignedToId = taskAssignedTo
      await fetchJson('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      setTaskTitle(''); setTaskDescription(''); setTaskPriority('MEDIUM'); setTaskDueDate(''); setTaskTime(''); setTaskAssignedTo('')
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
            <p className="eyebrow">Taskly</p>
            <h1>{mode === 'login' ? t('signIn', settingsLang) : t('createAccount', settingsLang)}</h1>
            <p>{mode === 'login' ? `${t('email', settingsLang)} ${t('password', settingsLang).toLowerCase()}` : `Register to start organizing your tasks.`}</p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="name-row">
                <label>{t('firstName', settingsLang)}<input value={form.firstname} onChange={e => setForm({ ...form, firstname: e.target.value })} required /></label>
                <label>{t('lastName', settingsLang)}<input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required /></label>
              </div>
            )}
            <label>{t('email', settingsLang)}<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></label>
            <label>{t('password', settingsLang)}<input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></label>
            <button type="submit" disabled={loading}>{loading ? t('working', settingsLang) : mode === 'login' ? t('signIn', settingsLang) : t('createAccount', settingsLang)}</button>
          </form>
          <p className="switch-copy">
            {mode === 'login' ? t('noAccount', settingsLang) : t('haveAccount', settingsLang)}
            <button type="button" className="link-button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage('') }}>
              {mode === 'login' ? t('createOne', settingsLang) : t('signInHere', settingsLang)}
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
          <p className="eyebrow">Taskly</p>
          <h2>{user.firstname} {user.lastName}</h2>
          <p>{selectedWs?.name || t('overview', settingsLang)}</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(({ page, icon }) => (
            <button key={page} className={`nav-item ${navPage === page ? 'active' : ''}`} onClick={() => setNavPage(page)}>
              <span className="nav-icon">{icon}</span>
              <span>{t(page === 'tasks' ? 'myTasks' : page, settingsLang)}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.textContent = user.firstname.charAt(0).toUpperCase() }} />
                : user.firstname.charAt(0).toUpperCase()}
            </div>
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
            <h1>{greeting(settingsLang)}, {user.firstname}</h1>
            <p>{selectedWs?.name || ''}</p>
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
            <div className="topbar-avatar" onClick={() => setNavPage('settings')} title={t('settings', settingsLang)}>
              <div className="sidebar-avatar">
                {user.avatarUrl
                  ? <img src={user.avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.textContent = user.firstname.charAt(0).toUpperCase() }} />
                  : user.firstname.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        <div className="main-content">
          {/* Invitation banner */}
          {myInvitations.length > 0 && (
            <div className="invite-banner">
              <h3>{t('pendingInvites', settingsLang)}</h3>
              {myInvitations.map(inv => (
                <div key={inv.id} className="invite-banner-item">
                  <span>{t('welcome', settingsLang)} <strong>{inv.workspace?.name || ''}</strong></span>
                  <button type="button" className="mini-btn accept-btn" onClick={() => handleAcceptInvitation(inv.token)}>{t('signIn', settingsLang)}</button>
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
                  <h2>{t('overview', settingsLang)}</h2>
                  <div className="task-summary-grid">
                    <div className="summary-card"><strong>{totalTasks}</strong>{t('total', settingsLang)}</div>
                    <div className="summary-card"><strong>{completedTasks}</strong>{t('completed', settingsLang)}</div>
                    <div className="summary-card"><strong>{inProgressTasks}</strong>{t('inProgress', settingsLang)}</div>
                    <div className="summary-card"><strong>{overdueTasks.length}</strong>{t('overdue', settingsLang)}</div>
                    <div className="summary-card"><strong>{myTasks.length}</strong>{t('myTasks', settingsLang)}</div>
                    <div className="summary-card"><strong>{members.length}</strong>{t('teamMembers', settingsLang)}</div>
                  </div>
                </div>
              </div>

              <div className="dashboard-grid">
                <div className="panel">
                  <h2>{t('progress', settingsLang)}</h2>
                  {totalTasks > 0 ? (
                    <div className="donut-chart">
                      <svg viewBox="0 0 36 36" className="donut-svg">
                        <path className="donut-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="donut-fill" strokeDasharray={`${completionPct}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <text x="18" y="20.5" className="donut-text">{completionPct}%</text>
                      </svg>
                    </div>
                  ) : <p className="empty-column">{t('noTasks', settingsLang)}</p>}
                  <div className="bar-chart" style={{ marginTop: 10 }}>
                    {[
                      { label: 'TODO', value: todoTasks, pct: totalTasks > 0 ? (todoTasks / totalTasks) * 100 : 0, color: '#64748b' },
                      { label: 'IN PROGRESS', value: inProgressTasks, pct: totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0, color: '#38bdf8' },
                      { label: 'COMPLETED', value: completedTasks, pct: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0, color: '#34d399' },
                      { label: 'OVERDUE', value: overdueTasks.length, pct: totalTasks > 0 ? (overdueTasks.length / totalTasks) * 100 : 0, color: '#f87171' },
                    ].map(bar => (
                      <div key={bar.label} className="bar-row" style={{ marginBottom: 4 }}>
                        <span className="bar-label" style={{ width: 80 }}>{bar.label}</span>
                        <div className="bar-track"><div className="bar-fill" style={{ width: `${bar.pct}%`, background: bar.color }} /></div>
                        <span className="bar-value">{bar.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel">
                  <h2>{t('recentTasks', settingsLang)}</h2>
                  {tasks.slice(0, 5).map(t => (
                    <div key={t.id} className="recent-task-item">
                      <strong>{t.title}</strong>
                      <span className={`priority-badge ${t.priority.toLowerCase()}`}>{t.priority}</span>
                      <span className={`status-badge ${t.status.toLowerCase()}`}>{t.status.replace('_', ' ')}</span>
                    </div>
                  ))}
                  {tasks.length === 0 && <p className="empty-column">{t('noTasks', settingsLang)}</p>}
                </div>
              </div>

              <div className="dashboard-grid">
                <div className="panel full-width">
                  <h2>{t('deadlines', settingsLang)}</h2>
                  {upcomingDeadlines.map(t => (
                    <div key={t.id} className="recent-task-item">
                      <strong>{t.title}</strong>
                      <span>{new Date(t.dueDate!).toLocaleDateString()} {t.dueDate!.includes('T') ? new Date(t.dueDate!).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : ''}</span>
                    </div>
                  ))}
                  {upcomingDeadlines.length === 0 && <p className="empty-column">{t('noTasks', settingsLang)}</p>}
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
                <input type="time" value={taskTime} onChange={e => setTaskTime(e.target.value)} />
                <select value={taskAssignedTo} onChange={e => setTaskAssignedTo(e.target.value)}>
                  <option value="">{t('assignTo', settingsLang)}</option>
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
                  <input type="time" value={taskTime} onChange={e => setTaskTime(e.target.value)} />
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
                <h2>{t('createWorkspace', settingsLang)}</h2>
                <form className="stack-form" onSubmit={handleCreateWorkspace}>
                  <input value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} placeholder={t('workspaceName', settingsLang)} required />
                  <input value={workspaceDescription} onChange={e => setWorkspaceDescription(e.target.value)} placeholder={t('taskDescription', settingsLang)} />
                  <button type="submit">{t('addWorkspace', settingsLang)}</button>
                </form>
              </div>

              <div className="panel">
                <h2>{t('members', settingsLang)} ({members.length})</h2>
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
                <h2>{t('invite', settingsLang)}</h2>
                <form className="stack-form" onSubmit={handleInviteMember}>
                  <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@company.com" required />
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                    <option value="MEMBER">{t('members', settingsLang)}</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <button type="submit">{t('sendInvite', settingsLang)}</button>
                </form>

                {workspaceInvitations.filter(i => i.status === 'PENDING').length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <h3>{t('pendingInvites', settingsLang)}</h3>
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
                <h2>{t('profile', settingsLang)}</h2>
                <form className="stack-form" onSubmit={handleSaveSettings}>
                  {settingsAvatar && (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 4 }}>
                      <img src={settingsAvatar} alt="Avatar" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover' }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      <button type="button" className="mini-btn danger-btn" onClick={() => setSettingsAvatar('')}>Remove</button>
                    </div>
                  )}
                  <label>{t('uploadPhoto', settingsLang)}
                    <input type="file" accept="image/*" onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (ev) => { if (ev.target?.result) setSettingsAvatar(ev.target.result as string) }
                        reader.readAsDataURL(file)
                      }
                    }} />
                  </label>
                  <label>{t('avatarUrl', settingsLang)}
                    <input value={settingsAvatar} onChange={e => setSettingsAvatar(e.target.value)} placeholder="https://..." />
                  </label>
                  <div className="name-row">
                    <label>{t('firstName', settingsLang)}<input value={settingsName} onChange={e => setSettingsName(e.target.value)} /></label>
                    <label>{t('lastName', settingsLang)}<input value={settingsLast} onChange={e => setSettingsLast(e.target.value)} /></label>
                  </div>
                  <label>{t('bio', settingsLang)}<textarea value={settingsBio} onChange={e => setSettingsBio(e.target.value)} rows={2} /></label>
                  <label style={{ color: '#64748b', fontSize: '0.82rem' }}>Email: {user.email}</label>
                  <button type="submit">{t('saveProfile', settingsLang)}</button>
                </form>
              </div>

              <div className="panel">
                <h2>{t('preferences', settingsLang)}</h2>
                <form className="stack-form" onSubmit={handleSaveSettings}>
                  <label>
                    {t('language', settingsLang)}
                    <select value={settingsLang} onChange={e => setSettingsLang(e.target.value)}>
                      {Object.entries(LANGUAGES).map(([code, name]) => (
                        <option key={code} value={code}>{name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {t('fontStyle', settingsLang)}
                    <select value={settingsFont} onChange={e => { setSettingsFont(e.target.value); document.documentElement.setAttribute('data-font', e.target.value) }}>
                      {FONTS.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                    </select>
                  </label>
                  <label>
                    {t('colorTheme', settingsLang)}
                    <select value={settingsColor} onChange={e => { setSettingsColor(e.target.value); document.documentElement.setAttribute('data-theme', e.target.value) }}>
                      {COLORS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </label>
                  <div className="theme-previews">
                    {COLORS.map(c => (
                      <div key={c} className={`theme-swatch ${settingsColor === c ? 'active' : ''} swatch-${c}`}
                        onClick={() => { setSettingsColor(c); document.documentElement.setAttribute('data-theme', c) }} />
                    ))}
                  </div>
                  <button type="submit">{t('savePrefs', settingsLang)}</button>
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
