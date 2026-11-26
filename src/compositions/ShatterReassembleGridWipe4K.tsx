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

export const shatterReassembleGridWipeThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type ShatterReassembleGridWipeThemePreset =
  (typeof shatterReassembleGridWipeThemePresets)[number];

export const shatterReassembleGridWipe4KSchema = z.object({
  themePreset: z.enum(shatterReassembleGridWipeThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type ShatterReassembleGridWipe4KProps = z.infer<
  typeof shatterReassembleGridWipe4KSchema
>;

export const defaultShatterReassembleGridWipe4KProps: ShatterReassembleGridWipe4KProps =
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

export const shatterReassembleGridWipe4KVariations: Record<
  ShatterReassembleGridWipeThemePreset,
  Omit<
    ShatterReassembleGridWipe4KProps,
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

interface ShardFragment {
  key: string;
  targetX: number;
  targetY: number;
  scatterX: number;
  scatterY: number;
  scatterZ: number;
  rotX: number;
  rotY: number;
  rotZ: number;
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

const ShatterReassembleScene: React.FC<{
  props: ShatterReassembleGridWipe4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset = shatterReassembleGridWipe4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultShatterReassembleGridWipe4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultShatterReassembleGridWipe4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultShatterReassembleGridWipe4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const cols = isVertical ? 8 : 14;
  const rows = isVertical ? 14 : 8;
  const worldW = isVertical ? 9 : 16;
  const worldH = isVertical ? 16 : 9;
  const tileW = worldW / cols;
  const tileH = worldH / rows;

  const fragmentGeometry = useMemo(() => {
    return new RoundedBoxGeometry(tileW * 1.04, tileH * 1.04, 0.22, 2, 0.03);
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
      fragmentGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [fragmentGeometry, materials]);

  const fragments = useMemo<ShardFragment[]>(() => {
    const list: ShardFragment[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const targetX = -worldW * 0.5 + (c + 0.5) * tileW;
        const targetY = worldH * 0.5 - (r + 0.5) * tileH;
        const h1 = Math.sin((r + 1) * 19.37 + (c + 2) * 71.13);
        const h2 = Math.cos((r + 5) * 43.19 + (c + 3) * 29.41);
        const h3 = Math.abs(Math.sin((r + 8) * 12.9898 + (c + 7) * 78.233)) % 1;
        const centerDist = Math.hypot(targetX, targetY) / Math.hypot(worldW * 0.5, worldH * 0.5);
        const matIndex = h3 > 0.85 ? 2 : (r + c) % 2;

        list.push({
          key: `shatter-${r}-${c}`,
          targetX,
          targetY,
          scatterX: targetX * 0.38 + h1 * 1.6,
          scatterY: targetY * 0.38 + h2 * 1.6,
          scatterZ: -2.5 - h3 * 2.5,
          rotX: h1 * 1.4,
          rotY: h2 * 1.4,
          rotZ: (h1 + h2) * 0.7,
          delayNorm: Math.min(1, centerDist * 0.55 + h3 * 0.45),
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
      <directionalLight position={[-6, -4, 7]} intensity={0.44} color={accentHex} />

      <group>
        {fragments.map((frag) => {
          const inStart = frag.delayNorm * enterSpan;
          const inT = interpolate(progress, [inStart, inStart + phaseDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });

          const outBegin = exitStart + (1 - frag.delayNorm) * exitSpan;
          const outT = interpolate(progress, [outBegin, outBegin + phaseDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          });

          const t = progress <= 0.5 ? 1 - inT : outT;
          const scale =
            progress <= 0.5
              ? interpolate(inT, [0, 0.25, 1], [0, 1, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              : interpolate(outT, [0, 0.75, 1], [1, 1, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });

          const x = frag.targetX + frag.scatterX * t;
          const y = frag.targetY + frag.scatterY * t;
          const z = (progress <= 0.5 ? frag.scatterZ : -frag.scatterZ) * t;
          const visible = scale > 0.002;

          return (
            <mesh
              key={frag.key}
              geometry={fragmentGeometry}
              material={materials[frag.matIndex]}
              position={[x, y, z]}
              rotation={[frag.rotX * t, frag.rotY * t, frag.rotZ * t]}
              scale={visible ? [scale, scale, scale] : [0.0001, 0.0001, 0.0001]}
              visible={visible}
            />
          );
        })}
      </group>
    </>
  );
};

export const ShatterReassembleGridWipe4K: React.FC<
  ShatterReassembleGridWipe4KProps
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
        <ShatterReassembleScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

