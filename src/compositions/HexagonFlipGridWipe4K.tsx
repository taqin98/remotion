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

export const hexagonFlipGridWipeThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type HexagonFlipGridWipeThemePreset =
  (typeof hexagonFlipGridWipeThemePresets)[number];

export const hexagonFlipGridWipe4KSchema = z.object({
  themePreset: z.enum(hexagonFlipGridWipeThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type HexagonFlipGridWipe4KProps = z.infer<
  typeof hexagonFlipGridWipe4KSchema
>;

export const defaultHexagonFlipGridWipe4KProps: HexagonFlipGridWipe4KProps = {
  themePreset: "dark-tech",
  aspectRatio: "16:9",
  backgroundColor: "transparent",
  primaryColor: "#1E293B",
  secondaryColor: "#334155",
  accentColor: "#38BDF8",
  speedMultiplier: 1,
  strokeWidth: 2,
};

export const hexagonFlipGridWipe4KVariations: Record<
  HexagonFlipGridWipeThemePreset,
  Omit<HexagonFlipGridWipe4KProps, "aspectRatio" | "speedMultiplier" | "strokeWidth">
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

interface HexCellData {
  key: string;
  x: number;
  y: number;
  delayNorm: number;
  materialIndex: number;
  baseSpin: number;
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

const HexagonFlipGridScene: React.FC<{
  props: HexagonFlipGridWipe4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset = hexagonFlipGridWipe4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor === defaultHexagonFlipGridWipe4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor === defaultHexagonFlipGridWipe4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultHexagonFlipGridWipe4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const cols = isVertical ? 11 : 15;
  const rows = isVertical ? 17 : 9;
  const radius = isVertical ? 0.62 : 0.72;
  const depth = 0.24;

  const hexGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(radius, radius * 0.94, depth, 6);
  }, [radius, depth]);

  const trimGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(radius * 0.84, radius * 0.84, depth + 0.02, 6);
  }, [radius, depth]);

  const materials = useMemo(() => {
    const primaryMat = new THREE.MeshStandardMaterial({
      color: primaryHex,
      metalness: 0.28,
      roughness: 0.36,
    });
    const secondaryMat = new THREE.MeshStandardMaterial({
      color: secondaryHex,
      metalness: 0.32,
      roughness: 0.32,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: accentHex,
      metalness: 0.45,
      roughness: 0.24,
      emissive: accentHex,
      emissiveIntensity: 0.08,
    });
    return [primaryMat, secondaryMat, accentMat];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      hexGeometry.dispose();
      trimGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [hexGeometry, trimGeometry, materials]);

  const cells = useMemo<HexCellData[]>(() => {
    const list: HexCellData[] = [];
    const dx = radius * Math.sqrt(3);
    const dy = radius * 1.5;
    const totalW = (cols - 1) * dx;
    const totalH = (rows - 1) * dy;

    for (let r = 0; r < rows; r++) {
      const rowOffset = r % 2 === 1 ? dx * 0.5 : 0;
      for (let c = 0; c < cols; c++) {
        const x = -totalW * 0.5 + c * dx + rowOffset - dx * 0.25;
        const y = totalH * 0.5 - r * dy;
        const diag =
          (c / Math.max(1, cols - 1)) * 0.62 +
          (r / Math.max(1, rows - 1)) * 0.38;
        const hash = Math.abs(Math.sin((r + 1) * 12.9898 + (c + 1) * 78.233));
        const matIdx = hash > 0.84 ? 2 : (r + c) % 2;
        list.push({
          key: `hex-${r}-${c}`,
          x,
          y,
          delayNorm: diag,
          materialIndex: matIdx,
          baseSpin: (r + c) % 2 === 0 ? 1 : -1,
        });
      }
    }
    return list;
  }, [cols, rows, radius]);

  const phaseDuration = 0.24;
  const enterSpan = 0.42 - phaseDuration;
  const exitStart = 0.58;
  const exitSpan = 1 - exitStart - phaseDuration;

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[6, 8, 12]} intensity={1.15} color="#ffffff" />
      <directionalLight position={[-6, -5, 8]} intensity={0.45} color={accentHex} />

      <group>
        {cells.map((cell) => {
          const inStart = cell.delayNorm * enterSpan;
          const inProgress = interpolate(
            progress,
            [inStart, inStart + phaseDuration],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.inOut(Easing.cubic),
            },
          );

          const outStart = exitStart + cell.delayNorm * exitSpan;
          const outProgress = interpolate(
            progress,
            [outStart, outStart + phaseDuration],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.inOut(Easing.cubic),
            },
          );

          const activeScaleIn = interpolate(inProgress, [0, 0.22, 1], [0, 1.03, 1.025], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const activeScaleOut = interpolate(outProgress, [0, 0.78, 1], [1.025, 1.03, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const scale = progress <= 0.5 ? activeScaleIn : activeScaleOut;

          const rotY =
            progress <= 0.5
              ? interpolate(inProgress, [0, 1], [-Math.PI, 0]) * cell.baseSpin
              : interpolate(outProgress, [0, 1], [0, Math.PI]) * cell.baseSpin;

          const zOffset =
            progress <= 0.5
              ? Math.sin(inProgress * Math.PI) * 0.45
              : Math.sin(outProgress * Math.PI) * 0.45;

          const visible = scale > 0.002;

          return (
            <group
              key={cell.key}
              position={[cell.x, cell.y, zOffset]}
              rotation={[0, rotY, 0]}
              scale={visible ? [scale, scale, scale] : [0.0001, 0.0001, 0.0001]}
              visible={visible}
            >
              <mesh
                geometry={hexGeometry}
                material={materials[cell.materialIndex]}
                rotation={[Math.PI / 2, 0, 0]}
              />
              {cell.materialIndex === 2 && (
                <mesh
                  geometry={trimGeometry}
                  material={materials[0]}
                  rotation={[Math.PI / 2, 0, 0]}
                />
              )}
            </group>
          );
        })}
      </group>
    </>
  );
};

export const HexagonFlipGridWipe4K: React.FC<HexagonFlipGridWipe4KProps> = (props) => {
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
        <HexagonFlipGridScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

