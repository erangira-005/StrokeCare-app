// Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import { useAuth } from '@/stores/auth'

type Role = 'prevention' | 'survivor' | 'caregiver' | 'clinician' | 'chw' | 'admin'
const PATIENT: Role[] = ['prevention', 'survivor']
const MEMBERS: Role[] = ['caregiver', 'clinician', 'chw']

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    roles?: Role[]
  }
}

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: () => '/welcome' },
  { path: '/welcome', component: () => import('@/views/shared/Welcome.vue'), meta: { public: true } },
  { path: '/login', component: () => import('@/views/auth/Login.vue'), meta: { public: true } },
  { path: '/register', component: () => import('@/views/auth/Register.vue'), meta: { public: true } },
  { path: '/emergency', component: () => import('@/views/shared/Emergency.vue'), meta: { public: true } },
  { path: '/talk', component: () => import('@/views/shared/TalkBoard.vue'), meta: { public: true } },
  { path: '/learn', component: () => import('@/views/shared/Learn.vue'), meta: { public: true } },
  { path: '/learn/:slug', component: () => import('@/views/shared/LearnItem.vue'), meta: { public: true } },
  { path: '/consent', component: () => import('@/views/auth/Consent.vue') },
  { path: '/today', component: () => import('@/views/patient/Today.vue'), meta: { roles: PATIENT } },
  { path: '/p/:ref/checkin', component: () => import('@/views/patient/CheckIn.vue') },
  { path: '/p/:ref/bp', component: () => import('@/views/patient/BloodPressure.vue') },
  { path: '/p/:ref/medicines', component: () => import('@/views/patient/Medicines.vue') },
  { path: '/p/:ref/visit', component: () => import('@/views/patient/VisitPrep.vue') },
  { path: '/p/:ref/calendar', component: () => import('@/views/care/Calendar.vue') },
  { path: '/p/:ref/messages', component: () => import('@/views/shared/Thread.vue') },
  { path: '/p/:ref/summary', component: () => import('@/views/clinician/Summary.vue') },
  { path: '/p/:ref/home-visit', component: () => import('@/views/chw/HomeVisit.vue'), meta: { roles: ['chw'] } },
  { path: '/care', component: () => import('@/views/care/CaregiverHome.vue'), meta: { roles: ['caregiver'] } },
  { path: '/caseload', component: () => import('@/views/clinician/Caseload.vue'), meta: { roles: ['clinician'] } },
  { path: '/templates', component: () => import('@/views/clinician/Templates.vue'), meta: { roles: ['clinician'] } },
  { path: '/chw', component: () => import('@/views/chw/ChwHome.vue'), meta: { roles: ['chw'] } },
  { path: '/inbox', component: () => import('@/views/shared/Inbox.vue'), meta: { roles: [...PATIENT, ...MEMBERS] } },
  { path: '/sharing', component: () => import('@/views/shared/Sharing.vue') },
  { path: '/settings', component: () => import('@/views/shared/Settings.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const auth = useAuth()
  if (!auth.ready) await auth.load()
  if (to.path === '/' || to.path === '/welcome') return auth.signedIn ? auth.home : true
  if (to.meta.public) return true
  if (!auth.signedIn) return { path: '/login', query: { next: to.fullPath } }
  if (auth.needsConsent && to.path !== '/consent' && to.path !== '/settings') return '/consent'
  if (to.meta.roles && !to.meta.roles.includes(auth.role as Role)) return auth.home
  return true
})
