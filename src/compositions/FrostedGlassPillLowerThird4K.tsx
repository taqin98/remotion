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

export const frostedGlassPillLowerThirdThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type FrostedGlassPillLowerThirdThemePreset =
  (typeof frostedGlassPillLowerThirdThemePresets)[number];

export const frostedGlassPillLowerThird4KSchema = z.object({
  themePreset: z.enum(frostedGlassPillLowerThirdThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type FrostedGlassPillLowerThird4KProps = z.infer<
  typeof frostedGlassPillLowerThird4KSchema
>;

export const defaultFrostedGlassPillLowerThird4KProps: FrostedGlassPillLowerThird4KProps =
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

export const frostedGlassPillLowerThird4KVariations: Record<
  FrostedGlassPillLowerThirdThemePreset,
  Omit<
    FrostedGlassPillLowerThird4KProps,
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

const FrostedGlassPillScene: React.FC<{
  props: FrostedGlassPillLowerThird4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset = frostedGlassPillLowerThird4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultFrostedGlassPillLowerThird4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultFrostedGlassPillLowerThird4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultFrostedGlassPillLowerThird4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const anchorX = isVertical ? -3.4 : -6.2;
  const anchorY = isVertical ? -4.6 : -2.6;
  const uiScale = isVertical ? 0.92 : 1;

  const cardWidth = 5.9;
  const cardHeight = 1.15;

  const glassPillGeometry = useMemo(() => {
    return new RoundedBoxGeometry(cardWidth, cardHeight, 0.24, 5, 0.42);
  }, [cardWidth, cardHeight]);

  const backingGeometry = useMemo(() => {
    return new RoundedBoxGeometry(cardWidth * 0.98, cardHeight * 0.92, 0.1, 4, 0.36);
  }, [cardWidth, cardHeight]);

  const leftAccentGeometry = useMemo(() => {
    return new RoundedBoxGeometry(
      0.12 * Math.max(0.6, props.strokeWidth * 0.6),
      cardHeight * 0.56,
      0.28,
      2,
      0.04,
    );
  }, [cardHeight, props.strokeWidth]);

  const bottomAccentGeometry = useMemo(() => {
    return new RoundedBoxGeometry(
      cardWidth * 0.35,
      0.045 * props.strokeWidth,
      0.28,
      2,
      0.02,
    );
  }, [cardWidth, props.strokeWidth]);

  const glassMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: primaryHex,
      roughness: 0.22,
      metalness: 0.08,
      transmission: 0.52,
      ior: 1.46,
      thickness: 1.1,
      clearcoat: 1,
      transparent: true,
      opacity: 0.9,
    });
  }, [primaryHex]);

  const backingMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: secondaryHex,
      metalness: 0.22,
      roughness: 0.42,
      transparent: true,
      opacity: 0.85,
    });
  }, [secondaryHex]);

  const accentMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: accentHex,
      metalness: 0.72,
      roughness: 0.18,
    });
  }, [accentHex]);

  useEffect(() => {
    return () => {
      glassPillGeometry.dispose();
      backingGeometry.dispose();
      leftAccentGeometry.dispose();
      bottomAccentGeometry.dispose();
      glassMaterial.dispose();
      backingMaterial.dispose();
      accentMaterial.dispose();
    };
  }, [
    glassPillGeometry,
    backingGeometry,
    leftAccentGeometry,
    bottomAccentGeometry,
    glassMaterial,
    backingMaterial,
    accentMaterial,
  ]);

  const cardScale =
    progress <= 0.17
      ? interpolate(progress, [0, 0.14], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.86, 1], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const stripScale =
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

  const floatY = Math.sin(progress * Math.PI * 2) * 0.03 * cardScale;
  const visible = cardScale > 0.002;

  return (
    <>
      <ambientLight intensity={0.82} />
      <directionalLight position={[6, 8, 12]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.48} color={accentHex} />

      <group
        position={[anchorX + cardWidth * 0.5 * uiScale, anchorY + floatY, 0]}
        scale={
          visible
            ? [cardScale * uiScale, cardScale * uiScale, cardScale * uiScale]
            : [0.0001, 0.0001, 0.0001]
        }
        visible={visible}
      >
        <mesh geometry={backingGeometry} material={backingMaterial} position={[0, 0, -0.06]} />
        <mesh geometry={glassPillGeometry} material={glassMaterial} position={[0, 0, 0.06]} />
        {stripScale > 0.002 && (
          <>
            <mesh
              geometry={leftAccentGeometry}
              material={accentMaterial}
              position={[-cardWidth * 0.44, 0, 0.14]}
              scale={[1, stripScale, 1]}
            />
            <mesh
              geometry={bottomAccentGeometry}
              material={accentMaterial}
              position={[-cardWidth * 0.24, -cardHeight * 0.5, 0.14]}
              scale={[stripScale, 1, 1]}
            />
          </>
        )}
      </group>
    </>
  );
};

export const FrostedGlassPillLowerThird4K: React.FC<
  FrostedGlassPillLowerThird4KProps
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
        <FrostedGlassPillScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

