import { createRouter, createWebHistory } from 'vue-router'
import { getSession } from '../../services/authService'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/kanban-page.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/login-view.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/register-view.vue'),
      meta: { guestOnly: true }
    },
    {
      // Catch all route - redirect to login
      path: '/:pathMatch(.*)*',
      redirect: '/login'
    }
  ],
})

// Navigation guard for auth routes
router.beforeEach(async (to, from, next) => {
  // Check if the route requires authentication
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const guestOnly = to.matched.some(record => record.meta.guestOnly)
  
  // Get current session
  const session = await getSession()
  const isAuthenticated = !!session

  if (requiresAuth && !isAuthenticated) {
    // If route requires auth but user is not authenticated, redirect to login
    next('/login')
  } else if (guestOnly && isAuthenticated) {
    // If route is for guests only but user is authenticated, redirect to home
    next('/')
  } else {
    // Otherwise proceed as normal
    next()
  }
})

export default router
