import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertCircle, Bell, BriefcaseBusiness, CalendarDays, Check, ChevronDown, ClipboardCheck, Download, FileText, LayoutDashboard, Menu, Plus, Search, Settings, Target, Upload, Users, X } from 'lucide-react'
import './App.css'
import { AuthProvider, useAuth } from './auth/authContext'
import { useWorkspaceData } from './hooks/useWorkspaceData'
import { api } from './lib/api'

const navGroups = [
  { label: 'Main', items: [['Dashboard', LayoutDashboard], ['Team', Users], ['Projects', BriefcaseBusiness], ['Tasks', ClipboardCheck], ['Updates', Activity], ['Meetings', CalendarDays], ['Announcements', Bell], ['Documents', FileText]] },
  { label: 'Reports', items: [['Team Reports', Target], ['Project Reports', BriefcaseBusiness], ['My Reports', FileText]] },
  { label: 'Settings', items: [['Settings', Settings]] },
]

function App() {
  return <AuthProvider><AppShell /></AuthProvider>
}

function AppShell() {
  const { user, loading, logout: signOut } = useAuth()
  const [activePage, setActivePage] = useState('Dashboard')
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [showTask, setShowTask] = useState(false)
  const [toast, setToast] = useState('')
  const [settings, setSettings] = useState(() => JSON.parse(localStorage.getItem('teamops-settings') || '{"emailNotifications":true,"taskReminders":true,"compactMode":false,"darkMode":false}'))
  const [workspaces, setWorkspaces] = useState([])
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => localStorage.getItem('teamops-workspace-id') || null)

  const workspaceData = useWorkspaceData(activeWorkspaceId)
  const { tasks, projects, records, members, loading: dataLoading } = workspaceData

  // Load the user's workspaces once signed in.
  useEffect(() => {
    if (!user) return undefined
    let mounted = true
    api.listWorkspaces()
      .then(({ workspaces: list }) => {
        if (!mounted) return
        setWorkspaces(list)
        if (!activeWorkspaceId && list.length) {
          setActiveWorkspaceId(list[0].id)
          localStorage.setItem('teamops-workspace-id', list[0].id)
        }
      })
      .catch(() => setToast('Unable to load workspaces'))
    return () => { mounted = false }
  }, [user, activeWorkspaceId])

  const filteredTasks = useMemo(() => tasks.filter((task) => task.title.toLowerCase().includes(query.toLowerCase())), [query, tasks])

  if (loading) return <LoadingScreen />
  if (!user) return <Login />

  const logout = async () => {
    await signOut()
    localStorage.removeItem('teamops-workspace-id')
    setActiveWorkspaceId(null)
  }

  const updateSettings = (nextSettings) => { setSettings(nextSettings); localStorage.setItem('teamops-settings', JSON.stringify(nextSettings)); setToast('Settings saved'); window.setTimeout(() => setToast(''), 2200) }

  const createTask = async (event) => {
    event.preventDefault()
    if (!activeWorkspaceId) { setToast('Create a workspace first'); window.setTimeout(() => setToast(''), 2200); return }
    const form = new FormData(event.currentTarget)
    try {
      await workspaceData.createTask({ title: form.get('title'), description: form.get('description') || null })
      setShowTask(false)
      setToast('Task created successfully')
      window.setTimeout(() => setToast(''), 2600)
    } catch {
      setToast('Unable to create task')
    }
  }

  const addRecord = async (page, record) => {
    if (!activeWorkspaceId) { setToast('Create a workspace first'); window.setTimeout(() => setToast(''), 2200); return }
    try {
      await workspaceData.createRecord(page, record)
      setToast(`${page.slice(0, -1)} created successfully`)
      window.setTimeout(() => setToast(''), 2200)
    } catch {
      setToast(`Unable to create ${page.slice(0, -1).toLowerCase()}`)
    }
  }

  const createWorkspace = async (name) => {
    try {
      const { workspace } = await api.createWorkspace({ name })
      setWorkspaces((current) => [...current, workspace])
      setActiveWorkspaceId(workspace.id)
      localStorage.setItem('teamops-workspace-id', workspace.id)
      setToast('Workspace created')
      window.setTimeout(() => setToast(''), 2200)
    } catch {
      setToast('Unable to create workspace')
    }
  }

  return <div className={`app-shell ${settings.darkMode ? 'dark' : ''}`}>
    <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Users size={17} /></div><div><strong>TeamOps</strong><small>Team Operations Hub</small></div></div>
      <WorkspaceSwitcher workspaces={workspaces} activeWorkspaceId={activeWorkspaceId} onCreate={createWorkspace} onChange={(id) => { setActiveWorkspaceId(id); localStorage.setItem('teamops-workspace-id', id) }} />
      <nav>{navGroups.map((group) => <div className="nav-group" key={group.label}><span className="nav-label">{group.label}</span>{group.items.map(([label, Icon]) => <button className={`nav-item ${activePage === label ? 'active' : ''}`} key={label} onClick={() => { setActivePage(label); setMenuOpen(false) }}><Icon size={16} /><span>{label}</span></button>)}</div>)}</nav>
      <button className="profile-switcher" onClick={logout}><span className={`avatar ${user.color || 'teal'}`}>{initials(user.name)}</span><span className="profile-copy"><strong>{user.name}</strong><small>{user.email}</small></span><ChevronDown size={15} /></button>
    </aside>
    <main className="main-content">
      <header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open navigation"><Menu size={18} /></button><div className="page-heading"><Menu size={16} className="desktop-menu" /><div><h1>Good morning, {user.name}! <span>👋</span></h1><p>Here's what's happening with your team today.</p></div></div><div className="header-actions"><label className="search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks..." /></label><button className="icon-button notification" aria-label="Notifications"><Bell size={17} /></button><button className={`header-avatar ${user.color || 'teal'}`}>{initials(user.name)}</button><button className="primary-button" onClick={() => setShowTask(true)}><Plus size={15} /> New Task</button></div></header>
      {!activeWorkspaceId ? <NoWorkspace onCreate={createWorkspace} /> : dataLoading ? <LoadingScreen compact /> : activePage === 'Settings' ? <SettingsPage currentUser={user} settings={settings} updateSettings={updateSettings} onLogout={logout} /> : activePage === 'Dashboard' ? <DashboardPage tasks={tasks} projects={projects} members={members} filteredTasks={filteredTasks} onNavigate={setActivePage} /> : <WorkspacePage page={activePage} records={records[activePage] || []} onCreate={addRecord} onBack={() => setActivePage('Dashboard')} onGenerate={() => { setToast(`${activePage} generated successfully`); window.setTimeout(() => setToast(''), 2200) }} />}
    </main>
    {showTask && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowTask(false)}><form className="modal" onSubmit={createTask}><div className="modal-heading"><div><p className="eyebrow">Tasks</p><h2>Create new task</h2></div><button type="button" className="icon-button" onClick={() => setShowTask(false)} aria-label="Close"><X size={17} /></button></div><label>Task title<input name="title" required placeholder="e.g. Review dashboard concepts" /></label><label>Description<textarea name="description" placeholder="Add context for the team..." rows="3"></textarea></label><div className="modal-footer"><button type="button" className="secondary-button" onClick={() => setShowTask(false)}>Cancel</button><button className="primary-button" type="submit"><Check size={15} /> Create task</button></div></form></div>}
    {toast && <div className="toast"><Check size={16} />{toast}</div>}
  </div>
}

