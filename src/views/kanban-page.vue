<template>
  <div class="min-h-screen w-full galaxy-bg p-6 overflow-hidden">
    <!-- Loading and error messages -->
    <div
      v-if="loading"
      class="fixed top-0 left-0 w-full bg-purple-600 text-white p-2 text-center z-50"
    >
      Loading tasks...
    </div>
    <div v-if="error" class="fixed top-0 left-0 w-full bg-red-600 text-white p-2 text-center z-50">
      {{ error }}
    </div>
    <div class="container flex flex-col gap-4">
      <h1 class="text-4xl font-bold text-white text-center mb-8">Avoria Kanban</h1>

      <!-- Task Creation Form -->
      <div
        class="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 shadow-xl border border-white/20"
      >
        <h2 class="text-2xl font-semibold text-white mb-4">Create New Task</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="grid gap-2 col-span-1 md:col-span-2">
            <input
              v-model="newTask.title"
              placeholder="Task Title"
              class="w-full p-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <textarea
              v-model="newTask.description"
              placeholder="Task Description"
              class="w-full p-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-500 h-24"
            ></textarea>
          </div>
          <div class="flex flex-col gap-2">
            <div>
              <select
                v-model="newTask.status"
                class="w-full p-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option
                  class="bg-black text-white border-red-200 rounded-lg"
                  v-for="column in columns"
                  :key="column.id"
                  :value="column.id"
                >
                  {{ column.title }}
                </option>
              </select>
            </div>
            <button
              @click="addTask"
              class="mt-4 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Create Task
            </button>
          </div>
        </div>
      </div>

      <!-- Kanban Board -->
      <div class="flex flex-nowrap gap-4 mt-2 scroll-auto overflow-x-auto min-h-[calc(100vh-350px)] pb-4">
        <div
          v-for="column in columns"
          :key="column.id"
          class="flex-1 min-w-[300px] bg-white/10 backdrop-blur-md rounded-xl p-4 shadow-xl border border-white/20"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-semibold text-white">{{ column.title }}</h3>
            <div class="bg-white/20 text-white text-sm px-2 py-1 rounded-full">
              {{ tasksInColumn(column.id).length }}
            </div>
          </div>

          <div
            class="min-h-[200px] flex flex-col gap-2 drop-zone"
            @dragover.prevent
            @drop="onDrop($event, column.id)"
          >
            <div
              v-for="task in tasksInColumn(column.id)"
              :key="task.id"
              :data-task-id="task.id"
              :data-column-id="column.id"
              draggable="true"
              @dragstart="onDragStart($event, task, column.id)"
              @dragenter.prevent
              @click="openEditModal(task)"
              class="task-card bg-white/20 backdrop-blur-sm p-4 mb-4 rounded-lg border border-white/30 cursor-move hover:shadow-lg transition-all duration-200 hover:bg-white/30"
            >
              <div class="flex justify-between items-start mb-2">
                <h4 class="text-white font-medium text-lg">{{ task.title }}</h4>
                <span class="text-xs text-white/70">{{ formatDate(task.created_at) }}</span>
              </div>
              <p class="text-white/90 text-sm mb-2">{{ task.description }}</p>
              <div class="flex justify-end mt-2">
                <button
                  @click.stop="removeTask(task.id)"
                  class="text-xs bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
            <!-- Empty state placeholder visible only when column is empty -->
            <div
              v-if="tasksInColumn(column.id).length === 0"
              class="empty-column-placeholder border-2 border-dashed border-white/20 rounded-lg p-4 text-center text-white/50"
            >
              Drop task here
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Edit Task Modal -->
  <div v-if="isEditModalOpen" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
    <div 
      class="bg-white/20 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/20 w-full max-w-md mx-4"
      @click.stop
    >
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-semibold text-white">Edit Task</h2>
        <button 
          @click="closeEditModal" 
          class="text-white hover:text-red-300 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="flex flex-col gap-2">
        <div>
          <label class="block text-white text-sm font-medium mb-1">Title</label>
          <input
            v-model="editingTask.title"
            class="w-full p-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <div>
          <label class="block text-white text-sm font-medium mb-1">Description</label>
          <textarea
            v-model="editingTask.description"
            class="w-full p-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-500 h-24"
          ></textarea>
        </div>
        
        <div>
          <label class="block text-white text-sm font-medium mb-1">Status</label>
          <select
            v-model="editingTask.status"
            class="w-full p-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option
              class="bg-black text-white border-red-200 rounded-lg"
              v-for="column in columns"
              :key="column.id"
              :value="column.id"
            >
              {{ column.title }}
            </option>
          </select>
        </div>
        
        <div class="flex gap-2 items-start">
          <div class="flex-1">
          <label class="block text-white text-sm font-medium mb-1">Start Date</label>
          <input
            type="date"
            v-model="editingTask.start_task"
            class="w-full p-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <div class="flex-1">
          <label class="block text-white text-sm font-medium mb-1">End Date</label>
          <input
            type="date"
            v-model="editingTask.end_task"
            class="w-full p-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <button 
            @click="closeEditModal" 
            class="bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            @click="updateTask" 
            class="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
