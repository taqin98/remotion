import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
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

export const glitchFreeDigitalBarRevealThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type GlitchFreeDigitalBarRevealThemePreset =
  (typeof glitchFreeDigitalBarRevealThemePresets)[number];

export const glitchFreeDigitalBarReveal4KSchema = z.object({
  themePreset: z.enum(glitchFreeDigitalBarRevealThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type GlitchFreeDigitalBarReveal4KProps = z.infer<
  typeof glitchFreeDigitalBarReveal4KSchema
>;

export const defaultGlitchFreeDigitalBarReveal4KProps: GlitchFreeDigitalBarReveal4KProps =
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

export const glitchFreeDigitalBarReveal4KVariations: Record<
  GlitchFreeDigitalBarRevealThemePreset,
  Omit<
    GlitchFreeDigitalBarReveal4KProps,
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

const SLICE_COUNT = 5;

const GlitchFreeDigitalBarScene: React.FC<{
  props: GlitchFreeDigitalBarReveal4KProps;
  progress: number;
  fps: number;
  durationInFrames: number;
}> = ({ props, progress, fps, durationInFrames }) => {
  const preset = glitchFreeDigitalBarReveal4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultGlitchFreeDigitalBarReveal4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultGlitchFreeDigitalBarReveal4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultGlitchFreeDigitalBarReveal4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const anchorX = isVertical ? -3.3 : -6.1;
  const anchorY = isVertical ? -4.55 : -2.55;
  const uiScale = isVertical ? 0.88 : 1;

  const barW = 5.6;
  const sliceH = 0.21;
  const totalH = sliceH * SLICE_COUNT;

  const sliceGeometry = useMemo(() => {
    return new RoundedBoxGeometry(barW, sliceH, 0.18, 3, 0.03);
  }, [barW, sliceH]);

  const edgeHighlightGeometry = useMemo(() => {
    return new RoundedBoxGeometry(
      0.09,
      sliceH * 0.72,
      0.21,
      2,
      0.015,
    );
  }, [sliceH]);

  const accentBarGeometry = useMemo(() => {
    return new RoundedBoxGeometry(
      0.12 * Math.max(0.7, props.strokeWidth * 0.55),
      totalH,
      0.24,
      3,
      0.03,
    );
  }, [totalH, props.strokeWidth]);

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
        roughness: 0.35,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.7,
        roughness: 0.2,
        emissive: accentHex,
        emissiveIntensity: 0.22,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      sliceGeometry.dispose();
      edgeHighlightGeometry.dispose();
      accentBarGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [sliceGeometry, edgeHighlightGeometry, accentBarGeometry, materials]);

  const lastFrame = Math.max(1, durationInFrames - 1);
  const cycleFrame = progress * lastFrame;
  const exitStartFrame = 0.83 * lastFrame;

  const pillarProgress =
    progress <= 0.17
      ? spring({
          frame: cycleFrame,
          fps,
          config: { damping: 18, stiffness: 180, mass: 0.7 },
        })
      : progress >= 0.83
        ? Math.max(
            0,
            1 -
              spring({
                frame: Math.max(0, cycleFrame - exitStartFrame - 6),
                fps,
                config: { damping: 20, stiffness: 200, mass: 0.6 },
              }),
          )
        : 1;

  const endClamp = progress >= 0.995 ? 0 : 1;
  const pillarT = pillarProgress * endClamp;

  const sliceOffsets = [-0.85, 0.75, -0.55, 0.95, -0.65];

  return (
    <>
      <ambientLight intensity={0.82} />
      <directionalLight position={[6, 8, 12]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.48} color={accentHex} />

      <group
        position={[anchorX, anchorY, 0]}
        scale={[uiScale, uiScale, uiScale]}
      >
        <mesh
          geometry={accentBarGeometry}
          material={materials[2]}
          position={[0.06, 0, 0.08]}
          scale={
            pillarT > 0.002 ? [1, pillarT, 1] : [1, 0.0001, 1]
          }
          visible={pillarT > 0.002}
        />

        {Array.from({ length: SLICE_COUNT }).map((_, idx) => {
          const inDelay = 2 + idx * 2.5;
          const outDelay = (SLICE_COUNT - 1 - idx) * 2;
          const rawSliceT =
            progress <= 0.17
              ? spring({
                  frame: Math.max(0, cycleFrame - inDelay),
                  fps,
                  config: { damping: 18, stiffness: 180, mass: 0.7 },
                })
              : progress >= 0.83
                ? Math.max(
                    0,
                    1 -
                      spring({
                        frame: Math.max(0, cycleFrame - exitStartFrame - outDelay),
                        fps,
                        config: { damping: 20, stiffness: 200, mass: 0.6 },
                      }),
                  )
                : 1;

          const sliceT = rawSliceT * endClamp;
          const yPos = ((SLICE_COUNT - 1) * 0.5 - idx) * sliceH;
          const xOffset = interpolate(sliceT, [0, 1], [sliceOffsets[idx], 0]);
          const isVisible = sliceT > 0.002;

          return (
            <group
              key={idx}
              position={[0.24 + xOffset, yPos, 0]}
              scale={isVisible ? [sliceT, 1, 1] : [0.0001, 1, 1]}
              visible={isVisible}
            >
              <mesh
                geometry={sliceGeometry}
                material={idx >= 3 ? materials[1] : materials[0]}
                position={[barW * 0.5, 0, 0]}
              />
              <mesh
                geometry={edgeHighlightGeometry}
                material={materials[2]}
                position={[barW - 0.08, 0, 0.02]}
              />
            </group>
          );
        })}
      </group>
    </>
  );
};

export const GlitchFreeDigitalBarReveal4K: React.FC<
  GlitchFreeDigitalBarReveal4KProps
> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames, fps } = useVideoConfig();

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
        <GlitchFreeDigitalBarScene
          props={props}
          progress={cycleProgress}
          fps={fps}
          durationInFrames={durationInFrames}
        />
      </ThreeCanvas>
    </div>
  );
};