function WorkspaceSwitcher({ workspaces, activeWorkspaceId, onCreate, onChange }) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const active = workspaces.find((workspace) => workspace.id === activeWorkspaceId)
  const submit = async (event) => {
    event.preventDefault()
    if (!name.trim()) return
    await onCreate(name.trim())
    setName('')
    setCreating(false)
    setOpen(false)
  }
  return <div className="workspace-switcher">
    <button className="workspace-switcher-button" onClick={() => setOpen(!open)}><BriefcaseBusiness size={14} /><span>{active ? active.name : workspaces.length ? 'Select workspace' : 'No workspace yet'}</span><ChevronDown size={13} /></button>
    {open && <div className="workspace-switcher-menu">
      {workspaces.map((workspace) => <button key={workspace.id} className={workspace.id === activeWorkspaceId ? 'active' : ''} onClick={() => { onChange(workspace.id); setOpen(false) }}>{workspace.name}</button>)}
      {creating
        ? <form className="workspace-create-form" onSubmit={submit}><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Workspace name" /><button type="submit" className="workspace-create-submit"><Check size={12} /></button></form>
        : <button className="workspace-create-button" onClick={() => setCreating(true)}><Plus size={13} /> New workspace</button>}
    </div>}
  </div>
}

function NoWorkspace({ onCreate }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    if (!name.trim() || busy) return
    setBusy(true)
    await onCreate(name.trim())
    setBusy(false)
  }
  return <section className="no-workspace">
    <div className="placeholder-icon"><BriefcaseBusiness size={26} /></div>
    <h2>Create your first workspace</h2>
    <p>Workspaces keep your projects, tasks, and team records organized. Create one to get started.</p>
    <form className="no-workspace-form" onSubmit={submit}>
      <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Acme Engineering" />
      <button className="primary-button" type="submit" disabled={busy || !name.trim()}><Plus size={15} /> {busy ? 'Creating…' : 'Create workspace'}</button>
    </form>
  </section>
}

