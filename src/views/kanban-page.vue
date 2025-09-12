<template>
  <auth-layout>
    <div
      class="min-h-screen w-full galaxy-bg p-6 overflow-hidden"
      :style="currentProjectId ? '' : 'position: fixed'"
    >
      <!-- Loading and error messages -->
      <div v-if="!currentProjectId" class="fixed inset-0 w-full bg-purple-600/10 text-white p-2 text-center z-50" >
        <div class="w-full min-h-screen flex flex-col justify-start items-center">
          <div id="bounce-up">
            <font-awesome-icon icon="circle-chevron-up" class="mb-4" size="xl" />
            <div class="mb-40">Please select project above</div>
          </div>
          <div class="bg-white rounded-full fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" >
            <Vue3Lottie :animationData="LoadingJSON" :height="400" :width="400" />
          </div>
        </div>
      </div>
      <div v-if="errorMessage" class="fixed top-0 left-0 w-full bg-red-600 text-white p-2 text-center z-50" >
        {{ errorMessage }}
      </div>
      <div v-if="currentProjectId" class="container flex flex-col gap-4">
        <!-- Task Creation Form -->
        <div class="flex flex-col gap-2 bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 shadow-xl border border-white/20" >
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-semibold text-white">Create New Task</h2>
            <div class="flex gap-2">
              <div class="tooltip">
                <font-awesome-icon
                  icon="box-archive"
                  style="color: white"
                  size="xl"
                  @click="openSidebar"
                />
                <span class="tooltiptext">Archive</span>
              </div>
              <div class="tooltip">
                <font-awesome-icon icon="gear" style="color: white" size="xl" />
                <span class="tooltiptext">Setting</span>
              </div>
            </div>
          </div>
          <CreateTaskForm
            :title="newTask.title"
            @update:title="newTask.title = $event"
            :description="newTask.description"
            @update:description="newTask.description = $event"
            :status="newTask.status"
            @update:status="newTask.status = $event"
            :columns="columns"
            @openColumnDialog="openColumnDialog"
            @create="addTask"
          />
        </div>

        <!-- drawer -->
        <DrawerDialog :isOpen="isDrawerOpen" @update:isOpen="isDrawerOpen = $event" />

        <!-- Kanban Board -->
        <div
          class="fancy-scrollbar flex flex-nowrap gap-4 mt-2 scroll-auto max-h-[95vh] overflow-y-hidden overflow-x-auto min-h-[calc(100vh-350px)] pb-4"
        >
          <div
            v-for="column in columns"
            :key="column.id"
            class="fancy-scrollbar flex-1 flex flex-col gap-4 min-w-[300px] max-h-[95vh] overflow-y-auto space-y-2 bg-white/10 backdrop-blur-md rounded-xl p-4 shadow-xl border border-white/20"
          >
            <div class="flex items-center justify-between mb-4 sticky top-0 z-10 bg-white backdrop-blur-sm border-b border-white/20 rounded-t-lg py-2 px-2">
              <h3 class="text-medium font-semibold text-slate-700">{{ column.name }}</h3>
              <div class="bg-slate-300 aspect-square w-8 text-slate-700 text-sm px-2 py-1 rounded-full flex items-center justify-center">
                {{ tasksInColumn(column.id).length }}
              </div>
            </div>

            <div
              class="h-full flex flex-col gap-2 drop-zone"
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
                class="task-card bg-white/20 px-2 pb-2 backdrop-blur-sm mb-4 rounded-lg border border-white/30 cursor-move hover:shadow-lg transition-all duration-200 hover:bg-white/30"
              >
                <div class="flex justify-between items-start mb-2 relative pt-4">
                  <h4 class="text-white font-bold text-medium border-b-1 line-clamp-1">{{ task.title }}</h4>
                  <span class="absolute top-1 right-0 text-xs text-white/70 whitespace-nowrap">{{ task.created_at.getDate() + '-' + task.created_at.getMonth() + '-' + task.created_at.getFullYear() + ' ' + task.created_at.getHours() + ':' + task.created_at.getMinutes() + ':' + task.created_at.getSeconds() }}</span>
                </div>
                <div class="text-white/90 text-sm mb-2 line-clamp-2 prose prose-slate" v-html="task.description"></div>
                <div class="flex items-center justify-end gap-2 mt-2">
                  <span class="text-xs text-white/80 flex items-center gap-1 select-none">
                    <font-awesome-icon icon="comment-dots" />
                    {{ getCommentCount(task.id) }}
                  </span>
                  <button
                    @click.stop="confirmDelete(task.id)"
                    class="text-xs bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded transition-colors duration-200"
                  >
                    <font-awesome-icon icon="trash" />
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
  </auth-layout>

  <!-- Show Project Dialog if no project selected -->
  <ProjectDialog
    v-if="showNoProjectDialog"
    @close="showNoProjectDialog = false"
    @select="handleProjectSelect"
  />

  <!-- Column Management Dialog -->
  <ColumnDialog
    v-if="showColumnDialog"
    :projectId="currentProjectId"
    @close="showColumnDialog = false"
    @update="handleColumnsUpdate"
  />

  <!-- Edit Task Modal -->
  <div
    v-if="isEditModalOpen"
    class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-40 overflow-y-auto px-2 lg:px-12 py-8"
    @scroll.stop
  >
    <div
    :class="isTaskList ? 'w-[80vw] lg:max-w-[70vw]' : 'w-[80vw] lg:max-w-[40vw]'"
      class="bg-white/20 backdrop-blur-md rounded-xl p-0 shadow-xl border border-white/20 w-full mx-4 max-h-[calc(100vh-4rem)] flex flex-col"
    >
      <!-- Header -->
      <div
        class="sticky rounded-t-xl top-0 bg-white/10 backdrop-blur-sm p-6 pb-4 border-b border-white/20"
      >
        <div class="flex justify-between items-center">
          <h2 class="text-2xl font-semibold text-white">Edit Task</h2>
          <button @click="closeEditModal" class="text-white hover:text-red-300 transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="grid gap-2 overflow-y-auto" :class="isTaskList ? 'grid-cols-2' : 'grid-cols-1'">
        <!-- Scrollable Content -->
        <div class="overflow-y-auto p-6 flex-1 [&::-webkit-scrollbar-thumb]:bg-purple-600/80 [&::-webkit-scrollbar-track]:bg-white/10 [&::-webkit-scrollbar]:w-2 hover:[&::-webkit-scrollbar-thumb]:bg-purple-500 [&::-webkit-scrollbar-thumb]:rounded-full" >
          <div class="flex flex-col gap-2">
            <EditTaskForm
              :title="editingTask.title"
              @update:title="editingTask.title = $event"
              :description="editingTask.description"
              @update:description="editingTask.description = $event"
              :status="editingTask.status"
              @update:status="editingTask.status = $event"
              :columns="columns"
            />

            <div class="flex w-full items-center gap-2">
              <div class="flex-1">
                <label class="block text-white text-sm font-medium mb-1">Start Date & Time</label>
                <div class="flex flex-col items-end gap-2">
                  <input
                    type="date"
                    v-model="editingTask.start_task_date"
                    class="w-full p-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="time"
                    v-model="editingTask.start_task_time"
                    class="w-3/4 p-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div class="flex-1">
                <label class="block text-white text-sm font-medium mb-1">End Date & Time</label>
                <div class="flex flex-col items-end gap-2">
                  <input
                    type="date"
                    v-model="editingTask.end_task_date"
                    class="w-full p-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="time"
                    v-model="editingTask.end_task_time"
                    class="w-3/4 p-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
            <!-- Assigned Users -->
            <div class="flex flex-col gap-2">
              <label class="block text-white text-sm font-medium mb-1">Assign Users</label>
              <div class="mb-2 flex flex-col gap-2">
                <select
                  v-model="selectedUserId"
                  class="w-full p-3 rounded-lg bg-black backdrop-blur-sm border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="" disabled>Select a user</option>
                  <option v-for="user in availableUsers" :key="user.id" :value="user.id">
                    {{ user.email }}
                  </option>
                </select>
                <button
                  @click="addUserToTask"
                  class="self-end bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Add User
                </button>
              </div>

              <!-- Display Assigned Users -->
              <div v-if="editingTask.assignedUsers.length > 0" class="mt-4 flex flex-wrap gap-2">
                <div
                  v-for="(user, index) in editingTask.assignedUsers"
                  :key="user.id"
                  class="flex items-center bg-white/20 rounded-lg px-3 py-1 text-white text-sm"
                >
                  <span>{{ user.email }}</span>
                  <button
                    @click="removeUserFromTask(index)"
                    class="ml-2 text-red-300 hover:text-red-500"
                  >
                    &times;
                  </button>
                </div>
              </div>
              <div v-else class="text-white/50 text-sm italic mt-2">No users assigned</div>
            </div>
          </div>
        </div>
        <!-- task list  v-if="isTaskList"  -->
        <div class="overflow-y-auto p-6 flex flex-col gap-12 justify-between fancy-scrollbar overflow-x-hidden" >
          <TaskListItem 
            v-if="editingTask.id" 
            :task_id="editingTask.id" 
          />
          <!-- Comments under the task list -->
          <div class="px-6 pb-4 w-full">
            <TaskComments 
              v-if="editingTask.id"
              :taskId="editingTask.id"
              :showComposer="true"
              @changed="onCommentsChanged"
            />
          </div>
        </div>
      </div> 
      <!-- Footer -->
      <div
        class="sticky rounded-b-xl bottom-0 bg-white/10 backdrop-blur-sm p-6 pt-4 border-t border-white/20"
      >
        <div class="flex justify-between gap-2">
          <div class="flex items-center gap-2">
            <input
            @change="isTaskList = !isTaskList"
              type="checkbox"
              id="show-task-list"
              :checked="isTaskList"
              class="h-5 w-5 rounded border-white/30 bg-white/20"
            />
            <label for="show-task-list" class="text-white text-sm">Show Task List</label>
          </div>

          <div class="flex justify-end gap-2">
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
  </div>

  <!-- Delete Confirmation Modal -->
  <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-white/20 backdrop-blur-md rounded-xl p-6 max-w-md w-full mx-4 border border-white/30">
      <h3 class="text-xl font-semibold text-white mb-4">Confirm Delete</h3>
      <p class="text-white/90 mb-6">Are you sure you want to delete this task? This action cannot be undone.</p>
      <div class="flex justify-end gap-3">
        <button
          @click="showDeleteConfirm = false"
          class="px-4 py-2 text-sm font-medium text-white bg-gray-500 hover:bg-gray-600 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          @click="executeDelete"
          class="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import moment from 'moment-timezone'
