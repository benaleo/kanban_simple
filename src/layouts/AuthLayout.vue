<template>
  <div class="layout-container text-black">
    <header class="navbar">
      <div class="navbar-brand" v-if="!isMobile">
        <router-link to="/" class="logo">Kanban Board</router-link>
      </div>
      <div class="project-selector" v-if="currentUser && userProfile">
        <div class="current-project" @click="openProjectDialog">
          <span class="project-name">{{ currentProject ? currentProject.name : 'Select Project' }}</span>
          <button class="select-project-btn">
            <font-awesome-icon icon="chevron-down" />
          </button>
        </div>
      </div>
      <div class="navbar-user" v-if="currentUser && userProfile">
        <div class="user-info" @click="toggleDropdown">
          <div class="avatar" v-if="userProfile.avatar_url">
            <img :src="userProfile.avatar_url" alt="User avatar" />
          </div>
          <div class="avatar" v-else>
            {{ userProfile.username.charAt(0).toUpperCase() }}
          </div>
          <span class="username">{{ userProfile.username }}</span>
        </div>

        <div class="dropdown" v-if="showDropdown">
          <div class="dropdown-item" @click="openProfileDialog">
            <i class="fas fa-user"></i> Edit Profile
          </div>
          <div class="dropdown-item" @click="openLogoutDialog">
            <i class="fas fa-sign-out-alt"></i> Logout
          </div>
        </div>
      </div>
    </header>

    <main>
      <slot></slot>
    </main>

    <!-- Profile Edit Dialog -->
    <ProfileDialog v-if="showProfileDialog" :user="userProfile" @close="showProfileDialog = false"
      @update="handleProfileUpdate" />

    <!-- Project Selection Dialog -->
    <ProjectDialog v-if="showProjectDialog" @close="showProjectDialog = false" @select="handleProjectSelect" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getCurrentUser, getUserProfile, logoutUser, type UserProfile } from '../../services/authService';
import { getProjectById } from '../../services/projectService';
import ProfileDialog from '@/components/ProfileDialog.vue';
import ProjectDialog from '@/components/ProjectDialog.vue';

// Component state
const router = useRouter();
const route = useRoute();
const currentUser = ref<any>(null);
const userProfile = ref<UserProfile | null>(null);
const showDropdown = ref(false);
const showProfileDialog = ref(false);
const showProjectDialog = ref(false);
const currentProject = ref<any>(null);
const showLogoutDialog = ref(false);

// Load user data on component mount
onMounted(async () => {
  try {
    const user = await getCurrentUser();
    if (user) {
      currentUser.value = user;
      userProfile.value = await getUserProfile(user.id);

      // Load current project if ID is in URL
      await loadCurrentProject();
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }

  // Add click outside listener
  document.addEventListener('click', handleClickOutside);
});

// Watch for changes in route to update current project
watch(() => route.query.id, async () => {
  await loadCurrentProject();
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Handle dropdown toggle
const toggleDropdown = (e: Event) => {
  e.stopPropagation();
  showDropdown.value = !showDropdown.value;
};

// Close dropdown when clicking outside
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.navbar-user')) {
    showDropdown.value = false;
  }
};

// Open profile edit dialog
const openProfileDialog = () => {
  showDropdown.value = false;
  showProfileDialog.value = true;
};

// Handle user logout
const handleLogout = async () => {
  showLogoutDialog.value = true;
};

// Handle logout confirmation
const openLogoutDialog = () => {
  showLogoutDialog.value = true;
  showDropdown.value = false;
};

// Handle profile update
const handleProfileUpdate = async (updatedProfile: UserProfile) => {
  userProfile.value = updatedProfile;
};

// Load current project from route query param
const loadCurrentProject = async () => {
  try {
    const projectId = route.query.id as string;
    if (projectId) {
      currentProject.value = await getProjectById(projectId);
    } else {
      currentProject.value = null;
    }
  } catch (error) {
    console.error('Error loading project:', error);
    currentProject.value = null;
  }
};

// Open project selection dialog
const openProjectDialog = () => {
  showProjectDialog.value = true;
};

// Handle project selection
const handleProjectSelect = (project: any) => {
  // Navigate to the same route but with project ID in query
  router.push({ query: { id: project.id } });
  showProjectDialog.value = false;
};

const isMobile = ref(false);

onMounted(() => {
  isMobile.value = window.innerWidth < 768;
});

</script>

<style scoped>
.layout-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1.5rem;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.navbar-brand {
  display: flex;
  align-items: center;
}

.logo {
  font-size: 1.25rem;
  font-weight: 600;
  color: #4f46e5;
  text-decoration: none;
}

.navbar-user,
.project-selector {
  position: relative;
}

.project-selector {
  display: flex;
  align-items: center;
}

.current-project {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: #f3f4f6;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.current-project:hover {
  background-color: #e5e7eb;
}

.project-name {
  font-weight: 500;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-project-btn {
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
  font-size: 0.75rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
}

.user-info:hover {
  background-color: #f3f4f6;
}

.avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: #4f46e5;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.username {
  font-weight: 500;
}

.dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 10;
  min-width: 200px;
  background-color: white;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
  margin-top: 0.5rem;
  overflow: hidden;
}

.dropdown-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background-color: #f3f4f6;
}

main {
  flex: 1;
}
</style>
