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

export const cornerHudFrameOverlayThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type CornerHudFrameOverlayThemePreset =
  (typeof cornerHudFrameOverlayThemePresets)[number];

export const cornerHudFrameOverlay4KSchema = z.object({
  themePreset: z.enum(cornerHudFrameOverlayThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type CornerHudFrameOverlay4KProps = z.infer<
  typeof cornerHudFrameOverlay4KSchema
>;

export const defaultCornerHudFrameOverlay4KProps: CornerHudFrameOverlay4KProps =
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

export const cornerHudFrameOverlay4KVariations: Record<
  CornerHudFrameOverlayThemePreset,
  Omit<
    CornerHudFrameOverlay4KProps,
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

function resolveThemeColors(props: CornerHudFrameOverlay4KProps) {
  const preset = cornerHudFrameOverlay4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor === defaultCornerHudFrameOverlay4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultCornerHudFrameOverlay4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultCornerHudFrameOverlay4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

const CornerHudFrameScene: React.FC<{
  props: CornerHudFrameOverlay4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const cornerX = isVertical ? 3.85 : 6.95;
  const cornerY = isVertical ? 6.95 : 3.85;

  const armH = 1.35;
  const armV = 1.05;
  const thick = 0.055 * props.strokeWidth;

  const hArmGeo = useMemo(
    () => new RoundedBoxGeometry(armH, thick, 0.2, 2, 0.02),
    [armH, thick],
  );
  const vArmGeo = useMemo(
    () => new RoundedBoxGeometry(thick, armV, 0.2, 2, 0.02),
    [armV, thick],
  );
  const innerRailGeo = useMemo(
    () => new RoundedBoxGeometry(armH * 0.72, thick * 0.55, 0.22, 2, 0.015),
    [armH, thick],
  );
  const nodeGeo = useMemo(() => new THREE.IcosahedronGeometry(0.11, 0), []);

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
      hArmGeo.dispose();
      vArmGeo.dispose();
      innerRailGeo.dispose();
      nodeGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [hArmGeo, vArmGeo, innerRailGeo, nodeGeo, materials]);

  const breathe = Math.sin(angle * 2) * 0.08;
  const corners: Array<[number, number]> = [
    [-1, 1],
    [1, 1],
    [-1, -1],
    [1, -1],
  ];

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 12]} intensity={1.3} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.5} color={accentHex} />

      {corners.map(([sx, sy], idx) => {
        const cx = sx * (cornerX + breathe);
        const cy = sy * (cornerY + breathe);
        return (
          <group key={idx} position={[cx, cy, 0]}>
            <mesh
              geometry={hArmGeo}
              material={materials[2]}
              position={[-sx * armH * 0.5, 0, 0]}
            />
            <mesh
              geometry={vArmGeo}
              material={materials[2]}
              position={[0, -sy * armV * 0.5, 0]}
            />
            <mesh
              geometry={innerRailGeo}
              material={materials[1]}
              position={[-sx * armH * 0.38, -sy * 0.14, 0.04]}
            />
            <mesh
              geometry={nodeGeo}
              material={materials[2]}
              position={[0, 0, 0.12]}
              rotation={[angle, angle * 2, 0]}
            />
          </group>
        );
      })}
    </>
  );
};

