"use strict";
(self["rspackChunkremotion"] = self["rspackChunkremotion"] || []).push([[6628], {
4207(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
/* import */ var _index_4svzhprm_mjs__rspack_import_0 = __webpack_require__(9728);
/* import */ var _index_bc2vk2ff_mjs__rspack_import_1 = __webpack_require__(6934);
/* import */ var _index_wxhvgv2s_mjs__rspack_import_4 = __webpack_require__(8197);
/* import */ var _index_4fvp93ps_mjs__rspack_import_3 = __webpack_require__(4075);
/* import */ var remotion__rspack_import_2 = __webpack_require__(3947);





// src/radial-progressive-pixelate/index.ts

var { createEffect } = remotion__rspack_import_2.Internals;
var DEFAULT_CENTER = [0.5, 0.5];
var DEFAULT_WIDTH = 1;
var DEFAULT_HEIGHT = 1;
var DEFAULT_ROTATION = 0;
var DEFAULT_START = 0;
var DEFAULT_START_BLOCK_SIZE = 1;
var DEFAULT_END_BLOCK_SIZE = 40;
var radialProgressivePixelateSchema = {
  center: {
    type: "uv-coordinate",
    min: -1,
    max: 2,
    step: 0.01,
    default: DEFAULT_CENTER,
    description: "Center",
    visual: {
      type: "ellipse",
      width: "width",
      height: "height",
      rotation: "rotation",
      innerScale: "start"
    }
  },
  width: {
    type: "number",
    min: 0,
    step: 0.01,
    default: DEFAULT_WIDTH,
    description: "Width",
    hiddenFromList: false
  },
  height: {
    type: "number",
    min: 0,
    step: 0.01,
    default: DEFAULT_HEIGHT,
    description: "Height",
    hiddenFromList: false
  },
  rotation: {
    type: "rotation-degrees",
    step: 1,
    default: DEFAULT_ROTATION,
    description: "Rotation"
  },
  start: {
    type: "number",
    min: 0,
    max: 1,
    step: 0.01,
    default: DEFAULT_START,
    description: "Start",
    hiddenFromList: false
  },
  startBlockSize: {
    type: "number",
    min: 1,
    max: 200,
    step: 1,
    default: DEFAULT_START_BLOCK_SIZE,
    description: "Start block size",
    hiddenFromList: false
  },
  endBlockSize: {
    type: "number",
    min: 1,
    max: 200,
    step: 1,
    default: DEFAULT_END_BLOCK_SIZE,
    description: "End block size",
    hiddenFromList: false
  }
};
var resolve = (params) => ({
  center: [
    ...params.center ?? DEFAULT_CENTER
  ],
  width: params.width ?? DEFAULT_WIDTH,
  height: params.height ?? DEFAULT_HEIGHT,
  rotation: params.rotation ?? DEFAULT_ROTATION,
  start: params.start ?? DEFAULT_START,
  startBlockSize: params.startBlockSize ?? DEFAULT_START_BLOCK_SIZE,
  endBlockSize: params.endBlockSize ?? DEFAULT_END_BLOCK_SIZE
});
var assertOptionalUvCoordinate = (value, name) => {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value) || value.length !== 2 || value.some((item) => typeof item !== "number" || !Number.isFinite(item))) {
    throw new TypeError(`"${name}" must be a [number, number] tuple`);
  }
};
var validateBlockSize = (value, name) => {
  if (value < 1) {
    throw new TypeError(`"${name}" must be >= 1`);
  }
};
var validateParams = (params) => {
  (0,_index_4fvp93ps_mjs__rspack_import_3/* .assertEffectParamsObject */.db)(params, "Radial progressive pixelate");
  assertOptionalUvCoordinate(params.center, "center");
  (0,_index_wxhvgv2s_mjs__rspack_import_4/* .assertOptionalFiniteNumber */.FC)(params.width, "width");
  (0,_index_wxhvgv2s_mjs__rspack_import_4/* .assertOptionalFiniteNumber */.FC)(params.height, "height");
  (0,_index_wxhvgv2s_mjs__rspack_import_4/* .assertOptionalFiniteNumber */.FC)(params.rotation, "rotation");
  (0,_index_wxhvgv2s_mjs__rspack_import_4/* .validateNonNegative */.XP)(params.width ?? DEFAULT_WIDTH, "width");
  (0,_index_wxhvgv2s_mjs__rspack_import_4/* .validateNonNegative */.XP)(params.height ?? DEFAULT_HEIGHT, "height");
  (0,_index_wxhvgv2s_mjs__rspack_import_4/* .assertOptionalFiniteNumber */.FC)(params.start, "start");
  (0,_index_wxhvgv2s_mjs__rspack_import_4/* .validateUnitInterval */.yk)(params.start ?? DEFAULT_START, "start");
  (0,_index_wxhvgv2s_mjs__rspack_import_4/* .assertOptionalFiniteNumber */.FC)(params.startBlockSize, "startBlockSize");
  (0,_index_wxhvgv2s_mjs__rspack_import_4/* .assertOptionalFiniteNumber */.FC)(params.endBlockSize, "endBlockSize");
  validateBlockSize(params.startBlockSize ?? DEFAULT_START_BLOCK_SIZE, "startBlockSize");
  validateBlockSize(params.endBlockSize ?? DEFAULT_END_BLOCK_SIZE, "endBlockSize");
};
var radialProgressivePixelate = createEffect({
  type: "dev.remotion.effects.radialProgressivePixelate",
  label: "radialProgressivePixelate()",
  documentationLink: "https://www.remotion.dev/docs/effects/radial-progressive-pixelate",
  calculateKey: (params) => {
    const r = resolve(params);
    return `radial-progressive-pixelate-${r.center.join(":")}-${r.width}-${r.height}-${r.rotation}-${r.start}-${r.startBlockSize}-${r.endBlockSize}`;
  },
  implementations: {
    webgpu: remotion__rspack_import_2.Internals.createEffectImplementation({
      setup: (target) => (0,_index_4svzhprm_mjs__rspack_import_0/* .setupWebGpuSinglePass */.DS)(target, "radial-progressive-pixelate"),
      apply: ({ source, width, height, params, state, gpuDevice }) => {
        if (!gpuDevice) {
          throw new Error("A WebGPU device is required for the radial-progressive-pixelate effect");
        }
        const r = resolve(params);
        (0,_index_4svzhprm_mjs__rspack_import_0/* .applyWebGpuSinglePass */.UI)({
          source,
          width,
          height,
          state,
          device: gpuDevice,
          shader: _index_bc2vk2ff_mjs__rspack_import_1/* .PROGRESSIVE_PIXELATE_WEBGPU_SHADER */.Gn,
          uniformData: new Float32Array([
            width,
            height,
            1,
            r.startBlockSize,
            0,
            0,
            0,
            0,
            r.center[0],
            r.center[1],
            r.width,
            r.height,
            r.rotation,
            r.start,
            r.endBlockSize,
            0
          ])
        });
      },
      cleanup: _index_4svzhprm_mjs__rspack_import_0/* .cleanupWebGpuSinglePass */.Gl
    }),
    webgl2: remotion__rspack_import_2.Internals.createEffectImplementation({
      setup: _index_bc2vk2ff_mjs__rspack_import_1/* .setupProgressivePixelate */.py,
      apply: ({ source, width, height, params, state, flipSourceY }) => {
        const r = resolve(params);
        (0,_index_bc2vk2ff_mjs__rspack_import_1/* .prepareProgressivePixelate */.bW)({
          state,
          source,
          width,
          height,
          flipSourceY
        });
        const { gl, uniforms } = state;
        if (uniforms.uMode)
          gl.uniform1i(uniforms.uMode, 1);
        if (uniforms.uCenter)
          gl.uniform2f(uniforms.uCenter, r.center[0], r.center[1]);
        if (uniforms.uWidth)
          gl.uniform1f(uniforms.uWidth, r.width);
        if (uniforms.uHeight)
          gl.uniform1f(uniforms.uHeight, r.height);
        if (uniforms.uRotation)
          gl.uniform1f(uniforms.uRotation, r.rotation);
        if (uniforms.uRadialStart)
          gl.uniform1f(uniforms.uRadialStart, r.start);
        if (uniforms.uStartBlockSize)
          gl.uniform1f(uniforms.uStartBlockSize, r.startBlockSize);
        if (uniforms.uEndBlockSize)
          gl.uniform1f(uniforms.uEndBlockSize, r.endBlockSize);
        (0,_index_bc2vk2ff_mjs__rspack_import_1/* .drawProgressivePixelate */._p)(state);
      },
      cleanup: _index_bc2vk2ff_mjs__rspack_import_1/* .cleanupProgressivePixelate */.sc
    })
  },
  schema: radialProgressivePixelateSchema,
  validateParams
});


__webpack_require__.d(__webpack_exports__, {
}, {
  radialProgressivePixelate: radialProgressivePixelate
});


},

}]);
//# sourceMappingURL=6628.bundle.js.map