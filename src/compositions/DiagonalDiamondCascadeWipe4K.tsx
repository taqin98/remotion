import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
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

export const diagonalDiamondCascadeThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type DiagonalDiamondCascadeThemePreset =
  (typeof diagonalDiamondCascadeThemePresets)[number];

export const diagonalDiamondCascadeWipe4KSchema = z.object({
  themePreset: z.enum(diagonalDiamondCascadeThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type DiagonalDiamondCascadeWipe4KProps = z.infer<
  typeof diagonalDiamondCascadeWipe4KSchema
>;

export const defaultDiagonalDiamondCascadeWipe4KProps: DiagonalDiamondCascadeWipe4KProps =
  {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#F5F0E6",
    secondaryColor: "#E5DAC8",
    accentColor: "#D97706",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const diagonalDiamondCascadeWipe4KVariations: Record<
  DiagonalDiamondCascadeThemePreset,
  Omit<
    DiagonalDiamondCascadeWipe4KProps,
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

interface DiamondTile {
  key: string;
  x: number;
  y: number;
  diagNorm: number;
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

const DiagonalDiamondCascadeScene: React.FC<{
  props: DiagonalDiamondCascadeWipe4KProps;
  localFrame: number;
  cycleFrames: number;
}> = ({ props, localFrame, cycleFrames }) => {
  const { fps } = useVideoConfig();
  const preset = diagonalDiamondCascadeWipe4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultDiagonalDiamondCascadeWipe4KProps.primaryColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultDiagonalDiamondCascadeWipe4KProps.secondaryColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultDiagonalDiamondCascadeWipe4KProps.accentColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const cols = isVertical ? 11 : 17;
  const rows = isVertical ? 21 : 11;
  const worldW = isVertical ? 9 : 16;
  const worldH = isVertical ? 16 : 9;

  const stepX = (worldW + 1.6) / (cols - 1);
  const stepY = (worldH + 1.6) / (rows - 1);
  const diamondSide = Math.hypot(stepX * 0.5, stepY) * 1.05;

  const diamondGeometry = useMemo(() => {
    return new RoundedBoxGeometry(diamondSide, diamondSide, 0.2, 2, 0.03);
  }, [diamondSide]);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.2,
        roughness: 0.36,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.24,
        roughness: 0.32,
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
      diamondGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [diamondGeometry, materials]);

  const tiles = useMemo<DiamondTile[]>(() => {
    const list: DiamondTile[] = [];
    for (let r = 0; r < rows; r++) {
      const offsetX = r % 2 === 1 ? stepX * 0.5 : 0;
      for (let c = 0; c < cols; c++) {
        const x = -(worldW + 1.6) * 0.5 + c * stepX + offsetX;
        const y = (worldH + 1.6) * 0.5 - r * stepY;
        const diagNorm =
          (c / Math.max(1, cols - 1)) * 0.55 +
          (r / Math.max(1, rows - 1)) * 0.45;
        const hash = Math.abs(Math.sin((r + 5) * 14.13 + (c + 7) * 63.71));
        const matIndex = hash > 0.85 ? 2 : (r + c) % 2;
        list.push({
          key: `diamond-${r}-${c}`,
          x,
          y,
          diagNorm,
          matIndex,
        });
      }
    }
    return list;
  }, [cols, rows, stepX, stepY, worldW, worldH]);

  const effectiveFps = fps * props.speedMultiplier;
  const maxDelayInFrames = Math.max(1, cycleFrames * 0.24);
  const exitOffsetFrames = Math.round(cycleFrames * 0.58);

  return (
    <>
      <ambientLight intensity={0.78} />
      <directionalLight position={[6, 8, 12]} intensity={1.12} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.4} color={accentHex} />

      <group>
        {tiles.map((tile) => {
          const delayFrames = tile.diagNorm * maxDelayInFrames;
          const enterSpring = spring({
            frame: localFrame - delayFrames,
            fps: effectiveFps,
            config: { damping: 18, stiffness: 220, mass: 0.7 },
            durationInFrames: Math.max(8, Math.round(cycleFrames * 0.18)),
          });

          const exitSpring = spring({
            frame: localFrame - exitOffsetFrames - delayFrames,
            fps: effectiveFps,
            config: { damping: 18, stiffness: 220, mass: 0.7 },
            durationInFrames: Math.max(8, Math.round(cycleFrames * 0.18)),
          });

          const scale =
            localFrame <= cycleFrames * 0.5
              ? Math.max(0, Math.min(1.03, enterSpring))
              : Math.max(0, Math.min(1.03, 1 - exitSpring));

          const rotX =
            localFrame <= cycleFrames * 0.5
              ? (1 - enterSpring) * (Math.PI * 0.45)
              : exitSpring * (Math.PI * 0.45);

          const zPos =
            localFrame <= cycleFrames * 0.5
              ? Math.sin(Math.min(1, enterSpring) * Math.PI) * 0.35
              : Math.sin(Math.min(1, exitSpring) * Math.PI) * 0.35;

          const visible = scale > 0.002 && localFrame < cycleFrames;

          return (
            <group
              key={tile.key}
              position={[tile.x, tile.y, zPos]}
              rotation={[rotX, 0, 0]}
              scale={visible ? [scale, scale, scale] : [0.0001, 0.0001, 0.0001]}
              visible={visible}
            >
              <mesh
                geometry={diamondGeometry}
                material={materials[tile.matIndex]}
                rotation={[0, 0, Math.PI / 4]}
              />
            </group>
          );
        })}
      </group>
    </>
  );
};

export const DiagonalDiamondCascadeWipe4K: React.FC<
  DiagonalDiamondCascadeWipe4KProps
> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const lastFrame = Math.max(1, durationInFrames - 1);
  const cycleFrames = Math.max(10, lastFrame / props.speedMultiplier);
  const localFrame =
    props.speedMultiplier === 1
      ? Math.min(lastFrame, frame)
      : frame >= lastFrame
        ? cycleFrames
        : frame % cycleFrames;

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
        <DiagonalDiamondCascadeScene
          props={props}
          localFrame={localFrame}
          cycleFrames={cycleFrames}
        />
      </ThreeCanvas>
    </div>
  );
};

