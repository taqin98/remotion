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

export const foldingRibbonNameplateLowerThirdThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type FoldingRibbonNameplateLowerThirdThemePreset =
  (typeof foldingRibbonNameplateLowerThirdThemePresets)[number];

export const foldingRibbonNameplateLowerThird4KSchema = z.object({
  themePreset: z.enum(foldingRibbonNameplateLowerThirdThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type FoldingRibbonNameplateLowerThird4KProps = z.infer<
  typeof foldingRibbonNameplateLowerThird4KSchema
>;

export const defaultFoldingRibbonNameplateLowerThird4KProps: FoldingRibbonNameplateLowerThird4KProps =
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

export const foldingRibbonNameplateLowerThird4KVariations: Record<
  FoldingRibbonNameplateLowerThirdThemePreset,
  Omit<
    FoldingRibbonNameplateLowerThird4KProps,
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

const FoldingRibbonNameplateScene: React.FC<{
  props: FoldingRibbonNameplateLowerThird4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset =
    foldingRibbonNameplateLowerThird4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultFoldingRibbonNameplateLowerThird4KProps.primaryColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultFoldingRibbonNameplateLowerThird4KProps.secondaryColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultFoldingRibbonNameplateLowerThird4KProps.accentColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const anchorX = isVertical ? -3.45 : -6.2;
  const anchorY = isVertical ? -4.55 : -2.55;
  const uiScale = isVertical ? 0.88 : 1;

  const segW = 2.8;
  const mainH = 0.68;

  const postGeometry = useMemo(() => {
    return new RoundedBoxGeometry(0.18, 1.12, 0.16, 2, 0.03);
  }, []);

  const segGeometry = useMemo(() => {
    return new RoundedBoxGeometry(segW, mainH, 0.1, 2, 0.02);
  }, [segW, mainH]);

  const lowerTabGeometry = useMemo(() => {
    return new RoundedBoxGeometry(segW * 1.45, 0.36, 0.08, 2, 0.02);
  }, [segW]);

  const creaseGeometry = useMemo(() => {
    return new THREE.BoxGeometry(0.03 * props.strokeWidth, mainH * 0.9, 0.12);
  }, [mainH, props.strokeWidth]);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.18,
        roughness: 0.42,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.22,
        roughness: 0.38,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.48,
        roughness: 0.26,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      postGeometry.dispose();
      segGeometry.dispose();
      lowerTabGeometry.dispose();
      creaseGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [postGeometry, segGeometry, lowerTabGeometry, creaseGeometry, materials]);

  const postScale =
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

  const seg1T =
    progress <= 0.17
      ? interpolate(progress, [0.03, 0.12], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.87, 0.96], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const seg2T =
    progress <= 0.17
      ? interpolate(progress, [0.08, 0.17], [0, 1], {
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

  const seg1FoldAngle = interpolate(seg1T, [0, 1], [-Math.PI * 0.5, 0]);
  const seg2FoldAngle = interpolate(seg2T, [0, 1], [Math.PI * 0.52, 0]);
  const seg1Visible = seg1T > 0.01;
  const seg2Visible = seg2T > 0.01;
  const visible = postScale > 0.002;

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[6, 8, 12]} intensity={1.12} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.42} color={accentHex} />

      <group
        position={[anchorX, anchorY, 0]}
        scale={[uiScale, uiScale, uiScale]}
        visible={visible}
      >
        <mesh
          geometry={postGeometry}
          material={materials[2]}
          position={[0.09, -0.05, 0.06]}
          scale={visible ? [1, postScale, 1] : [1, 0.0001, 1]}
        />

        <group
          position={[0.18, 0.16, 0]}
          rotation={[0, seg1FoldAngle, 0]}
          scale={seg1Visible ? [seg1T, 1, 1] : [0.0001, 1, 1]}
          visible={seg1Visible}
        >
          <mesh
            geometry={segGeometry}
            material={materials[0]}
            position={[segW * 0.5, 0, 0]}
          />
          <mesh
            geometry={lowerTabGeometry}
            material={materials[1]}
            position={[segW * 0.725, -0.52, -0.02]}
          />

          <group
            position={[segW, 0, 0]}
            rotation={[0, seg2FoldAngle, 0]}
            scale={seg2Visible ? [seg2T, 1, 1] : [0.0001, 1, 1]}
            visible={seg2Visible}
          >
            <mesh geometry={creaseGeometry} material={materials[2]} position={[0, 0, 0.02]} />
            <mesh
              geometry={segGeometry}
              material={materials[0]}
              position={[segW * 0.5, 0, 0]}
            />
          </group>
        </group>
      </group>
    </>
  );
};

export const FoldingRibbonNameplateLowerThird4K: React.FC<
  FoldingRibbonNameplateLowerThird4KProps
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
        <FoldingRibbonNameplateScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

