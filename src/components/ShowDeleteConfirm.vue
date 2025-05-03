<template>
  <div class="delete-confirm">
    <p>Are you sure you want to delete <strong>{{ projectToDelete?.name }}</strong>?</p>
    <p class="warning">This will delete all tasks associated with this project and cannot be undone.</p>
    <div class="dialog-actions">
      <button @click="cancelDelete"
        class="btn bg-slate-200 hover:bg-slate-400 transition-all duration-300 whitespace-nowrap">
        Cancel
      </button>
      <button @click="deleteProject"
        class="btn text-white bg-red-400 hover:bg-red-500 transition-all duration-300 whitespace-nowrap"

        :disabled="isSubmitting">
        {{ isSubmitting ? 'Deleting...' : 'Delete Project' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  projectToDelete: any;
  isSubmitting: boolean;
  cancelDelete: () => void;
  deleteProject: () => void;
}>();

const emit = defineEmits(['delete', 'cancel']);

const isSubmitting = ref(false);

const cancelDelete = () => {
  emit('cancel');
};

const deleteProject = async () => {
  isSubmitting.value = true;
  try {
    await props.projectToDelete.delete();
    emit('delete');
  } catch (error) {
    console.error('Error deleting project:', error);
  } finally {
    isSubmitting.value = false;
  }
};
</script>