// External modules
// Import Supabase Kanban service
import type { Task as SupabaseTask } from '../../services/kanbanService'
import { createTask, deleteTask, getTasks, updateTaskStatus, updateTask as updateTaskService } from '../../services/kanbanService'

// Define types
interface Column {
  id: string
  title: string
}

interface NewTask {
  title: string
  description: string
  status: string
}

interface EditingTask extends NewTask {
  id: string
  title: string
  description: string
  status: string
  start_task?: string
  end_task?: string
}

// Store the currently dragged task
const draggedTaskId = ref<string | null>(null)
const sourceColumnId = ref<string | null>(null)

// Loading and error states
const loading = ref<boolean>(true)
const error = ref<string | null>(null)

// Edit modal state
const isEditModalOpen = ref<boolean>(false)
const editingTask = ref<EditingTask>({
  id: '',
  title: '',
  description: '',
  status: '',
  start_task: '',
  end_task: ''
})

// Define columns
const columns: Column[] = [
  { id: 'planning', title: 'Planning' },
  { id: 'todo', title: 'Todo' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'test', title: 'Test' },
  { id: 'done', title: 'Done' },
]

// Tasks state
const tasks = ref<SupabaseTask[]>([])

// New task form state
const newTask = ref<NewTask>({
  title: '',
  description: '',
  status: 'planning',
})

// Get tasks for a specific column
const tasksInColumn = (columnId: string): SupabaseTask[] => {
  return tasks.value.filter((task) => task.status === columnId)
}

// Load all tasks from Supabase
const loadTasks = async () => {
  try {
    loading.value = true
    error.value = null
    tasks.value = await getTasks()
  } catch (err) {
    console.error('Error loading tasks:', err)
    error.value = 'Failed to load tasks. Please refresh the page.'
  } finally {
    loading.value = false
  }
}

// Add a new task
const addTask = async () => {
  if (!newTask.value.title.trim()) return

  try {
    loading.value = true
    error.value = null

    // Create task in Supabase
    const createdTask = await createTask({
      title: newTask.value.title,
      description: newTask.value.description,
      status: newTask.value.status,
    })

    // Add to local state
    tasks.value.unshift(createdTask)

    // Reset form
    newTask.value = {
      title: '',
      description: '',
      status: 'planning',
    }
  } catch (err) {
    console.error('Error creating task:', err)
    error.value = 'Failed to create task. Please try again.'
  } finally {
    loading.value = false
  }
}

// Delete a task
const removeTask = async (taskId: string) => {
  try {
    loading.value = true
    error.value = null

    // Delete from Supabase
    await deleteTask(taskId)

    // Remove from local state
    tasks.value = tasks.value.filter((t) => t.id !== taskId)
  } catch (err) {
    console.error('Error deleting task:', err)
    error.value = 'Failed to delete task. Please try again.'
  } finally {
    loading.value = false
  }
}

// Load tasks on component mount
onMounted(() => {
  loadTasks()
})

