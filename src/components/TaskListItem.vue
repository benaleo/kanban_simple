<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { 
  getTaskLists,
  createTaskListItem,
  updateTaskListItem, 
  deleteTaskListItem 
} from '../../services/taskListService'

interface TaskListItem {
  id: string
  name: string
  is_checked: boolean
  task_id: string
}

const props = defineProps<{
  task_id: string
}>()

const emit = defineEmits(['update', 'delete'])

// Task list state
const loadingTaskLists = ref(false)
const taskLists = ref<TaskListItem[]>([])

// Load task lists when task_id changes
const loadTaskLists = async () => {
  loadingTaskLists.value = true
  try {
    taskLists.value = await getTaskLists(props.task_id)
  } catch (error) {
    console.error('Error loading task lists:', error)
  } finally {
    loadingTaskLists.value = false
  }
}

// Initial load
onMounted(loadTaskLists)

// Watch for task_id changes
watch(() => props.task_id, loadTaskLists)

const handleUpdate = async (item: TaskListItem) => {
  if (!item.name.trim()) {
    await handleDelete(item)
    return
  }
  
  try {
    const updatedItem = await updateTaskListItem(item.id, {
      name: item.name,
      is_checked: item.is_checked,
    })
    emit('update', updatedItem)
  } catch (error) {
    console.error('Error updating task item:', error)
  }
}

const handleDelete = async (item: TaskListItem) => {
  try {
    await deleteTaskListItem(item.id)
    taskLists.value = taskLists.value.filter(t => t.id !== item.id)
    emit('delete', item.id)
  } catch (error) {
    console.error('Error deleting task item:', error)
  }
}

const addNewTaskListItem = async () => {
  try {
    const newItem = await createTaskListItem(props.task_id, '', false)
    taskLists.value.push(newItem)
    emit('update', newItem)
  } catch (error) {
    console.error('Error creating task item:', error)
  }
}
</script>

<template>
  <div>
    <div v-if="loadingTaskLists" class="text-white/50 text-center">Loading todo items...</div>
    <div v-else>
      <div 
        v-for="item in taskLists" 
        :key="item.id" 
        class="flex items-center gap-2 mb-2"
      >
        <input 
          type="checkbox" 
          v-model="item.is_checked" 
          @change="() => handleUpdate(item)"
          class="h-5 w-5 rounded border-white/30 bg-white/20"
        />
        
        <input
          v-if="!item.name"
          v-model="item.name"
          @blur="() => handleUpdate(item)"
          @keyup.enter="() => handleUpdate(item)"
          class="flex-1 bg-transparent border-b border-white/30 text-white focus:outline-none"
          autofocus
        />
        <span v-else class="text-white">{{ item.name }}</span>
        
        <button 
          @click="() => handleDelete(item)"
          class="text-red-300 hover:text-red-500"
        >
          &times;
        </button>
      </div>
      
      <button 
        @click="addNewTaskListItem"
        class="mt-4 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Todo Item
      </button>
    </div>
  </div>
</template>
