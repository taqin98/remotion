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

export const pixelBlockDissolveWipe3DThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type PixelBlockDissolveWipe3DThemePreset =
  (typeof pixelBlockDissolveWipe3DThemePresets)[number];

export const pixelBlockDissolveWipe3D4KSchema = z.object({
  themePreset: z.enum(pixelBlockDissolveWipe3DThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type PixelBlockDissolveWipe3D4KProps = z.infer<
  typeof pixelBlockDissolveWipe3D4KSchema
>;

export const defaultPixelBlockDissolveWipe3D4KProps: PixelBlockDissolveWipe3D4KProps =
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

export const pixelBlockDissolveWipe3D4KVariations: Record<
  PixelBlockDissolveWipe3DThemePreset,
  Omit<
    PixelBlockDissolveWipe3D4KProps,
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

interface PixelCube {
  key: string;
  x: number;
  y: number;
  zOffsetIn: number;
  zOffsetOut: number;
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

const PixelBlockDissolveScene: React.FC<{
  props: PixelBlockDissolveWipe3D4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset = pixelBlockDissolveWipe3D4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultPixelBlockDissolveWipe3D4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultPixelBlockDissolveWipe3D4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultPixelBlockDissolveWipe3D4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const cols = isVertical ? 10 : 20;
  const rows = isVertical ? 20 : 10;
  const worldW = isVertical ? 9 : 16;
  const worldH = isVertical ? 16 : 9;
  const tileW = worldW / cols;
  const tileH = worldH / rows;
  const cubeSize = Math.min(tileW, tileH);

  const cubeGeometry = useMemo(() => {
    return new RoundedBoxGeometry(tileW * 1.04, tileH * 1.04, cubeSize * 0.9, 2, 0.025);
  }, [tileW, tileH, cubeSize]);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.28,
        roughness: 0.34,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.34,
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
      cubeGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [cubeGeometry, materials]);

  const cubes = useMemo<PixelCube[]>(() => {
    const list: PixelCube[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = -worldW * 0.5 + (c + 0.5) * tileW;
        const y = worldH * 0.5 - (r + 0.5) * tileH;
        const hashA = Math.abs(Math.sin((r + 1) * 12.9898 + (c + 1) * 78.233)) % 1;
        const hashB = Math.abs(Math.sin((r + 9) * 39.346 + (c + 3) * 11.135)) % 1;
        const xBias = c / Math.max(1, cols - 1);
        const delayNorm = Math.min(1, xBias * 0.45 + hashA * 0.55);
        const matIndex = hashB > 0.86 ? 2 : (r + c) % 2;
        list.push({
          key: `px-${r}-${c}`,
          x,
          y,
          zOffsetIn: -2.2 - hashA * 2.4,
          zOffsetOut: 2.2 + hashB * 2.4,
          delayNorm,
          matIndex,
        });
      }
    }
    return list;
  }, [cols, rows, worldW, worldH, tileW, tileH]);

  const phaseDur = 0.22;
  const enterSpan = 0.42 - phaseDur;
  const exitStart = 0.58;
  const exitSpan = 1 - exitStart - phaseDur;

  return (
    <>
      <ambientLight intensity={0.78} />
      <directionalLight position={[6, 8, 12]} intensity={1.15} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.44} color={accentHex} />

      <group>
        {cubes.map((cube) => {
          const inStart = cube.delayNorm * enterSpan;
          const inT = interpolate(progress, [inStart, inStart + phaseDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });

          const outBegin = exitStart + cube.delayNorm * exitSpan;
          const outT = interpolate(progress, [outBegin, outBegin + phaseDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          });

          const scale =
            progress <= 0.5
              ? interpolate(inT, [0, 1], [0, 1])
              : interpolate(outT, [0, 1], [1, 0]);

          const z =
            progress <= 0.5
              ? interpolate(inT, [0, 1], [cube.zOffsetIn, 0])
              : interpolate(outT, [0, 1], [0, cube.zOffsetOut]);

          const rot =
            progress <= 0.5
              ? interpolate(inT, [0, 1], [Math.PI * 0.5, 0])
              : interpolate(outT, [0, 1], [0, -Math.PI * 0.5]);

          const visible = scale > 0.002;

          return (
            <mesh
              key={cube.key}
              geometry={cubeGeometry}
              material={materials[cube.matIndex]}
              position={[cube.x, cube.y, z]}
              rotation={[rot, rot * 0.5, 0]}
              scale={visible ? [scale, scale, scale] : [0.0001, 0.0001, 0.0001]}
              visible={visible}
            />
          );
        })}
      </group>
    </>
  );
};

export const PixelBlockDissolveWipe3D4K: React.FC<
  PixelBlockDissolveWipe3D4KProps
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
        <PixelBlockDissolveScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

