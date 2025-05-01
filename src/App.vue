<script setup lang="ts">
import favicon from '@/assets/favicon/favicon.ico'

document.head.insertAdjacentHTML('beforeend',
  `<link rel="icon" type="image/png" href="${favicon}" />`
)

</script>

<template>
  <RouterView>
  </RouterView>
</template>