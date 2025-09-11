<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="grid gap-2 col-span-1 md:col-span-2">
      <input
        :value="title"
        @input="$emit('update:title', ($event.target as HTMLInputElement).value)"
        placeholder="Task Title"
        class="w-full p-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-500"
      />

      <QuillEditor
        theme="snow"
        contentType="html"
        toolbar="minimal"
        placeholder="Task Description"
        :content="description"
        @update:content="val => $emit('update:description', String(val || ''))"
        class="bg-white/20 rounded-lg [&_.ql-container]:bg-transparent [&_.ql-toolbar]:bg-white [&_.ql-toolbar]:border-white/30 [&_.ql-container]:border-white/30 text-white"
      />
    </div>

    <div class="flex flex-col gap-2">
      <div class="flex gap-2">
        <select
          :value="status"
          @change="$emit('update:status', ($event.target as HTMLSelectElement).value)"
          class="flex-1 p-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option class="bg-black text-white border-red-200 rounded-lg" value="" disabled>
            Select a column
          </option>
          <option
            class="bg-black text-white border-red-200 rounded-lg"
            v-for="column in columns"
            :key="column.id"
            :value="column.id"
          >
            {{ column.name }}
          </option>
        </select>
        <button
          @click="$emit('openColumnDialog')"
          class="max-w-[150px] p-3 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <font-awesome-icon icon="table-columns" style="color: white" />
        </button>
      </div>

      <button @click="$emit('create')" class="mt-4 bg-galaxy">Create Task</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { QuillEditor } from '@vueup/vue-quill'

export interface Column {
  id: string
  name: string
}

const props = defineProps<{
  title: string
  description: string
  status: string
  columns: Column[]
}>()

const emit = defineEmits<{
  (e: 'update:title', value: string): void
  (e: 'update:description', value: string): void
  (e: 'update:status', value: string): void
  (e: 'openColumnDialog'): void
  (e: 'create'): void
}>()
</script>

<style scoped>
.ql-toolbar .ql-snow {
  background-color: white !important;
}
</style>

