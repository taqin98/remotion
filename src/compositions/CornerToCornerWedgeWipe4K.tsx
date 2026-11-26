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

export const cornerToCornerWedgeWipeThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type CornerToCornerWedgeWipeThemePreset =
  (typeof cornerToCornerWedgeWipeThemePresets)[number];

export const cornerToCornerWedgeWipe4KSchema = z.object({
  themePreset: z.enum(cornerToCornerWedgeWipeThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type CornerToCornerWedgeWipe4KProps = z.infer<
  typeof cornerToCornerWedgeWipe4KSchema
>;

export const defaultCornerToCornerWedgeWipe4KProps: CornerToCornerWedgeWipe4KProps =
  {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#FFFFFF",
    secondaryColor: "#E2E8F0",
    accentColor: "#2563EB",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const cornerToCornerWedgeWipe4KVariations: Record<
  CornerToCornerWedgeWipeThemePreset,
  Omit<
    CornerToCornerWedgeWipe4KProps,
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

const CornerToCornerWedgeScene: React.FC<{
  props: CornerToCornerWedgeWipe4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset = cornerToCornerWedgeWipe4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor === defaultCornerToCornerWedgeWipe4KProps.primaryColor &&
    props.themePreset !== "clean-corporate"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultCornerToCornerWedgeWipe4KProps.secondaryColor &&
    props.themePreset !== "clean-corporate"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultCornerToCornerWedgeWipe4KProps.accentColor &&
    props.themePreset !== "clean-corporate"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const worldW = isVertical ? 9 : 16;
  const worldH = isVertical ? 16 : 9;
  const diagLen = Math.hypot(worldW, worldH) + 3;
  const halfHeight = Math.hypot(worldW, worldH) * 0.65;

  const wedgeGeometry = useMemo(() => {
    return new RoundedBoxGeometry(diagLen, halfHeight, 0.28, 3, 0.04);
  }, [diagLen, halfHeight]);

  const seamTrimGeometry = useMemo(() => {
    return new RoundedBoxGeometry(
      diagLen,
      0.1 * props.strokeWidth,
      0.34,
      2,
      0.02,
    );
  }, [diagLen, props.strokeWidth]);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.24,
        roughness: 0.34,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.3,
        roughness: 0.28,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.56,
        roughness: 0.2,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      wedgeGeometry.dispose();
      seamTrimGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [wedgeGeometry, seamTrimGeometry, materials]);

  const diagAngle = -Math.atan2(worldH, worldW);

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

  const travelDist = halfHeight * 0.5 + Math.hypot(worldW, worldH) * 0.55;
  const closedOffset = halfHeight * 0.49;
  const topWedgeY = interpolate(slideT, [0, 1], [travelDist, closedOffset]);
  const bottomWedgeY = interpolate(slideT, [0, 1], [-travelDist, -closedOffset]);

  const seamScaleX =
    progress <= 0.45
      ? interpolate(progress, [0.22, 0.45], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.55
        ? interpolate(progress, [0.55, 0.78], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const active = slideT > 0.002;

  return (
    <>
      <ambientLight intensity={0.78} />
      <directionalLight position={[6, 8, 12]} intensity={1.15} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.44} color={accentHex} />

      <group rotation={[0, 0, diagAngle]} visible={active}>
        <mesh
          geometry={wedgeGeometry}
          material={materials[0]}
          position={[0, topWedgeY, 0]}
        />
        <mesh
          geometry={wedgeGeometry}
          material={materials[1]}
          position={[0, bottomWedgeY, 0.02]}
        />
        {seamScaleX > 0.002 && (
          <mesh
            geometry={seamTrimGeometry}
            material={materials[2]}
            position={[0, 0, 0.16]}
            scale={[seamScaleX, 1, 1]}
          />
        )}
      </group>
    </>
  );
};

export const CornerToCornerWedgeWipe4K: React.FC<
  CornerToCornerWedgeWipe4KProps
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
        <CornerToCornerWedgeScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

