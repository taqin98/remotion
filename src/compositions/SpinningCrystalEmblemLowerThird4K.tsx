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

export const spinningCrystalEmblemLowerThirdThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type SpinningCrystalEmblemLowerThirdThemePreset =
  (typeof spinningCrystalEmblemLowerThirdThemePresets)[number];

export const spinningCrystalEmblemLowerThird4KSchema = z.object({
  themePreset: z.enum(spinningCrystalEmblemLowerThirdThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type SpinningCrystalEmblemLowerThird4KProps = z.infer<
  typeof spinningCrystalEmblemLowerThird4KSchema
>;

export const defaultSpinningCrystalEmblemLowerThird4KProps: SpinningCrystalEmblemLowerThird4KProps =
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

export const spinningCrystalEmblemLowerThird4KVariations: Record<
  SpinningCrystalEmblemLowerThirdThemePreset,
  Omit<
    SpinningCrystalEmblemLowerThird4KProps,
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

const SpinningCrystalEmblemScene: React.FC<{
  props: SpinningCrystalEmblemLowerThird4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset = spinningCrystalEmblemLowerThird4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultSpinningCrystalEmblemLowerThird4KProps.primaryColor &&
    props.themePreset !== "clean-corporate"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultSpinningCrystalEmblemLowerThird4KProps.secondaryColor &&
    props.themePreset !== "clean-corporate"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultSpinningCrystalEmblemLowerThird4KProps.accentColor &&
    props.themePreset !== "clean-corporate"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const anchorX = isVertical ? -3.15 : -5.95;
  const anchorY = isVertical ? -4.5 : -2.55;
  const uiScale = isVertical ? 0.88 : 1;

  const primaryBarW = 5.4;
  const secondaryBarW = 4.1;

  const crystalGeometry = useMemo(() => {
    return new THREE.IcosahedronGeometry(0.46, 0);
  }, []);

  const ringGeometry = useMemo(() => {
    return new THREE.TorusGeometry(0.58, 0.024 * props.strokeWidth, 16, 48);
  }, [props.strokeWidth]);

  const primaryBarGeometry = useMemo(() => {
    return new RoundedBoxGeometry(primaryBarW, 0.62, 0.16, 3, 0.06);
  }, [primaryBarW]);

  const secondaryBarGeometry = useMemo(() => {
    return new RoundedBoxGeometry(secondaryBarW, 0.38, 0.14, 3, 0.05);
  }, [secondaryBarW]);

  const trimGeometry = useMemo(() => {
    return new RoundedBoxGeometry(primaryBarW, 0.05 * props.strokeWidth, 0.18, 2, 0.02);
  }, [primaryBarW, props.strokeWidth]);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.2,
        roughness: 0.34,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.26,
        roughness: 0.3,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.58,
        roughness: 0.2,
        flatShading: true,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      crystalGeometry.dispose();
      ringGeometry.dispose();
      primaryBarGeometry.dispose();
      secondaryBarGeometry.dispose();
      trimGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [
    crystalGeometry,
    ringGeometry,
    primaryBarGeometry,
    secondaryBarGeometry,
    trimGeometry,
    materials,
  ]);

  const emblemScale =
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

  const barPrimaryWipe =
    progress <= 0.17
      ? interpolate(progress, [0.04, 0.14], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.85, 0.96], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const barSecondaryWipe =
    progress <= 0.17
      ? interpolate(progress, [0.07, 0.17], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.83, 0.93], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const crystalSpin = progress * Math.PI * 2;
  const visible = emblemScale > 0.002 || barPrimaryWipe > 0.002;

  return (
    <>
      <ambientLight intensity={0.78} />
      <directionalLight position={[6, 8, 12]} intensity={1.15} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.44} color={accentHex} />

      <group
        position={[anchorX, anchorY, 0]}
        scale={[uiScale, uiScale, uiScale]}
        visible={visible}
      >
        <group
          position={[0, 0, 0.35]}
          scale={
            emblemScale > 0.002
              ? [emblemScale, emblemScale, emblemScale]
              : [0.0001, 0.0001, 0.0001]
          }
          visible={emblemScale > 0.002}
        >
          <mesh
            geometry={crystalGeometry}
            material={materials[2]}
            rotation={[crystalSpin * 0.5, crystalSpin, 0.3]}
          />
          <mesh
            geometry={ringGeometry}
            material={materials[0]}
            rotation={[0.35, -crystalSpin * 0.5, 0]}
          />
        </group>

        <group
          position={[0.72, 0.2, 0]}
          scale={
            barPrimaryWipe > 0.002
              ? [barPrimaryWipe, 1, 1]
              : [0.0001, 1, 1]
          }
          visible={barPrimaryWipe > 0.002}
        >
          <mesh
            geometry={primaryBarGeometry}
            material={materials[0]}
            position={[primaryBarW * 0.5, 0, 0]}
          />
          <mesh
            geometry={trimGeometry}
            material={materials[2]}
            position={[primaryBarW * 0.5, -0.29, 0.02]}
          />
        </group>

        <group
          position={[0.72, -0.34, -0.04]}
          scale={
            barSecondaryWipe > 0.002
              ? [barSecondaryWipe, 1, 1]
              : [0.0001, 1, 1]
          }
          visible={barSecondaryWipe > 0.002}
        >
          <mesh
            geometry={secondaryBarGeometry}
            material={materials[1]}
            position={[secondaryBarW * 0.5, 0, 0]}
          />
        </group>
      </group>
    </>
  );
};

export const SpinningCrystalEmblemLowerThird4K: React.FC<
  SpinningCrystalEmblemLowerThird4KProps
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
        <SpinningCrystalEmblemScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

