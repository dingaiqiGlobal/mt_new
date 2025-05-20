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
        zoom: 12,
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
      const sceneConfig = {
        environment: {
          enable: false, // 是否开启环境天空盒绘制
          mode: 1, // 天空盒模式： 0: 氛围模式， 1: 实景模式
          level: 0, // 实景模式下的模糊级别，0-3
          brightness: 1, // 天空盒的明亮度，-1 - 1， 默认为0
        },
        shadow: {
          type: "esm", // 阴影模式，固定为esm
          enable: true, // 是否开启
          quality: "high", // 阴影质量，可选的值：high, medium, low
          opacity: 1, // 阴影的透明度，0 - 1
          color: [0, 0, 0], // 阴影的颜色，归一化三位rgb颜色值
          blurOffset: 1, // 阴影模糊偏移量，值越高阴影越模糊
        },
        ground: {
          enable: false, // 是否开启地面绘制
          renderPlugin: {
            // 地面的绘制插件，取值范围 lit 或者 fill
            type: "fill",
          },
          symbol: {
            polygonFill: [
              0.803921568627451, 0.803921568627451, 0.803921568627451, 1,
            ],
            polygonOpacity: 1,
          },
        },
        postProcess: {
          enable: true, // 是否开启后处理
          antialias: {
            enable: false, // 是否开启FXAA后处理
            taa: true, // 是否开启taa后处理
          },
          ssr: {
            enable: false, // 是否开启屏幕空间反射
          },
          ssao: {
            enable: false, // 是否开启屏幕空间环境光遮蔽
            bias: 0.03, // 阴影偏移值，越大，阴影就越清晰，0.05 - 1
            radius: 0.08, // 遮蔽半径，越大，阴影就越清晰， 0.05 - 1
            intensity: 1.5, // 强度因子， 0.1 - 5
          },
          sharpen: {
            enable: false, // 是否开启锐化
            factor: 0.2, // 强度因子，0 - 1
          },
          bloom: {
            enable: false, // 是否开启泛光
            factor: 1, // 强度因子 0.1 - 5
            threshold: 0, // 最小阈值（亮度低于阈值的区域不发光） 0 - 1
            radius: 1, // 泛光半径 0.1 - 4
          },
          outline: {
            enable: false, // 是否开启高亮后处理
          },
        },
        //天气
        weather: {
          enable: true,
          fog: {
            enable: true,
            start: 0.1,
            end: 26,
            color: [0.9, 0.9, 0.9],
          },
          // rain: {
          //   enable: true,
          //   windDirectionX: 0, //沿 X 轴风向（度）
          //   windDirectionY: 0, //沿 Y轴风向（度）
          //   rippleRadius: 11, //雨滴落下的水花半径
          //   rainWidth: 1, //雨滴宽度
          //   rainHeight: 1, //雨滴高度
          //   speed: 1, //速度
          //   density: 2000, //雨滴密度
          //   rainTexture: require("@/assets/hdr/rain1.png"), //雨滴材质
          // },
          // snow: {
          //   enable: true,
          //   snowGroundTexture: require("@/assets/hdr/perlin.png"), //雪花材质
          // },
        },
      };
      this.groupLayer = new maptalks.GroupGLLayer("group", [], { sceneConfig });
      this.groupLayer.addTo(this.map);
    },
  
    methods: {},
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
  