function DashboardPage({ tasks, projects, members, filteredTasks, onNavigate }) {
  const activeProjects = projects.filter((project) => project.status !== 'Completed').length
  const dueToday = tasks.filter((task) => task.dueDate && isDueToday(task.dueDate)).length
  const overdue = tasks.filter((task) => task.dueDate && isOverdue(task.dueDate)).length
  return <>
    <section className="kpi-grid">{[['Active Projects', String(activeProjects), activeProjects ? 'In progress' : 'No projects yet', BriefcaseBusiness, 'mint'], ['Tasks Due Today', String(dueToday), dueToday ? 'Your tasks' : 'No tasks due today', CalendarDays, 'sky'], ['Overdue Tasks', String(overdue), overdue ? 'Needs attention' : 'All clear', AlertCircle, 'peach'], ['Team Members', String(members.length), members.length ? 'All active' : 'No members yet', Users, 'lilac']].map(([label, value, caption, Icon, tone]) => <article className="kpi-card" key={label}><div><p>{label}</p><strong>{value}</strong><small>{caption}</small></div><div className={`kpi-icon ${tone}`}><Icon size={18} /></div></article>)}</section>
    <section className="content-grid top-grid"><Card title="Projects Overview">{projects.length ? projects.slice(0, 4).map((project) => <div className="project-row" key={project.id}><span className={`project-icon ${projectTone(project.status)}`}><BriefcaseBusiness size={13} /></span><div className="project-info"><strong>{project.name}</strong><span>{project.status}</span></div><div className="progress-wrap"><div className="progress-track"><i className={projectTone(project.status)} style={{ width: `${project.progress}%` }}></i></div><small>{project.progress}%</small></div></div>) : <Empty text="No projects yet. Create your first project to start organizing your team's work." />}{!projects.length && <button className="empty-action" onClick={() => onNavigate('Projects')}><Plus size={13} /> Create project</button>}</Card><Card title="Tasks Summary"><div className="empty-panel"><ClipboardCheck size={23} /><strong>{tasks.length ? `${tasks.length} task${tasks.length === 1 ? '' : 's'}` : 'No tasks yet'}</strong><span>Create a task to see your team's progress here.</span></div></Card><Card title="Team Overview"><div className="member-list">{members.length ? members.map((member) => <div className="member-row" key={member.id}><span className={`avatar ${memberTone(member.id)}`}>{initials(member.name)}</span><div className="member-info"><strong>{member.name}</strong><span>{member.email}</span></div><Status tone="green">Active</Status></div>) : <Empty text="Invite your team to get started." />}</div></Card></section>
    <section className="content-grid bottom-grid"><Card title="Upcoming Deadlines">{tasks.filter((task) => task.dueDate && !isOverdue(task.dueDate)).slice(0, 4).map((task) => <div className="deadline-row" key={task.id}><span className="deadline-icon sky"><CalendarDays size={13} /></span><div><strong>{task.title}</strong><span>Due {formatDate(task.dueDate)}</span></div></div>)}</Card><Card title="Recent Tasks">{filteredTasks.length ? filteredTasks.slice(0, 4).map((task) => <div className="update-row" key={task.id}><span className="avatar tiny blue">{initials(task.assigneeName || '')}</span><div><strong>{task.title}</strong><span>Created {formatDate(task.createdAt)}</span></div></div>) : <Empty text="Your recent tasks will appear here." />}</Card><Card title="Announcements"><Empty text="No announcements yet." /></Card></section>
  </>
}

