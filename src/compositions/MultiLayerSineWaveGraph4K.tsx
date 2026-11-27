import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";

if ("setConsoleFunction" in THREE && typeof THREE.setConsoleFunction === "function") {
  THREE.setConsoleFunction((type, message) => {
    if (type === "warn" && typeof message === "string" && message.startsWith("THREE.Clock:")) {
      return;
    }
    if (type === "error") {
      console.error(message);
    } else if (type === "warn") {
      console.warn(message);
    }
  });
}

export const multiLayerSineWaveGraphThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type MultiLayerSineWaveGraphThemePreset =
  (typeof multiLayerSineWaveGraphThemePresets)[number];

export const multiLayerSineWaveGraph4KSchema = z.object({
  themePreset: z.enum(multiLayerSineWaveGraphThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type MultiLayerSineWaveGraph4KProps = z.infer<
  typeof multiLayerSineWaveGraph4KSchema
>;

export const defaultMultiLayerSineWaveGraph4KProps: MultiLayerSineWaveGraph4KProps =
  {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#0F172A",
    secondaryColor: "#1E293B",
    accentColor: "#38BDF8",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const multiLayerSineWaveGraph4KVariations: Record<
  MultiLayerSineWaveGraphThemePreset,
  Omit<
    MultiLayerSineWaveGraph4KProps,
    "aspectRatio" | "speedMultiplier" | "strokeWidth"
  >
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    backgroundColor: "transparent",
    primaryColor: "#1E293B",
    secondaryColor: "#64748B",
    accentColor: "#2563EB",
  },
  "dark-tech": {
    themePreset: "dark-tech",
    backgroundColor: "transparent",
    primaryColor: "#0F172A",
    secondaryColor: "#1E293B",
    accentColor: "#38BDF8",
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    backgroundColor: "transparent",
    primaryColor: "#F5F0E6",
    secondaryColor: "#E5DAC8",
    accentColor: "#D97706",
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    backgroundColor: "transparent",
    primaryColor: "#18181B",
    secondaryColor: "#3F3F46",
    accentColor: "#D4AF37",
  },
};

const CAMERA_CONFIG = {
  position: [0, 0, 12] as [number, number, number],
  zoom: 240,
  near: 0.1,
  far: 50,
};

const GL_CONFIG = {
  antialias: true,
  alpha: true,
};

const OrthographicCameraRig: React.FC<{ zoom: number }> = ({ zoom }) => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    camera.position.set(0, 0, 12);
    camera.zoom = zoom;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, zoom]);

  return null;
};

function resolveThemeColors(props: MultiLayerSineWaveGraph4KProps) {
  const preset = multiLayerSineWaveGraph4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultMultiLayerSineWaveGraph4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultMultiLayerSineWaveGraph4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultMultiLayerSineWaveGraph4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

const WAVE_WIDTH = 11.2;
const WAVE_SEGS = 120;

function evalWaveY(layerIdx: number, x: number, angle: number): number {
  if (layerIdx === 0) {
    return (
      Math.sin(x * 0.65 - angle) * 1.15 +
      Math.cos(x * 1.1 + angle * 2) * 0.35
    );
  }
  if (layerIdx === 1) {
    return (
      Math.sin(x * 0.55 - angle * 2 + 1.2) * 0.9 +
      Math.sin(x * 0.9 + angle) * 0.25
    );
  }
  return (
    Math.cos(x * 0.75 + angle - 0.8) * 0.75 +
    Math.sin(x * 1.25 - angle * 2) * 0.22
  );
}

const MultiLayerSineWaveScene: React.FC<{
  props: MultiLayerSineWaveGraph4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const uiScale = isVertical ? 0.66 : 1;

  const ribbonThickness = 0.14 * Math.max(0.6, props.strokeWidth * 0.55);

  const ribbonGeometries = useMemo(() => {
    return [0, 1, 2].map(
      () => new THREE.PlaneGeometry(WAVE_WIDTH, ribbonThickness, WAVE_SEGS, 2),
    );
  }, [ribbonThickness]);

  const nodeGeometry = useMemo(() => {
    return new THREE.SphereGeometry(0.11, 18, 18);
  }, []);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.6,
        roughness: 0.2,
        emissive: accentHex,
        emissiveIntensity: 0.28,
        side: THREE.DoubleSide,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.4,
        roughness: 0.32,
        side: THREE.DoubleSide,
      }),
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.35,
        roughness: 0.38,
        side: THREE.DoubleSide,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.7,
        roughness: 0.18,
        emissive: accentHex,
        emissiveIntensity: 0.45,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useLayoutEffect(() => {
    ribbonGeometries.forEach((geo, layerIdx) => {
      const pos = geo.attributes.position;
      const cols = WAVE_SEGS + 1;
      for (let i = 0; i < pos.count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const u = col / WAVE_SEGS;
        const x = (u - 0.5) * WAVE_WIDTH;
        const rowOffset = (row / 2 - 0.5) * ribbonThickness;
        const yBase = evalWaveY(layerIdx, x, angle);
        const zWave = Math.cos(x * 0.4 + angle + layerIdx) * 0.18;
        pos.setXYZ(i, x, yBase + rowOffset, zWave);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    });
  }, [ribbonGeometries, ribbonThickness, angle]);

  useEffect(() => {
    return () => {
      ribbonGeometries.forEach((g) => g.dispose());
      nodeGeometry.dispose();
      materials.forEach((m) => m.dispose());
    };
  }, [ribbonGeometries, nodeGeometry, materials]);

  const zDepths = [0.35, 0, -0.35];
  const nodeXs = [-4.2, -2.1, 0, 2.1, 4.2];

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 12]} intensity={1.3} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.5} color={accentHex} />

      <group scale={[uiScale, uiScale, uiScale]}>
        {ribbonGeometries.map((geo, idx) => (
          <mesh
            key={idx}
            geometry={geo}
            material={materials[idx]}
            position={[0, 0, zDepths[idx]]}
          />
        ))}

        {nodeXs.map((nx, i) => {
          const ny = evalWaveY(0, nx, angle);
          const nz = Math.cos(nx * 0.4 + angle) * 0.18 + 0.35;
          const pulse = 0.85 + 0.25 * Math.sin(angle * 2 + i * 1.1);
          return (
            <mesh
              key={i}
              geometry={nodeGeometry}
              material={materials[3]}
              position={[nx, ny, nz]}
              scale={[pulse, pulse, pulse]}
            />
          );
        })}
      </group>
    </>
  );
};

