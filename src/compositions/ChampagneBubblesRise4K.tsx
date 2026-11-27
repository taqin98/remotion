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

export const champagneBubblesRiseThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type ChampagneBubblesRiseThemePreset =
  (typeof champagneBubblesRiseThemePresets)[number];

export const champagneBubblesRise4KSchema = z.object({
  themePreset: z.enum(champagneBubblesRiseThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type ChampagneBubblesRise4KProps = z.infer<
  typeof champagneBubblesRise4KSchema
>;

export const defaultChampagneBubblesRise4KProps: ChampagneBubblesRise4KProps = {
  themePreset: "monochrome-luxury",
  aspectRatio: "16:9",
  backgroundColor: "transparent",
  primaryColor: "#F3D37A",
  secondaryColor: "#FAF6EE",
  accentColor: "#D4AF37",
  speedMultiplier: 1,
  strokeWidth: 2,
};

export const champagneBubblesRise4KVariations: Record<
  ChampagneBubblesRiseThemePreset,
  Omit<
    ChampagneBubblesRise4KProps,
    "aspectRatio" | "speedMultiplier" | "strokeWidth"
  >
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    backgroundColor: "transparent",
    primaryColor: "#FFFFFF",
    secondaryColor: "#DBEAFE",
    accentColor: "#93C5FD",
  },
  "dark-tech": {
    themePreset: "dark-tech",
    backgroundColor: "transparent",
    primaryColor: "#38BDF8",
    secondaryColor: "#E0F2FE",
    accentColor: "#22D3EE",
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    backgroundColor: "transparent",
    primaryColor: "#FDE68A",
    secondaryColor: "#FFFBEB",
    accentColor: "#F59E0B",
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    backgroundColor: "transparent",
    primaryColor: "#F3D37A",
    secondaryColor: "#FAF6EE",
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

function resolveThemeColors(props: ChampagneBubblesRise4KProps) {
  const preset = champagneBubblesRise4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor === defaultChampagneBubblesRise4KProps.primaryColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultChampagneBubblesRise4KProps.secondaryColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultChampagneBubblesRise4KProps.accentColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

function pseudoHash(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const STREAM_COUNT = 8;
const BUBBLE_COUNT = 110;

const ChampagneBubblesScene: React.FC<{
  props: ChampagneBubblesRise4KProps;
  cycleProgress: number;
  angle: number;
}> = ({ props, cycleProgress, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const spreadX = isVertical ? 7.2 : 13.6;
  const spanY = isVertical ? 16.4 : 9.6;

  const sphereGeo = useMemo(() => new THREE.SphereGeometry(0.115, 22, 22), []);

  const materials = useMemo(() => {
    return [primaryHex, secondaryHex, accentHex].map(
      (col, idx) =>
        new THREE.MeshPhysicalMaterial({
          color: col,
          metalness: idx === 1 ? 0.18 : 0.65,
          roughness: 0.12,
          clearcoat: 1,
          clearcoatRoughness: 0.08,
          iridescence: 0.35,
        }),
    );
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      sphereGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [sphereGeo, materials]);

  const bubbles = useMemo(() => {
    return Array.from({ length: BUBBLE_COUNT }).map((_, i) => {
      const streamIdx = i % STREAM_COUNT;
      const streamNorm = streamIdx / (STREAM_COUNT - 1) - 0.5;
      const jitterX = (pseudoHash(i * 6 + 1) - 0.5) * 0.45;
      return {
        streamX: streamNorm * spreadX + jitterX,
        baseU: pseudoHash(i * 6 + 2),
        z: (pseudoHash(i * 6 + 3) - 0.5) * 3.8,
        size: 0.45 + pseudoHash(i * 6 + 4) * 1.05,
        phase: pseudoHash(i * 6 + 5) * Math.PI * 2,
        wraps: pseudoHash(i * 6 + 6) > 0.65 ? 2 : 1,
        matIdx: i % 3,
      };
    });
  }, [spreadX]);

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 9, 12]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-7, -5, 8]} intensity={0.65} color={accentHex} />

      {bubbles.map((b, idx) => {
        const u = (b.baseU + cycleProgress * b.wraps) % 1;
        const y = -spanY * 0.5 + u * spanY;
        const x = b.streamX + Math.sin(u * Math.PI * 4 + angle + b.phase) * 0.18;
        const edgeFade = Math.min(1, Math.sin(u * Math.PI) * 3.2);
        const sc = b.size * edgeFade;

        return (
          <mesh
            key={idx}
            geometry={sphereGeo}
            material={materials[b.matIdx]}
            position={[x, y, b.z]}
            scale={[sc, sc, sc]}
          />
        );
      })}
    </>
  );
};

export const ChampagneBubblesRise4K: React.FC<ChampagneBubblesRise4KProps> = (
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
        <ChampagneBubblesScene
          props={props}
          cycleProgress={cycleProgress}
          angle={angle}
        />
      </ThreeCanvas>
    </div>
  );
};
