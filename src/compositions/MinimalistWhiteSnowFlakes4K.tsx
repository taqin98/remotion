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

export const minimalistWhiteSnowFlakesThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type MinimalistWhiteSnowFlakesThemePreset =
  (typeof minimalistWhiteSnowFlakesThemePresets)[number];

export const minimalistWhiteSnowFlakes4KSchema = z.object({
  themePreset: z.enum(minimalistWhiteSnowFlakesThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type MinimalistWhiteSnowFlakes4KProps = z.infer<
  typeof minimalistWhiteSnowFlakes4KSchema
>;

export const defaultMinimalistWhiteSnowFlakes4KProps: MinimalistWhiteSnowFlakes4KProps =
  {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#FFFFFF",
    secondaryColor: "#E2E8F0",
    accentColor: "#BAE6FD",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const minimalistWhiteSnowFlakes4KVariations: Record<
  MinimalistWhiteSnowFlakesThemePreset,
  Omit<
    MinimalistWhiteSnowFlakes4KProps,
    "aspectRatio" | "speedMultiplier" | "strokeWidth"
  >
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    backgroundColor: "transparent",
    primaryColor: "#FFFFFF",
    secondaryColor: "#E2E8F0",
    accentColor: "#BAE6FD",
  },
  "dark-tech": {
    themePreset: "dark-tech",
    backgroundColor: "transparent",
    primaryColor: "#E0F2FE",
    secondaryColor: "#94A3B8",
    accentColor: "#38BDF8",
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    backgroundColor: "transparent",
    primaryColor: "#FAF6F0",
    secondaryColor: "#E5DAC8",
    accentColor: "#FDE68A",
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    backgroundColor: "transparent",
    primaryColor: "#F4F4F5",
    secondaryColor: "#A1A1AA",
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

function resolveThemeColors(props: MinimalistWhiteSnowFlakes4KProps) {
  const preset = minimalistWhiteSnowFlakes4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultMinimalistWhiteSnowFlakes4KProps.primaryColor &&
    props.themePreset !== "clean-corporate"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultMinimalistWhiteSnowFlakes4KProps.secondaryColor &&
    props.themePreset !== "clean-corporate"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultMinimalistWhiteSnowFlakes4KProps.accentColor &&
    props.themePreset !== "clean-corporate"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

function pseudoHash(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const FLAKE_COUNT = 110;

const MinimalistSnowFlakesScene: React.FC<{
  props: MinimalistWhiteSnowFlakes4KProps;
  cycleProgress: number;
  angle: number;
}> = ({ props, cycleProgress, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const spreadX = isVertical ? 8.6 : 16.2;
  const spanY = isVertical ? 16.4 : 9.6;

  const hexFlakeGeo = useMemo(
    () => new THREE.CylinderGeometry(0.11, 0.11, 0.025, 6),
    [],
  );
  const crystalGeo = useMemo(() => new THREE.IcosahedronGeometry(0.085, 0), []);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.1,
        roughness: 0.45,
        flatShading: true,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.15,
        roughness: 0.4,
        flatShading: true,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.25,
        roughness: 0.3,
        flatShading: true,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      hexFlakeGeo.dispose();
      crystalGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [hexFlakeGeo, crystalGeo, materials]);

  const flakes = useMemo(() => {
    return Array.from({ length: FLAKE_COUNT }).map((_, i) => ({
      baseX: (pseudoHash(i * 6 + 1) - 0.5) * spreadX + 0.8,
      baseU: pseudoHash(i * 6 + 2),
      z: (pseudoHash(i * 6 + 3) - 0.5) * 4.5,
      size: 0.5 + pseudoHash(i * 6 + 4) * 0.95,
      phase: pseudoHash(i * 6 + 5) * Math.PI * 2,
      rotSign: pseudoHash(i * 6 + 6) > 0.5 ? 1 : -1,
      isHex: i % 2 === 0,
      matIdx: i % 3,
    }));
  }, [spreadX]);

  return (
    <>
      <ambientLight intensity={0.92} />
      <directionalLight position={[6, 8, 12]} intensity={1.15} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.45} color={accentHex} />

      {flakes.map((f, idx) => {
        const u = (f.baseU + cycleProgress) % 1;
        const y = spanY * 0.5 - u * spanY;
        const x = f.baseX - (u - 0.5) * 2.4 + Math.sin(angle + f.phase) * 0.35;
        const edgeFade = Math.min(1, Math.sin(u * Math.PI) * 3.2);
        const sc = f.size * edgeFade;

        return (
          <mesh
            key={idx}
            geometry={f.isHex ? hexFlakeGeo : crystalGeo}
            material={materials[f.matIdx]}
            position={[x, y, f.z]}
            rotation={[angle * f.rotSign + f.phase, angle + f.phase, f.phase]}
            scale={[sc, sc, sc]}
          />
        );
      })}
    </>
  );
};

export const MinimalistWhiteSnowFlakes4K: React.FC<
  MinimalistWhiteSnowFlakes4KProps
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
        <MinimalistSnowFlakesScene
          props={props}
          cycleProgress={cycleProgress}
          angle={angle}
        />
      </ThreeCanvas>
    </div>
  );
};
