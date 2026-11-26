import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
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

export const diagonalLowPolyShardSweepThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type DiagonalLowPolyShardSweepThemePreset =
  (typeof diagonalLowPolyShardSweepThemePresets)[number];

export const diagonalLowPolyShardSweep4KSchema = z.object({
  themePreset: z.enum(diagonalLowPolyShardSweepThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type DiagonalLowPolyShardSweep4KProps = z.infer<
  typeof diagonalLowPolyShardSweep4KSchema
>;

export const defaultDiagonalLowPolyShardSweep4KProps: DiagonalLowPolyShardSweep4KProps =
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

export const diagonalLowPolyShardSweep4KVariations: Record<
  DiagonalLowPolyShardSweepThemePreset,
  Omit<
    DiagonalLowPolyShardSweep4KProps,
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

interface ShardSpec {
  key: string;
  targetX: number;
  targetY: number;
  targetZ: number;
  rotZ: number;
  scaleX: number;
  scaleY: number;
  delayNorm: number;
  matIndex: number;
}

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

const DiagonalLowPolyShardSweepScene: React.FC<{
  props: DiagonalLowPolyShardSweep4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset = diagonalLowPolyShardSweep4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultDiagonalLowPolyShardSweep4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultDiagonalLowPolyShardSweep4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultDiagonalLowPolyShardSweep4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const shardRadius = isVertical ? 8.2 : 8.6;

  const shardGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(shardRadius, shardRadius * 0.95, 0.24, 3);
  }, [shardRadius]);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.25,
        roughness: 0.42,
        flatShading: true,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.3,
        roughness: 0.36,
        flatShading: true,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.5,
        roughness: 0.24,
        flatShading: true,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      shardGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [shardGeometry, materials]);

  const shards = useMemo<ShardSpec[]>(() => {
    return [
      { key: "s0", targetX: -4.2, targetY: -1.8, targetZ: 0.05, rotZ: 0.15, scaleX: 1.45, scaleY: 1.45, delayNorm: 0.0, matIndex: 0 },
      { key: "s1", targetX: 4.2, targetY: 1.8, targetZ: 0.08, rotZ: Math.PI + 0.15, scaleX: 1.45, scaleY: 1.45, delayNorm: 0.14, matIndex: 1 },
      { key: "s2", targetX: 0.0, targetY: -3.2, targetZ: 0.12, rotZ: -0.35, scaleX: 1.65, scaleY: 1.35, delayNorm: 0.26, matIndex: 1 },
      { key: "s3", targetX: 0.0, targetY: 3.2, targetZ: 0.16, rotZ: Math.PI - 0.35, scaleX: 1.65, scaleY: 1.35, delayNorm: 0.38, matIndex: 0 },
      { key: "s4", targetX: -3.5, targetY: 2.2, targetZ: 0.2, rotZ: 0.65, scaleX: 1.3, scaleY: 1.3, delayNorm: 0.52, matIndex: 2 },
      { key: "s5", targetX: 3.5, targetY: -2.2, targetZ: 0.24, rotZ: Math.PI + 0.65, scaleX: 1.3, scaleY: 1.3, delayNorm: 0.66, matIndex: 2 },
      { key: "s6", targetX: -0.8, targetY: 0.4, targetZ: 0.28, rotZ: 0.1, scaleX: 1.85, scaleY: 1.65, delayNorm: 0.8, matIndex: 0 },
      { key: "s7", targetX: 0.8, targetY: -0.4, targetZ: 0.32, rotZ: Math.PI + 0.1, scaleX: 1.85, scaleY: 1.65, delayNorm: 0.94, matIndex: 1 },
    ];
  }, []);

  const sweepDur = 0.26;
  const enterSpan = 0.42 - sweepDur;
  const exitStart = 0.58;
  const exitSpan = 1 - exitStart - sweepDur;
  const travelDist = isVertical ? 24 : 26;

  return (
    <>
      <ambientLight intensity={0.78} />
      <directionalLight position={[6, 8, 12]} intensity={1.15} color="#ffffff" />
      <directionalLight position={[-6, -5, 8]} intensity={0.44} color={accentHex} />

      <group>
        {shards.map((shard) => {
          const inStart = shard.delayNorm * enterSpan;
          const inT = interpolate(progress, [inStart, inStart + sweepDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });

          const outBegin = exitStart + shard.delayNorm * exitSpan;
          const outT = interpolate(progress, [outBegin, outBegin + sweepDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          });

          const slide =
            progress <= 0.5
              ? interpolate(inT, [0, 1], [-travelDist, 0])
              : interpolate(outT, [0, 1], [0, travelDist]);

          const x = shard.targetX + slide * 0.78;
          const y = shard.targetY + slide * 0.58;
          const onScreen = Math.abs(slide) < travelDist - 0.5;

          return (
            <group
              key={shard.key}
              position={[x, y, shard.targetZ]}
              rotation={[0, 0, shard.rotZ]}
              scale={[shard.scaleX, shard.scaleY, 1]}
              visible={onScreen}
            >
              <mesh
                geometry={shardGeometry}
                material={materials[shard.matIndex]}
                rotation={[Math.PI / 2, 0, 0]}
              />
            </group>
          );
        })}
      </group>
    </>
  );
};

export const DiagonalLowPolyShardSweep4K: React.FC<
  DiagonalLowPolyShardSweep4KProps
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
        <DiagonalLowPolyShardSweepScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

