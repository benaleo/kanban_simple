<template>
  <div class="dialog-overlay text-black" @click.self="$emit('close')">
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
              <font-awesome-icon icon="plus" />New Project
            </button>
          </div>

          <div v-if="loading" class="loading-indicator">Loading projects...</div>
          <div v-else-if="errorMessage" class="error-message">{{ errorMessage }}</div>
          <div v-else-if="projects.length === 0" class="empty-state">
            <p>You don't have any projects yet. Create your first project to get started.</p>
          </div>

          <div v-else class="projects-grid">
            <div v-for="project in projects" :key="project.id" class="project-card"
              :class="{ 'selected': selectedProjectId === project.id }" @click="selectProject(project)">
              <div class="project-card-content">
                <h4 class="project-name">{{ project.name }}</h4>

                <div class="project-actions">
                  <button @click.stop="editProject(project)" class="edit-button" title="Edit project">
                    <font-awesome-icon icon="edit" style="color: white" />
                  </button>
                  <button @click.stop="confirmDeleteProject(project)" class="delete-button" title="Delete project">
                    <font-awesome-icon icon="trash" style="color: white" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- if have invited projects -->
          <div v-if="projectInvited.length > 0" class="projects-grid">
            <div v-for="project in projectInvited" :key="project.id" class="project-card"
              :class="{ 'selected': selectedProjectId === project.id }" @click="selectProject(project)">
              <div class="project-card-content">
                <h4 class="project-name">{{ project.name }}</h4>

                <div class="project-actions">
                  <button @click.stop="confirmDeleteProject(project)" class="tooltip delete-button" title="Leave Project">
                    <font-awesome-icon icon="right-from-bracket" style="color: white" />
                    <div class="tooltiptext">Leave Project</div>
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
            <input type="text" id="projectName" v-model="projectForm.name" required class="form-input"
              placeholder="Enter project name" autofocus />
          </div>

          <div class="form-group">
            <label for="projectUsers">Invite Users (by email)</label>
            <div class="flex items-center mb-2">
              <input type="text" id="userEmail" v-model="newUserEmail" class="form-input" placeholder="Enter user email"
                @keydown.enter.prevent="addUserEmail" />
              <button type="button" @click="addUserEmail" class="ml-2 add-button">
                <font-awesome-icon icon="plus" /> Add
              </button>
            </div>
            <div v-if="emailError" class="text-red-500 text-sm mb-2">{{ emailError }}</div>
            <div v-if="projectForm.userEmails.length > 0" class="selected-users">
              <div v-for="(email, index) in projectForm.userEmails" :key="index" class="selected-user">
                <span>{{ email }}</span>
                <button type="button" @click="removeUserEmail(index)" class="remove-user-btn">
                  &times;
                </button>
              </div>
            </div>
          </div>

          <!-- add the list assigned users -->
          <div class="grid gap-2">
            <div v-for="user in assignedUsers" :key="user.id" :id="user.id" class="user-card">
              <div class="relative flex gap-2 items-center">
                <img :src="user.avatar_url == null ? 'public/default.jpg' : user.avatar_url" alt="User Avatar" class="user-avatar rounded-full w-12">
                <div class="user-details">
                  <h3 class="font-semibold">{{ user.username }}</h3>
                  <p class="text-sm text-gray-500">{{ user.email }}</p>
                </div>
                <button type="button" @click="removeUser(user.id)"
                  class="absolute top-1/2 -translate-y-1/2 right-4 hover:bg-slate-200 w-8 h-8 rounded-full">
                  <font-awesome-icon icon="trash" style="color: red;" />
                </button>
              </div>
            </div>
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
            <button @click="cancelDelete"
              class="btn bg-slate-200 hover:bg-slate-400 transition-all duration-300 whitespace-nowrap">Cancel</button>
            <button @click="deleteProject"
              class="btn text-white bg-red-400 hover:bg-red-500 transition-all duration-300 whitespace-nowrap"
              :disabled="isSubmitting">
              {{ isSubmitting ? 'Deleting...' : 'Delete Project' }}
            </button>
          </div>
        </div>

        <!-- Selection Actions -->
        <div v-if="!isEditMode && !isAddMode && !showDeleteConfirm" class="selection-actions">
          <button v-if="selectedProjectId" class="primary-button" @click="$emit('select', selectedProject)">
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
import { supabase } from '../../utils/supabase';
import { getProjects, createProject, updateProject, deleteProject as deleteProjectService, listAssignedUsers, getInvitedProjects } from "../../services/projectService";
import { toast } from 'vue-sonner';
import type { UserProfile } from '../../services/authService';
import type { Project } from '@/types/project.type';

