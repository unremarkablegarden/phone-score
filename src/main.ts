import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { router } from './router'
import { applySettings } from './composables/useSettings'

// Paint the right theme before the first frame.
applySettings()

createApp(App).use(router).mount('#app')
