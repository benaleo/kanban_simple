<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
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
const editingItemId = ref<string | null>(null)

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
  // If the item is empty, delete it
  if (!item.name.trim()) {
    await handleDelete(item)
    return
  }
  
  // Only save if we're not currently editing
  if (editingItemId.value !== item.id) {
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
    editingItemId.value = newItem.id // Set the new item as being edited
    emit('update', newItem)
  } catch (error) {
    console.error('Error creating task item:', error)
  }
}

const startEditing = (item: TaskListItem) => {
  editingItemId.value = item.id
}

const finishEditing = (item: TaskListItem) => {
  editingItemId.value = null
  handleUpdate(item)
}

const checkedTask = computed(() => {
  return taskLists.value.filter(t => t.is_checked).length
})

const totalTask = computed(() => {
  return taskLists.value.length
})

const calculateProgress = computed(() => {
  return checkedTask.value / totalTask.value * 100
})

</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-white font-semibold">Task List</h2>
      
      <!-- counting e.g (5/10) 50% Progress -->
      <div class="text-white/50 text-sm">({{ checkedTask }} / {{ totalTask }}) | {{ calculateProgress.toFixed(2) }}%</div>
    </div>

    <div v-if="loadingTaskLists" class="text-white/50 text-center">Loading todo items...</div>
    <div v-else>
      <div 
        v-for="item in taskLists" 
        :key="item.id" 
        class="flex justify-between items-center w-full gap-2 mb-2 min-w-[200px]"
      >
        <div class="flex items-center gap-2 w-full">
          <input 
            type="checkbox" 
            v-model="item.is_checked" 
            @change="() => handleUpdate(item)"
            class="h-5 w-5 rounded border-white/30 bg-white/20"
          />
          
          <input
            v-if="editingItemId === item.id || !item.name"
            v-model="item.name"
            @blur="() => finishEditing(item)"
            @keyup.enter="() => finishEditing(item)"
            @keyup.esc="editingItemId = null"
            class="w-full bg-transparent border-b border-white/30 text-white focus:outline-none"
            autofocus
          />
          <span 
            v-else 
            class="text-white cursor-pointer"
            @click="startEditing(item)"
          >
            {{ item.name }}
          </span>
        </div>
        
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
