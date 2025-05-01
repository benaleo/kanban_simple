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
            <label for="avatarUpload">Profile Image</label>
            <div 
              class="drop-zone" 
              @dragover.prevent="dragOver = true" 
              @dragleave.prevent="dragOver = false"
              @drop.prevent="handleDrop($event)"
              :class="{ 'drop-zone-active': dragOver }"
            >
              <div v-if="!formData.avatar_url && !isUploading" class="drop-message">
                <i class="material-icons">cloud_upload</i>
                <p>Drag & drop an image here or click to browse</p>
                <input 
                  type="file" 
                  id="avatarUpload" 
                  @change="handleFileSelect"
                  accept="image/*"
                  class="file-input"
                  ref="fileInput"
                />
                <button type="button" class="browse-button" @click="triggerFileInput">Browse Files</button>
              </div>
              <div v-else-if="isUploading" class="upload-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: `${uploadProgress}%` }"></div>
                </div>
                <span>Uploading {{ uploadProgress }}%</span>
              </div>
              <div v-else class="avatar-preview-container relative">
                <div class="avatar-preview">
                  <img :src="formData.avatar_url" alt="Avatar preview" />
                </div>
                <div class="avatar-controls">
                  <button type="button" class="remove-avatar-button absolute top-0 right-2" @click="removeAvatar">Remove</button>
                </div>
              </div>
            </div>
            <div v-if="uploadError" class="error-message">{{ uploadError }}</div>
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
import { ref, defineProps, defineEmits, onMounted, computed } from 'vue';
import { updateUserProfile, updatePassword, type UserProfile, getCurrentUser, getUserProfile } from '../../services/authService';
import { useImageUpload } from '../composables/useImageUpload';
import type { User } from '@supabase/supabase-js';

const currentUser = ref<User | null>(null);
const userProfile = ref<UserProfile | null>(null);

// Function to trigger file input click
const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

// Handle file selection from input
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    await uploadAvatarImage(target.files[0]);
  }
};

// Handle file drop
const handleDrop = async (event: DragEvent) => {
  dragOver.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    await uploadAvatarImage(event.dataTransfer.files[0]);
  }
};

// Upload avatar image to Supabase storage
const uploadAvatarImage = async (file: File) => {
  try {
    // Check if the bucket exists before attempting upload
    const bucketExists = await checkBucketExists();
    if (!bucketExists) {
      throw new Error('Storage bucket does not exist or you do not have access. Please contact the administrator.');
    }
    
    // Upload the image and get the URL
    const imageUrl = await uploadImage(file);
    
    // Update form data with the new URL
    formData.value.avatar_url = imageUrl;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    errorMessage.value = error.message || 'Failed to upload image';
  }
};

// Remove avatar and delete image from Supabase storage
const removeAvatar = async () => {
  if (formData.value.avatar_url) {
    try {
      // Extract the path after the bucket domain
      // Example: https://<project>.supabase.co/storage/v1/object/public/kanban-images/filename.png
      const url = formData.value.avatar_url;
      const match = url.match(/\/kanban-images\/(.*)$/);
      if (match && match[1]) {
        const filePath = `kanban-images/${match[1]}`;
        console.log("file path", filePath);
        await deleteImage(filePath);
      }
    } catch (error) {
      console.error('Failed to delete image from storage:', error);
    }
  }
  formData.value.avatar_url = '';
};

onMounted(async () => {
  try {
    // Get current user
    currentUser.value = await getCurrentUser();
    console.log("current user", currentUser.value?.id);
    
    if (currentUser.value) {
      // Get user profile
      userProfile.value = await getUserProfile(currentUser.value.id);
      console.log("user profile", userProfile.value);
      
      if (userProfile.value) {
        // Initialize form data with the loaded profile (update fields individually for reactivity)
        formData.value.username = userProfile.value.username || '';
        formData.value.avatar_url = userProfile.value.avatar_url || '';
        formData.value.password = '';
        formData.value.confirmPassword = '';
      }
    }
  } catch (error) {
    console.error('Error loading user profile:', error);
    errorMessage.value = 'Failed to load user profile';
  }
});

// Removed user prop as we're loading the profile directly in onMounted
defineProps<{}>();

const emit = defineEmits(['close', 'update']);

// Use the image upload composable
const { isUploading, uploadError, uploadProgress, uploadImage, deleteImage, checkBucketExists } = useImageUpload();

// Form data - initialized with default empty values
const formData = ref({
  username: '',
  avatar_url: '',
  password: '',
  confirmPassword: ''
});
console.log("form data", formData.value);
console.log("userProfile");
// Drag and drop state
const dragOver = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

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
    
    if (!userProfile.value) {
      errorMessage.value = 'User data not found';
      isSubmitting.value = false;
      return;
    }
    
    // Update profile data
    const profileUpdates = {
      username: formData.value.username,
      avatar_url: formData.value.avatar_url
    };
    
    // Use the correct id field from the profile for the update
    const updatedProfile = await updateUserProfile(userProfile.value.id, profileUpdates);
    
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

.drop-zone {
  border: 2px dashed #d1d5db;
  border-radius: 0.5rem;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s ease;
  background-color: #f9fafb;
  cursor: pointer;
  margin-bottom: 1rem;
}

.drop-zone-active {
  border-color: #4f46e5;
  background-color: rgba(79, 70, 229, 0.1);
}

.drop-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #6b7280;
}

.drop-message i {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: #9ca3af;
}

.drop-message p {
  margin: 0.5rem 0;
  font-size: 0.875rem;
}

.file-input {
  display: none;
}

.browse-button {
  padding: 0.5rem 1rem;
  background-color: #f3f4f6;
  color: #4b5563;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  margin-top: 0.75rem;
  transition: all 0.2s ease;
}

.browse-button:hover {
  background-color: #e5e7eb;
}

.upload-progress {
  padding: 1rem;
}

.progress-bar {
  height: 0.5rem;
  background-color: #e5e7eb;
  border-radius: 0.25rem;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background-color: #4f46e5;
  transition: width 0.3s ease;
}

.avatar-preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-preview {
  margin: 0.75rem 0;
  max-width: 200px;
  max-height: 200px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #e5e7eb;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-controls {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.change-avatar-button,
.remove-avatar-button {
  padding: 0.4rem 0.75rem;
  font-size: 0.75rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.change-avatar-button {
  background-color: #f3f4f6;
  color: #4b5563;
  border: 1px solid #d1d5db;
}

.change-avatar-button:hover {
  background-color: #e5e7eb;
}

.remove-avatar-button {
  background-color: #fee2e2;
  color: #ef4444;
  border: 1px solid #fecaca;
}

.remove-avatar-button:hover {
  background-color: #fecaca;
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
