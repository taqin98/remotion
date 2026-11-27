import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
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

export const horizontalTelemetryRulerScaleThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type HorizontalTelemetryRulerScaleThemePreset =
  (typeof horizontalTelemetryRulerScaleThemePresets)[number];

export const horizontalTelemetryRulerScale4KSchema = z.object({
  themePreset: z.enum(horizontalTelemetryRulerScaleThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type HorizontalTelemetryRulerScale4KProps = z.infer<
  typeof horizontalTelemetryRulerScale4KSchema
>;

export const defaultHorizontalTelemetryRulerScale4KProps: HorizontalTelemetryRulerScale4KProps =
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

export const horizontalTelemetryRulerScale4KVariations: Record<
  HorizontalTelemetryRulerScaleThemePreset,
  Omit<
    HorizontalTelemetryRulerScale4KProps,
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

  React.useLayoutEffect(() => {
    camera.position.set(0, 0, 12);
    camera.zoom = zoom;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, zoom]);

  return null;
};

function resolveThemeColors(props: HorizontalTelemetryRulerScale4KProps) {
  const preset = horizontalTelemetryRulerScale4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultHorizontalTelemetryRulerScale4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultHorizontalTelemetryRulerScale4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultHorizontalTelemetryRulerScale4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

const HorizontalTelemetryRulerScene: React.FC<{
  props: HorizontalTelemetryRulerScale4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const uiScale = isVertical ? 0.62 : 1;

  const pointerGeo = useMemo(() => new THREE.ConeGeometry(0.22, 0.44, 4), []);
  const bracketGeo = useMemo(
    () => new RoundedBoxGeometry(0.12, 1.35, 0.2, 2, 0.03),
    [],
  );
  const vernierGeo = useMemo(
    () => new RoundedBoxGeometry(0.08, 0.36, 0.16, 2, 0.02),
    [],
  );
  const centerHubGeo = useMemo(
    () => new RoundedBoxGeometry(0.65, 0.24, 0.16, 2, 0.04),
    [],
  );

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.42,
        roughness: 0.32,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.48,
        roughness: 0.28,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.72,
        roughness: 0.18,
        emissive: accentHex,
        emissiveIntensity: 0.36,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      pointerGeo.dispose();
      bracketGeo.dispose();
      vernierGeo.dispose();
      centerHubGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [pointerGeo, bracketGeo, vernierGeo, centerHubGeo, materials]);

  const halfSpan = 6.2;
  const vernierX = Math.sin(angle * 2) * 3.4;

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 12]} intensity={1.3} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.5} color={accentHex} />

      <group scale={[uiScale, uiScale, uiScale]}>
        {/* Central 3D metallic pointer assembly */}
        <mesh
          geometry={pointerGeo}
          material={materials[2]}
          position={[0, 0.85, 0.15]}
          rotation={[0, Math.PI * 0.25, Math.PI]}
        />
        <mesh
          geometry={centerHubGeo}
          material={materials[0]}
          position={[0, 1.12, 0.1]}
        />
        <mesh
          geometry={pointerGeo}
          material={materials[2]}
          position={[0, -0.85, 0.15]}
          rotation={[0, Math.PI * 0.25, 0]}
        />

        {/* End brackets */}
        <mesh
          geometry={bracketGeo}
          material={materials[1]}
          position={[-halfSpan, 0, 0.08]}
        />
        <mesh
          geometry={bracketGeo}
          material={materials[1]}
          position={[halfSpan, 0, 0.08]}
        />

        {/* Sliding secondary vernier markers */}
        <mesh
          geometry={vernierGeo}
          material={materials[2]}
          position={[vernierX, -0.52, 0.12]}
        />
        <mesh
          geometry={vernierGeo}
          material={materials[2]}
          position={[-vernierX, 0.52, 0.12]}
        />
      </group>
    </>
  );
};

export const HorizontalTelemetryRulerScale4K: React.FC<
  HorizontalTelemetryRulerScale4KProps
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
  const uiScale = isVertical ? 0.62 : 1;

  const cx = width * 0.5;
  const cy = height * 0.5;
  const rulerW = 12.2 * uiScale * zoom;
  const rulerH = 1.25 * uiScale * zoom;
  const left = cx - rulerW * 0.5;
  const top = cy - rulerH * 0.5;
  const strokePx = Math.max(1.4, props.strokeWidth * 1.4 * uiScale);

  const slidePx = Math.sin(angle) * 1.6 * uiScale * zoom;
  const tickCount = 96;
  const tickRange = rulerW * 1.6;
  const tickStart = cx - tickRange * 0.5;

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
        <defs>
          <clipPath id="rulerClip">
            <rect x={left} y={top - 40} width={rulerW} height={rulerH + 80} />
          </clipPath>
        </defs>

        {/* Top & bottom framing rails */}
        <line
          x1={left}
          y1={top}
          x2={left + rulerW}
          y2={top}
          stroke={accentHex}
          strokeOpacity={0.75}
          strokeWidth={strokePx * 1.2}
        />
        <line
          x1={left}
          y1={top + rulerH}
          x2={left + rulerW}
          y2={top + rulerH}
          stroke={secondaryHex}
          strokeOpacity={0.65}
          strokeWidth={strokePx}
        />

        {/* Center hairline */}
        <line
          x1={left}
          y1={cy}
          x2={left + rulerW}
          y2={cy}
          stroke={secondaryHex}
          strokeOpacity={0.35}
          strokeWidth={strokePx * 0.7}
        />

        {/* Sliding ruler graduations */}
        <g clipPath="url(#rulerClip)">
          <g transform={`translate(${slidePx}, 0)`}>
            {Array.from({ length: tickCount }).map((_, i) => {
              const x = tickStart + (i / (tickCount - 1)) * tickRange;
              const isMajor = i % 8 === 0;
              const isMedium = i % 4 === 0 && !isMajor;
              const tickLen =
                (isMajor ? 0.42 : isMedium ? 0.28 : 0.16) * uiScale * zoom;
              return (
                <line
                  key={i}
                  x1={x}
                  y1={cy - tickLen * 0.5}
                  x2={x}
                  y2={cy + tickLen * 0.5}
                  stroke={isMajor ? accentHex : secondaryHex}
                  strokeOpacity={isMajor ? 0.9 : isMedium ? 0.68 : 0.45}
                  strokeWidth={isMajor ? strokePx * 1.4 : strokePx * 0.85}
                />
              );
            })}
          </g>
        </g>

        {/* Static center indicator line */}
        <line
          x1={cx}
          y1={top - 0.18 * uiScale * zoom}
          x2={cx}
          y2={top + rulerH + 0.18 * uiScale * zoom}
          stroke={accentHex}
          strokeOpacity={0.85}
          strokeWidth={strokePx * 1.3}
        />
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
        <HorizontalTelemetryRulerScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
