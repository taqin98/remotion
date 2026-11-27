import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
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

export const ascendingGlowingEmbersThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type AscendingGlowingEmbersThemePreset =
  (typeof ascendingGlowingEmbersThemePresets)[number];

export const ascendingGlowingEmbers4KSchema = z.object({
  themePreset: z.enum(ascendingGlowingEmbersThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type AscendingGlowingEmbers4KProps = z.infer<
  typeof ascendingGlowingEmbers4KSchema
>;

export const defaultAscendingGlowingEmbers4KProps: AscendingGlowingEmbers4KProps =
  {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#F97316",
    secondaryColor: "#EF4444",
    accentColor: "#FDE047",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const ascendingGlowingEmbers4KVariations: Record<
  AscendingGlowingEmbersThemePreset,
  Omit<
    AscendingGlowingEmbers4KProps,
    "aspectRatio" | "speedMultiplier" | "strokeWidth"
  >
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    backgroundColor: "transparent",
    primaryColor: "#3B82F6",
    secondaryColor: "#1D4ED8",
    accentColor: "#BAE6FD",
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
    primaryColor: "#F97316",
    secondaryColor: "#EF4444",
    accentColor: "#FDE047",
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    backgroundColor: "transparent",
    primaryColor: "#F3D37A",
    secondaryColor: "#D4AF37",
    accentColor: "#FFFFFF",
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

function resolveThemeColors(props: AscendingGlowingEmbers4KProps) {
  const preset = ascendingGlowingEmbers4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultAscendingGlowingEmbers4KProps.primaryColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultAscendingGlowingEmbers4KProps.secondaryColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultAscendingGlowingEmbers4KProps.accentColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

function pseudoHash(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const EMBER_COUNT = 95;

const AscendingEmbersScene: React.FC<{
  props: AscendingGlowingEmbers4KProps;
  cycleProgress: number;
  angle: number;
}> = ({ props, cycleProgress, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const spreadX = isVertical ? 7.8 : 14.6;
  const spanY = isVertical ? 16.4 : 9.8;

  const sparkGeo = useMemo(() => new THREE.IcosahedronGeometry(0.085, 0), []);
  const shardGeo = useMemo(
    () => new THREE.CapsuleGeometry(0.032, 0.14, 6, 10),
    [],
  );

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.35,
        roughness: 0.2,
        emissive: primaryHex,
        emissiveIntensity: 0.72,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.35,
        roughness: 0.22,
        emissive: secondaryHex,
        emissiveIntensity: 0.68,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.25,
        roughness: 0.15,
        emissive: accentHex,
        emissiveIntensity: 0.85,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      sparkGeo.dispose();
      shardGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [sparkGeo, shardGeo, materials]);

  const embers = useMemo(() => {
    return Array.from({ length: EMBER_COUNT }).map((_, i) => ({
      baseX: (pseudoHash(i * 6 + 1) - 0.5) * spreadX,
      baseU: pseudoHash(i * 6 + 2),
      z: (pseudoHash(i * 6 + 3) - 0.5) * 4.0,
      size: 0.55 + pseudoHash(i * 6 + 4) * 1.0,
      phase: pseudoHash(i * 6 + 5) * Math.PI * 2,
      wraps: i % 3 === 0 ? 2 : 1,
      isShard: i % 2 === 1,
      matIdx: i % 3,
    }));
  }, [spreadX]);

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 12]} intensity={1.1} color="#ffffff" />

      {embers.map((e, idx) => {
        const u = (e.baseU + cycleProgress * e.wraps) % 1;
        const y = -spanY * 0.5 + u * spanY;
        // Multi-frequency circular current mimics 4D simplex-noise drift in a strict loop
        const swirlX =
          Math.sin(u * Math.PI * 2 + angle + e.phase) * 0.65 +
          Math.cos(u * Math.PI * 4 - angle + e.phase * 0.5) * 0.24;
        const x = e.baseX + swirlX;
        const edgeFade = Math.min(1, Math.sin(u * Math.PI) * 3.0);
        const flicker = 0.78 + 0.3 * Math.sin(angle * 4 + e.phase);
        const sc = e.size * edgeFade * flicker;
        const tiltZ = -Math.cos(u * Math.PI * 2 + angle + e.phase) * 0.35;

        return (
          <mesh
            key={idx}
            geometry={e.isShard ? shardGeo : sparkGeo}
            material={materials[e.matIdx]}
            position={[x, y, e.z]}
            rotation={[angle + e.phase, angle * 2, tiltZ]}
            scale={[sc, sc, sc]}
          />
        );
      })}
    </>
  );
};

export const AscendingGlowingEmbers4K: React.FC<
  AscendingGlowingEmbers4KProps
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
        <AscendingEmbersScene
          props={props}
          cycleProgress={cycleProgress}
          angle={angle}
        />
      </ThreeCanvas>
    </div>
  );
};