export const MultiLayerSineWaveGraph4K: React.FC<
  MultiLayerSineWaveGraph4KProps
> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const progress =
    ((frame % durationInFrames) / durationInFrames) * props.speedMultiplier;
  const cycleProgress = progress % 1;
  const angle = cycleProgress * Math.PI * 2;

  const targetWorldW = props.aspectRatio === "9:16" ? 9 : 16;
  const targetWorldH = props.aspectRatio === "9:16" ? 16 : 9;
  const zoom = Math.min(width / targetWorldW, height / targetWorldH);

  const { secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const uiScale = isVertical ? 0.66 : 1;

  const gridW = 11.6 * uiScale * zoom;
  const gridH = 5.2 * uiScale * zoom;
  const left = width * 0.5 - gridW * 0.5;
  const top = height * 0.5 - gridH * 0.5;
  const cols = 12;
  const rows = 6;
  const strokePx = Math.max(1.2, props.strokeWidth * 1.2 * uiScale);

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        backgroundColor: "transparent",
        overflow: "hidden",
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <rect
          x={left}
          y={top}
          width={gridW}
          height={gridH}
          fill="none"
          stroke={accentHex}
          strokeOpacity={0.45}
          strokeWidth={strokePx * 1.2}
        />

        {Array.from({ length: cols - 1 }).map((_, i) => {
          const x = left + ((i + 1) / cols) * gridW;
          const isMid = i + 1 === cols / 2;
          return (
            <line
              key={`v-${i}`}
              x1={x}
              y1={top}
              x2={x}
              y2={top + gridH}
              stroke={isMid ? accentHex : secondaryHex}
              strokeOpacity={isMid ? 0.55 : 0.35}
              strokeWidth={isMid ? strokePx * 1.3 : strokePx * 0.8}
            />
          );
        })}

        {Array.from({ length: rows - 1 }).map((_, j) => {
          const y = top + ((j + 1) / rows) * gridH;
          const isMid = j + 1 === rows / 2;
          return (
            <line
              key={`h-${j}`}
              x1={left}
              y1={y}
              x2={left + gridW}
              y2={y}
              stroke={isMid ? accentHex : secondaryHex}
              strokeOpacity={isMid ? 0.65 : 0.35}
              strokeWidth={isMid ? strokePx * 1.4 : strokePx * 0.8}
            />
          );
        })}

        {/* Intersection crosshairs */}
        {[2, 4, 6, 8, 10].map((c) =>
          [2, 4].map((r) => {
            const cx = left + (c / cols) * gridW;
            const cy = top + (r / rows) * gridH;
            const d = 10 * uiScale;
            return (
              <g key={`x-${c}-${r}`} stroke={accentHex} strokeOpacity={0.6} strokeWidth={strokePx}>
                <line x1={cx - d} y1={cy} x2={cx + d} y2={cy} />
                <line x1={cx} y1={cy - d} x2={cx} y2={cy + d} />
              </g>
            );
          }),
        )}
      </svg>

      <ThreeCanvas
        width={width}
        height={height}
        orthographic
        dpr={1}
        camera={CAMERA_CONFIG}
        gl={GL_CONFIG}
        style={{ position: "absolute", inset: 0 }}
      >
        <OrthographicCameraRig zoom={zoom} />
        <MultiLayerSineWaveScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
