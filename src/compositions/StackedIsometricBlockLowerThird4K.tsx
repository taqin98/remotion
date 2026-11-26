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

export const stackedIsometricBlockLowerThirdThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type StackedIsometricBlockLowerThirdThemePreset =
  (typeof stackedIsometricBlockLowerThirdThemePresets)[number];

export const stackedIsometricBlockLowerThird4KSchema = z.object({
  themePreset: z.enum(stackedIsometricBlockLowerThirdThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type StackedIsometricBlockLowerThird4KProps = z.infer<
  typeof stackedIsometricBlockLowerThird4KSchema
>;

export const defaultStackedIsometricBlockLowerThird4KProps: StackedIsometricBlockLowerThird4KProps =
  {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#18181B",
    secondaryColor: "#3F3F46",
    accentColor: "#E4E4E7",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const stackedIsometricBlockLowerThird4KVariations: Record<
  StackedIsometricBlockLowerThirdThemePreset,
  Omit<
    StackedIsometricBlockLowerThird4KProps,
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

const StackedIsometricBlockScene: React.FC<{
  props: StackedIsometricBlockLowerThird4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset =
    stackedIsometricBlockLowerThird4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultStackedIsometricBlockLowerThird4KProps.primaryColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultStackedIsometricBlockLowerThird4KProps.secondaryColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultStackedIsometricBlockLowerThird4KProps.accentColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const anchorX = isVertical ? -3.35 : -6.1;
  const anchorY = isVertical ? -4.55 : -2.55;
  const uiScale = isVertical ? 0.88 : 1;

  const upperSlabGeometry = useMemo(() => {
    return new RoundedBoxGeometry(5.5, 0.72, 0.22, 3, 0.05);
  }, []);

  const lowerSlabGeometry = useMemo(() => {
    return new RoundedBoxGeometry(4.4, 0.56, 0.2, 3, 0.05);
  }, []);

  const shadowSlabGeometry = useMemo(() => {
    return new RoundedBoxGeometry(5.35, 0.68, 0.05, 2, 0.04);
  }, []);

  const accentCubeGeometry = useMemo(() => {
    return new RoundedBoxGeometry(0.42, 0.72, 0.26, 2, 0.04);
  }, []);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.26,
        roughness: 0.34,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.3,
        roughness: 0.3,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.56,
        roughness: 0.2,
      }),
      new THREE.MeshStandardMaterial({
        color: "#09090b",
        metalness: 0.1,
        roughness: 0.9,
        transparent: true,
        opacity: 0.28,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      upperSlabGeometry.dispose();
      lowerSlabGeometry.dispose();
      shadowSlabGeometry.dispose();
      accentCubeGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [
    upperSlabGeometry,
    lowerSlabGeometry,
    shadowSlabGeometry,
    accentCubeGeometry,
    materials,
  ]);

  const slideA =
    progress <= 0.17
      ? interpolate(progress, [0, 0.13], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.87, 1], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const slideB =
    progress <= 0.17
      ? interpolate(progress, [0.05, 0.17], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.83, 0.95], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const visibleA = slideA > 0.002;
  const visibleB = slideB > 0.002;

  return (
    <>
      <ambientLight intensity={0.78} />
      <directionalLight position={[6, 8, 12]} intensity={1.15} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.44} color={accentHex} />

      <group position={[anchorX, anchorY, 0]} scale={[uiScale, uiScale, uiScale]}>
        <group
          position={[interpolate(slideA, [0, 1], [-1.8, 0]), 0.24, 0.16]}
          scale={visibleA ? [slideA, 1, 1] : [0.0001, 1, 1]}
          visible={visibleA}
        >
          <mesh
            geometry={accentCubeGeometry}
            material={materials[2]}
            position={[0.21, 0, 0.02]}
          />
          <mesh
            geometry={upperSlabGeometry}
            material={materials[0]}
            position={[3.1, 0, 0]}
          />
          <mesh
            geometry={shadowSlabGeometry}
            material={materials[3]}
            position={[3.18, -0.09, -0.14]}
          />
        </group>

        <group
          position={[interpolate(slideB, [0, 1], [-1.5, 0.42]), -0.34, -0.06]}
          scale={visibleB ? [slideB, 1, 1] : [0.0001, 1, 1]}
          visible={visibleB}
        >
          <mesh
            geometry={lowerSlabGeometry}
            material={materials[1]}
            position={[2.2, 0, 0]}
          />
        </group>
      </group>
    </>
  );
};

export const StackedIsometricBlockLowerThird4K: React.FC<
  StackedIsometricBlockLowerThird4KProps
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
        <StackedIsometricBlockScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