// Props and emits
const emit = defineEmits(['close', 'select']);

// Component state
const router = useRouter();
const route = useRoute();
const projects = ref<Project[]>([]);
const loading = ref(true);
const errorMessage = ref('');
const isSubmitting = ref(false);
const selectedProjectId = ref('');
const isEditMode = ref(false);
const isAddMode = ref(false);
const showDeleteConfirm = ref(false);
const projectToDelete = ref<any>(null);
const assignedUsers = ref<UserProfile[]>([]);
const selectedRemovedUserIds = ref<string[]>([]);
const projectInvited = ref<Project[]>([]);

// Form state
const projectForm = ref({
  id: '',
  name: '',
  userEmails: [] as string[]
});

const newUserEmail = ref('');
const emailError = ref('');

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

  await loadInvitedProjects();

  console.log("projectInvited", projectInvited.value);
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

// load invited projects
async function loadInvitedProjects() {
  try {
    loading.value = true;
    errorMessage.value = '';
    projectInvited.value = await getInvitedProjects();
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to load invited projects';
  } finally {
    loading.value = false;
  }
}

function selectProject(project: any) {
  selectedProjectId.value = project.id;
}

function startAddProject() {
  projectForm.value = {
    id: '',
    name: '',
    userEmails: []
  };
  isEditMode.value = false;
  isAddMode.value = true;
  emailError.value = '';
}

async function editProject(project: any) {
  // Fetch current project users
  const { data: projectUsers, error: fetchError } = await supabase
    .from('project_has_users')
    .select('user_id')
    .eq('project_id', project.id);

  if (fetchError) {
    console.error('Error fetching project users:', fetchError);
  }

  // Get emails for these users
  const userIds = projectUsers?.map((pu: { user_id: string }) => pu.user_id) || [];
  let userEmails: string[] = [];

  if (userIds.length > 0) {
    const { data: users, error: usersError } = await supabase
      .from('user_emails')
      .select('email')
      .in('email', userEmails);

    if (usersError) {
      console.error('Error fetching user emails:', usersError);
    } else {
      userEmails = users?.map((u: { email: string }) => u.email) || [];
    }
  }

  projectForm.value = {
    id: project.id,
    name: project.name,
    userEmails: userEmails
  };

  loadAssignedUsers(project.id)

  isEditMode.value = true;
  isAddMode.value = false;
}

function cancelEdit() {
  isEditMode.value = false;
  isAddMode.value = false;
}

// Add user email to the list
function addUserEmail() {
  emailError.value = '';
  const email = newUserEmail.value.trim();

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    emailError.value = 'Please enter an email address';
    return;
  }
  if (!emailRegex.test(email)) {
    emailError.value = 'Please enter a valid email address';
    return;
  }

  // Check for duplicates
  if (projectForm.value.userEmails.includes(email)) {
    emailError.value = 'This email has already been added';
    return;
  }

  projectForm.value.userEmails.push(email);
  newUserEmail.value = '';
}

// Remove user email from the list
function removeUserEmail(index: number) {
  projectForm.value.userEmails.splice(index, 1);
}

