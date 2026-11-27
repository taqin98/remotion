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

export const metallicConfettiRainLoopThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type MetallicConfettiRainLoopThemePreset =
  (typeof metallicConfettiRainLoopThemePresets)[number];

export const metallicConfettiRainLoop4KSchema = z.object({
  themePreset: z.enum(metallicConfettiRainLoopThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type MetallicConfettiRainLoop4KProps = z.infer<
  typeof metallicConfettiRainLoop4KSchema
>;

export const defaultMetallicConfettiRainLoop4KProps: MetallicConfettiRainLoop4KProps =
  {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#F59E0B",
    secondaryColor: "#EC4899",
    accentColor: "#38BDF8",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const metallicConfettiRainLoop4KVariations: Record<
  MetallicConfettiRainLoopThemePreset,
  Omit<
    MetallicConfettiRainLoop4KProps,
    "aspectRatio" | "speedMultiplier" | "strokeWidth"
  >
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    backgroundColor: "transparent",
    primaryColor: "#2563EB",
    secondaryColor: "#38BDF8",
    accentColor: "#E2E8F0",
  },
  "dark-tech": {
    themePreset: "dark-tech",
    backgroundColor: "transparent",
    primaryColor: "#38BDF8",
    secondaryColor: "#818CF8",
    accentColor: "#22D3EE",
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    backgroundColor: "transparent",
    primaryColor: "#F59E0B",
    secondaryColor: "#EC4899",
    accentColor: "#38BDF8",
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    backgroundColor: "transparent",
    primaryColor: "#D4AF37",
    secondaryColor: "#E4E4E7",
    accentColor: "#F3D37A",
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

function resolveThemeColors(props: MetallicConfettiRainLoop4KProps) {
  const preset = metallicConfettiRainLoop4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultMetallicConfettiRainLoop4KProps.primaryColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultMetallicConfettiRainLoop4KProps.secondaryColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultMetallicConfettiRainLoop4KProps.accentColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

function pseudoHash(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const CONFETTI_COUNT = 150;

const MetallicConfettiRainScene: React.FC<{
  props: MetallicConfettiRainLoop4KProps;
  cycleProgress: number;
  angle: number;
}> = ({ props, cycleProgress, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const spreadX = isVertical ? 8.2 : 15.2;
  const spanY = isVertical ? 16.4 : 9.8;

  const rectGeo = useMemo(
    () => new RoundedBoxGeometry(0.18, 0.1, 0.018, 2, 0.008),
    [],
  );
  const triGeo = useMemo(
    () => new THREE.CylinderGeometry(0.12, 0.12, 0.018, 3),
    [],
  );

  const materials = useMemo(() => {
    const highlightHex =
      props.themePreset === "monochrome-luxury" ? "#FFFFFF" : "#FDE047";
    return [primaryHex, secondaryHex, accentHex, highlightHex].map(
      (col) =>
        new THREE.MeshStandardMaterial({
          color: col,
          metalness: 0.78,
          roughness: 0.22,
          flatShading: true,
        }),
    );
  }, [primaryHex, secondaryHex, accentHex, props.themePreset]);

  useEffect(() => {
    return () => {
      rectGeo.dispose();
      triGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [rectGeo, triGeo, materials]);

  const pieces = useMemo(() => {
    return Array.from({ length: CONFETTI_COUNT }).map((_, i) => ({
      baseX: (pseudoHash(i * 8 + 1) - 0.5) * spreadX,
      baseU: pseudoHash(i * 8 + 2),
      z: (pseudoHash(i * 8 + 3) - 0.5) * 4.5,
      scale: 0.6 + pseudoHash(i * 8 + 4) * 0.85,
      phase: pseudoHash(i * 8 + 5) * Math.PI * 2,
      rx: pseudoHash(i * 8 + 6) > 0.5 ? 3 : -3,
      ry: pseudoHash(i * 8 + 7) > 0.5 ? 2 : -2,
      rz: pseudoHash(i * 8 + 8) > 0.5 ? 2 : -2,
      wraps: i % 3 === 0 ? 2 : 1,
      isTri: i % 2 === 1,
      matIdx: i % 4,
    }));
  }, [spreadX]);

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 9, 12]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-6, -5, 8]} intensity={0.65} color={accentHex} />

      {pieces.map((p, idx) => {
        const u = (p.baseU + cycleProgress * p.wraps) % 1;
        const y = spanY * 0.5 - u * spanY;
        const x = p.baseX + Math.sin(angle * 2 + p.phase) * 0.55;
        const edgeFade = Math.min(1, Math.sin(u * Math.PI) * 3.2);
        const sc = p.scale * edgeFade;

        return (
          <mesh
            key={idx}
            geometry={p.isTri ? triGeo : rectGeo}
            material={materials[p.matIdx]}
            position={[x, y, p.z]}
            rotation={[
              angle * p.rx + p.phase,
              angle * p.ry + p.phase,
              angle * p.rz + p.phase,
            ]}
            scale={[sc, sc, sc]}
          />
        );
      })}
    </>
  );
};

export const MetallicConfettiRainLoop4K: React.FC<
  MetallicConfettiRainLoop4KProps
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
        <MetallicConfettiRainScene
          props={props}
          cycleProgress={cycleProgress}
          angle={angle}
        />
      </ThreeCanvas>
    </div>
  );
};
