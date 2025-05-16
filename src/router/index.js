import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'maptalks_new',
    component: () => import("../components/maptalks_new.vue")
  },
  {
    path: "/h_videoMask",
    name: "h_videoMask",
    component: () => import("../components/height/h_videoMash.vue"),
  },
]

const router = new VueRouter({
  routes
})

export default router
