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

export const confettiBurstCannonOneShotThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type ConfettiBurstCannonOneShotThemePreset =
  (typeof confettiBurstCannonOneShotThemePresets)[number];

export const confettiBurstCannonOneShot4KSchema = z.object({
  themePreset: z.enum(confettiBurstCannonOneShotThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type ConfettiBurstCannonOneShot4KProps = z.infer<
  typeof confettiBurstCannonOneShot4KSchema
>;

export const defaultConfettiBurstCannonOneShot4KProps: ConfettiBurstCannonOneShot4KProps =
  {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#D4AF37",
    secondaryColor: "#38BDF8",
    accentColor: "#F43F5E",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const confettiBurstCannonOneShot4KVariations: Record<
  ConfettiBurstCannonOneShotThemePreset,
  Omit<
    ConfettiBurstCannonOneShot4KProps,
    "aspectRatio" | "speedMultiplier" | "strokeWidth"
  >
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    backgroundColor: "transparent",
    primaryColor: "#2563EB",
    secondaryColor: "#38BDF8",
    accentColor: "#F59E0B",
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
    secondaryColor: "#E07A5F",
    accentColor: "#FDE047",
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    backgroundColor: "transparent",
    primaryColor: "#D4AF37",
    secondaryColor: "#38BDF8",
    accentColor: "#F43F5E",
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

function resolveThemeColors(props: ConfettiBurstCannonOneShot4KProps) {
  const preset = confettiBurstCannonOneShot4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultConfettiBurstCannonOneShot4KProps.primaryColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultConfettiBurstCannonOneShot4KProps.secondaryColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultConfettiBurstCannonOneShot4KProps.accentColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

function pseudoHash(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const BURST_COUNT = 160;

const ConfettiBurstCannonScene: React.FC<{
  props: ConfettiBurstCannonOneShot4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const cornerX = isVertical ? 4.4 : 7.8;
  const cornerY = isVertical ? 7.8 : 4.4;

  const rectGeo = useMemo(
    () => new RoundedBoxGeometry(0.18, 0.1, 0.018, 2, 0.008),
    [],
  );
  const triGeo = useMemo(
    () => new THREE.CylinderGeometry(0.12, 0.12, 0.018, 3),
    [],
  );
  const hexGeo = useMemo(
    () => new THREE.CylinderGeometry(0.11, 0.11, 0.018, 6),
    [],
  );

  const materials = useMemo(() => {
    const highlightHex = "#FFFFFF";
    return [primaryHex, secondaryHex, accentHex, highlightHex].map(
      (col) =>
        new THREE.MeshStandardMaterial({
          color: col,
          metalness: 0.8,
          roughness: 0.2,
          flatShading: true,
        }),
    );
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      rectGeo.dispose();
      triGeo.dispose();
      hexGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [rectGeo, triGeo, hexGeo, materials]);

  const pieces = useMemo(() => {
    return Array.from({ length: BURST_COUNT }).map((_, i) => {
      const fromLeft = i % 2 === 0;
      const side = fromLeft ? 1 : -1;
      const launchAngle =
        (30 + pseudoHash(i * 9 + 1) * 44) * (Math.PI / 180);
      const speed =
        (isVertical ? 11.5 : 10.5) + pseudoHash(i * 9 + 2) * 8.5;
      return {
        originX: fromLeft ? -cornerX : cornerX,
        originY: -cornerY,
        vx: side * Math.cos(launchAngle) * speed,
        vy: Math.sin(launchAngle) * speed,
        z: (pseudoHash(i * 9 + 3) - 0.5) * 3.6,
        delay: pseudoHash(i * 9 + 4) * 0.14,
        scale: 0.65 + pseudoHash(i * 9 + 5) * 0.85,
        phase: pseudoHash(i * 9 + 6) * Math.PI * 2,
        rotSpeed: 8 + pseudoHash(i * 9 + 7) * 10,
        shapeIdx: i % 3,
        matIdx: i % 4,
      };
    });
  }, [cornerX, cornerY, isVertical]);

  const drag = 1.65;
  const gravity = 7.2;
  const flightDuration = 2.85;

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 9, 12]} intensity={1.55} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.65} color={accentHex} />

      {pieces.map((p, idx) => {
        const localT = Math.max(0, (progress - p.delay) / (0.96 - p.delay));
        const scaleEnv =
          localT <= 0 || localT >= 1
            ? 0
            : Math.min(1, localT * 10) * Math.min(1, (1 - localT) * 4.5);

        if (scaleEnv <= 0.002) {
          return null;
        }

        const tau = localT * flightDuration;
        const dragFactor = (1 - Math.exp(-drag * tau)) / drag;
        const x =
          p.originX +
          p.vx * dragFactor +
          Math.sin(tau * 6 + p.phase) * 0.22 * localT;
        const y = p.originY + p.vy * dragFactor - 0.5 * gravity * tau * tau;
        const sc = p.scale * scaleEnv;
        const geo =
          p.shapeIdx === 0 ? rectGeo : p.shapeIdx === 1 ? triGeo : hexGeo;

        return (
          <mesh
            key={idx}
            geometry={geo}
            material={materials[p.matIdx]}
            position={[x, y, p.z]}
            rotation={[
              tau * p.rotSpeed + p.phase,
              tau * p.rotSpeed * 0.8 + p.phase,
              tau * p.rotSpeed * 0.5,
            ]}
            scale={[sc, sc, sc]}
          />
        );
      })}
    </>
  );
};

export const ConfettiBurstCannonOneShot4K: React.FC<
  ConfettiBurstCannonOneShot4KProps
> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const lastFrame = Math.max(1, durationInFrames - 1);
  const rawProgress = (frame / lastFrame) * props.speedMultiplier;
  const cycleProgress =
    props.speedMultiplier === 1
      ? Math.min(1, Math.max(0, rawProgress))
      : rawProgress >= props.speedMultiplier
        ? 1
        : rawProgress % 1;

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
        <ConfettiBurstCannonScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};
