"use strict";
(self["rspackChunkremotion"] = self["rspackChunkremotion"] || []).push([[5495], {
5951(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
/* import */ var _index_dj5m7x2h_mjs__rspack_import_0 = __webpack_require__(1032);
/* import */ var _index_50s6bgpe_mjs__rspack_import_1 = __webpack_require__(1695);
/* import */ var _index_71g1r6xj_mjs__rspack_import_2 = __webpack_require__(6521);
/* import */ var _index_7shemw90_mjs__rspack_import_8 = __webpack_require__(8335);
/* import */ var _index_2pafawww_mjs__rspack_import_3 = __webpack_require__(7617);
/* import */ var _index_dc70f074_mjs__rspack_import_4 = __webpack_require__(6326);
Object(function __rspack_missing_module() { var e = new Error("Cannot find module '@remotion/whisper-webgpu'"); e.code = 'MODULE_NOT_FOUND'; throw e; }());
/* import */ var react__rspack_import_6 = __webpack_require__(6540);
/* import */ var mediabunny__rspack_import_7 = __webpack_require__(3014);







// src/components/RenderQueue/CaptionQueueProcessor.tsx



// src/components/Transcription/resample-media-to-16-khz.ts


var resampleMediaTo16Khz = async ({
  src,
  audioStreamIndex,
  requestInit,
  onProgress,
  signal
}) => {
  signal.throwIfAborted();
  const input = new mediabunny__rspack_import_7/* .Input */.pd({
    formats: mediabunny__rspack_import_7/* .ALL_FORMATS */.XE,
    source: new mediabunny__rspack_import_7/* .UrlSource */.Ts(src, requestInit === null ? {} : { requestInit })
  });
  const waveformChunks = [];
  let conversion = null;
  let cancellation = null;
  const onAbort = () => {
    cancellation = conversion?.cancel().catch(() => {
      return;
    }) ?? null;
    input.dispose();
  };
  signal.addEventListener("abort", onAbort, { once: true });
  try {
    onProgress(0);
    const audioTracks = await input.getAudioTracks();
    const primaryVideoTrack = audioStreamIndex === null ? await input.getPrimaryVideoTrack() : null;
    const audioTrack = audioStreamIndex !== null ? audioTracks[audioStreamIndex] ?? null : primaryVideoTrack ? await primaryVideoTrack.getPrimaryPairableAudioTrack() : audioTracks[0] ?? null;
    if (audioTrack === null) {
      throw new Error("The selected media does not have an audio track.");
    }
    if (await audioTrack.isLive()) {
      throw new Error("Live media cannot be transcribed.");
    }
    const output = new mediabunny__rspack_import_7/* .Output */.k7({
      format: new mediabunny__rspack_import_7/* .WavOutputFormat */.hR,
      target: new mediabunny__rspack_import_7/* .NullTarget */.D$
    });
    signal.throwIfAborted();
    conversion = await mediabunny__rspack_import_7/* .Conversion.init */.dY.init({
      input,
      output,
      tracks: "all",
      video: { discard: true },
      audio: (track) => {
        if (track.id !== audioTrack.id) {
          return { discard: true };
        }
        return {
          codec: "pcm-f32",
          forceTranscode: true,
          numberOfChannels: 1,
          process: (sample) => {
            signal.throwIfAborted();
            const floats = new Float32Array(sample.allocationSize({ format: "f32", planeIndex: 0 }) / Float32Array.BYTES_PER_ELEMENT);
            sample.copyTo(floats, { format: "f32", planeIndex: 0 });
            waveformChunks.push({
              startFrame: Math.round(sample.timestamp * Object(function __rspack_missing_module() { var e = new Error("Cannot find module '@remotion/whisper-webgpu'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())),
              waveform: floats
            });
            return sample;
          },
          sampleFormat: "f32",
          sampleRate: Object(function __rspack_missing_module() { var e = new Error("Cannot find module '@remotion/whisper-webgpu'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())
        };
      }
    });
    signal.throwIfAborted();
    if (!conversion.isValid) {
      throw new Error("The audio track cannot be decoded in this browser. Try converting the media to WAV first.");
    }
    conversion.onProgress = (progress) => onProgress(progress);
    await conversion.execute();
    signal.throwIfAborted();
    onProgress(1);
  } finally {
    signal.removeEventListener("abort", onAbort);
    await cancellation;
    if (signal.aborted && conversion && cancellation === null) {
      await conversion.cancel().catch(() => {
        return;
      });
    }
    input.dispose();
  }
  const waveformLength = waveformChunks.reduce((maximum, chunk) => Math.max(maximum, chunk.startFrame + chunk.waveform.length), 0);
  const waveform = new Float32Array(waveformLength);
  for (const chunk of waveformChunks) {
    const destinationStart = Math.max(0, chunk.startFrame);
    const sourceStart = Math.max(0, -chunk.startFrame);
    const availableLength = Math.min(chunk.waveform.length - sourceStart, waveform.length - destinationStart);
    if (availableLength > 0) {
      waveform.set(chunk.waveform.subarray(sourceStart, sourceStart + availableLength), destinationStart);
    }
  }
  return waveform;
};

// src/components/RenderQueue/CaptionQueueProcessor.tsx
var CaptionQueueProcessor = () => {
  const {
    updateCaptionJobProgress,
    markCaptionJobDone,
    markCaptionJobFailed,
    markCaptionJobCancelled,
    markCaptionJobSaving,
    getAbortController,
    setProcessCaptionJobCallback
  } = (0,react__rspack_import_6.useContext)(_index_71g1r6xj_mjs__rspack_import_2/* .RenderQueueContext */.x7);
  const processJob = (0,react__rspack_import_6.useCallback)(async (job) => {
    const { signal } = getAbortController(job.id);
    let captionCount = null;
    let processingError = null;
    try {
      signal.throwIfAborted();
      updateCaptionJobProgress(job.id, {
        message: "Checking WebGPU support...",
        value: 0
      });
      const support = await Object(function __rspack_missing_module() { var e = new Error("Cannot find module '@remotion/whisper-webgpu'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())();
      signal.throwIfAborted();
      if (!support.supported) {
        throw new Error(support.detailedReason);
      }
      updateCaptionJobProgress(job.id, {
        message: `Checking ${job.model}...`,
        value: 0.02
      });
      await Object(function __rspack_missing_module() { var e = new Error("Cannot find module '@remotion/whisper-webgpu'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())();
      signal.throwIfAborted();
      await (0,_index_7shemw90_mjs__rspack_import_8/* .loadModelForJob */.k)({
        signal,
        model: job.model,
        progressStart: 0.03,
        progressSpan: 0.27,
        isModelCached: (model) => Object(function __rspack_missing_module() { var e = new Error("Cannot find module '@remotion/whisper-webgpu'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())({ model }),
        loadModel: async (model, onProgress) => {
          await Object(function __rspack_missing_module() { var e = new Error("Cannot find module '@remotion/whisper-webgpu'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())({
            signal,
            model,
            onProgress: (progress) => onProgress(progress.progress)
          });
          await Object(function __rspack_missing_module() { var e = new Error("Cannot find module '@remotion/whisper-webgpu'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())({ model, signal });
        },
        updateProgress: (progress) => updateCaptionJobProgress(job.id, progress)
      });
      updateCaptionJobProgress(job.id, {
        message: `Preparing ${job.displayName}...`,
        value: 0.3
      });
      const channelWaveform = await resampleMediaTo16Khz({
        signal,
        src: job.src,
        audioStreamIndex: job.audioStreamIndex,
        requestInit: job.requestInit,
        onProgress: (progress) => {
          updateCaptionJobProgress(job.id, {
            message: `Preparing ${job.displayName}...`,
            value: 0.3 + progress * 0.2
          });
        }
      });
      updateCaptionJobProgress(job.id, {
        message: `Transcribing ${job.displayName}...`,
        value: 0.5
      });
      const transcription = await Object(function __rspack_missing_module() { var e = new Error("Cannot find module '@remotion/whisper-webgpu'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())({
        signal,
        channelWaveform,
        model: job.model,
        task: job.task,
        chunkLengthInSeconds: job.chunkLengthInSeconds,
        strideLengthInSeconds: job.strideLengthInSeconds,
        forceFullSequences: job.forceFullSequences,
        doSample: job.doSample,
        temperature: job.temperature,
        topK: job.topK,
        repetitionPenalty: job.repetitionPenalty,
        noRepeatNgramSize: job.noRepeatNgramSize,
        ...job.language === null ? {} : { language: job.language }
      });
      const { captions } = Object(function __rspack_missing_module() { var e = new Error("Cannot find module '@remotion/whisper-webgpu'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())({
        whisperWebGpuOutput: transcription
      });
      signal.throwIfAborted();
      markCaptionJobSaving(job.id);
      if (job.target === null) {
        updateCaptionJobProgress(job.id, {
          message: `Saving ${job.outName}...`,
          value: 0.95
        });
        await (0,_index_dc70f074_mjs__rspack_import_4/* .writeStaticFile2 */.g4)({
          contents: JSON.stringify(captions, null, 2),
          filePath: job.outName
        });
      } else if (job.captionStyle !== null && job.captionStyle.element.slug !== "captions/basic-captions") {
        const { element } = job.captionStyle;
        updateCaptionJobProgress(job.id, {
          message: `Adding ${element.displayName}...`,
          value: 0.95
        });
        const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(element.sourceCode));
        const sourceHash = Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
        const baseName = element.slug.split("/").at(-1);
        let installed = false;
        for (let index = 0;index < 1000; index++) {
          signal.throwIfAborted();
          const installationName = `${baseName}${index === 0 ? "" : `-copy${index === 1 ? "" : `-${index}`}`}`;
          const preflight = await (0,_index_2pafawww_mjs__rspack_import_3/* .prepareElementInstall */.Rl)({
            installationName,
            destination: {
              type: "selected-media",
              compositionFile: job.target.fileName
            },
            element
          });
          if (!preflight.success) {
            throw new Error(preflight.reason);
          }
          const { expectedFileState } = preflight.plan;
          if (expectedFileState.exists && expectedFileState.sourceHash !== sourceHash) {
            continue;
          }
          if ((0,_index_dj5m7x2h_mjs__rspack_import_0/* .getBrowserStudioOperations */.P3)() === null) {
            await (0,_index_dj5m7x2h_mjs__rspack_import_0/* .installRequiredPackages */.oX)(element.dependencies);
          }
          signal.throwIfAborted();
          const response = await (0,_index_2pafawww_mjs__rspack_import_3/* .installElement */.iW)({
            installationName,
            compositionFile: null,
            compositionId: null,
            captionTarget: {
              fileName: job.target.fileName,
              nodePath: job.target.nodePath.nodePath,
              durationInFrames: job.target.durationInFrames,
              captions
            },
            element,
            expectedFileState,
            from: null,
            position: null,
            overwriteExisting: expectedFileState.exists,
            undoRedoNavigation: null,
            newComposition: null
          });
          if (!response.success) {
            throw new Error(response.type === "error" ? response.reason : `Element file changed: ${response.conflict.filePath}`);
          }
          installed = true;
          break;
        }
        if (!installed) {
          throw new Error("Could not find an available filename for the caption style");
        }
      } else {
        updateCaptionJobProgress(job.id, {
          message: "Adding Basic captions...",
          value: 0.95
        });
        await (0,_index_dj5m7x2h_mjs__rspack_import_0/* .installRequiredPackages */.oX)([
          { name: "@remotion/captions", version: null }
        ]);
        const request = {
          fileName: job.target.fileName,
          nodePath: job.target.nodePath.nodePath,
          durationInFrames: job.target.durationInFrames,
          captions
        };
        const browserStudioOperations = (0,_index_dj5m7x2h_mjs__rspack_import_0/* .getBrowserStudioOperations */.P3)();
        const response = browserStudioOperations ? await browserStudioOperations.insertBasicCaptions(request) : await (0,_index_dj5m7x2h_mjs__rspack_import_0/* .callApi */.px)("/api/insert-basic-captions", request);
        if (!response.success) {
          throw new Error(response.reason);
        }
      }
      captionCount = captions.length;
    } catch (error) {
      processingError = error instanceof Error ? error : new Error(String(error));
    }
    try {
      await Object(function __rspack_missing_module() { var e = new Error("Cannot find module '@remotion/whisper-webgpu'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())({ model: job.model });
    } catch {}
    if (signal.aborted) {
      markCaptionJobCancelled(job.id);
    } else if (processingError) {
      markCaptionJobFailed(job.id, processingError);
    } else {
      markCaptionJobDone(job.id, captionCount ?? 0);
    }
  }, [
    getAbortController,
    markCaptionJobCancelled,
    markCaptionJobDone,
    markCaptionJobFailed,
    markCaptionJobSaving,
    updateCaptionJobProgress
  ]);
  (0,react__rspack_import_6.useEffect)(() => {
    setProcessCaptionJobCallback(processJob);
    return () => setProcessCaptionJobCallback(null);
  }, [processJob, setProcessCaptionJobCallback]);
  return null;
};


__webpack_require__.d(__webpack_exports__, {
}, {
  CaptionQueueProcessor: CaptionQueueProcessor
});


},
8335(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
// src/components/RenderQueue/load-model-for-job.ts
var loadModelForJob = async ({
  isModelCached,
  loadModel,
  model,
  signal,
  progressSpan,
  progressStart,
  updateProgress
}) => {
  signal.throwIfAborted();
  const cached = await isModelCached(model);
  signal.throwIfAborted();
  await loadModel(model, (progress) => {
    signal.throwIfAborted();
    const percentage = progress === null ? "" : ` ${Math.round(progress * 100)}%`;
    updateProgress({
      message: `${cached ? "Loading" : "Downloading"} ${model}${percentage}`,
      value: progressStart + (progress ?? 0) * progressSpan
    });
  });
  signal.throwIfAborted();
};



__webpack_require__.d(__webpack_exports__, {
}, {
  k: loadModelForJob
});


},

}]);
//# sourceMappingURL=5495.bundle.js.map