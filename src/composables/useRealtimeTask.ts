import type { Column, Task } from '@/types/kanban.type'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Ref } from 'vue'
import { getCurrentUser } from '../../services/authService.ts'

export const realtimeTask = (
  currentProjectId: string,
  tasks: Ref<Task[]>,
  columns: Ref<Column[]>,
  supabase: SupabaseClient,
  removeRealtimeSubscriptions: () => void,
) => {
  // Clean up any existing subscriptions first
  removeRealtimeSubscriptions()

  console.log('Setting up real-time subscriptions for project:', currentProjectId)

  // Subscribe to columns table changes for the current project
  supabase
    .channel('column-changes')
    .on(
      'postgres_changes',
      {
        event: '*', // Listen for all events
        schema: 'public',
        table: 'task_columns',
        filter: `project_id=eq.${currentProjectId}`,
      },
      async (payload) => {
        console.log('Column change received:', payload)
        console.log('Payload event type:', payload.eventType)

        // Handle different event types
        if (payload.eventType === 'INSERT') {
          const newColumn = payload.new as Column
          // Only add if not already in our array
          if (!columns.value.some((column) => column.id === newColumn.id)) {
            columns.value.push(newColumn)
            // Sort columns by order
            columns.value.sort((a, b) => a.order - b.order)
            window.dispatchEvent(
              new CustomEvent('column-change', {
                detail: payload,
              }),
            )
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedColumn = payload.new as Column
          const index = columns.value.findIndex((column) => column.id === updatedColumn.id)

          if (index !== -1) {
            columns.value[index] = updatedColumn
            // Sort columns by order in case order was changed
            columns.value.sort((a, b) => a.order - b.order)
            window.dispatchEvent(
              new CustomEvent('column-change', {
                detail: payload,
              }),
            )
          }
        } else if (payload.eventType === 'DELETE') {
          console.log('DELETE event received for column:', payload.old)

          // Make sure we have the id in the payload
          if (payload.old && payload.old.id) {
            const deletedColumnId = payload.old.id
            const index = columns.value.findIndex((column) => column.id === deletedColumnId)

            console.log('Found column index to delete:', index, 'with ID:', deletedColumnId)

            if (index !== -1) {
              // Store the column before removing it so we have complete data for the event
              const deletedColumn = columns.value[index]
              columns.value.splice(index, 1)

              // Include both the original payload and the complete column data
              window.dispatchEvent(
                new CustomEvent('column-change', {
                  detail: {
                    ...payload,
                    fullData: deletedColumn, // Keep the full column data for receivers
                  },
                }),
              )

              console.log('Dispatched column-change event for DELETE with full data')
            } else {
              console.warn('Could not find column with ID', deletedColumnId, 'to delete')
              // Still dispatch the event even if we can't find it locally
              window.dispatchEvent(
                new CustomEvent('column-change', {
                  detail: payload,
                }),
              )
            }
          } else {
            console.error('DELETE event payload missing id:', payload)
            // Try to dispatch event anyway with whatever data we have
            window.dispatchEvent(
              new CustomEvent('column-change', {
                detail: payload,
              }),
            )
          }
        }
      },
    )
    .subscribe()
  // Subscribe to tasks table changes for the current project
  supabase
    .channel('task-changes')
    .on(
      'postgres_changes',
      {
        event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'tasks',
        filter: `project_id=eq.${currentProjectId}`,
      },
      async (payload: any) => {
        const userData: User | null = await getCurrentUser()

        // Handle different event types
        if (payload.eventType === 'INSERT' && payload.new.created_by !== userData?.id) {
          const newTask = payload.new as Task
          // Only add if not already in our array
          if (!tasks.value.some((task) => task.id === newTask.id)) {
            tasks.value.push(newTask)
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedTask = payload.new as Task
          const index = tasks.value.findIndex((task) => task.id === updatedTask.id)

          // Handle soft delete: if is_deleted is true, remove from local array and dispatch event
          if (updatedTask.is_deleted) {
            if (index !== -1) {
              tasks.value.splice(index, 1)
              window.dispatchEvent(
                new CustomEvent('task-change', {
                  detail: {
                    ...payload,
                    fullData: updatedTask,
                    softDelete: true,
                  },
                }),
              )
              console.log('Task soft-deleted and removed from Kanban:', updatedTask.id)
            }
          } else {
            // Normal update
            if (index !== -1) {
              tasks.value[index] = {
                ...tasks.value[index],
                ...updatedTask,
              }
            }
          }
        } else if (payload.eventType === 'DELETE') {
          console.log('DELETE event received for task:', payload.old)

          // Make sure we have the id in the payload
          if (payload.old && payload.old.id) {
            const deletedTaskId = payload.old.id
            const index = tasks.value.findIndex((task) => task.id === deletedTaskId)

            console.log('Found task index to delete:', index, 'with ID:', deletedTaskId)

            if (index !== -1) {
              // Store the column before removing it so we have complete data for the event
              const deletedTask = tasks.value[index]
              tasks.value.splice(index, 1)

              // Include both the original payload and the complete column data
              window.dispatchEvent(
                new CustomEvent('task-change', {
                  detail: {
                    ...payload,
                    fullData: deletedTask, // Keep the full column data for receivers
                  },
                }),
              )

              console.log('Dispatched task-change event for DELETE with full data')
            } else {
              console.warn('Could not find task with ID', deletedTaskId, 'to delete')
              // Still dispatch the event even if we can't find it locally
              window.dispatchEvent(
                new CustomEvent('task-change', {
                  detail: payload,
                }),
              )
            }
          } else {
            console.error('DELETE event payload missing id:', payload)
            // Try to dispatch event anyway with whatever data we have
            window.dispatchEvent(
              new CustomEvent('task-change', {
                detail: payload,
              }),
            )
          }
        }
      },
    )
    .subscribe()
}
