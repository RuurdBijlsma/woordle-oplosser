// Composables
import {createRouter, createWebHistory} from 'vue-router'

const routes = [
  {
    path: '',
    name: 'Home',
    component: () => import(/* webpackChunkName: "home" */ '@/views/Home.vue'),
  },
]

const router = createRouter({
  history: createWebHistory('/woordle-oplosser/'),
  routes,
})

export default router
