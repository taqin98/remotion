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

export const dualToneSlidingAccentLowerThirdThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type DualToneSlidingAccentLowerThirdThemePreset =
  (typeof dualToneSlidingAccentLowerThirdThemePresets)[number];

export const dualToneSlidingAccentLowerThird4KSchema = z.object({
  themePreset: z.enum(dualToneSlidingAccentLowerThirdThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type DualToneSlidingAccentLowerThird4KProps = z.infer<
  typeof dualToneSlidingAccentLowerThird4KSchema
>;

export const defaultDualToneSlidingAccentLowerThird4KProps: DualToneSlidingAccentLowerThird4KProps =
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

export const dualToneSlidingAccentLowerThird4KVariations: Record<
  DualToneSlidingAccentLowerThirdThemePreset,
  Omit<
    DualToneSlidingAccentLowerThird4KProps,
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

const DualToneSlidingAccentScene: React.FC<{
  props: DualToneSlidingAccentLowerThird4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset =
    dualToneSlidingAccentLowerThird4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultDualToneSlidingAccentLowerThird4KProps.primaryColor &&
    props.themePreset !== "clean-corporate"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultDualToneSlidingAccentLowerThird4KProps.secondaryColor &&
    props.themePreset !== "clean-corporate"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultDualToneSlidingAccentLowerThird4KProps.accentColor &&
    props.themePreset !== "clean-corporate"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const anchorX = isVertical ? -3.4 : -6.15;
  const anchorY = isVertical ? -4.55 : -2.55;
  const uiScale = isVertical ? 0.88 : 1;

  const accentRectW = 2.1;
  const widePlateW = 5.4;

  const accentCardGeometry = useMemo(() => {
    return new RoundedBoxGeometry(accentRectW, 1.04, 0.16, 3, 0.05);
  }, [accentRectW]);

  const widePlateGeometry = useMemo(() => {
    return new RoundedBoxGeometry(widePlateW, 0.78, 0.2, 3, 0.05);
  }, [widePlateW]);

  const subStripGeometry = useMemo(() => {
    return new RoundedBoxGeometry(widePlateW * 0.65, 0.28, 0.14, 2, 0.03);
  }, [widePlateW]);

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
        metalness: 0.54,
        roughness: 0.22,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      accentCardGeometry.dispose();
      widePlateGeometry.dispose();
      subStripGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [accentCardGeometry, widePlateGeometry, subStripGeometry, materials]);

  const accentSlide =
    progress <= 0.17
      ? interpolate(progress, [0, 0.1], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.9, 1], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const wideSlide =
    progress <= 0.17
      ? interpolate(progress, [0.05, 0.17], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.83, 0.94], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const accentVisible = accentSlide > 0.002;
  const wideVisible = wideSlide > 0.002;

  return (
    <>
      <ambientLight intensity={0.78} />
      <directionalLight position={[6, 8, 12]} intensity={1.15} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.42} color={accentHex} />

      <group position={[anchorX, anchorY, 0]} scale={[uiScale, uiScale, uiScale]}>
        <group
          position={[interpolate(accentSlide, [0, 1], [-1.4, 0]), -0.04, 0]}
          scale={accentVisible ? [accentSlide, 1, 1] : [0.0001, 1, 1]}
          visible={accentVisible}
        >
          <mesh
            geometry={accentCardGeometry}
            material={materials[2]}
            position={[accentRectW * 0.5, 0, 0]}
          />
        </group>

        <group
          position={[interpolate(wideSlide, [0, 1], [-1.2, 0.45]), 0.1, 0.18]}
          scale={wideVisible ? [wideSlide, 1, 1] : [0.0001, 1, 1]}
          visible={wideVisible}
        >
          <mesh
            geometry={widePlateGeometry}
            material={materials[0]}
            position={[widePlateW * 0.5, 0, 0]}
          />
          <mesh
            geometry={subStripGeometry}
            material={materials[1]}
            position={[widePlateW * 0.325, -0.52, -0.06]}
          />
        </group>
      </group>
    </>
  );
};

export const DualToneSlidingAccentLowerThird4K: React.FC<
  DualToneSlidingAccentLowerThird4KProps
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
        <DualToneSlidingAccentScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

