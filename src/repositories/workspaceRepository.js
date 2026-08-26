import { supabase, supabaseEnabled } from '../lib/supabase'

export async function listWorkspaceRecords() {
  if (!supabaseEnabled) return []
  const { data, error } = await supabase.from('workspace_records').select('*').order('created_at', { ascending: true })
  if (error) throw error
  return data.map(({ page, title, description, created_at: createdAt }) => ({ page, title, description, createdAt }))
}

export async function createWorkspaceRecord(page, record) {
  if (!supabaseEnabled) return null
  const { data, error } = await supabase.from('workspace_records').insert({ page, title: record.title, description: record.description || null }).select().single()
  if (error) throw error
  return { page: data.page, title: data.title, description: data.description, createdAt: data.created_at }
}

export function subscribeToWorkspaceRecords(onChange) {
  if (!supabaseEnabled) return () => {}
  const channel = supabase.channel('workspace-records').on('postgres_changes', { event: '*', schema: 'public', table: 'workspace_records' }, onChange).subscribe()
  return () => supabase.removeChannel(channel)
}
