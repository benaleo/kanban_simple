import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import moment from 'moment-timezone'
import Vue3Lottie from 'vue3-lottie'

/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core'

/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

/* import specific icons */
import { faTrash, faEdit, faTableColumns, faChevronDown } from '@fortawesome/free-solid-svg-icons'

/* add icons to the library */
library.add(faTrash, faEdit, faTableColumns, faChevronDown)

moment.tz.setDefault('Asia/Jakarta')

const app = createApp(App)

app.component('font-awesome-icon', FontAwesomeIcon)

app.use(router)

app.use(Vue3Lottie)

app.mount('#app')
