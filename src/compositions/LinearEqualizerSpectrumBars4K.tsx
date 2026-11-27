import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useCurrentFrame, useVideoConfig } from "remotion";
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

export const linearEqualizerSpectrumBarsThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type LinearEqualizerSpectrumBarsThemePreset =
  (typeof linearEqualizerSpectrumBarsThemePresets)[number];

export const linearEqualizerSpectrumBars4KSchema = z.object({
  themePreset: z.enum(linearEqualizerSpectrumBarsThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type LinearEqualizerSpectrumBars4KProps = z.infer<
  typeof linearEqualizerSpectrumBars4KSchema
>;

export const defaultLinearEqualizerSpectrumBars4KProps: LinearEqualizerSpectrumBars4KProps =
  {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#0F172A",
    secondaryColor: "#1E293B",
    accentColor: "#38BDF8",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const linearEqualizerSpectrumBars4KVariations: Record<
  LinearEqualizerSpectrumBarsThemePreset,
  Omit<
    LinearEqualizerSpectrumBars4KProps,
    "aspectRatio" | "speedMultiplier" | "strokeWidth"
  >
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    backgroundColor: "transparent",
    primaryColor: "#1E293B",
    secondaryColor: "#64748B",
    accentColor: "#2563EB",
  },
  "dark-tech": {
    themePreset: "dark-tech",
    backgroundColor: "transparent",
    primaryColor: "#0F172A",
    secondaryColor: "#1E293B",
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
    accentColor: "#D4AF37",
  },
};

const CAMERA_CONFIG = {
  position: [0, 0, 12] as [number, number, number],
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
    camera.position.set(0, 0, 12);
    camera.zoom = zoom;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, zoom]);

  return null;
};

function resolveThemeColors(props: LinearEqualizerSpectrumBars4KProps) {
  const preset = linearEqualizerSpectrumBars4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultLinearEqualizerSpectrumBars4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultLinearEqualizerSpectrumBars4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultLinearEqualizerSpectrumBars4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

const COL_COUNT = 32;

const LinearEqualizerScene: React.FC<{
  props: LinearEqualizerSpectrumBars4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const uiScale = isVertical ? 0.62 : 1;

  const colGeometry = useMemo(() => {
    return new RoundedBoxGeometry(0.22, 1, 0.22, 2, 0.035);
  }, []);

  const capGeometry = useMemo(() => {
    return new RoundedBoxGeometry(0.22, 0.08, 0.24, 2, 0.02);
  }, []);

  const baseRuleGeometry = useMemo(() => {
    return new RoundedBoxGeometry(
      12.2,
      0.03 * props.strokeWidth,
      0.26,
      2,
      0.01,
    );
  }, [props.strokeWidth]);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.34,
        roughness: 0.38,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.4,
        roughness: 0.32,
        transparent: true,
        opacity: 0.55,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.68,
        roughness: 0.2,
        emissive: accentHex,
        emissiveIntensity: 0.32,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      colGeometry.dispose();
      capGeometry.dispose();
      baseRuleGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [colGeometry, capGeometry, baseRuleGeometry, materials]);

  const yBase = isVertical ? -4.2 : -3.1;
  const totalSpan = 11.6;
  const step = totalSpan / (COL_COUNT - 1);
  const startX = -totalSpan * 0.5;

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 12]} intensity={1.3} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.5} color={accentHex} />

      <group
        position={[0, yBase, 0]}
        scale={[uiScale, uiScale, uiScale]}
      >
        <mesh
          geometry={baseRuleGeometry}
          material={materials[2]}
          position={[0, -0.05, 0.05]}
        />

        {Array.from({ length: COL_COUNT }).map((_, i) => {
          const norm = i / (COL_COUNT - 1);
          const envelope = 0.55 + 0.45 * Math.sin(norm * Math.PI);
          const h =
            0.28 +
            2.15 *
              envelope *
              (0.5 + 0.5 * Math.sin(angle * 2 + i * 0.45)) *
              (0.6 + 0.4 * Math.cos(angle * 3 - i * 0.3));
          const x = startX + i * step;
          const reflH = h * 0.24;

          return (
            <group key={i} position={[x, 0, 0]}>
              <mesh
                geometry={colGeometry}
                material={i % 4 === 0 ? materials[2] : materials[0]}
                position={[0, h * 0.5, 0]}
                scale={[1, h, 1]}
              />
              <mesh
                geometry={capGeometry}
                material={materials[2]}
                position={[0, h + 0.12, 0]}
              />
              <mesh
                geometry={colGeometry}
                material={materials[1]}
                position={[0, -0.14 - reflH * 0.5, 0]}
                scale={[1, reflH, 1]}
              />
            </group>
          );
        })}
      </group>
    </>
  );
};

export const LinearEqualizerSpectrumBars4K: React.FC<
  LinearEqualizerSpectrumBars4KProps
> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const progress =
    ((frame % durationInFrames) / durationInFrames) * props.speedMultiplier;
  const cycleProgress = progress % 1;
  const angle = cycleProgress * Math.PI * 2;

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
        <LinearEqualizerScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
