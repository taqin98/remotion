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

export const minimalistLeftEdgeDockedTagThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type MinimalistLeftEdgeDockedTagThemePreset =
  (typeof minimalistLeftEdgeDockedTagThemePresets)[number];

export const minimalistLeftEdgeDockedTag4KSchema = z.object({
  themePreset: z.enum(minimalistLeftEdgeDockedTagThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type MinimalistLeftEdgeDockedTag4KProps = z.infer<
  typeof minimalistLeftEdgeDockedTag4KSchema
>;

export const defaultMinimalistLeftEdgeDockedTag4KProps: MinimalistLeftEdgeDockedTag4KProps =
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

export const minimalistLeftEdgeDockedTag4KVariations: Record<
  MinimalistLeftEdgeDockedTagThemePreset,
  Omit<
    MinimalistLeftEdgeDockedTag4KProps,
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

const MinimalistLeftEdgeDockedTagScene: React.FC<{
  props: MinimalistLeftEdgeDockedTag4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset = minimalistLeftEdgeDockedTag4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultMinimalistLeftEdgeDockedTag4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultMinimalistLeftEdgeDockedTag4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultMinimalistLeftEdgeDockedTag4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const leftEdgeX = isVertical ? -4.5 : -8.0;
  const anchorY = isVertical ? -4.55 : -2.55;
  const uiScale = isVertical ? 0.88 : 1;

  const tagW = 6.4;
  const tagH = 1.12;
  const subW = 4.8;

  const mainTagGeometry = useMemo(() => {
    return new RoundedBoxGeometry(tagW, tagH, 0.2, 4, 0.06);
  }, [tagW, tagH]);

  const accentTipGeometry = useMemo(() => {
    return new RoundedBoxGeometry(
      0.14 * Math.max(0.7, props.strokeWidth * 0.5),
      tagH,
      0.24,
      3,
      0.03,
    );
  }, [tagH, props.strokeWidth]);

  const subBarGeometry = useMemo(() => {
    return new RoundedBoxGeometry(subW, 0.38, 0.16, 3, 0.04);
  }, [subW]);

  const trimGeometry = useMemo(() => {
    return new RoundedBoxGeometry(
      tagW - 0.16,
      0.03 * props.strokeWidth,
      0.22,
      2,
      0.012,
    );
  }, [tagW, props.strokeWidth]);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.26,
        roughness: 0.4,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.32,
        roughness: 0.34,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.78,
        roughness: 0.18,
        emissive: accentHex,
        emissiveIntensity: 0.18,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      mainTagGeometry.dispose();
      accentTipGeometry.dispose();
      subBarGeometry.dispose();
      trimGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [
    mainTagGeometry,
    accentTipGeometry,
    subBarGeometry,
    trimGeometry,
    materials,
  ]);

  const slideMain =
    progress <= 0.17
      ? interpolate(progress, [0, 0.13], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.87, 1], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const slideSub =
    progress <= 0.17
      ? interpolate(progress, [0.04, 0.17], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.83, 0.95], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const mainXOffset = interpolate(slideMain, [0, 1], [-tagW - 0.35, -0.15]);
  const subXOffset = interpolate(slideSub, [0, 1], [-subW - 0.35, -0.15]);
  const visible = slideMain > 0.002 || slideSub > 0.002;

  return (
    <>
      <ambientLight intensity={0.82} />
      <directionalLight position={[6, 8, 12]} intensity={1.22} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.48} color={accentHex} />

      <group
        position={[leftEdgeX, anchorY, 0]}
        scale={[uiScale, uiScale, uiScale]}
        visible={visible}
      >
        <group
          position={[mainXOffset, 0.12, 0]}
          visible={slideMain > 0.002}
        >
          <mesh
            geometry={mainTagGeometry}
            material={materials[0]}
            position={[tagW * 0.5, 0, 0]}
          />
          <mesh
            geometry={accentTipGeometry}
            material={materials[2]}
            position={[tagW - 0.24, 0, 0.02]}
          />
          <mesh
            geometry={trimGeometry}
            material={materials[2]}
            position={[tagW * 0.5 - 0.08, tagH * 0.5, 0.02]}
          />
        </group>

        <group
          position={[subXOffset, -0.66, -0.05]}
          visible={slideSub > 0.002}
        >
          <mesh
            geometry={subBarGeometry}
            material={materials[1]}
            position={[subW * 0.5, 0, 0]}
          />
        </group>
      </group>
    </>
  );
};

export const MinimalistLeftEdgeDockedTag4K: React.FC<
  MinimalistLeftEdgeDockedTag4KProps
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
        <MinimalistLeftEdgeDockedTagScene
          props={props}
          progress={cycleProgress}
        />
      </ThreeCanvas>
    </div>
  );
};
