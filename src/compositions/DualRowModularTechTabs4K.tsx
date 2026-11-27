import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
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

export const dualRowModularTechTabsThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type DualRowModularTechTabsThemePreset =
  (typeof dualRowModularTechTabsThemePresets)[number];

export const dualRowModularTechTabs4KSchema = z.object({
  themePreset: z.enum(dualRowModularTechTabsThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type DualRowModularTechTabs4KProps = z.infer<
  typeof dualRowModularTechTabs4KSchema
>;

export const defaultDualRowModularTechTabs4KProps: DualRowModularTechTabs4KProps =
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

export const dualRowModularTechTabs4KVariations: Record<
  DualRowModularTechTabsThemePreset,
  Omit<
    DualRowModularTechTabs4KProps,
    "aspectRatio" | "speedMultiplier" | "strokeWidth"
  >
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    backgroundColor: "transparent",
    primaryColor: "#FFFFFF",
    secondaryColor: "#E2E8F0",
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
    secondaryColor: "#27272A",
    accentColor: "#E4E4E7",
  },
};

const CAMERA_CONFIG = {
  position: [0, 0, 10] as [number, number, number],
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
    camera.position.set(0, 0, 10);
    camera.zoom = zoom;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, zoom]);

  return null;
};

function resolveThemeColors(props: DualRowModularTechTabs4KProps) {
  const preset = dualRowModularTechTabs4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor === defaultDualRowModularTechTabs4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultDualRowModularTechTabs4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultDualRowModularTechTabs4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

const PulsingStatusCubeScene: React.FC<{
  props: DualRowModularTechTabs4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const { accentHex } = resolveThemeColors(props);

  const isVertical = props.aspectRatio === "9:16";
  const anchorX = isVertical ? -3.2 : -5.95;
  const anchorY = isVertical ? -4.55 : -2.55;
  const uiScale = isVertical ? 0.88 : 1;

  const cubeGeometry = useMemo(() => {
    return new RoundedBoxGeometry(0.54, 0.54, 0.54, 3, 0.06);
  }, []);

  const cageGeometry = useMemo(() => {
    return new THREE.BoxGeometry(0.76, 0.76, 0.76);
  }, []);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.68,
        roughness: 0.2,
        emissive: accentHex,
        emissiveIntensity: 0.24,
      }),
      new THREE.MeshBasicMaterial({
        color: accentHex,
        wireframe: true,
        transparent: true,
        opacity: 0.82,
      }),
    ];
  }, [accentHex]);

  useEffect(() => {
    return () => {
      cubeGeometry.dispose();
      cageGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [cubeGeometry, cageGeometry, materials]);

  const cubeScale =
    progress <= 0.17
      ? interpolate(progress, [0, 0.09], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.91, 1], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const pulse = 1 + Math.sin(progress * Math.PI * 6) * 0.06;
  const spin = progress * Math.PI * 2;
  const visible = cubeScale > 0.002;

  return (
    <>
      <ambientLight intensity={0.82} />
      <directionalLight position={[6, 8, 12]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.48} color={accentHex} />

      <group
        position={[anchorX, anchorY, 0.25]}
        scale={
          visible
            ? [cubeScale * uiScale, cubeScale * uiScale, cubeScale * uiScale]
            : [0.0001, 0.0001, 0.0001]
        }
        visible={visible}
      >
        <mesh
          geometry={cubeGeometry}
          material={materials[0]}
          rotation={[0.55, spin, 0.6]}
          scale={[pulse, pulse, pulse]}
        />
        <mesh
          geometry={cageGeometry}
          material={materials[1]}
          rotation={[0.55, -spin * 0.5, 0.6]}
        />
      </group>
    </>
  );
};

export const DualRowModularTechTabs4K: React.FC<
  DualRowModularTechTabs4KProps
> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const lastFrame = Math.max(1, durationInFrames - 1);
  const rawProgress = (frame / lastFrame) * props.speedMultiplier;
  const cycleProgress =
    props.speedMultiplier === 1
      ? Math.min(1, Math.max(0, rawProgress))
      : rawProgress >= props.speedMultiplier
        ? 1
        : rawProgress % 1;

  const targetWorldW = props.aspectRatio === "9:16" ? 9 : 16;
  const targetWorldH = props.aspectRatio === "9:16" ? 16 : 9;
  const zoom = Math.min(width / targetWorldW, height / targetWorldH);

  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const anchorX = isVertical ? -3.2 : -5.95;
  const anchorY = isVertical ? -4.55 : -2.55;
  const uiScale = isVertical ? 0.88 : 1;

  const topTabT =
    cycleProgress <= 0.17
      ? interpolate(cycleProgress, [0.04, 0.14], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : cycleProgress >= 0.83
        ? interpolate(cycleProgress, [0.85, 0.96], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const botTabT =
    cycleProgress <= 0.17
      ? interpolate(cycleProgress, [0.08, 0.17], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : cycleProgress >= 0.83
        ? interpolate(cycleProgress, [0.83, 0.93], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const tabBaseX = width * 0.5 + (anchorX + 0.74 * uiScale) * zoom;
  const topSlideOffset = interpolate(topTabT, [0, 1], [-0.45, 0]) * uiScale * zoom;
  const botSlideOffset = interpolate(botTabT, [0, 1], [-0.45, 0]) * uiScale * zoom;

  const topCenterY = height * 0.5 - (anchorY + 0.26 * uiScale) * zoom;
  const topW = 5.2 * uiScale * zoom;
  const topH = 0.58 * uiScale * zoom;
  const topChamfer = 0.16 * uiScale * zoom;
  const topLeft = tabBaseX + topSlideOffset;
  const topT = topCenterY - topH * 0.5;
  const topB = topCenterY + topH * 0.5;

  const topTabPoints = [
    `${topLeft},${topT + topChamfer}`,
    `${topLeft + topChamfer},${topT}`,
    `${topLeft + topW},${topT}`,
    `${topLeft + topW},${topB - topChamfer}`,
    `${topLeft + topW - topChamfer},${topB}`,
    `${topLeft},${topB}`,
  ].join(" ");

  const botCenterY = height * 0.5 - (anchorY - 0.32 * uiScale) * zoom;
  const botW = 3.8 * uiScale * zoom;
  const botH = 0.42 * uiScale * zoom;
  const botChamfer = 0.12 * uiScale * zoom;
  const botLeft = tabBaseX + botSlideOffset;
  const botT = botCenterY - botH * 0.5;
  const botB = botCenterY + botH * 0.5;

  const botTabPoints = [
    `${botLeft},${botT + botChamfer}`,
    `${botLeft + botChamfer},${botT}`,
    `${botLeft + botW},${botT}`,
    `${botLeft + botW},${botB - botChamfer}`,
    `${botLeft + botW - botChamfer},${botB}`,
    `${botLeft},${botB}`,
  ].join(" ");

  const tagLeft = botLeft + botW + 0.14 * uiScale * zoom;
  const tagW = 1.15 * uiScale * zoom;
  const tagPoints = [
    `${tagLeft},${botT + botChamfer}`,
    `${tagLeft + botChamfer},${botT}`,
    `${tagLeft + tagW},${botT}`,
    `${tagLeft + tagW},${botB - botChamfer}`,
    `${tagLeft + tagW - botChamfer},${botB}`,
    `${tagLeft},${botB}`,
  ].join(" ");

  const strokePx = Math.max(1.5, props.strokeWidth * 1.5 * uiScale);
  const notchW = 0.08 * props.strokeWidth * 0.65 * uiScale * zoom;

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
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
      >
        <defs>
          <clipPath id="modularTopClip">
            <rect
              x={tabBaseX - 10}
              y={topT - 20}
              width={(topW + 30) * topTabT}
              height={topH + 40}
            />
          </clipPath>
          <clipPath id="modularBotClip">
            <rect
              x={tabBaseX - 10}
              y={botT - 20}
              width={(botW + tagW + 60) * botTabT}
              height={botH + 40}
            />
          </clipPath>
        </defs>

        {topTabT > 0.002 && (
          <g clipPath="url(#modularTopClip)">
            <polygon
              points={topTabPoints}
              fill={primaryHex}
              fillOpacity={0.94}
              stroke={accentHex}
              strokeWidth={strokePx}
            />
            <rect
              x={topLeft + 0.14 * uiScale * zoom}
              y={topCenterY - topH * 0.34}
              width={notchW}
              height={topH * 0.68}
              rx={3}
              fill={accentHex}
            />
          </g>
        )}

        {botTabT > 0.002 && (
          <g clipPath="url(#modularBotClip)">
            <polygon
              points={botTabPoints}
              fill={secondaryHex}
              fillOpacity={0.92}
            />
            <polygon points={tagPoints} fill={accentHex} fillOpacity={0.95} />
          </g>
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
        <PulsingStatusCubeScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};
