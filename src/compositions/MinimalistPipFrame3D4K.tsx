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

export const minimalistPipFrame3DThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type MinimalistPipFrame3DThemePreset =
  (typeof minimalistPipFrame3DThemePresets)[number];

export const minimalistPipFrame3D4KSchema = z.object({
  themePreset: z.enum(minimalistPipFrame3DThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type MinimalistPipFrame3D4KProps = z.infer<
  typeof minimalistPipFrame3D4KSchema
>;

export const defaultMinimalistPipFrame3D4KProps: MinimalistPipFrame3D4KProps = {
  themePreset: "dark-tech",
  aspectRatio: "16:9",
  backgroundColor: "transparent",
  primaryColor: "#0F172A",
  secondaryColor: "#1E293B",
  accentColor: "#38BDF8",
  speedMultiplier: 1,
  strokeWidth: 2,
};

export const minimalistPipFrame3D4KVariations: Record<
  MinimalistPipFrame3DThemePreset,
  Omit<
    MinimalistPipFrame3D4KProps,
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
    secondaryColor: "#27272A",
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

function resolveThemeColors(props: MinimalistPipFrame3D4KProps) {
  const preset = minimalistPipFrame3D4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor === defaultMinimalistPipFrame3D4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultMinimalistPipFrame3D4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultMinimalistPipFrame3D4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

const MinimalistPipFrameScene: React.FC<{
  props: MinimalistPipFrame3D4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const anchorX = isVertical ? 0 : -2.65;
  const anchorY = isVertical ? 1.85 : 0.15;
  const uiScale = isVertical ? 0.86 : 1;

  const winW = 7.2;
  const winH = 4.05;
  const barThick = 0.16 * Math.max(0.7, props.strokeWidth * 0.55);
  const clampThick = 0.055 * props.strokeWidth;
  const clampLen = 0.85;

  const hBarGeo = useMemo(
    () => new RoundedBoxGeometry(winW + barThick * 2, barThick, 0.24, 3, 0.04),
    [winW, barThick],
  );
  const vBarGeo = useMemo(
    () => new RoundedBoxGeometry(barThick, winH + barThick * 2, 0.24, 3, 0.04),
    [winH, barThick],
  );
  const hClampGeo = useMemo(
    () => new RoundedBoxGeometry(clampLen, clampThick, 0.28, 2, 0.02),
    [clampLen, clampThick],
  );
  const vClampGeo = useMemo(
    () => new RoundedBoxGeometry(clampThick, clampLen, 0.28, 2, 0.02),
    [clampLen, clampThick],
  );
  const pillGeo = useMemo(
    () => new RoundedBoxGeometry(0.95, 0.14, 0.26, 3, 0.05),
    [],
  );

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.34,
        roughness: 0.36,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.4,
        roughness: 0.3,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.72,
        roughness: 0.18,
        emissive: accentHex,
        emissiveIntensity: 0.32,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      hBarGeo.dispose();
      vBarGeo.dispose();
      hClampGeo.dispose();
      vClampGeo.dispose();
      pillGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [hBarGeo, vBarGeo, hClampGeo, vClampGeo, pillGeo, materials]);

  const floatY = Math.sin(angle) * 0.08;
  const tiltY = Math.cos(angle) * 0.035;
  const halfW = winW * 0.5 + barThick * 0.5;
  const halfH = winH * 0.5 + barThick * 0.5;
  const cHalfW = winW * 0.5 + barThick + 0.04;
  const cHalfH = winH * 0.5 + barThick + 0.04;

  const corners: Array<[number, number]> = [
    [-1, 1],
    [1, 1],
    [-1, -1],
    [1, -1],
  ];

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 12]} intensity={1.35} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.5} color={accentHex} />

      <group
        position={[anchorX, anchorY + floatY, 0]}
        rotation={[0, tiltY, 0]}
        scale={[uiScale, uiScale, uiScale]}
      >
        {/* 4 Beveled RoundedBox frame bars leaving transparent center cutout */}
        <mesh geometry={hBarGeo} material={materials[0]} position={[0, halfH, 0]} />
        <mesh geometry={hBarGeo} material={materials[0]} position={[0, -halfH, 0]} />
        <mesh geometry={vBarGeo} material={materials[1]} position={[-halfW, 0, 0]} />
        <mesh geometry={vBarGeo} material={materials[1]} position={[halfW, 0, 0]} />

        {/* 4 Metallic corner accent clamps */}
        {corners.map(([sx, sy], idx) => (
          <group key={idx} position={[sx * cHalfW, sy * cHalfH, 0.04]}>
            <mesh
              geometry={hClampGeo}
              material={materials[2]}
              position={[-sx * clampLen * 0.5, 0, 0]}
            />
            <mesh
              geometry={vClampGeo}
              material={materials[2]}
              position={[0, -sy * clampLen * 0.5, 0]}
            />
          </group>
        ))}

        {/* Top status pill */}
        <mesh
          geometry={pillGeo}
          material={materials[2]}
          position={[-halfW + 1.1, halfH + barThick * 0.75, 0.06]}
        />
      </group>
    </>
  );
};

export const MinimalistPipFrame3D4K: React.FC<MinimalistPipFrame3D4KProps> = (
  props,
) => {
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
        <MinimalistPipFrameScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
