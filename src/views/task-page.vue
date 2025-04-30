<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { supabase } from '../../utils/supabase'

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
    <div class="container mx-auto flex justify-center items-center w-full min-h-screen">
        <ul>
            <li v-for="task in tasks" :key="task.id" class="text-white">{{ task.title }}</li>
        </ul>
    </div>
</template>