export const CornerHudFrameOverlay4K: React.FC<
  CornerHudFrameOverlay4KProps
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
  const cornerX = isVertical ? 3.85 : 6.95;
  const cornerY = isVertical ? 6.95 : 3.85;

  const leftPx = width * 0.5 - cornerX * zoom;
  const rightPx = width * 0.5 + cornerX * zoom;
  const topPx = height * 0.5 - cornerY * zoom;
  const botPx = height * 0.5 + cornerY * zoom;
  const strokePx = Math.max(1.4, props.strokeWidth * 1.3);

  const scanOffsetH = Math.sin(angle) * (rightPx - leftPx) * 0.25;
  const scanOffsetV = Math.cos(angle) * (botPx - topPx) * 0.22;

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
        {/* Top & bottom hairline border guides */}
        <line
          x1={leftPx + 1.55 * zoom}
          y1={topPx}
          x2={rightPx - 1.55 * zoom}
          y2={topPx}
          stroke={secondaryHex}
          strokeOpacity={0.4}
          strokeWidth={strokePx * 0.8}
        />
        <line
          x1={leftPx + 1.55 * zoom}
          y1={botPx}
          x2={rightPx - 1.55 * zoom}
          y2={botPx}
          stroke={secondaryHex}
          strokeOpacity={0.4}
          strokeWidth={strokePx * 0.8}
        />

        {/* Left & right hairline border guides */}
        <line
          x1={leftPx}
          y1={topPx + 1.25 * zoom}
          x2={leftPx}
          y2={botPx - 1.25 * zoom}
          stroke={secondaryHex}
          strokeOpacity={0.4}
          strokeWidth={strokePx * 0.8}
        />
        <line
          x1={rightPx}
          y1={topPx + 1.25 * zoom}
          x2={rightPx}
          y2={botPx - 1.25 * zoom}
          stroke={secondaryHex}
          strokeOpacity={0.4}
          strokeWidth={strokePx * 0.8}
        />

        {/* Top & bottom tick marks */}
        {Array.from({ length: 21 }).map((_, i) => {
          const t = i / 20;
          const x = leftPx + 1.8 * zoom + t * (rightPx - leftPx - 3.6 * zoom);
          const isMid = i === 10;
          const len = (isMid ? 0.16 : 0.08) * zoom;
          return (
            <g key={`h-${i}`}>
              <line
                x1={x}
                y1={topPx}
                x2={x}
                y2={topPx + len}
                stroke={isMid ? accentHex : secondaryHex}
                strokeOpacity={isMid ? 0.85 : 0.55}
                strokeWidth={strokePx}
              />
              <line
                x1={x}
                y1={botPx}
                x2={x}
                y2={botPx - len}
                stroke={isMid ? accentHex : secondaryHex}
                strokeOpacity={isMid ? 0.85 : 0.55}
                strokeWidth={strokePx}
              />
            </g>
          );
        })}

        {/* Left & right side tick marks */}
        {Array.from({ length: 13 }).map((_, i) => {
          const t = i / 12;
          const y = topPx + 1.5 * zoom + t * (botPx - topPx - 3.0 * zoom);
          const isMid = i === 6;
          const len = (isMid ? 0.16 : 0.08) * zoom;
          return (
            <g key={`v-${i}`}>
              <line
                x1={leftPx}
                y1={y}
                x2={leftPx + len}
                y2={y}
                stroke={isMid ? accentHex : secondaryHex}
                strokeOpacity={isMid ? 0.85 : 0.55}
                strokeWidth={strokePx}
              />
              <line
                x1={rightPx}
                y1={y}
                x2={rightPx - len}
                y2={y}
                stroke={isMid ? accentHex : secondaryHex}
                strokeOpacity={isMid ? 0.85 : 0.55}
                strokeWidth={strokePx}
              />
            </g>
          );
        })}

        {/* Gliding edge scanning markers */}
        <rect
          x={width * 0.5 + scanOffsetH - 36}
          y={topPx - 4}
          width={72}
          height={8}
          rx={4}
          fill={accentHex}
          fillOpacity={0.85}
        />
        <rect
          x={width * 0.5 - scanOffsetH - 36}
          y={botPx - 4}
          width={72}
          height={8}
          rx={4}
          fill={accentHex}
          fillOpacity={0.85}
        />
        <rect
          x={leftPx - 4}
          y={height * 0.5 + scanOffsetV - 28}
          width={8}
          height={56}
          rx={4}
          fill={accentHex}
          fillOpacity={0.85}
        />
        <rect
          x={rightPx - 4}
          y={height * 0.5 - scanOffsetV - 28}
          width={8}
          height={56}
          rx={4}
          fill={accentHex}
          fillOpacity={0.85}
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
        <CornerHudFrameScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