async function saveProject() {
  try {
    isSubmitting.value = true;
    errorMessage.value = '';
    emailError.value = '';

    let project: any;
    let invalidEmails: string[] = [];

    // 1. First get or create all users from emails to get their IDs
    const userIds: { email: string, id: string }[] = [];

    for (const email of projectForm.value.userEmails) {
      // Check if user with this email exists in user_emails
      const { data: userData, error: userError } = await supabase
        .from('user_emails')
        .select('id, email')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        invalidEmails.push(email);
        continue;
      }

      userIds.push({ email, id: userData.id });
    }

    // Show error if any invalid emails
    if (invalidEmails.length > 0) {
      const errorMsg = `The following emails were not found: ${invalidEmails.join(', ')}`;
      toast.error('Invalid Users', {
        description: errorMsg,
        duration: 5000
      });
    }

    if (isEditMode.value) {
      // 2. Update existing project
      project = await updateProject(projectForm.value.id, {
        name: projectForm.value.name
      });

      // 3. Update project in local array
      const index = projects.value.findIndex(p => p.id === project.id);
      if (index !== -1) {
        projects.value[index] = project;
      }

      // // 4. Handle user assignments - first remove all existing users
      // const { error: deleteError } = await supabase
      //   .from('project_has_users')
      //   .delete()
      //   .eq('project_id', project.id);

      // if (deleteError) {
      //   console.error('Error removing project users:', deleteError);
      //   throw new Error('Failed to update project users');
      // }
    } else {
      // Add new project
      project = await createProject({
        name: projectForm.value.name
      });

      // Add to local array
      projects.value.push(project);
      selectedProjectId.value = project.id;
    }

    // 5. Now add all the current users to the project
    if (userIds.length > 0) {
      const projectUsers = userIds.map((user: { id: string }) => ({
        project_id: project.id,
        user_id: user.id
      }));

      const { error: insertError } = await supabase
        .from('project_has_users')
        .insert(projectUsers);

      if (insertError) {
        console.error('Error adding project users:', insertError);
        throw new Error('Failed to add users to project');
      }
    }

    // 6. Remove users from project
    if (selectedRemovedUserIds.value.length > 0) {
      const { error: deleteError } = await supabase
        .from('project_has_users')
        .delete()
        .in('user_id', selectedRemovedUserIds.value);

      if (deleteError) {
        console.error('Error removing project users:', deleteError);
        throw new Error('Failed to remove users from project');
      }
    }

    // Reset form state
    isEditMode.value = false;
    isAddMode.value = false;

    // Show success toast
    toast.success('Success', {
      description: 'Project saved successfully',
      duration: 3000
    })
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to save project';
    toast.error('Error', {
      description: errorMessage.value,
      duration: 3000
    })
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

    // Show success toast
    toast.success('Success', {
      description: 'Project deleted successfully',
      duration: 3000
    })
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to delete project';
    toast.error('Error', {
      description: 'Failed to delete project. Please try again.',
      duration: 3000
    })
  } finally {
    isSubmitting.value = false;
  }
}

async function loadAssignedUsers(projectId: string) {
  try {
    loading.value = true;
    errorMessage.value = '';
    console.log("projectId", projectId);
    assignedUsers.value = await listAssignedUsers(projectId);

    console.log("assignedUsers", assignedUsers.value);

  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to load assigned users';
  } finally {
    loading.value = false;
  }
}

function removeUser(userId: string) {
  selectedRemovedUserIds.value.push(userId);

  // remove element with id = userId
  assignedUsers.value = assignedUsers.value.filter(user => user.id !== userId);

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

.save-button,
.primary-button {
  padding: 0.625rem 1rem;
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.save-button:hover,
.primary-button:hover {
  background-color: #4338ca;
}

.save-button:disabled,
.delete-button:disabled {
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

.selected-users {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.selected-user {
  display: flex;
  align-items: center;
  background-color: rgba(79, 70, 229, 0.2);
  border: 1px solid rgba(79, 70, 229, 0.4);
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.remove-user-btn {
  margin-left: 0.5rem;
  color: #ef4444;
  font-size: 1rem;
  font-weight: bold;
  background: none;
  border: none;
  cursor: pointer;
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

.loading-indicator,
.error-message {
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
