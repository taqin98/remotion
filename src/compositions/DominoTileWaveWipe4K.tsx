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

export const dominoTileWaveWipeThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type DominoTileWaveWipeThemePreset =
  (typeof dominoTileWaveWipeThemePresets)[number];

export const dominoTileWaveWipe4KSchema = z.object({
  themePreset: z.enum(dominoTileWaveWipeThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type DominoTileWaveWipe4KProps = z.infer<
  typeof dominoTileWaveWipe4KSchema
>;

export const defaultDominoTileWaveWipe4KProps: DominoTileWaveWipe4KProps = {
  themePreset: "warm-minimalist",
  aspectRatio: "16:9",
  backgroundColor: "transparent",
  primaryColor: "#F5F0E6",
  secondaryColor: "#E5DAC8",
  accentColor: "#D97706",
  speedMultiplier: 1,
  strokeWidth: 2,
};

export const dominoTileWaveWipe4KVariations: Record<
  DominoTileWaveWipeThemePreset,
  Omit<DominoTileWaveWipe4KProps, "aspectRatio" | "speedMultiplier" | "strokeWidth">
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

interface DominoTile {
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

const DominoTileWaveScene: React.FC<{
  props: DominoTileWaveWipe4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset = dominoTileWaveWipe4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor === defaultDominoTileWaveWipe4KProps.primaryColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor === defaultDominoTileWaveWipe4KProps.secondaryColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultDominoTileWaveWipe4KProps.accentColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const cols = isVertical ? 8 : 14;
  const rows = isVertical ? 11 : 6;
  const worldW = isVertical ? 9 : 16;
  const worldH = isVertical ? 16 : 9;
  const tileW = worldW / cols;
  const tileH = worldH / rows;

  const dominoGeometry = useMemo(() => {
    return new RoundedBoxGeometry(tileW * 1.04, tileH * 1.04, 0.22, 2, 0.03);
  }, [tileW, tileH]);

  const notchGeometry = useMemo(() => {
    return new THREE.BoxGeometry(tileW * 0.78, 0.04 * props.strokeWidth, 0.24);
  }, [tileW, props.strokeWidth]);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.22,
        roughness: 0.36,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.26,
        roughness: 0.32,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.44,
        roughness: 0.24,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      dominoGeometry.dispose();
      notchGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [dominoGeometry, notchGeometry, materials]);

  const tiles = useMemo<DominoTile[]>(() => {
    const list: DominoTile[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = -worldW * 0.5 + (c + 0.5) * tileW;
        const y = worldH * 0.5 - (r + 0.5) * tileH;
        const delayNorm =
          (c / Math.max(1, cols - 1)) * 0.72 + (r / Math.max(1, rows - 1)) * 0.28;
        const hash = Math.abs(Math.sin((r + 3) * 17.73 + (c + 4) * 53.19));
        const matIndex = hash > 0.85 ? 2 : (r + c) % 2;
        list.push({
          key: `dom-${r}-${c}`,
          x,
          y,
          delayNorm,
          matIndex,
        });
      }
    }
    return list;
  }, [cols, rows, worldW, worldH, tileW, tileH]);

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
        {tiles.map((tile) => {
          const inStart = tile.delayNorm * enterSpan;
          const inT = interpolate(progress, [inStart, inStart + phaseDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });

          const outBegin = exitStart + tile.delayNorm * exitSpan;
          const outT = interpolate(progress, [outBegin, outBegin + phaseDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          });

          const rotX =
            progress <= 0.5
              ? interpolate(inT, [0, 1], [-Math.PI * 0.54, 0])
              : interpolate(outT, [0, 1], [0, Math.PI * 0.54]);

          const scale =
            progress <= 0.5
              ? interpolate(inT, [0, 0.22, 1], [0, 1, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              : interpolate(outT, [0, 0.78, 1], [1, 1, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });

          const visible = scale > 0.002;

          return (
            <group
              key={tile.key}
              position={[tile.x, tile.y, 0]}
              rotation={[rotX, 0, 0]}
              scale={visible ? [scale, scale, scale] : [0.0001, 0.0001, 0.0001]}
              visible={visible}
            >
              <mesh geometry={dominoGeometry} material={materials[tile.matIndex]} />
              {tile.matIndex === 2 && (
                <mesh geometry={notchGeometry} material={materials[0]} />
              )}
            </group>
          );
        })}
      </group>
    </>
  );
};

export const DominoTileWaveWipe4K: React.FC<DominoTileWaveWipe4KProps> = (
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
        <DominoTileWaveScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

