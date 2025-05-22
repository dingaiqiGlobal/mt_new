import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: "/",
    name: "maptalks_new",
    component: () => import("../components/maptalks_new.vue"),
  },
  {
    path: "/h_videoMask",
    name: "h_videoMask",
    component: () => import("../components/height/h_videoMash.vue"),
  },
  {
    path: "/h_videoMashGltf",
    name: "h_videoMashGltf",
    component: () => import("../components/height/h_videoMashGltf.vue"),
  },
  {
    path: "/three_buildingScanning",
    name: "three_buildingScanning",
    component: () => import("../components/three/three_buildingScanning.vue"),
  },
  {
    path: "/layer_sort",
    name: "layer_sort",
    component: () => import("../components/layer/layer_sort.vue"),
  },
];

const router = new VueRouter({
  routes
})

export default router