// Handle drop event for Kanban drag-and-drop
const onDrop = async (event: DragEvent, targetColumnId: string): Promise<void> => {
  event.preventDefault()
  // Only proceed if we have a valid dragged task
  if (draggedTaskId.value) {
    try {
      // Find the task in our local state
      const taskIndex = tasks.value.findIndex((t) => t.id === draggedTaskId.value)
      if (taskIndex !== -1 && targetColumnId !== sourceColumnId.value) {
        const task = tasks.value[taskIndex]

        // Optimistically update the UI
        tasks.value[taskIndex].status = targetColumnId

        // Update in Supabase
        await updateTaskStatus(task.id, targetColumnId)

        // If we get here, the update was successful
      }

      // Clear the drag state
      draggedTaskId.value = null
      sourceColumnId.value = null

      // Remove drag styling from all elements
      document.querySelectorAll('.dragging').forEach((el) => {
        el.classList.remove('dragging')
      })
    } catch (err) {
      console.error('Failed to update task status:', err)
      error.value = 'Failed to update task status. Please try again.'

      // Reload tasks to reset to server state
      try {
        tasks.value = await getTasks()
      } catch (err) {
        console.error('Failed to reload tasks:', err)
      }
    }
  }
}

// Handle drag start for Kanban drag-and-drop
const onDragStart = (event: DragEvent, task: SupabaseTask, columnId: string): void => {
  if (event.dataTransfer) {
    // Set data on drag event
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', task.id)
    draggedTaskId.value = task.id
    sourceColumnId.value = columnId
    // Add a class to indicate dragging
    if (event.target instanceof HTMLElement) {
      event.target.classList.add('dragging')
    }
  }
}

// Format date for display
const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// Open edit modal with task data
const openEditModal = (task: SupabaseTask) => {
  // Prevent opening modal when dragging
  if (draggedTaskId.value) return
  
  // Format dates for input fields (YYYY-MM-DD format)
  const formatDateForInput = (date: Date | null): string => {
    if (!date) return ''
    const d = new Date(date)
    return d.toISOString().split('T')[0]
  }
  
  editingTask.value = {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    start_task: task.start_task ? formatDateForInput(new Date(task.start_task)) : '',
    end_task: task.end_task ? formatDateForInput(new Date(task.end_task)) : ''
  }
  
  isEditModalOpen.value = true
}

// Close edit modal
const closeEditModal = () => {
  isEditModalOpen.value = false
}

// Update task
const updateTask = async () => {
  try {
    loading.value = true
    error.value = null
    
    const taskId = editingTask.value.id
    const updates = {
      title: editingTask.value.title,
      description: editingTask.value.description,
      status: editingTask.value.status,
      start_task: editingTask.value.start_task ? new Date(editingTask.value.start_task) : null,
      end_task: editingTask.value.end_task ? new Date(editingTask.value.end_task) : null
    }
    
    // Update in Supabase
    const updatedTask = await updateTaskService(taskId, updates)
    
    // Update in local state
    const taskIndex = tasks.value.findIndex(t => t.id === taskId)
    if (taskIndex !== -1) {
      tasks.value[taskIndex] = {
        ...tasks.value[taskIndex],
        ...updatedTask
      }
    }
    
    // Close modal
    closeEditModal()
  } catch (err) {
    console.error('Error updating task:', err)
    error.value = 'Failed to update task. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style>
.galaxy-bg {
  background: linear-gradient(125deg, #000000, #0f0c29, #24243e, #302b63, #0f0c29, #000000);
  background-size: 400% 400%;
  animation: galaxy-animation 15s ease infinite;
  position: relative;
  overflow: hidden;
}

.galaxy-bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(white, rgba(255, 255, 255, 0.2) 2px, transparent 3px),
    radial-gradient(white, rgba(255, 255, 255, 0.15) 1px, transparent 2px),
    radial-gradient(white, rgba(255, 255, 255, 0.1) 2px, transparent 3px);
  background-size:
    550px 550px,
    350px 350px,
    250px 250px;
  background-position:
    0 0,
    40px 60px,
    130px 270px;
  z-index: 1;
  pointer-events: none;
}

.galaxy-bg > * {
  position: relative;
  z-index: 2;
}

@keyframes galaxy-animation {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.dragging {
  opacity: 0.5;
  background: rgba(255, 255, 255, 0.3);
  border: 2px dashed rgba(255, 255, 255, 0.5);
}

.task-card {
  transition: transform 0.2s;
}

.task-card:hover {
  transform: translateY(-2px);
}
</style>
