<template>
  <div class="dialog-overlay" @click.self="$emit('close')">
    <div class="dialog-content">
      <div class="dialog-header">
        <h2 class="dialog-title">{{ isEditMode ? 'Edit Column' : 'Manage Columns' }}</h2>
        <button class="close-button" @click="$emit('close')">&times;</button>
      </div>
      
      <div class="dialog-body">
        <!-- Column List -->
        <div v-if="!isEditMode && !isAddMode" class="column-list">
          <div class="column-list-header">
            <h3>Project Columns</h3>
            <button @click="startAddColumn" class="add-button">
              <i class="fas fa-plus"></i> New Column
            </button>
          </div>
          
          <div v-if="loading" class="loading-indicator">Loading columns...</div>
          <div v-else-if="errorMessage" class="error-message">{{ errorMessage }}</div>
          <div v-else-if="columns.length === 0" class="empty-state">
            <p>No columns found. Create your first column to organize tasks.</p>
          </div>
          
          <div v-else class="columns-grid">
            <div class="column-list-instructions">
              <p>Drag and drop columns to change their order</p>
            </div>
            <div v-for="(column, index) in columns" :key="column.id" class="column-card" draggable="true" @dragstart="startDrag($event, index)" @dragover.prevent @dragenter.prevent="onDragEnter($event, index)" @dragleave.prevent="onDragLeave($event)" @drop.prevent="onDrop($event, index)" :class="{ 'drag-over': dragOverIndex === index }">
              <div class="column-card-content">
                <h4 class="column-name">{{ column.name }}</h4>
                
                <div class="column-actions">
                  <button @click="editColumn(column)" class="edit-button" title="Edit column">
                    <font-awesome-icon icon="edit" style="color: white" />
                  </button>
                  <button @click="confirmDeleteColumn(column)" class="delete-button" title="Delete column">
                    <font-awesome-icon icon="trash" style="color: white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Add/Edit Column Form -->
        <form v-if="isEditMode || isAddMode" @submit.prevent="saveColumn" class="column-form">
          <div class="form-group">
            <label for="columnName">Column Name</label>
            <input 
              type="text" 
              id="columnName" 
              v-model="columnForm.name" 
              required
              class="form-input"
              placeholder="Enter column name"
              autofocus
            />
          </div>
          
          <div class="dialog-actions">
            <button type="button" class="cancel-button" @click="cancelEdit">Cancel</button>
            <button type="submit" class="save-button" :disabled="isSubmitting">
              {{ isSubmitting ? 'Saving...' : 'Save Column' }}
            </button>
          </div>
        </form>
        
        <!-- Confirm Delete Modal -->
        <div v-if="showDeleteConfirm" class="delete-confirm">
          <p>Are you sure you want to delete <strong>{{ columnToDelete?.name }}</strong>?</p>
          <p class="warning">This will move all tasks in this column to 'unassigned' status and cannot be undone.</p>
          
          <div class="dialog-actions">
            <button @click="cancelDelete" class="btn bg-slate-200 hover:bg-slate-400 transition-all duration-300 whitespace-nowrap">Cancel</button>
            <button @click="deleteColumn" class="btn text-white bg-red-400 hover:bg-red-500 transition-all duration-300 whitespace-nowrap" :disabled="isSubmitting">
              {{ isSubmitting ? 'Deleting...' : 'Delete Column' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, defineProps, defineEmits } from 'vue';
import { getColumns, createColumn, updateColumn, deleteColumn as deleteColumnService } from '../../services/columnService';
import { toast } from 'vue-sonner';

// Props and emits
const props = defineProps<{
  projectId: string;
}>();

const emit = defineEmits(['close', 'update']);

// Component state
const columns = ref<any[]>([]);
const loading = ref(true);
const errorMessage = ref('');
const isSubmitting = ref(false);
const isEditMode = ref(false);
const isAddMode = ref(false);
const showDeleteConfirm = ref(false);
const columnToDelete = ref<any>(null);
const dragOverIndex = ref<number | null>(null);
const dragSourceIndex = ref<number | null>(null);

// Form state
const columnForm = ref({
  id: '',
  name: ''
});

// Lifecycle hooks
onMounted(async () => {
  if (props.projectId) {
    await loadColumns();
  } else {
    errorMessage.value = 'No project selected';
    loading.value = false;
  }
});

// Drag and drop functions
const startDrag = (event: DragEvent, index: number) => {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.dropEffect = 'move';
    event.dataTransfer.setData('text/plain', index.toString());
    dragSourceIndex.value = index;
  }
};

const onDragEnter = (event: DragEvent, index: number) => {
  if (dragSourceIndex.value !== index) {
    dragOverIndex.value = index;
  }
};

const onDragLeave = (event: DragEvent) => {
  // Only clear if we're leaving for another element, not for a child element
  if (event.target === event.currentTarget) {
    dragOverIndex.value = null;
  }
};

