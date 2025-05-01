<template>
  <div class="dialog-overlay" @click.self="$emit('close')">
    <div class="dialog-content">
      <div class="dialog-header">
        <h2 class="dialog-title">Edit Profile</h2>
        <button class="close-button" @click="$emit('close')">&times;</button>
      </div>
      
      <div class="dialog-body">
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="username">Username</label>
            <input 
              type="text" 
              id="username" 
              v-model="formData.username" 
              required
              class="form-input"
            />
            
          </div>
          
          <div class="form-group">
            <label for="avatarUrl">Avatar URL</label>
            <input 
              type="text" 
              id="avatarUrl" 
              v-model="formData.avatar_url" 
              class="form-input"
            />
            <div class="avatar-preview" v-if="formData.avatar_url">
              <img :src="formData.avatar_url" alt="Avatar preview" />
            </div>
          </div>
          
          <div class="password-section">
            <h3>Change Password</h3>
            <div class="form-group">
              <label for="password">New Password</label>
              <input 
                type="password" 
                id="password" 
                v-model="formData.password" 
                class="form-input"
              />
            </div>
            
            <div class="form-group">
              <label for="confirmPassword">Confirm Password</label>
              <input 
                type="password" 
                id="confirmPassword" 
                v-model="formData.confirmPassword" 
                class="form-input"
              />
            </div>
          </div>
          
          <div class="error-message" v-if="errorMessage">{{ errorMessage }}</div>
          
          <div class="dialog-actions">
            <button type="button" class="cancel-button" @click="$emit('close')">Cancel</button>
            <button type="submit" class="save-button" :disabled="isSubmitting">
              {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue';
import { updateUserProfile, updatePassword, type UserProfile } from '../../services/authService';

const props = defineProps<{
  user: UserProfile | null;
}>();

const emit = defineEmits(['close', 'update']);

// Form data
const formData = ref({
  username: props.user?.username || '',
  avatar_url: props.user?.avatar_url || '',
  password: '',
  confirmPassword: ''
});

const errorMessage = ref('');
const isSubmitting = ref(false);

// Submit form handler
const handleSubmit = async () => {
  try {
    errorMessage.value = '';
    isSubmitting.value = true;
    
    // Validate passwords if trying to change it
    if (formData.value.password) {
      if (formData.value.password.length < 6) {
        errorMessage.value = 'Password must be at least 6 characters';
        isSubmitting.value = false;
        return;
      }
      
      if (formData.value.password !== formData.value.confirmPassword) {
        errorMessage.value = 'Passwords do not match';
        isSubmitting.value = false;
        return;
      }
    }
    
    if (!props.user) {
      errorMessage.value = 'User data not found';
      isSubmitting.value = false;
      return;
    }
    
    // Update profile data
    const profileUpdates = {
      username: formData.value.username,
      avatar_url: formData.value.avatar_url
    };
    
    const updatedProfile = await updateUserProfile(props.user.id, profileUpdates);
    
    // Update password if provided
    if (formData.value.password) {
      await updatePassword(formData.value.password);
    }
    
    // Emit update event with updated profile
    emit('update', updatedProfile);
    emit('close');
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to update profile';
  } finally {
    isSubmitting.value = false;
  }
};
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

.avatar-preview {
  margin-top: 0.75rem;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #e5e7eb;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.password-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.password-section h3 {
  font-size: 1.125rem;
  margin-top: 0;
  margin-bottom: 1rem;
  color: #111827;
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

.save-button:disabled {
  background-color: #a5a5a5;
  cursor: not-allowed;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
</style>
