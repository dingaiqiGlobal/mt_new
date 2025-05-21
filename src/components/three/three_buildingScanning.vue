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
      GeoJSONLayer: null,

      threeLayer: null,
      material: null,
      time: {
        value: 0,
      },
      StartTime: {
        value: 0,
      },
      clock: new THREE.Clock(),
      isStart: true,
    };
  },

  computed: {},

  mounted() {
    this.map = new maptalks.Map("map", {
      center: [116.390190,39.917900],
      zoom: 18,
      pitch: 90,
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
        enable: false,
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

    /**
     * threeLayer
     */
    this.threeLayer = new ThreeLayer("threelayer", {
      identifyCountOnEvent: 1,
      animation: true,
    });
    this.threeLayer.prepareToDraw = (gl, scene, camera) => {
      var light = new THREE.DirectionalLight(0xffffff);
      light.position.set(0, -10, 10).normalize();
      scene.add(light);
      scene.add(new THREE.AmbientLight("#fff", 0.5));
      this.threeLayer.config("animation", true);

      //   this.clock = new THREE.Clock()
      // this.isStart = true;
      this.animate();
      this.addPolygon();
    };
    this.threeLayer.addTo(this.map);
  },

  methods: {
    addPolygon() {
      this.material = new THREE.MeshPhongMaterial({
        color: "#10381ff",
        transparent: true,
        needsUpdate: true,
        side: THREE.DoubleSide,
      });
      fetch("data/json/data_GuGong.json")
        .then((res) => res.json())
        .then((geojson) => {
          const extrudePolygons = geojson.features.map((feature) => {
            return this.threeLayer.toExtrudePolygon(
              feature,
              { height: feature.properties.height },
              this.material
            );
          });
          this.threeLayer.addMesh(extrudePolygons);
          this.resetMaterial(extrudePolygons);
        });
    },
    resetMaterial(extrudePolygons) {
      extrudePolygons.forEach((extrudePolygon) => {
        let geometry = extrudePolygon.getObject3d().geometry;
        geometry.computeBoundingBox(); //无意义也得加
        // geometry.computeBoundingSphere(); //无意义也得加
        // let { center, radius } = geometry.boundingSphere;
        let { max, min } = geometry.boundingBox;
        const size = new THREE.Vector3(
          max.x - min.x,
          max.y - min.y,
          max.z - min.z + 5
        );
        //材质重新
        this.material.onBeforeCompile = (shader) => {
          shader.uniforms.time = this.time;
          shader.uniforms.uStartTime = this.StartTime;
          shader.uniforms.uSize = {
            value: size,
          };
          // 上下扫描参数
          shader.uniforms.uFlow = {
            value: new THREE.Vector3(
              1, // 0 1开关
              0.1, // 范围
              0.2 // 速度
            ),
          };
          shader.uniforms.uColor = {
            value: new THREE.Color("#1B3045"),
          };
          // 效果颜色
          shader.uniforms.uFlowColor = {
            value: new THREE.Color("#FFFFDC"),
          };
          /**
           * 对片元着色器进行修改
           */
          const fragment = `
                    float distanceTo(vec2 src, vec2 dst) {
                        float dx = src.x - dst.x;
                        float dy = src.y - dst.y;
                        float dv = dx * dx + dy * dy;
                        return sqrt(dv);
                    }

                    float lerp(float x, float y, float t) {
                        return (1.0 - t) * x + t * y;
                    }

                    vec3 getGradientColor(vec3 color1, vec3 color2, float index) {
                        float r = lerp(color1.r, color2.r, index);
                        float g = lerp(color1.g, color2.g, index);
                        float b = lerp(color1.b, color2.b, index);
                        return vec3(r, g, b);
                    }

                    varying vec4 vPositionMatrix;
                    varying vec3 vPosition;

                    uniform float time;
                    // 扩散参数
                    uniform float uRadius;
                    uniform float uOpacity;
                    // 初始动画参数
                    uniform float uStartTime;

                    uniform vec3 uMin;
                    uniform vec3 uMax;
                    uniform vec3 uSize;
                    uniform vec3 uFlow;
                    uniform vec3 uColor;
                    uniform vec3 uCenter;
                    uniform vec3 uSwitch;
                    uniform vec3 uTopColor;
                    uniform vec3 uFlowColor;
                    uniform vec3 uDiffusion;
                    uniform vec3 uDiffusionCenter;
                    uniform float uHeight;
                    void main() {
                 `;
          const fragmentColor = `
                  // #include <aomap_fragment>
                  // 给建筑设置从上到下的渐变颜色
                  float indexPct = vPosition.z / uSize.z;
                  //像素混合mix(x,y,a)-->x * (1 - a) + y * a
                  vec3 color = uColor;
                  // 根据时间和速度计算出当前扫描点的位置， 以上顶点为准
                  //求两个数相除的余数
                  float flowTop = mod(uFlow.z * time, uSize.z);
                  // 判断当前点是否在扫描范围内
                  if (flowTop > vPosition.z && flowTop - uFlow.y < vPosition.z) {
                      // 扫描范围内的位置设置从上到下的渐变颜色
                      float flowPct = (uFlow.y - ( flowTop -  vPosition.z)) / uFlow.y;
                      color = mix(color ,uFlowColor, flowPct);
                  }
                  // gl_FragColor = vec4(color, 1.0);
                  vec4 diffuseColor = vec4( color, 1.0 );
                `;

          shader.fragmentShader = shader.fragmentShader.replace(
            "void main() {",
            fragment
          );
          shader.fragmentShader = shader.fragmentShader.replace(
            "vec4 diffuseColor = vec4( diffuse, opacity );",
            fragmentColor
          );
          /**
           * 对顶点着色器进行修改
           */
          const vertex = `
                varying vec4 vPositionMatrix;
                varying vec3 vPosition;
                uniform float uStartTime;
                void main() {
                        vPositionMatrix = projectionMatrix * vec4(position, 1.0);
                        vPosition = position;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
             `;
          const vertexPosition = `
                vec3 transformed = vec3(position.x, position.y, position.z * uStartTime);
             `;

          shader.vertexShader = shader.vertexShader.replace(
            "void main() {",
            vertex
          );
          shader.vertexShader = shader.vertexShader.replace(
            "#include <begin_vertex>",
            vertexPosition
          );
        };
      });
    },
    animate() {
      requestAnimationFrame(this.animate);
      const dt = this.clock ? this.clock.getDelta() : 0;
      this.time.value += dt*4;
      // 启动
      if (this.isStart) {
        this.StartTime.value += dt * 0.5;
        if (this.StartTime.value >= 1) {
          this.StartTime.value = 1;
          this.isStart = false;
        }
      }
      // this.threeLayer._needsUpdate = !this.threeLayer._needsUpdate;
      // if (this.threeLayer._needsUpdate && !this.threeLayer.isRendering()) {
      //   this.threeLayer.redraw();
      // }
    },
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
