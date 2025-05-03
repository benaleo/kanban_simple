import type { Task, Column } from "@/types/kanban.type"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Ref } from "vue"

export const realtimeTask = (currentProjectId: string, tasks: Ref<Task[]>, columns: Ref<Column[]>, supabase: SupabaseClient, removeRealtimeSubscriptions: () => void) => {
    // Clean up any existing subscriptions first
    removeRealtimeSubscriptions()
  
    console.log('Setting up real-time subscriptions for project:', currentProjectId)
  
    // Subscribe to tasks table changes for the current project
    const taskSubscription = supabase
      .channel('task-changes')
      .on('postgres_changes', {
        event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'tasks',
        filter: `project_id=eq.${currentProjectId}`
      }, async (payload : any) => {
        console.log('Task change received:', payload)
  
        // Handle different event types
        if (payload.eventType === 'INSERT') {
          const newTask = payload.new as Task
          // Only add if not already in our array
          if (!tasks.value.some(task => task.id === newTask.id)) {
            tasks.value.push(newTask)
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedTask = payload.new as Task
          const index = tasks.value.findIndex(task => task.id === updatedTask.id)
  
          if (index !== -1) {
            // Preserve any local state that might not be in the database record
            tasks.value[index] = {
              ...tasks.value[index],
              ...updatedTask
            }
          }
        } else if (payload.eventType === 'DELETE') {
          const deletedTaskId = payload.old.id
          const index = tasks.value.findIndex(task => task.id === deletedTaskId)
  
          if (index !== -1) {
            tasks.value.splice(index, 1)
          }
        }
      })
      .subscribe()
  
    // Subscribe to columns table changes for the current project
    const columnSubscription = supabase
      .channel('column-changes')
      .on('postgres_changes', {
        event: '*', // Listen for all events
        schema: 'public',
        table: 'columns',
        filter: `project_id=eq.${currentProjectId}`
      }, async (payload) => {
        console.log('Column change received:', payload)
  
        // Handle different event types
        if (payload.eventType === 'INSERT') {
          const newColumn = payload.new as Column
          // Only add if not already in our array
          if (!columns.value.some(column => column.id === newColumn.id)) {
            columns.value.push(newColumn)
            // Sort columns by order
            columns.value.sort((a, b) => a.order - b.order)
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedColumn = payload.new as Column
          const index = columns.value.findIndex(column => column.id === updatedColumn.id)
  
          if (index !== -1) {
            columns.value[index] = updatedColumn
            // Sort columns by order in case order was changed
            columns.value.sort((a, b) => a.order - b.order)
          }
        } else if (payload.eventType === 'DELETE') {
          const deletedColumnId = payload.old.id
          const index = columns.value.findIndex(column => column.id === deletedColumnId)
  
          if (index !== -1) {
            columns.value.splice(index, 1)
          }
        }
      })
      .subscribe()
  }