import { useRoute, useRouter } from 'vue-router'
import AuthLayout from '../layouts/AuthLayout.vue'
// External modules
// Import Supabase Kanban service
import {
  createTask,
  getTasks,
  updateTask as updateTaskService,
  deleteTask,
  updateTaskStatus,
} from '../../services/kanbanService'
import { supabase } from '../../utils/supabase'

// Set page title
document.title = 'Kanban Ala ala'

// UI components
import { toast } from 'vue-sonner'
import { Vue3Lottie } from 'vue3-lottie'
import LoadingJSON from '../assets/html/loading.json'
import ProjectDialog from '@/components/ProjectDialog.vue'
import ColumnDialog from '@/components/ColumnDialog.vue'
import TaskComments from '@/components/TaskComments.vue'
import type { Column, EditingTask, NewTask, Task } from '@/types/kanban.type'
import { realtimeTask } from '@/composables/useRealtimeTask'
import DrawerDialog from '@/components/DrawerDialog.vue'
import TaskListItem from '@/components/TaskListItem.vue'
import CreateTaskForm from '@/components/CreateTaskForm.vue'
import EditTaskForm from '@/components/EditTaskForm.vue'
import { countTaskList } from '../../services/taskListService'
import { getCommentsCountForTasks } from '../../services/commentService'

