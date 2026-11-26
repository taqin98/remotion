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

export const spinningCrossPlusGridWipeThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type SpinningCrossPlusGridWipeThemePreset =
  (typeof spinningCrossPlusGridWipeThemePresets)[number];

export const spinningCrossPlusGridWipe4KSchema = z.object({
  themePreset: z.enum(spinningCrossPlusGridWipeThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type SpinningCrossPlusGridWipe4KProps = z.infer<
  typeof spinningCrossPlusGridWipe4KSchema
>;

export const defaultSpinningCrossPlusGridWipe4KProps: SpinningCrossPlusGridWipe4KProps =
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

export const spinningCrossPlusGridWipe4KVariations: Record<
  SpinningCrossPlusGridWipeThemePreset,
  Omit<
    SpinningCrossPlusGridWipe4KProps,
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

interface PlusCell {
  key: string;
  x: number;
  y: number;
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

const SpinningCrossPlusGridScene: React.FC<{
  props: SpinningCrossPlusGridWipe4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset = spinningCrossPlusGridWipe4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultSpinningCrossPlusGridWipe4KProps.primaryColor &&
    props.themePreset !== "clean-corporate"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultSpinningCrossPlusGridWipe4KProps.secondaryColor &&
    props.themePreset !== "clean-corporate"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultSpinningCrossPlusGridWipe4KProps.accentColor &&
    props.themePreset !== "clean-corporate"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const cols = isVertical ? 7 : 12;
  const rows = isVertical ? 12 : 7;
  const worldW = isVertical ? 9 : 16;
  const worldH = isVertical ? 16 : 9;
  const cellSize = Math.max(worldW / cols, worldH / rows);

  const armGeometry = useMemo(() => {
    return new RoundedBoxGeometry(cellSize * 1.48, cellSize * 0.44, 0.2, 2, 0.03);
  }, [cellSize]);

  const hubGeometry = useMemo(() => {
    return new RoundedBoxGeometry(cellSize * 1.48, cellSize * 1.48, 0.16, 2, 0.03);
  }, [cellSize]);

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
        metalness: 0.5,
        roughness: 0.22,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      armGeometry.dispose();
      hubGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [armGeometry, hubGeometry, materials]);

  const cells = useMemo<PlusCell[]>(() => {
    const list: PlusCell[] = [];
    const stepX = worldW / cols;
    const stepY = worldH / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = -worldW * 0.5 + (c + 0.5) * stepX;
        const y = worldH * 0.5 - (r + 0.5) * stepY;
        const delayNorm =
          (c / Math.max(1, cols - 1)) * 0.55 + (r / Math.max(1, rows - 1)) * 0.45;
        const hash = Math.abs(Math.sin((r + 2) * 19.17 + (c + 5) * 41.33));
        const matIndex = hash > 0.84 ? 2 : (r + c) % 2;
        list.push({
          key: `plus-${r}-${c}`,
          x,
          y,
          delayNorm,
          matIndex,
        });
      }
    }
    return list;
  }, [cols, rows, worldW, worldH]);

  const phaseDur = 0.24;
  const enterSpan = 0.42 - phaseDur;
  const exitStart = 0.58;
  const exitSpan = 1 - exitStart - phaseDur;

  return (
    <>
      <ambientLight intensity={0.78} />
      <directionalLight position={[6, 8, 12]} intensity={1.15} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.42} color={accentHex} />

      <group>
        {cells.map((cell) => {
          const inStart = cell.delayNorm * enterSpan;
          const inT = interpolate(progress, [inStart, inStart + phaseDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });

          const outBegin = exitStart + cell.delayNorm * exitSpan;
          const outT = interpolate(progress, [outBegin, outBegin + phaseDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          });

          const crossScale =
            progress <= 0.5
              ? interpolate(inT, [0, 1], [0, 1])
              : interpolate(outT, [0, 1], [1, 0]);

          const lockFillScale =
            progress <= 0.5
              ? interpolate(inT, [0.55, 1], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.out(Easing.cubic),
                })
              : interpolate(outT, [0, 0.45], [1, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.in(Easing.cubic),
                });

          const rotZ =
            progress <= 0.5
              ? interpolate(inT, [0, 1], [0, Math.PI / 4])
              : interpolate(outT, [0, 1], [Math.PI / 4, Math.PI / 2]);

          const visible = crossScale > 0.002;

          return (
            <group
              key={cell.key}
              position={[cell.x, cell.y, 0]}
              rotation={[0, 0, rotZ]}
              scale={
                visible
                  ? [crossScale, crossScale, crossScale]
                  : [0.0001, 0.0001, 0.0001]
              }
              visible={visible}
            >
              <mesh geometry={armGeometry} material={materials[cell.matIndex]} />
              <mesh
                geometry={armGeometry}
                material={materials[cell.matIndex]}
                rotation={[0, 0, Math.PI / 2]}
              />
              {lockFillScale > 0.002 && (
                <mesh
                  geometry={hubGeometry}
                  material={materials[(cell.matIndex + 1) % 2]}
                  position={[0, 0, -0.02]}
                  scale={[lockFillScale, lockFillScale, 1]}
                />
              )}
            </group>
          );
        })}
      </group>
    </>
  );
};

export const SpinningCrossPlusGridWipe4K: React.FC<
  SpinningCrossPlusGridWipe4KProps
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
        <SpinningCrossPlusGridScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

