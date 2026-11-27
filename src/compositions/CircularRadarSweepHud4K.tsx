import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { makePie } from "@remotion/shapes";
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

export const circularRadarSweepHudThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type CircularRadarSweepHudThemePreset =
  (typeof circularRadarSweepHudThemePresets)[number];

export const circularRadarSweepHud4KSchema = z.object({
  themePreset: z.enum(circularRadarSweepHudThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type CircularRadarSweepHud4KProps = z.infer<
  typeof circularRadarSweepHud4KSchema
>;

export const defaultCircularRadarSweepHud4KProps: CircularRadarSweepHud4KProps =
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

export const circularRadarSweepHud4KVariations: Record<
  CircularRadarSweepHudThemePreset,
  Omit<
    CircularRadarSweepHud4KProps,
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

function resolveThemeColors(props: CircularRadarSweepHud4KProps) {
  const preset = circularRadarSweepHud4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor === defaultCircularRadarSweepHud4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultCircularRadarSweepHud4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultCircularRadarSweepHud4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

const TARGET_BLIPS = [
  { r: 1.55, theta: 0.7 },
  { r: 2.3, theta: 2.1 },
  { r: 1.05, theta: 3.4 },
  { r: 2.45, theta: 4.5 },
  { r: 1.85, theta: 5.5 },
];

const CircularRadarSweepScene: React.FC<{
  props: CircularRadarSweepHud4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const uiScale = isVertical ? 0.78 : 1;

  const tubeThick = 0.045 * Math.max(0.6, props.strokeWidth * 0.55);

  const outerRingGeo = useMemo(
    () => new THREE.TorusGeometry(2.8, tubeThick * 1.3, 20, 72),
    [tubeThick],
  );
  const midRingGeo = useMemo(
    () => new THREE.TorusGeometry(2.0, tubeThick, 18, 64),
    [tubeThick],
  );
  const innerRingGeo = useMemo(
    () => new THREE.TorusGeometry(1.2, tubeThick * 0.85, 16, 48),
    [tubeThick],
  );
  const sweepBarGeo = useMemo(
    () => new RoundedBoxGeometry(0.055 * props.strokeWidth, 2.75, 0.14, 2, 0.02),
    [props.strokeWidth],
  );
  const hubGeo = useMemo(() => new THREE.SphereGeometry(0.14, 20, 20), []);
  const blipGeo = useMemo(() => new THREE.SphereGeometry(0.09, 16, 16), []);
  const blipRingGeo = useMemo(
    () => new THREE.TorusGeometry(0.18, 0.018 * props.strokeWidth, 12, 32),
    [props.strokeWidth],
  );

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.38,
        roughness: 0.34,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.45,
        roughness: 0.28,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.72,
        roughness: 0.18,
        emissive: accentHex,
        emissiveIntensity: 0.38,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      outerRingGeo.dispose();
      midRingGeo.dispose();
      innerRingGeo.dispose();
      sweepBarGeo.dispose();
      hubGeo.dispose();
      blipGeo.dispose();
      blipRingGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [
    outerRingGeo,
    midRingGeo,
    innerRingGeo,
    sweepBarGeo,
    hubGeo,
    blipGeo,
    blipRingGeo,
    materials,
  ]);

  const tiltX = Math.sin(angle) * 0.14;
  const tiltY = Math.cos(angle) * 0.14;

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 12]} intensity={1.3} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.5} color={accentHex} />

      <group scale={[uiScale, uiScale, uiScale]}>
        <group rotation={[tiltX, tiltY, 0]}>
          <mesh geometry={outerRingGeo} material={materials[0]} />
          <mesh
            geometry={midRingGeo}
            material={materials[1]}
            position={[0, 0, 0.08]}
          />
          <mesh
            geometry={innerRingGeo}
            material={materials[2]}
            position={[0, 0, 0.16]}
          />
        </group>

        <mesh
          geometry={hubGeo}
          material={materials[2]}
          position={[0, 0, 0.22]}
        />

        {/* Rotating 3D radar sweep bar matching SVG pie sweep */}
        <group rotation={[0, 0, -angle]} position={[0, 0, 0.2]}>
          <mesh
            geometry={sweepBarGeo}
            material={materials[2]}
            position={[0, 1.375, 0]}
          />
        </group>

        {/* 5 Pulsing 3D target blips */}
        {TARGET_BLIPS.map((b, idx) => {
          const diff = ((angle - b.theta) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
          const flare = Math.max(0.65, 1.55 - diff / Math.PI);
          const bx = Math.sin(b.theta) * b.r;
          const by = Math.cos(b.theta) * b.r;
          return (
            <group key={idx} position={[bx, by, 0.24]} scale={[flare, flare, flare]}>
              <mesh geometry={blipGeo} material={materials[2]} />
              <mesh geometry={blipRingGeo} material={materials[2]} />
            </group>
          );
        })}
      </group>
    </>
  );
};