// Global state
const columns = ref<Column[]>([])
const tasks = ref<Task[]>([])
const loading = ref(false)
const errorMessage = ref<string>('')
// Comment counts per task id
const commentCounts = ref<Record<string, number>>({})

const getCommentCount = (taskId: string) => {
  return commentCounts.value[taskId] ?? 0
}

const refreshCommentCounts = async () => {
  try {
    const ids = tasks.value.map(t => t.id)
    commentCounts.value = await getCommentsCountForTasks(ids)
  } catch (e) {
    console.error('Failed to load comment counts', e)
  }
}

// Update counts when TaskComments emits changes
const onCommentsChanged = (delta: number) => {
  const id = editingTask.value.id
  if (!id) return
  const current = commentCounts.value[id] ?? 0
  commentCounts.value = { ...commentCounts.value, [id]: Math.max(0, current + delta) }
}
const isTaskList = ref<boolean>(false)
const isMobile = ref<boolean>(false)

// Store the currently dragged task
const draggedTaskId = ref<string | null>(null)
const sourceColumnId = ref<string | null>(null)

// Edit modal state
const isEditModalOpen = ref<boolean>(false)
const editingTask = ref<EditingTask>({
  id: '',
  title: '',
  description: '',
  status: '',
  project_id: '',
  // We don't need to set start_task and end_task directly as we'll compute them from the date/time fields
  start_task_date: '',
  start_task_time: '',
  end_task_date: '',
  end_task_time: '',
  assignedUsers: [],
})

