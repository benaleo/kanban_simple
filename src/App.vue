<script setup lang="ts">
import favicon from '@/assets/favicon/favicon.ico'
import { Toaster } from 'vue-sonner'
import { onMounted } from 'vue'

// Tambahkan favicon
document.head.insertAdjacentHTML('beforeend',
  `<link rel="icon" type="image/png" href="${favicon}" />`
)

// Fungsi untuk menambahkan tracker script
onMounted(() => {
  const script = document.createElement('script')
  script.src = 'https://tracker.epicgoods.my.id/tracker.js?domain=kanban-simple-ashy.vercel.app&lisence=premium'
  script.async = true
  document.head.appendChild(script)
})
</script>

<template>
  <Toaster rich-colors />
  <RouterView />
</template>