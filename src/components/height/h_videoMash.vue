<template>
  <div>
    <div id="map" class="container"></div>
    <div class="control"></div>
    <div
      style="
        position: absolute;
        width: 50px;
        height: 50px;
        display: none;
        z-index: 1;
      "
    >
      <video
        id="playArea"
        disabled="true"
        src="/data/height/sintel.mp4"
        autoplay
        loop
        style="width: 100%; height: 100%"
      ></video>
    </div>
  </div>
</template>

<script>
import * as dat from "dat.gui";
import "maptalks/dist/maptalks.css";
import * as maptalks from "maptalks-gl";
/**
 * 版本选用新的100以上
 */
export default {
  components: {},

  data() {
    return {
      map: null,
      group: null,
      geo3DTilesLayer: null,
      mk: null,
      //UI
      coordinate: [
        [108.95908, 34.22002],
        [108.95974, 34.22002],
        [108.95973, 34.21955],
        [108.95908, 34.21957],
        [108.95908, 34.22002],
      ],
      params: {
        altitude: 10,
        height: 130,
        longitude: 0,
        latitude: 0,
        horizontal: 30,
        vertical: 30,
        pitch: 0,
        heading: 0,
      },
    };
  },

  computed: {},

  mounted() {
    this.map = new maptalks.Map("map", {
      center: [108.95941, 34.21978],
      zoom: 15,
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
     * video
     */
    this.mk = new maptalks.VideoMask(this.coordinate, {
      elementId: "playArea",
      symbol: {
        lineWidth: 2,
        polygonOpacity: 0.8,
      },
    });
    /**
     * 3dtiles
     */
    this.geo3DTilesLayer = new maptalks.Geo3DTilesLayer("Geo3DTilesLayer", {
      geometryEvents: true,
      services: [
        {
          url: "data/3dtiles/dayanta/tileset.json",
          maximumScreenSpaceError: 1,
          ambientLight: [0.2, 0.2, 0.2],
          heightOffset: -400,
          scale: [1, 1, 1],
          rotation: [0, 0, 0],
          coordOffset: [0, 0.00002],
        },
      ],
    });
    this.geo3DTilesLayer.once("loadtileset", (e) => {
      this.geo3DTilesLayer.setMask(this.mk);
      const extent = this.geo3DTilesLayer.getExtent(e.index);
      this.map.fitExtent(extent, 0, {
        animation: false,
      });
    });

    /**
     * group
     */
    const sceneConfig = {
      postProcess: {
        enable: true,
        antialias: { enable: true },
      },
    };
    this.group = new maptalks.GroupGLLayer("group", [this.geo3DTilesLayer], {
      sceneConfig,
    });
    this.group.addTo(this.map);
    /**
     * UI
     */
    this.initUI();
  },

  methods: {
    initUI() {
      const gui = new dat.GUI();
      gui
        .add(this.params, "height", 0, 200)
        .name("飞行高度")
        .onChange((value) => {
          this.upadateMask();
        });
      gui
        .add(this.params, "longitude", -0.001, 0.001)
        .name("经度偏离")
        .onChange((value) => {
          this.upadateMask();
        });
      gui
        .add(this.params, "latitude", -0.001, 0.001)
        .name("纬度偏离")
        .onChange((value) => {
          this.upadateMask();
        });
      gui
        .add(this.params, "horizontal", 0, 180)
        .name("水平夹角")
        .onChange((value) => {
          this.upadateMask();
        });
      gui
        .add(this.params, "vertical", -80, 80)
        .name("垂直夹角")
        .onChange((value) => {
          this.upadateMask();
        });
      gui
        .add(this.params, "pitch", -180, 180)
        .name("俯仰角")
        .onChange((value) => {
          this.upadateMask();
        });
      gui
        .add(this.params, "heading", 0, 200)
        .name("偏航角")
        .onChange((value) => {
          this.upadateMask();
        });
    },
    upadateMask(isAccurate) {
      const center = this.calculateCenter(this.coordinate);
      const longitude = center[0] + this.params.longitude;
      const latitude = center[1] + this.params.latitude;
      this.renderMask(
        [longitude, latitude, this.params.height],
        this.params.horizontal,
        this.params.vertical,
        this.params.pitch,
        this.params.heading,
        this.params.altitude,
        isAccurate
      );
    },
    renderMask(f, h, v, pitch, heading, altitude, isAccurate) {
      const topCoord = new maptalks.Coordinate(f[0], f[1], f[2]);
      const topPoint = this.map.coordinateToPointAtRes(
        topCoord,
        this.map.getGLRes()
      );
      const zPoint = this.map.altitudeToPoint(topCoord.z, this.map.getGLRes());
      const altitudePoint = this.map.altitudeToPoint(
        altitude,
        this.map.getGLRes()
      );
      let intersections = this.calculateIntersections(
        [topPoint.x, topPoint.y, zPoint],
        h,
        v,
        pitch,
        heading,
        altitudePoint
      );
      if (isAccurate) {
        intersections = this.calculateIntersections(
          [topPoint.x, topPoint.y, zPoint],
          h,
          v,
          pitch,
          heading,
          0
        );
      }
      const newCoordinates = intersections.map((p) => {
        const coord = this.map.pointAtResToCoordinate(
          new maptalks.Point(p[0], p[1]),
          this.map.getGLRes()
        );
        coord.z = p[2] / this.map.altitudeToPoint(1, this.map.getGLRes());
        return coord;
      });
      if (isAccurate) {
        const results = this.raycastTest(topCoord, newCoordinates);
        if (results.length > 0) {
          const coords = results.map((r) => {
            return r[0].coordinates[0].coordinate;
          });
          this.mk.setCoordinates(coords);
          this.updateHelperLine(f, coords);
        }
      } else {
        this.mk.setCoordinates(newCoordinates);
        this.updateHelperLine(f, newCoordinates);
      }
    },
    calculateCenter(points) {
      let sumLongitude = 0;
      let sumLatitude = 0;
      const count = points.length;
      for (const [longitude, latitude] of points) {
        sumLongitude += longitude;
        sumLatitude += latitude;
      }
      const avgLongitude = sumLongitude / count;
      const avgLatitude = sumLatitude / count;
      return [avgLongitude, avgLatitude];
    },
    calculateIntersections(f, h, v, pitch, heading, height) {
      // 将角度转换为弧度
      const hRad = this.toRadians(h / 2);
      const vRad = this.toRadians(v / 2);
      const pitchRad = this.toRadians(pitch);
      const headingRad = this.toRadians(heading);

      // 定义视锥体的四个方向向量（未旋转前）
      // 左上、右上、右下、左下
      const directions = [
        [-Math.tan(hRad), Math.tan(vRad), -1], // 左上
        [Math.tan(hRad), Math.tan(vRad), -1], // 右上
        [Math.tan(hRad), -Math.tan(vRad), -1], // 右下
        [-Math.tan(hRad), -Math.tan(vRad), -1], // 左下
      ];

      // 应用旋转变换
      const rotatedDirections = directions.map((dir) => {
        // 首先绕x轴旋转pitch角度
        let x = dir[0];
        let y = dir[1] * Math.cos(pitchRad) - dir[2] * Math.sin(pitchRad);
        let z = dir[1] * Math.sin(pitchRad) + dir[2] * Math.cos(pitchRad);

        // 然后绕z轴旋转heading角度
        const xNew = x * Math.cos(headingRad) - y * Math.sin(headingRad);
        const yNew = x * Math.sin(headingRad) + y * Math.cos(headingRad);

        return [xNew, yNew, z];
      });

      // 计算射线与水平平面的交点
      const intersections = rotatedDirections.map((dir) => {
        // 参数方程: f + t * dir = (x, y, height)
        // 求解t: f[2] + t * dir[2] = height
        const t = (height - f[2]) / dir[2];

        // 计算交点坐标
        return [f[0] + t * dir[0], f[1] + t * dir[1], height];
      });

      return intersections;
    },
    toRadians(degrees) {
      return (degrees * Math.PI) / 180;
    },
    updateHelperLine(topCoord, coordinates) {
      let helperLinestringLayer = this.group.getLayer("helperLinestringLayer");
      if (!helperLinestringLayer) {
        helperLinestringLayer = new maptalks.LineStringLayer(
          "helperLinestringLayer"
        ).addTo(this.group);
      }
      helperLinestringLayer.clear();
      for (let i = 0; i < coordinates.length; i++) {
        const line = new maptalks.LineString([coordinates[i], topCoord], {
          symbol: {
            lineColor: [1, 1, 0, 1],
            lineWidth: 2,
          },
        }).addTo(helperLinestringLayer);
      }
    },
    raycastTest(from, coordinates) {
      const results = [];
      const meshes = this.geo3DTilesLayer.getRenderer().getAnalysisMeshes();
      
      for (let i = 0; i < coordinates.length; i++) {
        const to = coordinates[i];
        const raycast = new maptalks.RayCaster(from, to, true);
        const result = raycast.test(meshes, this.map, { count: 1 });
        if (result) {
          results.push(result);
        }
      }
      return results;
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