// For user assignment
const selectedUserId = ref('')
const projectUsers = ref<{ id: string; email: string }[]>([])

// Computed property for available users (not yet assigned to the task)
const availableUsers = computed(() => {
  const assignedUserIds = editingTask.value.assignedUsers.map((user) => user.id)
  return projectUsers.value.filter((user) => !assignedUserIds.includes(user.id))
})

// Add a user to the task
const addUserToTask = () => {
  if (!selectedUserId.value) return

  const user = projectUsers.value.find((u) => u.id === selectedUserId.value)
  if (!user) return

  // Add to assigned users list if not already assigned
  if (!editingTask.value.assignedUsers.some((u) => u.id === user.id)) {
    editingTask.value.assignedUsers.push(user)
  }

  // Reset selection
  selectedUserId.value = ''
}

// Remove a user from the task
const removeUserFromTask = (index: number) => {
  editingTask.value.assignedUsers.splice(index, 1)
}

// Load project users
const loadProjectUsers = async (projectId: string) => {
  try {
    // First, get all users associated with this project
    const { data: projectUserData, error: projectUserError } = await supabase
      .from('project_has_users')
      .select('user_id')
      .eq('project_id', projectId)
      .is('task_id', null)

    if (projectUserError) {
      console.error('Error loading project users:', projectUserError)
      return []
    }

    if (!projectUserData || projectUserData.length === 0) {
      projectUsers.value = []
      return []
    }

    // Get user details from user_emails
    const userIds = projectUserData.map((pu: { user_id: string }) => pu.user_id)
    const { data: userData, error: userError } = await supabase
      .from('user_emails')
      .select('id, email')
      .in('id', userIds)

    if (userError) {
      console.error('Error loading user details:', userError)
      return []
    }

    projectUsers.value = userData || []
    return userData || []
  } catch (err) {
    console.error('Error in loadProjectUsers:', err)
    return []
  }
}

// Load task assigned users
const loadTaskAssignedUsers = async (taskId: string) => {
  try {
    // Get users assigned to this task
    const { data: taskUserData, error: taskUserError } = await supabase
      .from('project_has_users')
      .select('user_id')
      .eq('task_id', taskId)

    if (taskUserError) {
      console.error('Error loading task users:', taskUserError)
      return []
    }

    if (!taskUserData || taskUserData.length === 0) {
      return []
    }

    // Get user details
    const userIds = taskUserData.map((tu: { user_id: string }) => tu.user_id)
    const { data: userData, error: userError } = await supabase
      .from('user_emails')
      .select('id, email')
      .in('id', userIds)

    if (userError) {
      console.error('Error loading user details:', userError)
      return []
    }

    return userData || []
  } catch (error) {
    console.error('Error in loadTaskAssignedUsers:', error)
    return []
  }
}

// Project dialog state
const isDrawerOpen = ref(false)
const showNoProjectDialog = ref(false)
const showColumnDialog = ref(false)
const lengthTasks = ref(0)

// Drawer methods
function openSidebar() {
  isDrawerOpen.value = true
}

function closeSidebar() {
  isDrawerOpen.value = false
}

// Router for navigation
const router = useRouter()