const onDrop = async (event: DragEvent, dropIndex: number) => {
  event.preventDefault();
  const sourceIndex = dragSourceIndex.value;
  dragOverIndex.value = null; // Clear drag over highlight
  dragSourceIndex.value = null;
  
  if (sourceIndex === null || sourceIndex === dropIndex) return;
  
  try {
    // Make a copy of the columns array
    const newColumns = [...columns.value];
    
    // Remove the item from its original position
    const [movedColumn] = newColumns.splice(sourceIndex, 1);
    
    // Insert it at the new position
    newColumns.splice(dropIndex, 0, movedColumn);
    
    // Update all affected columns with new order values
    // First update the local state
    columns.value = newColumns.map((col, idx) => ({
      ...col,
      order: idx
    }));
    
    // Then update the backend
    loading.value = true;
    const updatePromises = columns.value.map(column => {
      return updateColumn(column.id, { order: column.order });
    });
    
    await Promise.all(updatePromises);
    emit('update'); // Notify parent that columns have been updated
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to update column order';
  } finally {
    loading.value = false;
  }
};

// Methods
async function loadColumns() {
  try {
    loading.value = true;
    errorMessage.value = '';
    columns.value = await getColumns(props.projectId);
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to load columns';
  } finally {
    loading.value = false;
  }
}

function startAddColumn() {
  isAddMode.value = true;
  isEditMode.value = false;
  columnForm.value = {
    id: '',
    name: ''
  };
}

function editColumn(column: any) {
  isEditMode.value = true;
  isAddMode.value = false;
  columnForm.value = {
    id: column.id,
    name: column.name
  };
}

function cancelEdit() {
  isEditMode.value = false;
  isAddMode.value = false;
}

async function saveColumn() {
  try {
    isSubmitting.value = true;
    errorMessage.value = '';
    
    if (isEditMode.value) {
      // Update existing column
      const updatedColumn = await updateColumn(columnForm.value.id, {
        name: columnForm.value.name
      });
      
      // Update column in local array
      const index = columns.value.findIndex(p => p.id === updatedColumn.id);
      if (index !== -1) {
        columns.value[index] = updatedColumn;
      }
    } else {
      // Add new column
      const newColumn = await createColumn(props.projectId, {
        name: columnForm.value.name
      });
      
      // Add to local array
      columns.value.push(newColumn);
    }
    
    // Reset form state
    isEditMode.value = false;
    isAddMode.value = false;
    
    // Emit update event
    emit('update', columns.value);

    // Show success toast
    toast.success('Success', {
      description: 'Column saved successfully',
      duration: 3000
    })
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to save column';
    toast.error('Error', {
      description: 'Failed to save column. Please try again.',
      duration: 3000
    })
  } finally {
    isSubmitting.value = false;
  }
}

function confirmDeleteColumn(column: any) {
  columnToDelete.value = column;
  showDeleteConfirm.value = true;
}

function cancelDelete() {
  columnToDelete.value = null;
  showDeleteConfirm.value = false;
}

async function deleteColumn() {
  if (!columnToDelete.value) return;
  
  try {
    isSubmitting.value = true;
    errorMessage.value = '';
    
    await deleteColumnService(columnToDelete.value.id);
    
    // Remove from local array
    columns.value = columns.value.filter(c => c.id !== columnToDelete.value?.id);
    
    // Reset state
    showDeleteConfirm.value = false;
    columnToDelete.value = null;
    
    // Emit update event
    emit('update', columns.value);

    // Show success toast
    toast.success('Success', {
      description: 'Column deleted successfully',
      duration: 3000
    })
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to delete column';
    toast.error('Error', {
      description: 'Failed to delete column. Please try again.',
      duration: 3000
    })
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>

input {
  color: #111827;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
}

.dialog-content {
  background-color: white;
  border-radius: 0.5rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
  max-height: 90vh;
  overflow-y: auto;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
}

.dialog-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.cancel-button {
  padding: 0.625rem 1rem;
  background-color: #f3f4f6;
  color: #4b5563;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.save-button {
  padding: 0.625rem 1rem;
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.save-button:hover {
  background-color: #4338ca;
}

.save-button:disabled, .delete-button:disabled {
  background-color: #a5a5a5;
  cursor: not-allowed;
}

.column-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.column-list-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.column-list-instructions {
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: #f9fafb;
  border-radius: 0.375rem;
  color: #6b7280;
  font-size: 0.875rem;
  text-align: center;
}

.add-button {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background-color: #f3f4f6;
  color: #4b5563;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.add-button:hover {
  background-color: #e5e7eb;
}

.columns-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.column-card {
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  transition: all 0.2s;
  cursor: grab;
}

.column-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.column-card.drag-over {
  border: 2px dashed #4f46e5;
  background-color: rgba(79, 70, 229, 0.1);
}

.column-card:active {
  cursor: grabbing;
}

.column-card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.column-name {
  margin: 0;
  font-weight: 500;
  font-size: 1rem;
}

.column-actions {
  display: flex;
  gap: 0.5rem;
}

.delete-confirm {
  background-color: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  padding: 1rem;
  margin-top: 1rem;
}

.delete-confirm p {
  margin: 0.5rem 0;
}

.warning {
  color: #b91c1c;
  font-size: 0.875rem;
}

.empty-state {
  text-align: center;
  color: #6b7280;
  padding: 2rem 0;
}

.loading-indicator, .error-message {
  padding: 1rem;
  text-align: center;
}

.error-message {
  color: #ef4444;
}
</style>
