<template>
  <div class="flex flex-col gap-2">
    <div>
      <label class="block text-white text-sm font-medium mb-1">Title</label>
      <input
        :value="title"
        @input="$emit('update:title', ($event.target as HTMLInputElement).value)"
        class="w-full p-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
    </div>

    <div>
      <label class="block text-white text-sm font-medium mb-1">Description</label>
      <QuillEditor
        theme="snow"
        contentType="html"
        :content="description"
        @update:content="val => $emit('update:description', String(val || ''))"
        class="bg-white/20 rounded-lg h-[250px] [&_.ql-container]:bg-transparent [&_.ql-toolbar]:bg-white/10 [&_.ql-toolbar]:border-white/30 [&_.ql-container]:border-white/30 text-white"
      />
    </div>

    <div>
      <label class="block text-white text-sm font-medium mb-1">Status</label>
      <select
        :value="status"
        @change="$emit('update:status', ($event.target as HTMLSelectElement).value)"
        class="w-full p-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
}>()
</script>

<style scoped>
.ql-toolbar.ql-snow {
  background: white;
}
</style>
