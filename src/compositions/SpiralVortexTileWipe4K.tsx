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

export const spiralVortexTileWipeThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type SpiralVortexTileWipeThemePreset =
  (typeof spiralVortexTileWipeThemePresets)[number];

export const spiralVortexTileWipe4KSchema = z.object({
  themePreset: z.enum(spiralVortexTileWipeThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type SpiralVortexTileWipe4KProps = z.infer<
  typeof spiralVortexTileWipe4KSchema
>;

export const defaultSpiralVortexTileWipe4KProps: SpiralVortexTileWipe4KProps = {
  themePreset: "monochrome-luxury",
  aspectRatio: "16:9",
  backgroundColor: "transparent",
  primaryColor: "#18181B",
  secondaryColor: "#3F3F46",
  accentColor: "#E4E4E7",
  speedMultiplier: 1,
  strokeWidth: 2,
};

export const spiralVortexTileWipe4KVariations: Record<
  SpiralVortexTileWipeThemePreset,
  Omit<SpiralVortexTileWipe4KProps, "aspectRatio" | "speedMultiplier" | "strokeWidth">
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

interface SpiralCell {
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

const SpiralVortexTileScene: React.FC<{
  props: SpiralVortexTileWipe4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset = spiralVortexTileWipe4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor === defaultSpiralVortexTileWipe4KProps.primaryColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultSpiralVortexTileWipe4KProps.secondaryColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultSpiralVortexTileWipe4KProps.accentColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const cols = isVertical ? 9 : 15;
  const rows = isVertical ? 15 : 9;
  const worldW = isVertical ? 9 : 16;
  const worldH = isVertical ? 16 : 9;
  const tileW = worldW / cols;
  const tileH = worldH / rows;

  const tileGeometry = useMemo(() => {
    return new RoundedBoxGeometry(tileW * 1.04, tileH * 1.04, 0.2, 2, 0.03);
  }, [tileW, tileH]);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.3,
        roughness: 0.34,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.36,
        roughness: 0.28,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.54,
        roughness: 0.22,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      tileGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [tileGeometry, materials]);

  const cells = useMemo<SpiralCell[]>(() => {
    const orderGrid: number[][] = Array.from({ length: rows }, () =>
      Array(cols).fill(0),
    );
    let top = 0;
    let bottom = rows - 1;
    let left = 0;
    let right = cols - 1;
    let step = 0;

    while (top <= bottom && left <= right) {
      for (let c = left; c <= right; c++) orderGrid[top][c] = step++;
      top++;
      for (let r = top; r <= bottom; r++) orderGrid[r][right] = step++;
      right--;
      if (top <= bottom) {
        for (let c = right; c >= left; c--) orderGrid[bottom][c] = step++;
        bottom--;
      }
      if (left <= right) {
        for (let r = bottom; r >= top; r--) orderGrid[r][left] = step++;
        left++;
      }
    }

    const total = Math.max(1, rows * cols - 1);
    const list: SpiralCell[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = -worldW * 0.5 + (c + 0.5) * tileW;
        const y = worldH * 0.5 - (r + 0.5) * tileH;
        const idx = orderGrid[r][c];
        const delayNorm = idx / total;
        const matIndex = idx % 11 === 5 ? 2 : (r + c) % 2;
        list.push({
          key: `spiral-${r}-${c}`,
          x,
          y,
          delayNorm,
          matIndex,
        });
      }
    }
    return list;
  }, [cols, rows, worldW, worldH, tileW, tileH]);

  const phaseDur = 0.2;
  const enterSpan = 0.42 - phaseDur;
  const exitStart = 0.58;
  const exitSpan = 1 - exitStart - phaseDur;

  return (
    <>
      <ambientLight intensity={0.78} />
      <directionalLight position={[6, 8, 12]} intensity={1.15} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.44} color={accentHex} />

      <group>
        {cells.map((cell) => {
          const inStart = cell.delayNorm * enterSpan;
          const inT = interpolate(progress, [inStart, inStart + phaseDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });

          const outBegin = exitStart + (1 - cell.delayNorm) * exitSpan;
          const outT = interpolate(progress, [outBegin, outBegin + phaseDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          });

          const scale =
            progress <= 0.5
              ? interpolate(inT, [0, 1], [0, 1])
              : interpolate(outT, [0, 1], [1, 0]);

          const twistZ =
            progress <= 0.5
              ? interpolate(inT, [0, 1], [Math.PI * 0.65, 0])
              : interpolate(outT, [0, 1], [0, -Math.PI * 0.65]);

          const zPos =
            progress <= 0.5
              ? Math.sin(inT * Math.PI) * 0.55
              : Math.sin(outT * Math.PI) * 0.55;

          const visible = scale > 0.002;

          return (
            <mesh
              key={cell.key}
              geometry={tileGeometry}
              material={materials[cell.matIndex]}
              position={[cell.x, cell.y, zPos]}
              rotation={[0, 0, twistZ]}
              scale={visible ? [scale, scale, scale] : [0.0001, 0.0001, 0.0001]}
              visible={visible}
            />
          );
        })}
      </group>
    </>
  );
};

export const SpiralVortexTileWipe4K: React.FC<SpiralVortexTileWipe4KProps> = (
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
        <SpiralVortexTileScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

