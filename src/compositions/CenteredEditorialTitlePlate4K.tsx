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

export const centeredEditorialTitlePlateThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type CenteredEditorialTitlePlateThemePreset =
  (typeof centeredEditorialTitlePlateThemePresets)[number];

export const centeredEditorialTitlePlate4KSchema = z.object({
  themePreset: z.enum(centeredEditorialTitlePlateThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type CenteredEditorialTitlePlate4KProps = z.infer<
  typeof centeredEditorialTitlePlate4KSchema
>;

export const defaultCenteredEditorialTitlePlate4KProps: CenteredEditorialTitlePlate4KProps =
  {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#F5F0E6",
    secondaryColor: "#E5DAC8",
    accentColor: "#D97706",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const centeredEditorialTitlePlate4KVariations: Record<
  CenteredEditorialTitlePlateThemePreset,
  Omit<
    CenteredEditorialTitlePlate4KProps,
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

const CenteredEditorialPlateScene: React.FC<{
  props: CenteredEditorialTitlePlate4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset =
    centeredEditorialTitlePlate4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultCenteredEditorialTitlePlate4KProps.primaryColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultCenteredEditorialTitlePlate4KProps.secondaryColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultCenteredEditorialTitlePlate4KProps.accentColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const anchorY = isVertical ? -4.5 : -2.55;
  const uiScale = isVertical ? 0.86 : 1;

  const mainPlateW = 7.4;
  const subPlateW = 4.6;

  const diamondGeometry = useMemo(() => {
    return new RoundedBoxGeometry(0.44, 0.44, 0.22, 2, 0.04);
  }, []);

  const mainPlateGeometry = useMemo(() => {
    return new RoundedBoxGeometry(mainPlateW, 0.72, 0.14, 3, 0.05);
  }, [mainPlateW]);

  const subPlateGeometry = useMemo(() => {
    return new RoundedBoxGeometry(subPlateW, 0.38, 0.12, 3, 0.04);
  }, [subPlateW]);

  const railGeometry = useMemo(() => {
    return new RoundedBoxGeometry(
      mainPlateW * 0.94,
      0.036 * props.strokeWidth,
      0.16,
      2,
      0.015,
    );
  }, [mainPlateW, props.strokeWidth]);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.16,
        roughness: 0.44,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.2,
        roughness: 0.38,
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
      diamondGeometry.dispose();
      mainPlateGeometry.dispose();
      subPlateGeometry.dispose();
      railGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [
    diamondGeometry,
    mainPlateGeometry,
    subPlateGeometry,
    railGeometry,
    materials,
  ]);

  const diamondScale =
    progress <= 0.17
      ? interpolate(progress, [0, 0.08], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.92, 1], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const mainExpandX =
    progress <= 0.17
      ? interpolate(progress, [0.04, 0.14], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.85, 0.95], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const subExpandX =
    progress <= 0.17
      ? interpolate(progress, [0.07, 0.17], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.83, 0.92], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const diamondSpin = progress * Math.PI;
  const visible = diamondScale > 0.002 || mainExpandX > 0.002;

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[6, 8, 12]} intensity={1.15} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.4} color={accentHex} />

      <group
        position={[0, anchorY, 0]}
        scale={[uiScale, uiScale, uiScale]}
        visible={visible}
      >
        <group
          position={[0, 0.62, 0.24]}
          rotation={[0, diamondSpin, Math.PI / 4]}
          scale={
            diamondScale > 0.002
              ? [diamondScale, diamondScale, diamondScale]
              : [0.0001, 0.0001, 0.0001]
          }
          visible={diamondScale > 0.002}
        >
          <mesh geometry={diamondGeometry} material={materials[2]} />
        </group>

        <group
          position={[0, 0.08, 0]}
          scale={mainExpandX > 0.002 ? [mainExpandX, 1, 1] : [0.0001, 1, 1]}
          visible={mainExpandX > 0.002}
        >
          <mesh geometry={mainPlateGeometry} material={materials[0]} />
          <mesh
            geometry={railGeometry}
            material={materials[2]}
            position={[0, 0.34, 0.02]}
          />
          <mesh
            geometry={railGeometry}
            material={materials[2]}
            position={[0, -0.34, 0.02]}
          />
        </group>

        <group
          position={[0, -0.48, -0.05]}
          scale={subExpandX > 0.002 ? [subExpandX, 1, 1] : [0.0001, 1, 1]}
          visible={subExpandX > 0.002}
        >
          <mesh geometry={subPlateGeometry} material={materials[1]} />
        </group>
      </group>
    </>
  );
};

export const CenteredEditorialTitlePlate4K: React.FC<
  CenteredEditorialTitlePlate4KProps
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
        <CenteredEditorialPlateScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

