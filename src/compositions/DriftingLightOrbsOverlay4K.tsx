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

export const driftingLightOrbsOverlayThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type DriftingLightOrbsOverlayThemePreset =
  (typeof driftingLightOrbsOverlayThemePresets)[number];

export const driftingLightOrbsOverlay4KSchema = z.object({
  themePreset: z.enum(driftingLightOrbsOverlayThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type DriftingLightOrbsOverlay4KProps = z.infer<
  typeof driftingLightOrbsOverlay4KSchema
>;

export const defaultDriftingLightOrbsOverlay4KProps: DriftingLightOrbsOverlay4KProps =
  {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#38BDF8",
    secondaryColor: "#818CF8",
    accentColor: "#22D3EE",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const driftingLightOrbsOverlay4KVariations: Record<
  DriftingLightOrbsOverlayThemePreset,
  Omit<
    DriftingLightOrbsOverlay4KProps,
    "aspectRatio" | "speedMultiplier" | "strokeWidth"
  >
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    backgroundColor: "transparent",
    primaryColor: "#93C5FD",
    secondaryColor: "#DBEAFE",
    accentColor: "#3B82F6",
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
    primaryColor: "#FDE68A",
    secondaryColor: "#FDBA74",
    accentColor: "#F59E0B",
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    backgroundColor: "transparent",
    primaryColor: "#F3D37A",
    secondaryColor: "#E4E4E7",
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

function resolveThemeColors(props: DriftingLightOrbsOverlay4KProps) {
  const preset = driftingLightOrbsOverlay4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultDriftingLightOrbsOverlay4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultDriftingLightOrbsOverlay4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultDriftingLightOrbsOverlay4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

function pseudoHash(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const ORB_COUNT = 45;

const DriftingLightOrbsScene: React.FC<{
  props: DriftingLightOrbsOverlay4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const spreadX = isVertical ? 7.6 : 14.4;
  const spreadY = isVertical ? 14.4 : 7.6;

  const coreGeo = useMemo(() => new THREE.SphereGeometry(0.16, 20, 20), []);
  const haloGeo = useMemo(() => new THREE.SphereGeometry(0.38, 24, 24), []);

  const coreMaterials = useMemo(() => {
    return [primaryHex, secondaryHex, accentHex].map(
      (col) =>
        new THREE.MeshStandardMaterial({
          color: col,
          metalness: 0.2,
          roughness: 0.2,
          emissive: col,
          emissiveIntensity: 0.72,
          transparent: true,
          opacity: 0.86,
        }),
    );
  }, [primaryHex, secondaryHex, accentHex]);

  const haloMaterials = useMemo(() => {
    return [primaryHex, secondaryHex, accentHex].map(
      (col) =>
        new THREE.MeshPhysicalMaterial({
          color: col,
          transmission: 0.62,
          roughness: 0.2,
          clearcoat: 1,
          emissive: col,
          emissiveIntensity: 0.35,
          transparent: true,
          opacity: 0.32,
        }),
    );
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      coreGeo.dispose();
      haloGeo.dispose();
      coreMaterials.forEach((m) => m.dispose());
      haloMaterials.forEach((m) => m.dispose());
    };
  }, [coreGeo, haloGeo, coreMaterials, haloMaterials]);

  const orbs = useMemo(() => {
    return Array.from({ length: ORB_COUNT }).map((_, i) => ({
      baseX: (pseudoHash(i * 7 + 1) - 0.5) * spreadX,
      baseY: (pseudoHash(i * 7 + 2) - 0.5) * spreadY,
      z: (pseudoHash(i * 7 + 3) - 0.5) * 4.2,
      scale: 0.55 + pseudoHash(i * 7 + 4) * 1.15,
      phase: pseudoHash(i * 7 + 5) * Math.PI * 2,
      ampX: 0.6 + pseudoHash(i * 7 + 6) * 0.85,
      ampY: 0.45 + pseudoHash(i * 7 + 7) * 0.6,
      speed: i % 3 === 0 ? 2 : 1,
      matIdx: i % 3,
    }));
  }, [spreadX, spreadY]);

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[6, 8, 12]} intensity={1.2} color="#ffffff" />

      {orbs.map((orb, idx) => {
        const x = orb.baseX + Math.sin(angle * orb.speed + orb.phase) * orb.ampX;
        const y = orb.baseY + Math.cos(angle * orb.speed + orb.phase) * orb.ampY;
        const pulse = 0.8 + 0.28 * Math.sin(angle * 2 + orb.phase);
        const sc = orb.scale * pulse;

        return (
          <group key={idx} position={[x, y, orb.z]} scale={[sc, sc, sc]}>
            <mesh geometry={coreGeo} material={coreMaterials[orb.matIdx]} />
            <mesh geometry={haloGeo} material={haloMaterials[orb.matIdx]} />
          </group>
        );
      })}
    </>
  );
};

export const DriftingLightOrbsOverlay4K: React.FC<
  DriftingLightOrbsOverlay4KProps
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
        <DriftingLightOrbsScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
