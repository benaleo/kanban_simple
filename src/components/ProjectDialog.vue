<template>
  <div class="dialog-overlay" @click.self="$emit('close')">
    <div class="dialog-content">
      <div class="dialog-header">
        <h2 class="dialog-title">{{ isEditMode ? 'Edit Project' : 'Select Project' }}</h2>
        <button class="close-button" @click="$emit('close')">&times;</button>
      </div>
      
      <div class="dialog-body">
        <!-- Project List -->
        <div v-if="!isEditMode && !isAddMode" class="project-list">
          <div class="project-list-header">
            <h3>Your Projects</h3>
            <button @click="startAddProject" class="add-button">
              <i class="fas fa-plus"></i> New Project
            </button>
          </div>
          
          <div v-if="loading" class="loading-indicator">Loading projects...</div>
          <div v-else-if="errorMessage" class="error-message">{{ errorMessage }}</div>
          <div v-else-if="projects.length === 0" class="empty-state">
            <p>You don't have any projects yet. Create your first project to get started.</p>
          </div>
          
          <div v-else class="projects-grid">
            <div v-for="project in projects" :key="project.id" class="project-card" 
                 :class="{'selected': selectedProjectId === project.id}"
                 @click="selectProject(project)">
              <div class="project-card-content">
                <h4 class="project-name">{{ project.name }}</h4>
                
                <div class="project-actions">
                  <button @click.stop="editProject(project)" class="edit-button" title="Edit project">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button @click.stop="confirmDeleteProject(project)" class="delete-button" title="Delete project">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Add/Edit Project Form -->
        <form v-if="isEditMode || isAddMode" @submit.prevent="saveProject" class="project-form">
          <div class="form-group">
            <label for="projectName">Project Name</label>
            <input 
              type="text" 
              id="projectName" 
              v-model="projectForm.name" 
              required
              class="form-input"
              placeholder="Enter project name"
              autofocus
            />
          </div>
          
          <div class="dialog-actions">
            <button type="button" class="cancel-button" @click="cancelEdit">Cancel</button>
            <button type="submit" class="save-button" :disabled="isSubmitting">
              {{ isSubmitting ? 'Saving...' : 'Save Project' }}
            </button>
          </div>
        </form>
        
        <!-- Confirm Delete Modal -->
        <div v-if="showDeleteConfirm" class="delete-confirm">
          <p>Are you sure you want to delete <strong>{{ projectToDelete?.name }}</strong>?</p>
          <p class="warning">This will delete all tasks associated with this project and cannot be undone.</p>
          
          <div class="dialog-actions">
            <button @click="cancelDelete" class="cancel-button">Cancel</button>
            <button @click="deleteProject" class="delete-button" :disabled="isSubmitting">
              {{ isSubmitting ? 'Deleting...' : 'Delete Project' }}
            </button>
          </div>
        </div>
        
        <!-- Selection Actions -->
        <div v-if="!isEditMode && !isAddMode && !showDeleteConfirm" class="selection-actions">
          <button 
            v-if="selectedProjectId" 
            class="primary-button" 
            @click="$emit('select', selectedProject)">
            Open Selected Project
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getProjects, createProject, updateProject, deleteProject as deleteProjectService } from '../../services/projectService';

// Props and emits
const emit = defineEmits(['close', 'select']);

// Component state
const router = useRouter();
const route = useRoute();
const projects = ref<any[]>([]);
const loading = ref(true);
const errorMessage = ref('');
const isSubmitting = ref(false);
const selectedProjectId = ref('');
const isEditMode = ref(false);
const isAddMode = ref(false);
const showDeleteConfirm = ref(false);
const projectToDelete = ref<any>(null);

// Form state
const projectForm = ref({
  id: '',
  name: ''
});

// Computed properties
const selectedProject = computed(() => {
  return projects.value.find(p => p.id === selectedProjectId.value) || null;
});

// Lifecycle hooks
onMounted(async () => {
  await loadProjects();
  
  // Set initial selected project from URL query param if present
  const projectId = route.query.id as string;
  if (projectId) {
    selectedProjectId.value = projectId;
  } else if (projects.value.length > 0) {
    // Otherwise select first project by default
    selectedProjectId.value = projects.value[0].id;
  }
});

// Methods
async function loadProjects() {
  try {
    loading.value = true;
    errorMessage.value = '';
    projects.value = await getProjects();
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to load projects';
  } finally {
    loading.value = false;
  }
}

function selectProject(project: any) {
  selectedProjectId.value = project.id;
}

function startAddProject() {
  isAddMode.value = true;
  isEditMode.value = false;
  projectForm.value = {
    id: '',
    name: ''
  };
}

function editProject(project: any) {
  isEditMode.value = true;
  isAddMode.value = false;
  projectForm.value = {
    id: project.id,
    name: project.name
  };
}

function cancelEdit() {
  isEditMode.value = false;
  isAddMode.value = false;
}

async function saveProject() {
  try {
    isSubmitting.value = true;
    errorMessage.value = '';
    
    if (isEditMode.value) {
      // Update existing project
      const updatedProject = await updateProject(projectForm.value.id, {
        name: projectForm.value.name
      });
      
      // Update project in local array
      const index = projects.value.findIndex(p => p.id === updatedProject.id);
      if (index !== -1) {
        projects.value[index] = updatedProject;
      }
    } else {
      // Add new project
      const newProject = await createProject({
        name: projectForm.value.name
      });
      
      // Add to local array
      projects.value.push(newProject);
      selectedProjectId.value = newProject.id;
    }
    
    // Reset form state
    isEditMode.value = false;
    isAddMode.value = false;
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to save project';
  } finally {
    isSubmitting.value = false;
  }
}

function confirmDeleteProject(project: any) {
  projectToDelete.value = project;
  showDeleteConfirm.value = true;
}

function cancelDelete() {
  projectToDelete.value = null;
  showDeleteConfirm.value = false;
}

async function deleteProject() {
  if (!projectToDelete.value) return;
  
  try {
    isSubmitting.value = true;
    errorMessage.value = '';
    
    await deleteProjectService(projectToDelete.value.id);
    
    // Remove from local array
    projects.value = projects.value.filter(p => p.id !== projectToDelete.value?.id);
    
    // Reset selected project if needed
    if (selectedProjectId.value === projectToDelete.value.id) {
      selectedProjectId.value = projects.value.length > 0 ? projects.value[0].id : '';
    }
    
    // Reset state
    showDeleteConfirm.value = false;
    projectToDelete.value = null;
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to delete project';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
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

.save-button, .primary-button {
  padding: 0.625rem 1rem;
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.delete-button {
  padding: 0.625rem 1rem;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.save-button:hover, .primary-button:hover {
  background-color: #4338ca;
}

.save-button:disabled, .delete-button:disabled {
  background-color: #a5a5a5;
  cursor: not-allowed;
}

.project-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.project-list-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
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

.projects-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.project-card {
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.project-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.project-card.selected {
  border-color: #4f46e5;
  background-color: rgba(79, 70, 229, 0.05);
}

.project-card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-name {
  margin: 0;
  font-weight: 500;
  font-size: 1rem;
}

.project-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-button, .delete-button {
  background: none;
  border: none;
  font-size: 0.875rem;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  cursor: pointer;
}

.edit-button {
  color: #4b5563;
}

.edit-button:hover {
  background-color: rgba(75, 85, 99, 0.1);
}

.delete-button {
  color: #ef4444;
}

.delete-button:hover {
  background-color: rgba(239, 68, 68, 0.1);
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

.selection-actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
}
</style>
