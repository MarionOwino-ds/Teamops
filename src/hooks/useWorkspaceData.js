import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'

const RECORD_PAGES = ['Team', 'Projects', 'Tasks', 'Updates', 'Meetings', 'Announcements', 'Documents']

/**
 * Loads and manages all data for the active workspace through the API.
 * The UI never talks to SQLite or Supabase directly — only to this hook,
 * which talks to the backend.
 */
export function useWorkspaceData(workspaceId) {
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [records, setRecords] = useState({})
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!workspaceId) {
      // No active workspace yet (e.g. brand-new account): show empty state,
      // not an endless spinner.
      setProjects([])
      setTasks([])
      setRecords({})
      setMembers([])
      setLoading(false)
      setError('')
      return
    }
    setLoading(true)
    setError('')
    try {
      const [projectsData, tasksData, membersData, ...recordPages] = await Promise.all([
        api.listProjects(workspaceId),
        api.listTasks(workspaceId),
        api.listMembers(workspaceId),
        ...RECORD_PAGES.map((page) => api.listRecords(workspaceId, page)),
      ])
      setProjects(projectsData.projects)
      setTasks(tasksData.tasks)
      setMembers(membersData.members)
      const grouped = {}
      RECORD_PAGES.forEach((page, index) => { grouped[page] = recordPages[index].records })
      setRecords(grouped)
    } catch (err) {
      setError(err.message || 'Unable to load workspace data')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const createProject = useCallback(async (payload) => {
    const { project } = await api.createProject(workspaceId, payload)
    setProjects((current) => [...current, project])
    return project
  }, [workspaceId])

  const updateProject = useCallback(async (projectId, payload) => {
    const { project } = await api.updateProject(workspaceId, projectId, payload)
    setProjects((current) => current.map((item) => (item.id === project.id ? project : item)))
    return project
  }, [workspaceId])

  const deleteProject = useCallback(async (projectId) => {
    await api.deleteProject(workspaceId, projectId)
    setProjects((current) => current.filter((item) => item.id !== projectId))
    setTasks((current) => current.filter((task) => task.projectId !== projectId))
  }, [workspaceId])

  const createTask = useCallback(async (payload) => {
    const { task } = await api.createTask(workspaceId, payload)
    setTasks((current) => [...current, task])
    return task
  }, [workspaceId])

  const updateTask = useCallback(async (taskId, payload) => {
    const { task } = await api.updateTask(workspaceId, taskId, payload)
    setTasks((current) => current.map((item) => (item.id === task.id ? task : item)))
    return task
  }, [workspaceId])

  const deleteTask = useCallback(async (taskId) => {
    await api.deleteTask(workspaceId, taskId)
    setTasks((current) => current.filter((item) => item.id !== taskId))
  }, [workspaceId])

  const createRecord = useCallback(async (page, payload) => {
    const { record } = await api.createRecord(workspaceId, { page, ...payload })
    setRecords((current) => ({ ...current, [page]: [...(current[page] || []), record] }))
    return record
  }, [workspaceId])

  const deleteRecord = useCallback(async (page, recordId) => {
    await api.deleteRecord(workspaceId, recordId)
    setRecords((current) => ({ ...current, [page]: (current[page] || []).filter((item) => item.id !== recordId) }))
  }, [workspaceId])

  const addMember = useCallback(async (payload) => {
    const { member } = await api.addMember(workspaceId, payload)
    setMembers((current) => [...current, member])
    return member
  }, [workspaceId])

  const removeMember = useCallback(async (userId) => {
    await api.removeMember(workspaceId, userId)
    setMembers((current) => current.filter((member) => member.id !== userId))
  }, [workspaceId])

  return {
    projects,
    tasks,
    records,
    members,
    loading,
    error,
    refresh,
    createProject,
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
    createRecord,
    deleteRecord,
    addMember,
    removeMember,
  }
}