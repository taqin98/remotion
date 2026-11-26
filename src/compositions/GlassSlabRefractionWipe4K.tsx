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

export const glassSlabRefractionWipeThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type GlassSlabRefractionWipeThemePreset =
  (typeof glassSlabRefractionWipeThemePresets)[number];

export const glassSlabRefractionWipe4KSchema = z.object({
  themePreset: z.enum(glassSlabRefractionWipeThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type GlassSlabRefractionWipe4KProps = z.infer<
  typeof glassSlabRefractionWipe4KSchema
>;

export const defaultGlassSlabRefractionWipe4KProps: GlassSlabRefractionWipe4KProps =
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

export const glassSlabRefractionWipe4KVariations: Record<
  GlassSlabRefractionWipeThemePreset,
  Omit<
    GlassSlabRefractionWipe4KProps,
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

const GlassSlabRefractionScene: React.FC<{
  props: GlassSlabRefractionWipe4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset = glassSlabRefractionWipe4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor === defaultGlassSlabRefractionWipe4KProps.primaryColor &&
    props.themePreset !== "clean-corporate"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultGlassSlabRefractionWipe4KProps.secondaryColor &&
    props.themePreset !== "clean-corporate"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultGlassSlabRefractionWipe4KProps.accentColor &&
    props.themePreset !== "clean-corporate"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const slabW = isVertical ? 12.5 : 18.5;
  const slabH = isVertical ? 19.5 : 12.5;

  const coreSlabGeometry = useMemo(() => {
    return new RoundedBoxGeometry(slabW, slabH, 0.24, 3, 0.08);
  }, [slabW, slabH]);

  const glassSlabGeometry = useMemo(() => {
    return new RoundedBoxGeometry(slabW * 0.92, slabH * 0.94, 0.36, 4, 0.14);
  }, [slabW, slabH]);

  const edgeBarGeometry = useMemo(() => {
    return new RoundedBoxGeometry(0.14 * props.strokeWidth, slabH * 0.9, 0.4, 2, 0.03);
  }, [slabH, props.strokeWidth]);

  const matteMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: primaryHex,
      metalness: 0.24,
      roughness: 0.36,
    });
  }, [primaryHex]);

  const frostedGlassPrimary = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: secondaryHex,
      roughness: 0.14,
      metalness: 0.06,
      transmission: 0.72,
      ior: 1.48,
      thickness: 1.2,
      clearcoat: 1,
      transparent: true,
      opacity: 0.88,
    });
  }, [secondaryHex]);

  const accentMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: accentHex,
      metalness: 0.58,
      roughness: 0.2,
    });
  }, [accentHex]);

  useEffect(() => {
    return () => {
      coreSlabGeometry.dispose();
      glassSlabGeometry.dispose();
      edgeBarGeometry.dispose();
      matteMaterial.dispose();
      frostedGlassPrimary.dispose();
      accentMaterial.dispose();
    };
  }, [
    coreSlabGeometry,
    glassSlabGeometry,
    edgeBarGeometry,
    matteMaterial,
    frostedGlassPrimary,
    accentMaterial,
  ]);

  const travel = isVertical ? 18 : 24;

  const leadGlassX =
    progress <= 0.5
      ? interpolate(progress, [0, 0.4], [-travel, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : interpolate(progress, [0.58, 0.94], [0, travel], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.in(Easing.cubic),
        });

  const coreMatteX =
    progress <= 0.5
      ? interpolate(progress, [0.1, 0.42], [-travel, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : interpolate(progress, [0.58, 0.92], [0, travel], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.in(Easing.cubic),
        });

  const trailGlassX =
    progress <= 0.5
      ? interpolate(progress, [0.16, 0.44], [-travel, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : interpolate(progress, [0.6, 1], [0, travel], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.in(Easing.cubic),
        });

  return (
    <>
      <ambientLight intensity={0.82} />
      <directionalLight position={[6, 8, 12]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.5} color={accentHex} />

      <group rotation={[0, 0, -0.08]}>
        <group
          position={[leadGlassX, 0, 0.28]}
          visible={Math.abs(leadGlassX) < travel - 0.5}
        >
          <mesh geometry={glassSlabGeometry} material={frostedGlassPrimary} />
          <mesh
            geometry={edgeBarGeometry}
            material={accentMaterial}
            position={[slabW * 0.44, 0, 0.04]}
          />
        </group>

        <group
          position={[coreMatteX, 0, 0]}
          visible={Math.abs(coreMatteX) < travel - 0.5}
        >
          <mesh geometry={coreSlabGeometry} material={matteMaterial} />
        </group>

        <group
          position={[trailGlassX, 0, 0.52]}
          visible={Math.abs(trailGlassX) < travel - 0.5}
        >
          <mesh geometry={glassSlabGeometry} material={frostedGlassPrimary} />
          <mesh
            geometry={edgeBarGeometry}
            material={accentMaterial}
            position={[-slabW * 0.44, 0, 0.04]}
          />
        </group>
      </group>
    </>
  );
};

export const GlassSlabRefractionWipe4K: React.FC<
  GlassSlabRefractionWipe4KProps
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
        <GlassSlabRefractionScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

