<template>
    <div @click.self="closeDrawer" :class="{ 'drawer-overlay': isOpen }">
        <div class="drawer" :class="{ 'drawer-open': isOpen }">
            <div class="drawer-content">
                <button @click="closeDrawer">Close</button>
            </div>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:isOpen'])

function closeDrawer() {
  emit('update:isOpen', false)
}
</script>

<style scoped>
.drawer-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
}

.drawer {
    position: fixed;
    top: 0;
    right: 0;
    width: 300px;
    height: 100vh;
    background-color: #fff;
    transform: translateX(100%);
    transition: transform 0.3s ease-in-out;
}

.drawer-open {
    transform: translateX(0);
}

.drawer-content {
    padding: 20px;
}
</style>