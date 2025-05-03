<template>
<div class="w-full h-screen overflow-hidden bg-auth">
  <div class="w-full h-screen bg-black/40">
    <div class="login-container">
    <div class="glass-card">
      <h1 class="title">Login to Kanban</h1>
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            v-model="email"
            required
            placeholder="Enter your email"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input
            type="password"
            id="password"
            v-model="password"
            required
            placeholder="Enter your password"
            class="form-input"
          />
        </div>
        <div class="error-message" v-if="errorMessage">{{ errorMessage }}</div>
        <button type="submit" class="submit-btn" :disabled="isLoading">
          {{ isLoading ? 'Logging in...' : 'Login' }}
        </button>
        <div class="auth-link">
          Don't have an account?
          <router-link to="/register">
            <span class="underline">Register here</span>
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
import { getCurrentUser, getUserProfile, loginUser } from '../../services/authService';
import { toast } from 'vue-sonner';

document.title = "Login Kanban"

const router = useRouter();
const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);
const name = ref('');

const handleLogin = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    
    await loginUser(email.value, password.value);
    router.push('/');

    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not found');
    }
    name.value = (await getUserProfile(user.id)).username;

    toast.success("Login successful", {
      duration: 5000,
      description: "Welcome back! " + name.value
    });

  } catch (error: any) {
    toast.error("Failed Login", {
      duration: 5000,
      description: "Failed to login. Please try again."
    });
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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

.register-link {
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.register-link a {
  color: #4f46e5;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
</style>