// New task object
const newTask = ref<NewTask>({
  title: '',
  description: '',
  status: '',
  project_id: '',
})

// count task list
watch(
  () => editingTask.value?.id,
  async (newTaskId) => {
    if (!newTaskId) {
      lengthTasks.value = 0;
      isTaskList.value = false;
      return;
    }
    
    try {
      console.log('Fetching task list count for task ID:', newTaskId);
      const count = await countTaskList(newTaskId);
      console.log('Task list count:', count);
      
      lengthTasks.value = count || 0;
      isTaskList.value = lengthTasks.value > 0;
      console.log('Updated isTaskList to:', isTaskList.value);
    } catch (error) {
      console.error('Error loading task lists:', error);
      lengthTasks.value = 0;
      isTaskList.value = false;
    }
  },
  { immediate: true }
)

// Get route for project_id from query params
const route = useRoute()

// Current project ID from URL query
const currentProjectId = computed(() => (route.query.id as string) || '')

// Watch for changes in project ID to update form
watch(
  () => currentProjectId.value,
  (newProjectId) => {
    newTask.value.project_id = newProjectId
  },
)

// Get tasks for a specific column
const tasksInColumn = (columnId: string): Task[] => {
  return tasks.value.filter((task: Task) => task.status === columnId)
}

// Fetch tasks from Supabase
const fetchTasks = async () => {
  try {
    loading.value = true
    errorMessage.value = ''

    // Only fetch tasks if a project is selected
    if (currentProjectId.value) {
      tasks.value = await getTasks(currentProjectId.value)
      await refreshCommentCounts()

      // Setup real-time subscription after initial fetch
      setupRealtimeSubscriptions()
    } else {
      tasks.value = []
    }
  } catch (err) {
    console.error('Error fetching tasks:', err)
    errorMessage.value = 'Failed to load tasks. Please try again.'
    toast.error('Error', {
      description: 'Failed to load tasks',
      duration: 3000,
    })
  } finally {
    loading.value = false
  }
}

// Watch for changes in project ID to refresh tasks and check for missing project
watch(
  () => currentProjectId.value,
  (newProjectId) => {
    if (newProjectId) {
      fetchTasks()
      loadColumns()
      // Update the project_id in the newTask object
      newTask.value.project_id = newProjectId
    } else {
      // If no project selected, show the project dialog
      showNoProjectDialog.value = true
      // Clean up any existing subscriptions
      removeRealtimeSubscriptions()
    }
  },
)

// Load columns from backend
const loadColumns = async () => {
  try {
    loading.value = true
    const { getColumns } = await import('../../services/columnService')
    const fetchedColumns = await getColumns(currentProjectId.value)
    if (fetchedColumns.length === 0) {
      // If no columns, create default ones
      const { initializeDefaultColumns } = await import('../../services/columnService')
      columns.value = await initializeDefaultColumns(currentProjectId.value)
    } else {
      columns.value = fetchedColumns
    }
  } catch (err) {
    console.error('Error loading columns:', err)
    errorMessage.value = 'Failed to load columns. Please try again.'
    toast.error('Error', {
      description: 'Failed to load columns',
      duration: 3000,
    })
  } finally {
    loading.value = false
  }
}

// Add a new task
const addTask = async () => {
  try {
    if (!newTask.value.title) {
      errorMessage.value = 'Task title is required'
      toast.error('Error', {
        description: 'Task title is required',
        duration: 3000,
      })
      return
    }

    if (!currentProjectId.value) {
      errorMessage.value = 'Please select a project first'
      toast.error('Error', {
        description: 'Please select a project first',
        duration: 3000,
      })
      return
    }

    if (!newTask.value.status) {
      errorMessage.value = 'Please select a column'
      toast.error('Error', {
        description: 'Please select a column',
        duration: 3000,
      })
      return
    }

    loading.value = true
    errorMessage.value = ''

    const taskToCreate = {
      title: newTask.value.title,
      description: newTask.value.description,
      status: newTask.value.status,
      project_id: currentProjectId.value,
    }

    const createdTask = await createTask(taskToCreate)
    tasks.value.unshift(createdTask)

    // Reset form
    newTask.value = {
      title: '',
      description: '',
      status: '',
      project_id: currentProjectId.value,
    }

    // Show success toast
    toast.success('Success', {
      description: 'Task created successfully',
      duration: 3000,
    })
  } catch (err) {
    console.error('Error creating task:', err)
    errorMessage.value = 'Failed to create task. Please try again.'
    toast.error('Error', {
      description: 'Failed to create task',
      duration: 3000,
    })
  } finally {
    loading.value = false
  }
}

