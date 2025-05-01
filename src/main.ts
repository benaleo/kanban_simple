import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import moment from 'moment-timezone'
import Vue3Lottie from 'vue3-lottie'



moment.tz.setDefault('Asia/Jakarta')

const app = createApp(App)

app.use(router)

app.use(Vue3Lottie)

app.mount('#app')
