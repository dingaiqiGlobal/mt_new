<template>
  <div>
    <div id="map" class="container"></div>
    <div class="control"></div>
  </div>
</template>

<script>
import * as dat from "dat.gui";
import "maptalks/dist/maptalks.css";
import * as maptalks from "maptalks-gl";
import * as THREE from "three";
import { ThreeLayer } from "maptalks.three";

export default {
  components: {},

  data() {
    return {
      map: null,
      groupLayer: null,
    };
  },

  computed: {},

  mounted() {
    this.map = new maptalks.Map("map", {
      center: [116.39259, 39.90473],
      zoom: 16,
      pitch: 60,
      bearing: -25,
      spatialReference: {
        projection: "EPSG:3857",
      },
      baseLayer: new maptalks.TileLayer("tile", {
        urlTemplate:
          "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      }),
      layers: [],
    });

    /**
     * groupLayer
     */
    const sceneConfig = {};
    this.groupLayer = new maptalks.GroupGLLayer("group", [], { sceneConfig });
    this.groupLayer.addTo(this.map);
    this.addGltfLayer();

    /**
     * vectorLayer
     */
    this.addVectorLayer();
    this.addVectorLayer2();

    /**
     * 排序
     */
    this.sortLayer()
  },

  methods: {
    addVectorLayer() {
      const layer = new maptalks.VectorLayer("vector1").addTo(this.map);
      const point = new maptalks.Marker([116.39122, 39.90734], {
        id: "marker1",
        properties: {
          name: "天安门",
        },
        symbol: {
          markerFile: "images/icon_Red.png",
          markerWidth: 20,
          markerHeight: 25,
          textName: "{name}",
          textDy: -50,
        },
      });
      point.addTo(layer);
    },
    addVectorLayer2() {
      const layer = new maptalks.VectorLayer("vector2").addTo(this.map);
      const point = new maptalks.Marker([116.392210,39.907120], {
        id: "marker2",
        properties: {
          name: "人民",
        },
        symbol: {
          markerFile: "images/icon_Red.png",
          markerWidth: 20,
          markerHeight: 25,
          textName: "{name}",
          textDy: -50,
        },
      });
      point.addTo(layer);
    },
    addGltfLayer() {
      const gltfLayer = new maptalks.GLTFLayer("gltf").addTo(this.groupLayer);
      const gltfMarker = new maptalks.GLTFMarker([116.39126, 39.90681], {
        symbol: {
          url: "data/gltf/CesiumDrone.glb",
          modelHeight: 24,
          scaleX: 1,
          scaleY: 1,
          scaleZ: 1,
          rotationZ: 180,
        },
      });
      gltfLayer.addGeometry(gltfMarker);
    },
    sortLayer(){
        const layers=this.map.getLayers();
        const vectorLayer = layers.filter(layer => layer instanceof maptalks.VectorLayer);
        const otherLayers = layers.filter(layer => !(layer instanceof maptalks.VectorLayer));
        this.map.sortLayers([...vectorLayer,...otherLayers]);
    }
  },
};
</script>
<style>
.control {
  position: absolute;
  z-index: 999;
  left: 10px;
  top: 10px;
}
</style>
