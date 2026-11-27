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

export const floatingGlassShardsOverlayThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type FloatingGlassShardsOverlayThemePreset =
  (typeof floatingGlassShardsOverlayThemePresets)[number];

export const floatingGlassShardsOverlay4KSchema = z.object({
  themePreset: z.enum(floatingGlassShardsOverlayThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type FloatingGlassShardsOverlay4KProps = z.infer<
  typeof floatingGlassShardsOverlay4KSchema
>;

export const defaultFloatingGlassShardsOverlay4KProps: FloatingGlassShardsOverlay4KProps =
  {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#E0F2FE",
    secondaryColor: "#93C5FD",
    accentColor: "#38BDF8",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const floatingGlassShardsOverlay4KVariations: Record<
  FloatingGlassShardsOverlayThemePreset,
  Omit<
    FloatingGlassShardsOverlay4KProps,
    "aspectRatio" | "speedMultiplier" | "strokeWidth"
  >
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    backgroundColor: "transparent",
    primaryColor: "#E0F2FE",
    secondaryColor: "#93C5FD",
    accentColor: "#38BDF8",
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
    primaryColor: "#FEF3C7",
    secondaryColor: "#FCD34D",
    accentColor: "#F59E0B",
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

function resolveThemeColors(props: FloatingGlassShardsOverlay4KProps) {
  const preset = floatingGlassShardsOverlay4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultFloatingGlassShardsOverlay4KProps.primaryColor &&
    props.themePreset !== "clean-corporate"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultFloatingGlassShardsOverlay4KProps.secondaryColor &&
    props.themePreset !== "clean-corporate"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultFloatingGlassShardsOverlay4KProps.accentColor &&
    props.themePreset !== "clean-corporate"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

function pseudoHash(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const SHARD_COUNT = 25;

const FloatingGlassShardsScene: React.FC<{
  props: FloatingGlassShardsOverlay4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const spreadX = isVertical ? 7.6 : 14.2;
  const spreadY = isVertical ? 14.2 : 7.6;

  const shardGeo = useMemo(
    () => new THREE.CylinderGeometry(0.46, 0.42, 0.06, 3),
    [],
  );
  const rimGeo = useMemo(
    () => new THREE.CylinderGeometry(0.465, 0.425, 0.062, 3),
    [],
  );

  const glassMaterials = useMemo(() => {
    return [
      new THREE.MeshPhysicalMaterial({
        color: primaryHex,
        transmission: 0.72,
        roughness: 0.14,
        metalness: 0.12,
        ior: 1.52,
        thickness: 0.8,
        clearcoat: 1,
        transparent: true,
        opacity: 0.76,
      }),
      new THREE.MeshPhysicalMaterial({
        color: secondaryHex,
        transmission: 0.68,
        roughness: 0.18,
        metalness: 0.16,
        ior: 1.52,
        thickness: 0.8,
        clearcoat: 1,
        transparent: true,
        opacity: 0.72,
      }),
    ];
  }, [primaryHex, secondaryHex]);

  const rimMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: accentHex,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
  }, [accentHex]);

  useEffect(() => {
    return () => {
      shardGeo.dispose();
      rimGeo.dispose();
      glassMaterials.forEach((m) => m.dispose());
      rimMaterial.dispose();
    };
  }, [shardGeo, rimGeo, glassMaterials, rimMaterial]);

  const shards = useMemo(() => {
    return Array.from({ length: SHARD_COUNT }).map((_, i) => ({
      baseX: (pseudoHash(i * 8 + 1) - 0.5) * spreadX,
      baseY: (pseudoHash(i * 8 + 2) - 0.5) * spreadY,
      z: (pseudoHash(i * 8 + 3) - 0.5) * 4.2,
      scale: 0.65 + pseudoHash(i * 8 + 4) * 0.9,
      phase: pseudoHash(i * 8 + 5) * Math.PI * 2,
      rx: pseudoHash(i * 8 + 6) * Math.PI,
      ry: pseudoHash(i * 8 + 7) * Math.PI,
      sx: pseudoHash(i * 8 + 8) > 0.5 ? 1 : -1,
      matIdx: i % 2,
    }));
  }, [spreadX, spreadY]);

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[7, 9, 12]} intensity={1.55} color="#ffffff" />
      <directionalLight position={[-6, -5, 8]} intensity={0.75} color={accentHex} />

      {shards.map((s, idx) => {
        const x = s.baseX + Math.sin(angle + s.phase) * 0.65;
        const y = s.baseY + Math.cos(angle + s.phase) * 0.5;
        return (
          <group
            key={idx}
            position={[x, y, s.z]}
            rotation={[
              s.rx + angle * s.sx,
              s.ry + angle * 1.0,
              s.phase + angle * -s.sx,
            ]}
            scale={[s.scale, s.scale, s.scale]}
          >
            <mesh geometry={shardGeo} material={glassMaterials[s.matIdx]} />
            <mesh geometry={rimGeo} material={rimMaterial} />
          </group>
        );
      })}
    </>
  );
};

export const FloatingGlassShardsOverlay4K: React.FC<
  FloatingGlassShardsOverlay4KProps
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
        <FloatingGlassShardsScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
