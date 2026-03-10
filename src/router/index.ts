import { createRouter, createWebHistory } from 'vue-router'
import Chat from '../views/Chat.vue'
import Agent from '../views/Agent.vue'
import UsageRecords from '../views/UsageRecords.vue'
import Images from '../views/Images.vue'

const routes = [
  { path: '/', name: 'Chat', component: Chat },
  { path: '/agent', name: 'Agent', component: Agent },
  { path: '/usage-records', name: 'UsageRecords', component: UsageRecords },
  { path: '/images', name: 'Images', component: Images }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