export const CircularRadarSweepHud4K: React.FC<
  CircularRadarSweepHud4KProps
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
  const uiScale = isVertical ? 0.78 : 1;

  const cx = width * 0.5;
  const cy = height * 0.5;
  const sweepRadius = 2.75 * uiScale * zoom;
  const strokePx = Math.max(1.4, props.strokeWidth * 1.4 * uiScale);

  const sweepPie = makePie({
    radius: sweepRadius,
    progress: 0.16,
    closePath: true,
    rotation: angle - 0.16 * Math.PI * 2,
  });

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
          <radialGradient id="radarSweepGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accentHex} stopOpacity="0.08" />
            <stop offset="100%" stopColor={accentHex} stopOpacity="0.34" />
          </radialGradient>
        </defs>

        {/* Crosshair axes */}
        <line
          x1={cx - sweepRadius * 1.15}
          y1={cy}
          x2={cx + sweepRadius * 1.15}
          y2={cy}
          stroke={secondaryHex}
          strokeOpacity={0.45}
          strokeWidth={strokePx}
        />
        <line
          x1={cx}
          y1={cy - sweepRadius * 1.15}
          x2={cx}
          y2={cy + sweepRadius * 1.15}
          stroke={secondaryHex}
          strokeOpacity={0.45}
          strokeWidth={strokePx}
        />

        {/* Concentric SVG range rings */}
        {[0.32, 0.62, 0.92, 1.12].map((f, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={sweepRadius * f}
            fill="none"
            stroke={i === 3 ? accentHex : secondaryHex}
            strokeOpacity={i === 3 ? 0.5 : 0.4}
            strokeWidth={strokePx * 0.9}
            strokeDasharray={i === 1 ? `${strokePx * 6} ${strokePx * 4}` : undefined}
          />
        ))}

        {/* 72 degree tick marks */}
        {Array.from({ length: 72 }).map((_, i) => {
          const deg = (i * 360) / 72;
          const isMajor = i % 6 === 0;
          const tickR = sweepRadius * 1.12;
          const len = (isMajor ? 0.16 : 0.08) * uiScale * zoom;
          return (
            <line
              key={i}
              x1={cx}
              y1={cy - tickR}
              x2={cx}
              y2={cy - tickR - len}
              stroke={isMajor ? accentHex : secondaryHex}
              strokeOpacity={isMajor ? 0.8 : 0.45}
              strokeWidth={isMajor ? strokePx * 1.2 : strokePx * 0.7}
              transform={`rotate(${deg} ${cx} ${cy})`}
            />
          );
        })}

        {/* Rotating radar sweep sector */}
        <g transform={`translate(${cx - sweepRadius}, ${cy - sweepRadius})`}>
          <path d={sweepPie.path} fill="url(#radarSweepGrad)" />
        </g>
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
        <CircularRadarSweepScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
