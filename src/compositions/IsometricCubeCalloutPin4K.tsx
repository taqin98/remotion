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

export const isometricCubeCalloutPinThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type IsometricCubeCalloutPinThemePreset =
  (typeof isometricCubeCalloutPinThemePresets)[number];

export const isometricCubeCalloutPin4KSchema = z.object({
  themePreset: z.enum(isometricCubeCalloutPinThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type IsometricCubeCalloutPin4KProps = z.infer<
  typeof isometricCubeCalloutPin4KSchema
>;

export const defaultIsometricCubeCalloutPin4KProps: IsometricCubeCalloutPin4KProps =
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

export const isometricCubeCalloutPin4KVariations: Record<
  IsometricCubeCalloutPinThemePreset,
  Omit<
    IsometricCubeCalloutPin4KProps,
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

const IsometricCubeCalloutPinScene: React.FC<{
  props: IsometricCubeCalloutPin4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset = isometricCubeCalloutPin4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultIsometricCubeCalloutPin4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultIsometricCubeCalloutPin4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultIsometricCubeCalloutPin4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const anchorX = isVertical ? -2.4 : -4.5;
  const anchorY = isVertical ? -4.5 : -2.8;
  const uiScale = isVertical ? 0.86 : 1;

  const laserH = 1.45;
  const plateW = 4.6;
  const plateH = 0.84;

  const baseRingGeometry = useMemo(() => {
    return new THREE.TorusGeometry(0.32, 0.022 * props.strokeWidth, 16, 48);
  }, [props.strokeWidth]);

  const baseDotGeometry = useMemo(() => {
    return new THREE.SphereGeometry(0.08, 16, 16);
  }, []);

  const laserLineGeometry = useMemo(() => {
    return new RoundedBoxGeometry(
      0.032 * props.strokeWidth,
      laserH,
      0.06,
      2,
      0.01,
    );
  }, [laserH, props.strokeWidth]);

  const nodeDotGeometry = useMemo(() => {
    return new THREE.SphereGeometry(0.065, 16, 16);
  }, []);

  const isoCubeGeometry = useMemo(() => {
    return new RoundedBoxGeometry(0.48, 0.48, 0.48, 3, 0.06);
  }, []);

  const labelPlateGeometry = useMemo(() => {
    return new RoundedBoxGeometry(plateW, plateH, 0.15, 3, 0.05);
  }, [plateW, plateH]);

  const leftBorderGeometry = useMemo(() => {
    return new RoundedBoxGeometry(
      0.08 * Math.max(0.7, props.strokeWidth * 0.55),
      plateH,
      0.18,
      2,
      0.02,
    );
  }, [plateH, props.strokeWidth]);

  const topLineGeometry = useMemo(() => {
    return new RoundedBoxGeometry(
      plateW * 0.85,
      0.035 * props.strokeWidth,
      0.18,
      2,
      0.012,
    );
  }, [plateW, props.strokeWidth]);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.28,
        roughness: 0.4,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.32,
        roughness: 0.34,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.68,
        roughness: 0.2,
        emissive: accentHex,
        emissiveIntensity: 0.25,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      baseRingGeometry.dispose();
      baseDotGeometry.dispose();
      laserLineGeometry.dispose();
      nodeDotGeometry.dispose();
      isoCubeGeometry.dispose();
      labelPlateGeometry.dispose();
      leftBorderGeometry.dispose();
      topLineGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [
    baseRingGeometry,
    baseDotGeometry,
    laserLineGeometry,
    nodeDotGeometry,
    isoCubeGeometry,
    labelPlateGeometry,
    leftBorderGeometry,
    topLineGeometry,
    materials,
  ]);

  const baseT =
    progress <= 0.17
      ? interpolate(progress, [0, 0.07], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.93, 1], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const laserT =
    progress <= 0.17
      ? interpolate(progress, [0.04, 0.11], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.89, 0.95], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const cubeT =
    progress <= 0.17
      ? interpolate(progress, [0.07, 0.14], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.86, 0.92], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const plateT =
    progress <= 0.17
      ? interpolate(progress, [0.09, 0.17], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.83, 0.91], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const cubeSpin = progress * Math.PI * 2;
  const bob = Math.sin(progress * Math.PI * 4) * 0.08 * cubeT;
  const visible = baseT > 0.002;

  return (
    <>
      <ambientLight intensity={0.82} />
      <directionalLight position={[6, 8, 12]} intensity={1.22} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.48} color={accentHex} />

      <group
        position={[anchorX, anchorY, 0]}
        scale={[uiScale, uiScale, uiScale]}
        visible={visible}
      >
        {/* Ground plane target ring */}
        <group
          position={[0, 0, 0.1]}
          scale={
            baseT > 0.002
              ? [baseT, baseT, baseT]
              : [0.0001, 0.0001, 0.0001]
          }
        >
          <mesh
            geometry={baseRingGeometry}
            material={materials[2]}
            rotation={[Math.PI * 0.38, 0, 0]}
          />
          <mesh geometry={baseDotGeometry} material={materials[2]} />
        </group>

        {/* Vertical laser line */}
        <group
          position={[0, 0, 0.05]}
          scale={laserT > 0.002 ? [1, laserT, 1] : [1, 0.0001, 1]}
          visible={laserT > 0.002}
        >
          <mesh
            geometry={laserLineGeometry}
            material={materials[2]}
            position={[0, laserH * 0.5, 0]}
          />
          <mesh
            geometry={nodeDotGeometry}
            material={materials[2]}
            position={[0, 1.15, 0.04]}
          />
        </group>

        {/* Hovering rotating isometric cube */}
        <group
          position={[0, 1.9 + bob, 0.25]}
          rotation={[0.615, cubeSpin, 0.785]}
          scale={
            cubeT > 0.002
              ? [cubeT, cubeT, cubeT]
              : [0.0001, 0.0001, 0.0001]
          }
          visible={cubeT > 0.002}
        >
          <mesh geometry={isoCubeGeometry} material={materials[2]} />
        </group>

        {/* Blank horizontal label plate */}
        <group
          position={[0.35, 1.15, 0]}
          scale={plateT > 0.002 ? [plateT, 1, 1] : [0.0001, 1, 1]}
          visible={plateT > 0.002}
        >
          <mesh
            geometry={labelPlateGeometry}
            material={materials[0]}
            position={[plateW * 0.5, 0, 0]}
          />
          <mesh
            geometry={leftBorderGeometry}
            material={materials[2]}
            position={[0.04, 0, 0.02]}
          />
          <mesh
            geometry={topLineGeometry}
            material={materials[1]}
            position={[plateW * 0.5 + 0.15, plateH * 0.5 + 0.08, 0.02]}
          />
        </group>
      </group>
    </>
  );
};

export const IsometricCubeCalloutPin4K: React.FC<
  IsometricCubeCalloutPin4KProps
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
        <IsometricCubeCalloutPinScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};
