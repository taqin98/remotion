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

export const rotatingCubeThinLineLowerThirdThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type RotatingCubeThinLineLowerThirdThemePreset =
  (typeof rotatingCubeThinLineLowerThirdThemePresets)[number];

export const rotatingCubeThinLineLowerThird4KSchema = z.object({
  themePreset: z.enum(rotatingCubeThinLineLowerThirdThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type RotatingCubeThinLineLowerThird4KProps = z.infer<
  typeof rotatingCubeThinLineLowerThird4KSchema
>;

export const defaultRotatingCubeThinLineLowerThird4KProps: RotatingCubeThinLineLowerThird4KProps =
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

export const rotatingCubeThinLineLowerThird4KVariations: Record<
  RotatingCubeThinLineLowerThirdThemePreset,
  Omit<
    RotatingCubeThinLineLowerThird4KProps,
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

const RotatingCubeThinLineScene: React.FC<{
  props: RotatingCubeThinLineLowerThird4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset =
    rotatingCubeThinLineLowerThird4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultRotatingCubeThinLineLowerThird4KProps.primaryColor &&
    props.themePreset !== "clean-corporate"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultRotatingCubeThinLineLowerThird4KProps.secondaryColor &&
    props.themePreset !== "clean-corporate"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultRotatingCubeThinLineLowerThird4KProps.accentColor &&
    props.themePreset !== "clean-corporate"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const anchorX = isVertical ? -3.15 : -5.95;
  const anchorY = isVertical ? -4.55 : -2.55;
  const uiScale = isVertical ? 0.88 : 1;

  const boxWidth = 5.3;

  const cubeGeometry = useMemo(() => {
    return new RoundedBoxGeometry(0.56, 0.56, 0.56, 3, 0.06);
  }, []);

  const lineRuleGeometry = useMemo(() => {
    return new RoundedBoxGeometry(
      boxWidth,
      0.032 * props.strokeWidth,
      0.08,
      2,
      0.015,
    );
  }, [boxWidth, props.strokeWidth]);

  const titleBoxGeometry = useMemo(() => {
    return new RoundedBoxGeometry(boxWidth, 0.62, 0.14, 3, 0.04);
  }, [boxWidth]);

  const subtitleBoxGeometry = useMemo(() => {
    return new RoundedBoxGeometry(boxWidth * 0.72, 0.38, 0.12, 3, 0.04);
  }, [boxWidth]);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.2,
        roughness: 0.36,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.25,
        roughness: 0.32,
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
      cubeGeometry.dispose();
      lineRuleGeometry.dispose();
      titleBoxGeometry.dispose();
      subtitleBoxGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [
    cubeGeometry,
    lineRuleGeometry,
    titleBoxGeometry,
    subtitleBoxGeometry,
    materials,
  ]);

  const cubeScale =
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

  const lineWipe =
    progress <= 0.17
      ? interpolate(progress, [0.03, 0.13], [0, 1], {
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

  const boxRevealY =
    progress <= 0.17
      ? interpolate(progress, [0.06, 0.17], [0, 1], {
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

  const cubeSpin = progress * Math.PI * 2;
  const visible = cubeScale > 0.002 || lineWipe > 0.002;

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
          position={[0, 0, 0.25]}
          rotation={[0.62, cubeSpin, 0.78]}
          scale={
            cubeScale > 0.002
              ? [cubeScale, cubeScale, cubeScale]
              : [0.0001, 0.0001, 0.0001]
          }
          visible={cubeScale > 0.002}
        >
          <mesh geometry={cubeGeometry} material={materials[2]} />
        </group>

        <group
          position={[0.68, -0.05, 0.08]}
          scale={lineWipe > 0.002 ? [lineWipe, 1, 1] : [0.0001, 1, 1]}
          visible={lineWipe > 0.002}
        >
          <mesh
            geometry={lineRuleGeometry}
            material={materials[2]}
            position={[boxWidth * 0.5, 0, 0]}
          />
        </group>

        <group
          position={[0.68, 0.34, 0]}
          scale={boxRevealY > 0.002 ? [1, boxRevealY, 1] : [1, 0.0001, 1]}
          visible={boxRevealY > 0.002}
        >
          <mesh
            geometry={titleBoxGeometry}
            material={materials[0]}
            position={[boxWidth * 0.5, 0, 0]}
          />
        </group>

        <group
          position={[0.68, -0.34, -0.04]}
          scale={boxRevealY > 0.002 ? [1, boxRevealY, 1] : [1, 0.0001, 1]}
          visible={boxRevealY > 0.002}
        >
          <mesh
            geometry={subtitleBoxGeometry}
            material={materials[1]}
            position={[boxWidth * 0.36, 0, 0]}
          />
        </group>
      </group>
    </>
  );
};

export const RotatingCubeThinLineLowerThird4K: React.FC<
  RotatingCubeThinLineLowerThird4KProps
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
        <RotatingCubeThinLineScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

