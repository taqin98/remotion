"use strict";
(self["rspackChunkremotion"] = self["rspackChunkremotion"] || []).push([[7938], {
3481(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
/* import */ var _index_4svzhprm_mjs__rspack_import_0 = __webpack_require__(9728);
/* import */ var _index_bc2vk2ff_mjs__rspack_import_1 = __webpack_require__(6934);
/* import */ var _index_wxhvgv2s_mjs__rspack_import_4 = __webpack_require__(8197);
/* import */ var _index_4fvp93ps_mjs__rspack_import_3 = __webpack_require__(4075);
/* import */ var remotion__rspack_import_2 = __webpack_require__(3947);





// src/linear-progressive-pixelate/index.ts

var { createEffect } = remotion__rspack_import_2.Internals;
var DEFAULT_START = [0, 0.5];
var DEFAULT_END = [1, 0.5];
var DEFAULT_START_BLOCK_SIZE = 1;
var DEFAULT_END_BLOCK_SIZE = 40;
var linearProgressivePixelateSchema = {
  start: {
    type: "uv-coordinate",
    min: -1,
    max: 2,
    step: 0.01,
    default: DEFAULT_START,
    description: "Start",
    visual: {
      type: "line",
      to: "end"
    }
  },
  end: {
    type: "uv-coordinate",
    min: -1,
    max: 2,
    step: 0.01,
    default: DEFAULT_END,
    description: "End"
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
  start: [
    ...params.start ?? DEFAULT_START
  ],
  end: [
    ...params.end ?? DEFAULT_END
  ],
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
  (0,_index_4fvp93ps_mjs__rspack_import_3/* .assertEffectParamsObject */.db)(params, "Linear progressive pixelate");
  assertOptionalUvCoordinate(params.start, "start");
  assertOptionalUvCoordinate(params.end, "end");
  (0,_index_wxhvgv2s_mjs__rspack_import_4/* .assertOptionalFiniteNumber */.FC)(params.startBlockSize, "startBlockSize");
  (0,_index_wxhvgv2s_mjs__rspack_import_4/* .assertOptionalFiniteNumber */.FC)(params.endBlockSize, "endBlockSize");
  validateBlockSize(params.startBlockSize ?? DEFAULT_START_BLOCK_SIZE, "startBlockSize");
  validateBlockSize(params.endBlockSize ?? DEFAULT_END_BLOCK_SIZE, "endBlockSize");
};
var linearProgressivePixelate = createEffect({
  type: "dev.remotion.effects.linearProgressivePixelate",
  label: "linearProgressivePixelate()",
  documentationLink: "https://www.remotion.dev/docs/effects/linear-progressive-pixelate",
  calculateKey: (params) => {
    const r = resolve(params);
    return `linear-progressive-pixelate-${r.start.join(":")}-${r.end.join(":")}-${r.startBlockSize}-${r.endBlockSize}`;
  },
  implementations: {
    webgpu: remotion__rspack_import_2.Internals.createEffectImplementation({
      setup: (target) => (0,_index_4svzhprm_mjs__rspack_import_0/* .setupWebGpuSinglePass */.DS)(target, "linear-progressive-pixelate"),
      apply: ({ source, width, height, params, state, gpuDevice }) => {
        if (!gpuDevice) {
          throw new Error("A WebGPU device is required for the linear-progressive-pixelate effect");
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
            0,
            r.startBlockSize,
            r.start[0],
            r.start[1],
            r.end[0],
            r.end[1],
            0,
            0,
            0,
            0,
            0,
            0,
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
          gl.uniform1i(uniforms.uMode, 0);
        if (uniforms.uStart)
          gl.uniform2f(uniforms.uStart, r.start[0], r.start[1]);
        if (uniforms.uEnd)
          gl.uniform2f(uniforms.uEnd, r.end[0], r.end[1]);
        if (uniforms.uStartBlockSize)
          gl.uniform1f(uniforms.uStartBlockSize, r.startBlockSize);
        if (uniforms.uEndBlockSize)
          gl.uniform1f(uniforms.uEndBlockSize, r.endBlockSize);
        (0,_index_bc2vk2ff_mjs__rspack_import_1/* .drawProgressivePixelate */._p)(state);
      },
      cleanup: _index_bc2vk2ff_mjs__rspack_import_1/* .cleanupProgressivePixelate */.sc
    })
  },
  schema: linearProgressivePixelateSchema,
  validateParams
});


__webpack_require__.d(__webpack_exports__, {
}, {
  linearProgressivePixelate: linearProgressivePixelate
});


},

}]);
//# sourceMappingURL=7938.bundle.js.map