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

export const multiLayerRibbonWipeThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type MultiLayerRibbonWipeThemePreset =
  (typeof multiLayerRibbonWipeThemePresets)[number];

export const multiLayerRibbonWipe4KSchema = z.object({
  themePreset: z.enum(multiLayerRibbonWipeThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type MultiLayerRibbonWipe4KProps = z.infer<
  typeof multiLayerRibbonWipe4KSchema
>;

export const defaultMultiLayerRibbonWipe4KProps: MultiLayerRibbonWipe4KProps = {
  themePreset: "clean-corporate",
  aspectRatio: "16:9",
  backgroundColor: "transparent",
  primaryColor: "#FFFFFF",
  secondaryColor: "#E2E8F0",
  accentColor: "#2563EB",
  speedMultiplier: 1,
  strokeWidth: 2,
};

export const multiLayerRibbonWipe4KVariations: Record<
  MultiLayerRibbonWipeThemePreset,
  Omit<MultiLayerRibbonWipe4KProps, "aspectRatio" | "speedMultiplier" | "strokeWidth">
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

const MultiLayerRibbonScene: React.FC<{
  props: MultiLayerRibbonWipe4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset = multiLayerRibbonWipe4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor === defaultMultiLayerRibbonWipe4KProps.primaryColor &&
    props.themePreset !== "clean-corporate"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultMultiLayerRibbonWipe4KProps.secondaryColor &&
    props.themePreset !== "clean-corporate"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultMultiLayerRibbonWipe4KProps.accentColor &&
    props.themePreset !== "clean-corporate"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const ribbonCount = 6;
  const worldW = isVertical ? 10 : 17.2;
  const worldH = isVertical ? 16.4 : 9.4;
  const ribbonH = (worldH / ribbonCount) * 1.1;

  const ribbonGeometry = useMemo(() => {
    return new RoundedBoxGeometry(worldW, ribbonH, 0.24, 3, 0.04);
  }, [worldW, ribbonH]);

  const trimGeometry = useMemo(() => {
    return new RoundedBoxGeometry(worldW, 0.07 * props.strokeWidth, 0.28, 2, 0.02);
  }, [worldW, props.strokeWidth]);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.24,
        roughness: 0.34,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.3,
        roughness: 0.28,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.52,
        roughness: 0.22,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      ribbonGeometry.dispose();
      trimGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [ribbonGeometry, trimGeometry, materials]);

  const ribbons = useMemo(() => {
    const stepY = worldH / ribbonCount;
    const delays = [0.0, 0.35, 0.15, 0.6, 0.25, 0.48];
    return Array.from({ length: ribbonCount }, (_, i) => ({
      key: `ribbon-${i}`,
      y: worldH * 0.5 - (i + 0.5) * stepY,
      z: (i % 3) * 0.14,
      delayNorm: delays[i],
      matIndex: i % 2,
      hasAccent: i % 2 === 1,
    }));
  }, [ribbonCount, worldH]);

  const travelX = worldW + 0.6;
  const sweepDur = 0.26;
  const enterSpan = 0.42 - sweepDur;
  const exitStart = 0.58;
  const exitSpan = 1 - exitStart - sweepDur;

  return (
    <>
      <ambientLight intensity={0.78} />
      <directionalLight position={[6, 8, 12]} intensity={1.15} color="#ffffff" />
      <directionalLight position={[-6, -5, 8]} intensity={0.42} color={accentHex} />

      <group>
        {ribbons.map((ribbon) => {
          const inStart = ribbon.delayNorm * enterSpan;
          const inT = interpolate(progress, [inStart, inStart + sweepDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });

          const outBegin = exitStart + ribbon.delayNorm * exitSpan;
          const outT = interpolate(progress, [outBegin, outBegin + sweepDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          });

          const x =
            progress <= 0.5
              ? interpolate(inT, [0, 1], [-travelX, 0])
              : interpolate(outT, [0, 1], [0, travelX]);

          const tiltY =
            progress <= 0.5
              ? interpolate(inT, [0, 0.5, 1], [0.06, 0.12, 0])
              : interpolate(outT, [0, 0.5, 1], [0, -0.12, -0.06]);

          const onScreen = Math.abs(x) < travelX - 0.35;

          return (
            <group
              key={ribbon.key}
              position={[x, ribbon.y, ribbon.z]}
              rotation={[tiltY, 0, 0]}
              visible={onScreen}
            >
              <mesh geometry={ribbonGeometry} material={materials[ribbon.matIndex]} />
              {ribbon.hasAccent && (
                <mesh
                  geometry={trimGeometry}
                  material={materials[2]}
                  position={[0, -ribbonH * 0.4, 0.04]}
                />
              )}
            </group>
          );
        })}
      </group>
    </>
  );
};

export const MultiLayerRibbonWipe4K: React.FC<MultiLayerRibbonWipe4KProps> = (
  props,
) => {
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
        <MultiLayerRibbonScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

