import { createRouter, createWebHistory } from 'vue-router'
import SetupView from './views/SetupView.vue'
import { useScores } from './composables/useScores'
import { useToast } from './composables/useToast'
import { decodeScore } from './lib/transfer'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'setup', component: SetupView },
    { path: '/play', name: 'play', component: () => import('./views/PlayView.vue') },
    { path: '/settings', name: 'settings', component: () => import('./views/SettingsView.vue') },
    {
      // A shared score, e.g. /PS1NY1BCsJADEWv8sk6zE… — loaded, then swapped for /.
      // The pattern is narrow enough that nothing else can collide with it.
      path: '/:code(PS1[A-Za-z0-9_-]+)',
      name: 'share',
      component: SetupView, // never rendered; the guard always redirects
      beforeEnter: async (to) => {
        const { toast } = useToast()
        const imported = await decodeScore(String(to.params.code))
        if (imported) {
          useScores().draft.value = imported
          toast(`Opened “${imported.name || 'Untitled'}”`)
        } else {
          toast("That link isn't a score", 'error')
        }
        return '/'
      },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
