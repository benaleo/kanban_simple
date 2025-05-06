<script setup lang="ts">
import { ref } from 'vue'
import { updateTaskListItem, deleteTaskListItem } from '../../services/taskListService'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update', 'delete'])

const name = ref(props.item.name)
const isChecked = ref(props.item.is_checked)
const isEditing = ref(!props.item.name)

const handleUpdate = async () => {
  if (!name.value.trim()) {
    emit('delete', props.item.id)
    return
  }
  
  const updatedItem = await updateTaskListItem(props.item.id, {
    name: name.value,
    is_checked: isChecked.value
  })
  emit('update', updatedItem)
  isEditing.value = false
}

const handleDelete = async () => {
  await deleteTaskListItem(props.item.id)
  emit('delete', props.item.id)
}
</script>

<template>
  <div class="flex items-center gap-2 mb-2">
    <input 
      type="checkbox" 
      v-model="isChecked" 
      @change="handleUpdate"
      class="h-5 w-5 rounded border-white/30 bg-white/20"
    />
    
    <input
      v-if="isEditing"
      v-model="name"
      @blur="handleUpdate"
      @keyup.enter="handleUpdate"
      class="flex-1 p-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
      autofocus
    />
    <span 
      v-else
      @click="isEditing = true"
      class="flex-1 p-2 cursor-text"
      :class="{ 'line-through text-white/50': isChecked }"
    >
      {{ name }}
    </span>
    
    <button 
      @click="handleDelete"
      class="text-red-300 hover:text-red-500 p-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  </div>
</template>
