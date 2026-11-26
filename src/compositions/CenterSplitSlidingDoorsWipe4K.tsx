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

export const centerSplitSlidingDoorsThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type CenterSplitSlidingDoorsThemePreset =
  (typeof centerSplitSlidingDoorsThemePresets)[number];

export const centerSplitSlidingDoorsWipe4KSchema = z.object({
  themePreset: z.enum(centerSplitSlidingDoorsThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type CenterSplitSlidingDoorsWipe4KProps = z.infer<
  typeof centerSplitSlidingDoorsWipe4KSchema
>;

export const defaultCenterSplitSlidingDoorsWipe4KProps: CenterSplitSlidingDoorsWipe4KProps =
  {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#1E293B",
    secondaryColor: "#334155",
    accentColor: "#38BDF8",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const centerSplitSlidingDoorsWipe4KVariations: Record<
  CenterSplitSlidingDoorsThemePreset,
  Omit<
    CenterSplitSlidingDoorsWipe4KProps,
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
    primaryColor: "#1E293B",
    secondaryColor: "#334155",
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

const CenterSplitSlidingDoorsScene: React.FC<{
  props: CenterSplitSlidingDoorsWipe4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset = centerSplitSlidingDoorsWipe4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultCenterSplitSlidingDoorsWipe4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultCenterSplitSlidingDoorsWipe4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultCenterSplitSlidingDoorsWipe4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const worldW = isVertical ? 9.4 : 16.4;
  const worldH = isVertical ? 16.6 : 9.6;
  const panelW = worldW * 0.56;
  const trimThickness = 0.08 * Math.max(0.6, props.strokeWidth * 0.6);

  const mainSlabGeometry = useMemo(() => {
    return new RoundedBoxGeometry(panelW, worldH, 0.32, 3, 0.05);
  }, [panelW, worldH]);

  const bevelStepGeometry = useMemo(() => {
    return new RoundedBoxGeometry(panelW * 0.85, worldH * 0.86, 0.14, 2, 0.04);
  }, [panelW, worldH]);

  const trimBarGeometry = useMemo(() => {
    return new RoundedBoxGeometry(trimThickness, worldH * 0.92, 0.18, 2, 0.02);
  }, [trimThickness, worldH]);

  const chevronTipGeometry = useMemo(() => {
    return new RoundedBoxGeometry(0.95, 0.95, 0.22, 2, 0.04);
  }, []);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.32,
        roughness: 0.34,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.38,
        roughness: 0.28,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.58,
        roughness: 0.2,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      mainSlabGeometry.dispose();
      bevelStepGeometry.dispose();
      trimBarGeometry.dispose();
      chevronTipGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [
    mainSlabGeometry,
    bevelStepGeometry,
    trimBarGeometry,
    chevronTipGeometry,
    materials,
  ]);

  const slideT =
    progress <= 0.4
      ? interpolate(progress, [0, 0.4], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.6
        ? interpolate(progress, [0.6, 1], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const secondaryReveal =
    progress <= 0.44
      ? interpolate(progress, [0.06, 0.44], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.56
        ? interpolate(progress, [0.56, 0.94], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const openOffset = worldW * 0.55 + panelW * 0.52;
  const closedLeftX = -panelW * 0.48;
  const closedRightX = panelW * 0.48;

  const leftX = interpolate(slideT, [0, 1], [-openOffset, closedLeftX]);
  const rightX = interpolate(slideT, [0, 1], [openOffset, closedRightX]);
  const lockScale = interpolate(secondaryReveal, [0.5, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const doorsVisible = slideT > 0.002;

  return (
    <>
      <ambientLight intensity={0.76} />
      <directionalLight position={[6, 8, 12]} intensity={1.18} color="#ffffff" />
      <directionalLight position={[-6, -5, 8]} intensity={0.44} color={accentHex} />

      <group visible={doorsVisible}>
        <group position={[leftX, 0, 0]}>
          <mesh geometry={mainSlabGeometry} material={materials[0]} />
          <mesh
            geometry={bevelStepGeometry}
            material={materials[1]}
            position={[-0.25, 0, 0.14]}
          />
          <mesh
            geometry={trimBarGeometry}
            material={materials[2]}
            position={[panelW * 0.46, 0, 0.2]}
          />
        </group>

        <group position={[rightX, 0, 0.01]}>
          <mesh geometry={mainSlabGeometry} material={materials[0]} />
          <mesh
            geometry={bevelStepGeometry}
            material={materials[1]}
            position={[0.25, 0, 0.14]}
          />
          <mesh
            geometry={trimBarGeometry}
            material={materials[2]}
            position={[-panelW * 0.46, 0, 0.2]}
          />
        </group>

        {lockScale > 0.002 && (
          <group
            position={[0, 0, 0.28]}
            rotation={[0, 0, Math.PI / 4]}
            scale={[lockScale, lockScale, lockScale]}
          >
            <mesh geometry={chevronTipGeometry} material={materials[2]} />
          </group>
        )}
      </group>
    </>
  );
};

export const CenterSplitSlidingDoorsWipe4K: React.FC<
  CenterSplitSlidingDoorsWipe4KProps
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

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: "transparent",
        overflow: "hidden",
      }}
    >
      <ThreeCanvas
        width={width}
        height={height}
        orthographic
        dpr={1}
        camera={CAMERA_CONFIG}
        gl={GL_CONFIG}
      >
        <OrthographicCameraRig zoom={zoom} />
        <CenterSplitSlidingDoorsScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

