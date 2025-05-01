<template>
  <div class="w-full h-screen overflow-hidden bg-auth">
    <div class="w-full h-screen bg-black/40">
      <div class="register-container">
        <div class="glass-card">
          <h1 class="title">Create an Account</h1>
          <form @submit.prevent="handleRegister" class="register-form">
            <div class="form-group">
              <label for="username">Username</label>
              <input type="text" id="username" v-model="username" required placeholder="Enter a username"
                class="form-input" />
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" v-model="email" required placeholder="Enter your email"
                class="form-input" />
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" v-model="password" required placeholder="Enter a password"
                class="form-input" />
            </div>
            <div class="form-group">
              <label for="confirmPassword">Confirm Password</label>
              <input type="password" id="confirmPassword" v-model="confirmPassword" required
                placeholder="Confirm your password" class="form-input" />
            </div>
            <div class="error-message" v-if="errorMessage">{{ errorMessage }}</div>
            <button type="submit" class="submit-btn" :disabled="isLoading">
              {{ isLoading ? 'Creating account...' : 'Register' }}
            </button> 
            <div class="auth-link">
              Already have an account?
              <router-link to="/login">
                <span class="underline">Login here</span>
              </router-link>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { registerUser } from '../../services/authService';
import { toast } from 'vue-sonner';

const router = useRouter();
const username = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const handleRegister = async () => {
  try {
    errorMessage.value = '';

    // Validate passwords match
    if (password.value !== confirmPassword.value) {
      errorMessage.value = 'Passwords do not match';
      return;
    }

    // Validate password length
    if (password.value.length < 6) {
      errorMessage.value = 'Password must be at least 6 characters';
      return;
    }

    isLoading.value = true;
    await registerUser(email.value, password.value, username.value);
    router.push('/');

    // Show success toast
    toast.success('Success', {
      description: 'Account created successfully',
      duration: 3000
    })
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to register. Please try again.';

    // Show error toast
    toast.error('Error', {
      description: 'Failed to register. Please try again.',
      duration: 3000
    })
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  font-size: 1rem;
}

.submit-btn {
  padding: 0.75rem 1rem;
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 0.25rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-btn:hover {
  background-color: #4338ca;
}

.submit-btn:disabled {
  background-color: #a5a5a5;
  cursor: not-allowed;
}

.login-link a {
  color: #4f46e5;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
</style>