// Show delete confirmation dialog
const confirmDelete = (taskId: string) => {
  taskToDelete.value = taskId
  showDeleteConfirm.value = true
}

// Execute task deletion after confirmation
const executeDelete = async () => {
  if (!taskToDelete.value) return
  
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskToDelete.value)
    
    if (error) throw error

    // Remove task from local state
    tasks.value = tasks.value.filter(t => t.id !== taskToDelete.value)
    // Remove its comment count too
    const copy = { ...commentCounts.value }
    delete copy[taskToDelete.value]
    commentCounts.value = copy
    
    // Close modal and reset state
    showDeleteConfirm.value = false
    taskToDelete.value = null
    
    // Show success message
    if (errorMessage.value) errorMessage.value = ''
    toast.success('Success', {
      description: 'Task deleted successfully',
      duration: 3000,
    })
  } catch (error) {
    console.error('Error deleting task:', error)
    errorMessage.value = 'Failed to delete task. Please try again.'
    toast.error('Error', {
      description: 'Failed to delete task',
      duration: 3000,
    })
    setTimeout(() => {
      errorMessage.value = ''
    }, 5000)
  }
}

// Delete a task (kept for backward compatibility)
const removeTask = async (taskId: string) => {
  taskToDelete.value = taskId
  await executeDelete()
}

// Lifecycle hooks
// Track active subscriptions
const taskSubscription = ref<any>(null)
const columnSubscription = ref<any>(null)

// Delete confirmation state
const showDeleteConfirm = ref(false)
const taskToDelete = ref<string | null>(null)

// Task change event handler reference
const taskChangeHandler = (e: Event) => {
  console.log('Task change event received:', (e as CustomEvent).detail)
  fetchTasks()
}

// Column change event handler reference
const columnChangeHandler = (e: Event) => {
  console.log('Column change event received:', (e as CustomEvent).detail)
  loadColumns()
}

const setupRealtimeSubscriptions = () => {
  realtimeTask(currentProjectId.value, tasks, columns, supabase, removeRealtimeSubscriptions)
}

// Clean up subscriptions to prevent memory leaks
const removeRealtimeSubscriptions = () => {
  if (taskSubscription.value) {
    supabase.removeChannel(taskSubscription.value)
    taskSubscription.value = null
  }

  if (columnSubscription.value) {
    supabase.removeChannel(columnSubscription.value)
    columnSubscription.value = null
  }
}

onMounted(async () => {
  // Check if project ID exists
  if (currentProjectId.value) {
    fetchTasks()
    loadColumns()

    // Add event listener for column changes from other users
    window.addEventListener('column-change', columnChangeHandler)

    // Add event listener for task changes from other users
    window.addEventListener('task-change', taskChangeHandler)
  } else {
    // If no project ID, show project dialog
    showNoProjectDialog.value = true
  }
})

// Clean up subscriptions when component is unmounted
onUnmounted(() => {
  removeRealtimeSubscriptions()

  // Remove task change event listener
  window.removeEventListener('task-change', taskChangeHandler)

  // Remove column change event listener
  window.removeEventListener('column-change', columnChangeHandler)
})

// Method to open column management dialog
const openColumnDialog = () => {
  showColumnDialog.value = true
}

// Handle columns update
const handleColumnsUpdate = async () => {
  // Reload columns from the backend to ensure we have the latest data
  await loadColumns()
  // Refresh tasks to ensure they match the updated columns
  fetchTasks()
}