function Card({ title, children }) { return <article className="panel"><div className="panel-heading"><h2>{title}</h2></div>{children}</article> }
function Status({ tone, children }) { return <span className={`status ${tone}`}>{children}</span> }
function Empty({ text }) { return <div className="empty-state">{text}</div> }
function LoadingScreen({ compact }) { return <div className={`loading-screen ${compact ? 'compact' : ''}`}><div className="spinner"></div><p>Loading your workspace…</p></div> }

function Login() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'login') await login(email, password)
      else await register(name, email, password)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return <main className="login-page"><div className="login-card"><div className="brand login-brand"><div className="brand-mark"><Users size={17} /></div><div><strong>TeamOps</strong><small>Team Operations Hub</small></div></div><p className="eyebrow">Welcome back</p><h1>{mode === 'login' ? 'Sign in to your workspace' : 'Create your account'}</h1><p className="login-copy">{mode === 'login' ? 'Enter your email and password to continue.' : 'Register to start your TeamOps workspace.'}</p><form onSubmit={submit}>{mode === 'register' && <label>Your name<input autoFocus value={name} onChange={(event) => { setName(event.target.value); setError('') }} placeholder="Enter your name" required /></label>}<label>Email<input autoFocus={mode === 'login'} type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError('') }} placeholder="you@example.com" required /></label><label>Password<input type="password" value={password} onChange={(event) => { setPassword(event.target.value); setError('') }} placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter your password'} required minLength={mode === 'register' ? 8 : undefined} /></label>{error && <p className="login-error">{error}</p>}<button className="primary-button login-button" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button></form><p className="login-members">{mode === 'login' ? <>New to TeamOps? <button className="link-button" onClick={() => { setMode('register'); setError('') }}>Create an account</button></> : <>Already have an account? <button className="link-button" onClick={() => { setMode('login'); setError('') }}>Sign in</button></>}</p></div></main>
}

function SettingsPage({ currentUser, settings, updateSettings, onLogout }) {
  const { updateProfile } = useAuth()
  const [profileName, setProfileName] = useState(currentUser.name)
  const [saving, setSaving] = useState(false)
  const saveProfile = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await updateProfile(profileName.trim() || currentUser.name)
      updateSettings(settings)
    } finally {
      setSaving(false)
    }
  }
  const downloadBackup = () => { const backup = { product: 'TeamOps', exportedAt: new Date().toISOString(), settings, currentUser }; const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })); link.download = 'teamops-workspace-backup.json'; link.click(); URL.revokeObjectURL(link.href) }
  const restoreBackup = (event) => { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const backup = JSON.parse(reader.result); if (!backup.settings) throw new Error('Invalid backup'); updateSettings(backup.settings) } catch { window.alert('That backup file is not valid TeamOps data.') } }; reader.readAsText(file) }
  const toggle = (key) => updateSettings({ ...settings, [key]: !settings[key] })
  return <section className="settings-page"><div className="settings-intro"><div><p className="eyebrow">Workspace configuration</p><h2>Settings</h2><p>Manage your personal preferences and TeamOps workspace.</p></div><button className="secondary-button" onClick={onLogout}>Sign out</button></div><div className="settings-grid"><form className="settings-panel" onSubmit={saveProfile}><div className="settings-heading"><div><h3>Profile</h3><p>Update the name shown across TeamOps.</p></div><span className={`avatar ${currentUser.color || 'teal'}`}>{initials(currentUser.name)}</span></div><label>Display name<input value={profileName} onChange={(event) => setProfileName(event.target.value)} required /></label><button className="primary-button" type="submit" disabled={saving}><Check size={14} /> {saving ? 'Saving…' : 'Save profile'}</button></form><div className="settings-panel"><div className="settings-heading"><div><h3>Notifications</h3><p>Choose which local reminders you receive.</p></div><Bell size={18} className="settings-symbol" /></div><SettingToggle label="Email notifications" description="Updates about your workspace" checked={settings.emailNotifications} onChange={() => toggle('emailNotifications')} /><SettingToggle label="Task reminders" description="Due dates and overdue tasks" checked={settings.taskReminders} onChange={() => toggle('taskReminders')} /></div><div className="settings-panel"><div className="settings-heading"><div><h3>Appearance</h3><p>Adjust how TeamOps fits your workflow.</p></div><Settings size={18} className="settings-symbol" /></div><SettingToggle label="Compact mode" description="Use tighter spacing across lists" checked={settings.compactMode} onChange={() => toggle('compactMode')} /><SettingToggle label="Dark mode" description="Use a darker workspace theme" checked={settings.darkMode} onChange={() => toggle('darkMode')} /></div><div className="settings-panel"><div className="settings-heading"><div><h3>Workspace data</h3><p>Export or restore your local preferences.</p></div><Download size={18} className="settings-symbol" /></div><button className="secondary-button settings-action" onClick={downloadBackup}><Download size={13} /> Export backup</button><label className="settings-action"><Upload size={13} /> Restore backup<input type="file" accept="application/json" onChange={restoreBackup} hidden /></label></div></div></section>
}

