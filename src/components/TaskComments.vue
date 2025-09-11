<template>
  <div class="mt-4 flex flex-col gap-3">
    <div
      v-for="c in comments"
      :key="c.id"
      class="flex"
      :class="c.from_id === currentUserId ? 'justify-end' : 'justify-start'"
    >
      <div
        class="relative group max-w-[80%] w-fit bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 shadow-md flex gap-3"
      >
        <!-- Avatar -->
        <img
          v-if="c.profile?.avatar_url"
          :src="c.profile.avatar_url"
          alt="avatar"
          class="h-8 w-8 rounded-full object-cover mt-0.5"
        />
        <div v-else class="h-8 w-8 rounded-full bg-purple-600/60 flex items-center justify-center text-white font-semibold mt-0.5">
          {{ (c.profile?.username || 'U').charAt(0).toUpperCase() }}
        </div>

        <!-- Content -->
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-white">{{ c.profile?.username || 'Unknown' }}</span>
            <span class="text-[10px] text-white/70">• {{ formatTime(c.created_at) }}</span>
          </div>
          <div class="text-white/90 text-sm whitespace-pre-wrap" v-html="escapeHtml(c.message)"></div>
        </div>

        <!-- Hover Delete (only for own comments) -->
        <button
          v-if="c.from_id === currentUserId"
          @click.stop="onDelete(c.id)"
          class="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 text-white rounded-full h-7 w-7 flex items-center justify-center shadow-lg"
          title="Delete"
        >
          <font-awesome-icon icon="trash" class="text-xs" />
        </button>
      </div>
    </div>

    <!-- Optional: input composer (not requested, but useful) -->
    <div v-if="showComposer" class="flex items-center gap-2 mt-1">
      <input
        v-model="newMessage"
        type="text"
        placeholder="Write a comment..."
        class="flex-1 bg-white/10 text-white placeholder-white/60 border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        @keyup.enter="submit"
      />
      <button
        @click="submit"
        class="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
      >
        Send
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import moment from 'moment-timezone'
import { getCurrentUser, getUserProfile, type UserProfile } from '../../services/authService'
import { getCommentsByTask, deleteComment, addComment, type TaskComment } from '../../services/commentService'

const props = defineProps<{
  taskId: string
  showComposer?: boolean
}>()

const comments = ref<TaskComment[]>([])
const currentUserId = ref<string>('')
const loading = ref(false)
const newMessage = ref('')
const currentUserProfile = ref<UserProfile | null>(null)
const emit = defineEmits<{
  (e: 'changed', delta: number): void
}>()

const loadComments = async () => {
  if (!props.taskId) return
  loading.value = true
  try {
    comments.value = await getCommentsByTask(props.taskId)
  } finally {
    loading.value = false
  }
}

const onDelete = async (id: string) => {
  await deleteComment(id)
  comments.value = comments.value.filter((c: TaskComment) => c.id !== id)
  emit('changed', -1)
}

const submit = async () => {
  if (!props.taskId || !newMessage.value.trim() || !currentUserId.value) return
  const c = await addComment(props.taskId, newMessage.value.trim(), currentUserId.value)
  comments.value.push({
    ...c,
    profile: currentUserProfile.value
      ? {
          username: currentUserProfile.value.username,
          avatar_url: currentUserProfile.value.avatar_url,
          user_id: currentUserId.value,
        }
      : undefined,
  })
  newMessage.value = ''
  emit('changed', +1)
}

const formatTime = (date: string | Date) => {
  return moment(date).fromNow()
}

// Prevent XSS for plain text messages
const escapeHtml = (str: string) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

onMounted(async () => {
  const user = await getCurrentUser()
  currentUserId.value = user?.id || ''
  if (currentUserId.value) {
    try {
      currentUserProfile.value = await getUserProfile(currentUserId.value)
    } catch {}
  }
  await loadComments()
})

watch(() => props.taskId, async () => {
  await loadComments()
})
</script>

<style scoped>
</style>
