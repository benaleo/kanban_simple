<script setup lang="ts">
import favicon from '@/assets/favicon/favicon.ico'
import { Toaster } from 'vue-sonner'

document.head.insertAdjacentHTML('beforeend',
  `<link rel="icon" type="image/png" href="${favicon}" />`
)

</script>

<template>
    <Toaster rich-colors />
    <RouterView />
</template>