function SettingToggle({ label, description, checked, onChange }) { return <label className="setting-toggle"><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={checked} onChange={onChange} /><i></i></label> }

function WorkspacePage({ page, records, onCreate, onBack, onGenerate }) {
  const [showForm, setShowForm] = useState(false)
  const singular = page.replace(/s$/, '')
  const isReport = page.includes('Reports')
  const submit = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onCreate(page, { title: form.get('title'), description: form.get('description') || null })
    setShowForm(false)
  }
  return <section className="workspace-page"><div className="workspace-heading"><div><p className="eyebrow">TeamOps workspace</p><h2>{page}</h2><p>Keep your team's {page.toLowerCase()} organized in one shared workspace.</p></div><div className="workspace-actions">{isReport ? <button className="primary-button" onClick={onGenerate}><Target size={15} /> Generate report</button> : <button className="primary-button" onClick={() => setShowForm(true)}><Plus size={15} /> Add {singular}</button>}<button className="secondary-button" onClick={onBack}>Dashboard</button></div></div>{records.length ? <div className="record-grid">{records.map((record) => <article className="record-card" key={record.id}><div className="record-icon"><FileText size={17} /></div><div><h3>{record.title}</h3><p>{record.description || `Created ${formatDate(record.createdAt)}`}</p><small>{formatDate(record.createdAt)}</small></div></article>)}</div> : <div className="workspace-empty"><div className="placeholder-icon"><FileText size={23} /></div><h3>No {page.toLowerCase()} yet</h3><p>Create your first {singular.toLowerCase()} to start organizing your team.</p>{!isReport && <button className="primary-button" onClick={() => setShowForm(true)}><Plus size={15} /> Add {singular}</button>}</div>}{showForm && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowForm(false)}><form className="modal" onSubmit={submit}><div className="modal-heading"><div><p className="eyebrow">{page}</p><h2>Add {singular}</h2></div><button type="button" className="icon-button" onClick={() => setShowForm(false)} aria-label="Close"><X size={17} /></button></div><label>Title<input name="title" required placeholder={`e.g. ${singular} name`} /></label><label>Description<textarea name="description" placeholder="Add context for the team..." rows="3"></textarea></label><div className="modal-footer"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-button" type="submit"><Check size={15} /> Add {singular}</button></div></form></div>}</section>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initials(name) {
  if (!name) return '?'
  return name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function isDueToday(value) {
  const date = new Date(value)
  const today = new Date()
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate()
}

function isOverdue(value) {
  const date = new Date(value)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

function projectTone(status) {
  if (status === 'Completed') return 'green'
  if (status === 'Active') return 'blue'
  if (status === 'On Hold') return 'orange'
  return 'violet'
}

function memberTone(id) {
  const tones = ['teal', 'blue', 'purple']
  return tones[Number(id) % tones.length]
}

export default App
