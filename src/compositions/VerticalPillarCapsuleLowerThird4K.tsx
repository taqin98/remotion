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

export const verticalPillarCapsuleLowerThirdThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type VerticalPillarCapsuleLowerThirdThemePreset =
  (typeof verticalPillarCapsuleLowerThirdThemePresets)[number];

export const verticalPillarCapsuleLowerThird4KSchema = z.object({
  themePreset: z.enum(verticalPillarCapsuleLowerThirdThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type VerticalPillarCapsuleLowerThird4KProps = z.infer<
  typeof verticalPillarCapsuleLowerThird4KSchema
>;

export const defaultVerticalPillarCapsuleLowerThird4KProps: VerticalPillarCapsuleLowerThird4KProps =
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

export const verticalPillarCapsuleLowerThird4KVariations: Record<
  VerticalPillarCapsuleLowerThirdThemePreset,
  Omit<
    VerticalPillarCapsuleLowerThird4KProps,
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

const VerticalPillarCapsuleScene: React.FC<{
  props: VerticalPillarCapsuleLowerThird4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset =
    verticalPillarCapsuleLowerThird4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultVerticalPillarCapsuleLowerThird4KProps.primaryColor &&
    props.themePreset !== "clean-corporate"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultVerticalPillarCapsuleLowerThird4KProps.secondaryColor &&
    props.themePreset !== "clean-corporate"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultVerticalPillarCapsuleLowerThird4KProps.accentColor &&
    props.themePreset !== "clean-corporate"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const anchorX = isVertical ? -3.4 : -6.15;
  const anchorY = isVertical ? -4.55 : -2.55;
  const uiScale = isVertical ? 0.9 : 1;

  const primaryW = 5.4;
  const secondaryW = 3.9;

  const pillarGeometry = useMemo(() => {
    return new RoundedBoxGeometry(
      0.16 * Math.max(0.7, props.strokeWidth * 0.55),
      1.22,
      0.24,
      3,
      0.04,
    );
  }, [props.strokeWidth]);

  const primaryCapsuleGeometry = useMemo(() => {
    return new RoundedBoxGeometry(primaryW, 0.66, 0.16, 4, 0.28);
  }, [primaryW]);

  const secondaryCapsuleGeometry = useMemo(() => {
    return new RoundedBoxGeometry(secondaryW, 0.42, 0.14, 4, 0.2);
  }, [secondaryW]);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.22,
        roughness: 0.34,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.26,
        roughness: 0.3,
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
      pillarGeometry.dispose();
      primaryCapsuleGeometry.dispose();
      secondaryCapsuleGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [pillarGeometry, primaryCapsuleGeometry, secondaryCapsuleGeometry, materials]);

  const pillarScaleY =
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

  const pillarDropY =
    progress <= 0.17
      ? interpolate(progress, [0, 0.08], [0.85, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.92, 1], [0, 0.85], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 0;

  const primaryExtrude =
    progress <= 0.17
      ? interpolate(progress, [0.05, 0.15], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.85, 0.94], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const secondaryExtrude =
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

  const visible = pillarScaleY > 0.002;

  return (
    <>
      <ambientLight intensity={0.78} />
      <directionalLight position={[6, 8, 12]} intensity={1.15} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.42} color={accentHex} />

      <group
        position={[anchorX, anchorY, 0]}
        scale={[uiScale, uiScale, uiScale]}
        visible={visible}
      >
        <mesh
          geometry={pillarGeometry}
          material={materials[2]}
          position={[0.1, pillarDropY, 0.14]}
          scale={visible ? [1, pillarScaleY, pillarScaleY] : [1, 0.0001, 0.0001]}
        />

        <group
          position={[0.28, 0.24, 0]}
          scale={primaryExtrude > 0.002 ? [primaryExtrude, 1, 1] : [0.0001, 1, 1]}
          visible={primaryExtrude > 0.002}
        >
          <mesh
            geometry={primaryCapsuleGeometry}
            material={materials[0]}
            position={[primaryW * 0.5, 0, 0]}
          />
        </group>

        <group
          position={[0.28, -0.34, -0.04]}
          scale={secondaryExtrude > 0.002 ? [secondaryExtrude, 1, 1] : [0.0001, 1, 1]}
          visible={secondaryExtrude > 0.002}
        >
          <mesh
            geometry={secondaryCapsuleGeometry}
            material={materials[1]}
            position={[secondaryW * 0.5, 0, 0]}
          />
        </group>
      </group>
    </>
  );
};

export const VerticalPillarCapsuleLowerThird4K: React.FC<
  VerticalPillarCapsuleLowerThird4KProps
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
        <VerticalPillarCapsuleScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

