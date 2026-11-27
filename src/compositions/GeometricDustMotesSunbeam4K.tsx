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

export const geometricDustMotesSunbeamThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type GeometricDustMotesSunbeamThemePreset =
  (typeof geometricDustMotesSunbeamThemePresets)[number];

export const geometricDustMotesSunbeam4KSchema = z.object({
  themePreset: z.enum(geometricDustMotesSunbeamThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type GeometricDustMotesSunbeam4KProps = z.infer<
  typeof geometricDustMotesSunbeam4KSchema
>;

export const defaultGeometricDustMotesSunbeam4KProps: GeometricDustMotesSunbeam4KProps =
  {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#FDE68A",
    secondaryColor: "#F59E0B",
    accentColor: "#FEF3C7",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const geometricDustMotesSunbeam4KVariations: Record<
  GeometricDustMotesSunbeamThemePreset,
  Omit<
    GeometricDustMotesSunbeam4KProps,
    "aspectRatio" | "speedMultiplier" | "strokeWidth"
  >
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    backgroundColor: "transparent",
    primaryColor: "#DBEAFE",
    secondaryColor: "#3B82F6",
    accentColor: "#FFFFFF",
  },
  "dark-tech": {
    themePreset: "dark-tech",
    backgroundColor: "transparent",
    primaryColor: "#38BDF8",
    secondaryColor: "#6366F1",
    accentColor: "#BAE6FD",
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    backgroundColor: "transparent",
    primaryColor: "#FDE68A",
    secondaryColor: "#F59E0B",
    accentColor: "#FEF3C7",
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    backgroundColor: "transparent",
    primaryColor: "#F3D37A",
    secondaryColor: "#D4AF37",
    accentColor: "#FAF6EE",
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

function resolveThemeColors(props: GeometricDustMotesSunbeam4KProps) {
  const preset = geometricDustMotesSunbeam4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultGeometricDustMotesSunbeam4KProps.primaryColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultGeometricDustMotesSunbeam4KProps.secondaryColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultGeometricDustMotesSunbeam4KProps.accentColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

function pseudoHash(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const MOTE_COUNT = 115;

const GeometricDustMotesScene: React.FC<{
  props: GeometricDustMotesSunbeam4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";

  // Unit vector along diagonal sunbeam (top-left to bottom-right)
  const beamDx = isVertical ? 0.51 : 0.86;
  const beamDy = isVertical ? -0.86 : -0.51;
  const perpDx = -beamDy;
  const perpDy = beamDx;
  const halfLen = isVertical ? 8.2 : 8.5;

  const icosaGeo = useMemo(() => new THREE.IcosahedronGeometry(0.075, 0), []);
  const cubeGeo = useMemo(
    () => new RoundedBoxGeometry(0.095, 0.095, 0.095, 2, 0.02),
    [],
  );

  const materials = useMemo(() => {
    return [primaryHex, secondaryHex, accentHex].map(
      (col, idx) =>
        new THREE.MeshStandardMaterial({
          color: col,
          metalness: 0.55,
          roughness: 0.2,
          emissive: col,
          emissiveIntensity: idx === 2 ? 0.65 : 0.42,
          flatShading: true,
        }),
    );
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      icosaGeo.dispose();
      cubeGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [icosaGeo, cubeGeo, materials]);

  const motes = useMemo(() => {
    return Array.from({ length: MOTE_COUNT }).map((_, i) => {
      // Box-Muller-free triangular distribution concentrates motes near beam center axis
      const r1 = pseudoHash(i * 6 + 1) - 0.5;
      const r2 = pseudoHash(i * 6 + 2) - 0.5;
      return {
        along: (pseudoHash(i * 6 + 3) - 0.5) * 2 * halfLen,
        across: (r1 + r2) * 2.4,
        z: (pseudoHash(i * 6 + 4) - 0.5) * 3.5,
        size: 0.5 + pseudoHash(i * 6 + 5) * 0.9,
        phase: pseudoHash(i * 6 + 6) * Math.PI * 2,
        isCube: i % 3 === 0,
        matIdx: i % 3,
      };
    });
  }, [halfLen]);

  return (
    <>
      <ambientLight intensity={0.88} />
      <directionalLight position={[-6, 8, 12]} intensity={1.45} color={accentHex} />
      <directionalLight position={[6, -6, 8]} intensity={0.45} color="#ffffff" />

      {motes.map((m, idx) => {
        const along = m.along + Math.sin(angle + m.phase) * 0.45;
        const across = m.across + Math.cos(angle * 2 + m.phase) * 0.24;
        const x = along * beamDx + across * perpDx;
        const y = along * beamDy + across * perpDy;
        const beamGlow = 0.55 + 0.75 * Math.exp(-across * across * 0.85);
        const sc = m.size * beamGlow;

        return (
          <mesh
            key={idx}
            geometry={m.isCube ? cubeGeo : icosaGeo}
            material={materials[m.matIdx]}
            position={[x, y, m.z]}
            rotation={[angle + m.phase, angle * 2, m.phase]}
            scale={[sc, sc, sc]}
          />
        );
      })}
    </>
  );
};

export const GeometricDustMotesSunbeam4K: React.FC<
  GeometricDustMotesSunbeam4KProps
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

  const { primaryHex, accentHex } = resolveThemeColors(props);
  const pulseOpacity = 0.14 + 0.04 * Math.sin(angle);

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        backgroundColor: "transparent",
        overflow: "hidden",
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <defs>
          <linearGradient id="sunbeamDiagGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accentHex} stopOpacity={pulseOpacity * 1.6} />
            <stop offset="55%" stopColor={primaryHex} stopOpacity={pulseOpacity} />
            <stop offset="100%" stopColor={primaryHex} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,0 ${width * 0.34},0 ${width},${height * 0.72} ${width},${height} ${width * 0.62},${height} 0,${height * 0.28}`}
          fill="url(#sunbeamDiagGrad)"
        />
      </svg>

      <ThreeCanvas
        width={width}
        height={height}
        orthographic
        dpr={1}
        camera={CAMERA_CONFIG}
        gl={GL_CONFIG}
        style={{ position: "absolute", inset: 0 }}
      >
        <OrthographicCameraRig zoom={zoom} />
        <GeometricDustMotesScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
