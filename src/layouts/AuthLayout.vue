<template>
  <div class="layout-container">
    <header class="navbar">
      <div class="navbar-brand">
        <router-link to="/" class="logo">Kanban Board</router-link>
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
          <div class="dropdown-item" @click="handleLogout">
            <i class="fas fa-sign-out-alt"></i> Logout
          </div>
        </div>
      </div>
    </header>
    
    <main>
      <slot></slot>
    </main>
    
    <!-- Profile Edit Dialog -->
    <ProfileDialog
      v-if="showProfileDialog" 
      :user="userProfile"
      @close="showProfileDialog = false"
      @update="handleProfileUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { getCurrentUser, getUserProfile, logoutUser, type UserProfile } from '../../services/authService';
import ProfileDialog from '@/components/ProfileDialog.vue';

// Component state
const router = useRouter();
const currentUser = ref<any>(null);
const userProfile = ref<UserProfile | null>(null);
const showDropdown = ref(false);
const showProfileDialog = ref(false);

// Load user data on component mount
onMounted(async () => {
  try {
    const user = await getCurrentUser();
    if (user) {
      currentUser.value = user;
      userProfile.value = await getUserProfile(user.id);
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
  
  // Add click outside listener
  document.addEventListener('click', handleClickOutside);
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
  try {
    await logoutUser();
    router.push('/login');
  } catch (error) {
    console.error('Error logging out:', error);
  }
};

// Handle profile update
const handleProfileUpdate = async (updatedProfile: UserProfile) => {
  userProfile.value = updatedProfile;
};
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
  padding: 0.75rem 1.5rem;
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

.navbar-user {
  position: relative;
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