// Handle project selection
const handleProjectSelect = (project: { id: string }) => {
  router.push({ query: { id: project.id } })
  showNoProjectDialog.value = false
}

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
      errorMessage.value = 'Failed to update task status. Please try again.'

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
const onDragStart = (event: DragEvent, task: Task, columnId: string): void => {
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
const openEditModal = async (task: Task) => {
  // Prevent opening modal when dragging
  if (draggedTaskId.value) return

  // If the task has no status, assign it the first column's id
  if (!task.status && columns.value.length > 0) {
    task.status = columns.value[0].id
  }

  // Format date for display in edit form
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Format time for display in edit form
  const formatTimeForInput = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  // Parse dates
  const startDate = task.start_task ? moment(task.start_task).tz('Asia/Jakarta').toDate() : null
  const endDate = task.end_task ? moment(task.end_task).tz('Asia/Jakarta').toDate() : null

  // Load project users
  await loadProjectUsers(task.project_id)

  // Load users assigned to this task
  const assignedUsers = await loadTaskAssignedUsers(task.id)

  editingTask.value = {
    id: task.id,
    title: task.title,
    description: task.description || '',
    status: task.status,
    project_id: task.project_id,
    // We don't need to set start_task and end_task directly as we'll compute them from the date/time fields
    start_task_date: startDate ? formatDateForInput(startDate) : '',
    start_task_time: startDate ? formatTimeForInput(startDate) : '',
    end_task_date: endDate ? formatDateForInput(endDate) : '',
    end_task_time: endDate ? formatTimeForInput(endDate) : '',
    assignedUsers: assignedUsers,
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
    errorMessage.value = ''

    // Combine date and time for start_task using moment-timezone to preserve local timezone
    let startTaskDate = null
    if (editingTask.value.start_task_date) {
      const dateStr = editingTask.value.start_task_date
      const timeStr = editingTask.value.start_task_time || '00:00'
      // Use moment to create a date in the local timezone (Asia/Jakarta)
      startTaskDate = moment.tz(`${dateStr} ${timeStr}`, 'YYYY-MM-DD HH:mm', 'UTC').toDate()
    }

    // Combine date and time for end_task using moment-timezone
    let endTaskDate = null
    if (editingTask.value.end_task_date) {
      const dateStr = editingTask.value.end_task_date
      const timeStr = editingTask.value.end_task_time || '00:00'
      // Use moment to create a date in the local timezone (Asia/Jakarta)
      endTaskDate = moment.tz(`${dateStr} ${timeStr}`, 'YYYY-MM-DD HH:mm', 'UTC').toDate()
    }

    const taskId = editingTask.value.id
    const projectId = editingTask.value.project_id

    // 1. Update task details in tasks table
    const updates = {
      title: editingTask.value.title,
      description: editingTask.value.description,
      status: editingTask.value.status,
      start_task: startTaskDate,
      end_task: endTaskDate,
    }

    // Update in Supabase
    const updatedTask = await updateTaskService(taskId, updates)

    // 2. Handle user assignments
    // First remove all existing user assignments for this task
    const { error: deleteError } = await supabase
      .from('project_has_users')
      .delete()
      .eq('task_id', taskId)

    if (deleteError) {
      console.error('Error removing task users:', deleteError)
      throw new Error('Failed to update task users')
    }

    // Then add new user assignments if any
    if (editingTask.value.assignedUsers.length > 0) {
      const taskUsers = editingTask.value.assignedUsers.map((user) => ({
        project_id: projectId,
        user_id: user.id,
        task_id: taskId,
      }))

      const { error: insertError } = await supabase.from('project_has_users').insert(taskUsers)

      if (insertError) {
        console.error('Error adding task users:', insertError)
        throw new Error('Failed to assign users to task')
      }
    }

    // 3. Update in local state
    const taskIndex = tasks.value.findIndex((t) => t.id === taskId)
    if (taskIndex !== -1) {
      tasks.value[taskIndex] = {
        ...tasks.value[taskIndex],
        ...updatedTask,
      }
    }

    // Close modal
    closeEditModal()

    // Show success toast
    toast.success('Success', {
      description: 'Task updated successfully',
      duration: 3000,
    })
  } catch (err: any) {
    console.error('Error updating task:', err)
    errorMessage.value = err.message || 'Failed to update task. Please try again.'
    toast.error('Error', {
      description: errorMessage.value,
      duration: 3000,
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
#bounce-up {
  animation: bounce 1.5s infinite;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }

  50% {
    transform: translateY(-30px);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}

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
