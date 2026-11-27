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

export const goldSilverLuxuryConfettiThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type GoldSilverLuxuryConfettiThemePreset =
  (typeof goldSilverLuxuryConfettiThemePresets)[number];

export const goldSilverLuxuryConfetti4KSchema = z.object({
  themePreset: z.enum(goldSilverLuxuryConfettiThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type GoldSilverLuxuryConfetti4KProps = z.infer<
  typeof goldSilverLuxuryConfetti4KSchema
>;

export const defaultGoldSilverLuxuryConfetti4KProps: GoldSilverLuxuryConfetti4KProps =
  {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#D4AF37",
    secondaryColor: "#E4E4E7",
    accentColor: "#F3D37A",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const goldSilverLuxuryConfetti4KVariations: Record<
  GoldSilverLuxuryConfettiThemePreset,
  Omit<
    GoldSilverLuxuryConfetti4KProps,
    "aspectRatio" | "speedMultiplier" | "strokeWidth"
  >
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    backgroundColor: "transparent",
    primaryColor: "#E2E8F0",
    secondaryColor: "#CBD5E1",
    accentColor: "#3B82F6",
  },
  "dark-tech": {
    themePreset: "dark-tech",
    backgroundColor: "transparent",
    primaryColor: "#38BDF8",
    secondaryColor: "#E2E8F0",
    accentColor: "#22D3EE",
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    backgroundColor: "transparent",
    primaryColor: "#F59E0B",
    secondaryColor: "#FEF3C7",
    accentColor: "#D97706",
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

function resolveThemeColors(props: GoldSilverLuxuryConfetti4KProps) {
  const preset = goldSilverLuxuryConfetti4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultGoldSilverLuxuryConfetti4KProps.primaryColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultGoldSilverLuxuryConfetti4KProps.secondaryColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultGoldSilverLuxuryConfetti4KProps.accentColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

function pseudoHash(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const LUXURY_COUNT = 130;

const GoldSilverConfettiScene: React.FC<{
  props: GoldSilverLuxuryConfetti4KProps;
  cycleProgress: number;
  angle: number;
}> = ({ props, cycleProgress, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const spreadX = isVertical ? 8.2 : 15.2;
  const spanY = isVertical ? 16.4 : 9.8;

  const squareGeo = useMemo(
    () => new RoundedBoxGeometry(0.16, 0.16, 0.02, 2, 0.02),
    [],
  );
  const stripGeo = useMemo(
    () => new RoundedBoxGeometry(0.24, 0.08, 0.018, 2, 0.015),
    [],
  );
  const hexGeo = useMemo(
    () => new THREE.CylinderGeometry(0.11, 0.11, 0.02, 6),
    [],
  );

  const materials = useMemo(() => {
    return [primaryHex, secondaryHex, accentHex].map(
      (col) =>
        new THREE.MeshPhysicalMaterial({
          color: col,
          metalness: 0.9,
          roughness: 0.18,
          clearcoat: 0.85,
          clearcoatRoughness: 0.12,
          flatShading: true,
        }),
    );
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      squareGeo.dispose();
      stripGeo.dispose();
      hexGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [squareGeo, stripGeo, hexGeo, materials]);

  const pieces = useMemo(() => {
    return Array.from({ length: LUXURY_COUNT }).map((_, i) => ({
      baseX: (pseudoHash(i * 8 + 1) - 0.5) * spreadX,
      baseU: pseudoHash(i * 8 + 2),
      z: (pseudoHash(i * 8 + 3) - 0.5) * 4.5,
      scale: 0.6 + pseudoHash(i * 8 + 4) * 0.9,
      phase: pseudoHash(i * 8 + 5) * Math.PI * 2,
      rx: pseudoHash(i * 8 + 6) > 0.5 ? 2 : -2,
      ry: pseudoHash(i * 8 + 7) > 0.5 ? 3 : -3,
      rz: pseudoHash(i * 8 + 8) > 0.5 ? 1 : -1,
      shapeIdx: i % 3,
      matIdx: i % 3,
    }));
  }, [spreadX]);

  return (
    <>
      <ambientLight intensity={0.78} />
      <directionalLight position={[7, 9, 12]} intensity={1.65} color="#ffffff" />
      <directionalLight position={[-7, -5, 10]} intensity={0.85} color={accentHex} />

      {pieces.map((p, idx) => {
        const u = (p.baseU + cycleProgress) % 1;
        const y = spanY * 0.5 - u * spanY;
        const x = p.baseX + Math.sin(angle + p.phase) * 0.48;
        const edgeFade = Math.min(1, Math.sin(u * Math.PI) * 3.2);
        const sc = p.scale * edgeFade;
        const geo =
          p.shapeIdx === 0 ? squareGeo : p.shapeIdx === 1 ? stripGeo : hexGeo;

        return (
          <mesh
            key={idx}
            geometry={geo}
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

export const GoldSilverLuxuryConfetti4K: React.FC<
  GoldSilverLuxuryConfetti4KProps
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
        <GoldSilverConfettiScene
          props={props}
          cycleProgress={cycleProgress}
          angle={angle}
        />
      </ThreeCanvas>
    </div>
  );
};
