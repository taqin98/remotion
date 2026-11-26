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

export const isometricCubeCurtainWipeThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type IsometricCubeCurtainWipeThemePreset =
  (typeof isometricCubeCurtainWipeThemePresets)[number];

export const isometricCubeCurtainWipe4KSchema = z.object({
  themePreset: z.enum(isometricCubeCurtainWipeThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type IsometricCubeCurtainWipe4KProps = z.infer<
  typeof isometricCubeCurtainWipe4KSchema
>;

export const defaultIsometricCubeCurtainWipe4KProps: IsometricCubeCurtainWipe4KProps = {
  themePreset: "clean-corporate",
  aspectRatio: "16:9",
  backgroundColor: "transparent",
  primaryColor: "#FFFFFF",
  secondaryColor: "#E2E8F0",
  accentColor: "#2563EB",
  speedMultiplier: 1,
  strokeWidth: 2,
};

export const isometricCubeCurtainWipe4KVariations: Record<
  IsometricCubeCurtainWipeThemePreset,
  Omit<IsometricCubeCurtainWipe4KProps, "aspectRatio" | "speedMultiplier" | "strokeWidth">
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

interface CubeCell {
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

const IsometricCubeCurtainScene: React.FC<{
  props: IsometricCubeCurtainWipe4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset = isometricCubeCurtainWipe4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor === defaultIsometricCubeCurtainWipe4KProps.primaryColor &&
    props.themePreset !== "clean-corporate"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor === defaultIsometricCubeCurtainWipe4KProps.secondaryColor &&
    props.themePreset !== "clean-corporate"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultIsometricCubeCurtainWipe4KProps.accentColor &&
    props.themePreset !== "clean-corporate"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const cols = isVertical ? 8 : 13;
  const rows = isVertical ? 14 : 8;
  const worldW = isVertical ? 9 : 16;
  const worldH = isVertical ? 16 : 9;
  const tileW = worldW / cols;
  const tileH = worldH / rows;
  const cubeDepth = Math.min(tileW, tileH) * 0.9;

  const cubeGeometry = useMemo(() => {
    return new RoundedBoxGeometry(tileW * 1.03, tileH * 1.03, cubeDepth, 3, 0.04);
  }, [tileW, tileH, cubeDepth]);

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
        metalness: 0.42,
        roughness: 0.24,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      cubeGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [cubeGeometry, materials]);

  const cells = useMemo<CubeCell[]>(() => {
    const list: CubeCell[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = -worldW * 0.5 + (c + 0.5) * tileW;
        const y = worldH * 0.5 - (r + 0.5) * tileH;
        const colNorm = c / Math.max(1, cols - 1);
        const rowNorm = r / Math.max(1, rows - 1);
        const delayNorm = colNorm * 0.72 + Math.abs(rowNorm - 0.5) * 0.28;
        const hash = Math.abs(Math.sin((r + 3) * 19.31 + (c + 2) * 47.17));
        const matIndex = hash > 0.85 ? 2 : (r + c) % 2;
        list.push({
          key: `cube-${r}-${c}`,
          x,
          y,
          delayNorm,
          matIndex,
        });
      }
    }
    return list;
  }, [cols, rows, worldW, worldH, tileW, tileH]);

  const stepDur = 0.23;
  const enterSpan = 0.42 - stepDur;
  const exitStart = 0.58;
  const exitSpan = 1 - exitStart - stepDur;

  return (
    <>
      <ambientLight intensity={0.78} />
      <directionalLight position={[5, 8, 12]} intensity={1.1} color="#ffffff" />
      <directionalLight position={[-6, -4, 6]} intensity={0.4} color={accentHex} />

      <group>
        {cells.map((cell) => {
          const inStart = cell.delayNorm * enterSpan;
          const inT = interpolate(progress, [inStart, inStart + stepDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });

          const outBegin = exitStart + cell.delayNorm * exitSpan;
          const outT = interpolate(progress, [outBegin, outBegin + stepDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          });

          const scale =
            progress <= 0.5
              ? interpolate(inT, [0, 1], [0, 1])
              : interpolate(outT, [0, 1], [1, 0]);

          const zScale =
            progress <= 0.5
              ? interpolate(inT, [0, 0.6, 1], [0.05, 1.5, 1])
              : interpolate(outT, [0, 0.4, 1], [1, 1.4, 0.05]);

          const zPos =
            progress <= 0.5
              ? Math.sin(inT * Math.PI) * 0.45
              : Math.sin(outT * Math.PI) * 0.45;

          const rotZ =
            progress <= 0.5
              ? interpolate(inT, [0, 1], [0.18, 0])
              : interpolate(outT, [0, 1], [0, -0.18]);

          const visible = scale > 0.002;

          return (
            <mesh
              key={cell.key}
              geometry={cubeGeometry}
              material={materials[cell.matIndex]}
              position={[cell.x, cell.y, zPos]}
              rotation={[0, 0, rotZ]}
              scale={
                visible
                  ? [scale, scale, Math.max(0.001, scale * zScale)]
                  : [0.0001, 0.0001, 0.0001]
              }
              visible={visible}
            />
          );
        })}
      </group>
    </>
  );
};

export const IsometricCubeCurtainWipe4K: React.FC<
  IsometricCubeCurtainWipe4KProps
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
        <IsometricCubeCurtainScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

