<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { supabase } from '../utils/supabase'
import KanbanPage from './views/kanban-page.vue'

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

const tasks = ref<Task[]>([])

async function getTasks() {
  const { data } = await supabase.from('tasks').select()
  tasks.value = data as Task[]
}

onMounted(() => {
  getTasks()
})
</script>

<template>
  <KanbanPage />
</template>
