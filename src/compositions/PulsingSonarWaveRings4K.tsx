import React, { useEffect, useLayoutEffect, useMemo } from "react";
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

export const pulsingSonarWaveRingsThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type PulsingSonarWaveRingsThemePreset =
  (typeof pulsingSonarWaveRingsThemePresets)[number];

export const pulsingSonarWaveRings4KSchema = z.object({
  themePreset: z.enum(pulsingSonarWaveRingsThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type PulsingSonarWaveRings4KProps = z.infer<
  typeof pulsingSonarWaveRings4KSchema
>;

export const defaultPulsingSonarWaveRings4KProps: PulsingSonarWaveRings4KProps =
  {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#0F172A",
    secondaryColor: "#1E293B",
    accentColor: "#38BDF8",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const pulsingSonarWaveRings4KVariations: Record<
  PulsingSonarWaveRingsThemePreset,
  Omit<
    PulsingSonarWaveRings4KProps,
    "aspectRatio" | "speedMultiplier" | "strokeWidth"
  >
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    backgroundColor: "transparent",
    primaryColor: "#1E293B",
    secondaryColor: "#64748B",
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
    secondaryColor: "#3F3F46",
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

  useLayoutEffect(() => {
    camera.position.set(0, 0, 12);
    camera.zoom = zoom;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, zoom]);

  return null;
};

function resolveThemeColors(props: PulsingSonarWaveRings4KProps) {
  const preset = pulsingSonarWaveRings4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor === defaultPulsingSonarWaveRings4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultPulsingSonarWaveRings4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultPulsingSonarWaveRings4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

const RING_COUNT = 8;

const PulsingSonarWaveScene: React.FC<{
  props: PulsingSonarWaveRings4KProps;
  cycleProgress: number;
  angle: number;
}> = ({ props, cycleProgress, angle }) => {
  const { secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const uiScale = isVertical ? 0.78 : 1;

  const waveRingGeo = useMemo(
    () => new THREE.TorusGeometry(1, 0.022 * props.strokeWidth, 18, 72),
    [props.strokeWidth],
  );
  const coreSphereGeo = useMemo(() => new THREE.SphereGeometry(0.22, 24, 24), []);
  const coreGimbalGeo = useMemo(
    () => new THREE.TorusGeometry(0.4, 0.028 * props.strokeWidth, 16, 48),
    [props.strokeWidth],
  );

  const ringMaterials = useMemo(() => {
    return Array.from({ length: RING_COUNT }).map((_, i) => {
      return new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? accentHex : secondaryHex,
        metalness: 0.65,
        roughness: 0.2,
        emissive: accentHex,
        emissiveIntensity: i % 2 === 0 ? 0.42 : 0.16,
        transparent: true,
        opacity: 1,
      });
    });
  }, [accentHex, secondaryHex]);

  const coreMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: accentHex,
      metalness: 0.75,
      roughness: 0.16,
      emissive: accentHex,
      emissiveIntensity: 0.48,
    });
  }, [accentHex]);

  useLayoutEffect(() => {
    ringMaterials.forEach((mat, i) => {
      const u = (i / RING_COUNT + cycleProgress) % 1;
      mat.opacity = Math.sin(u * Math.PI) * 0.92;
    });
  }, [ringMaterials, cycleProgress]);

  useEffect(() => {
    return () => {
      waveRingGeo.dispose();
      coreSphereGeo.dispose();
      coreGimbalGeo.dispose();
      ringMaterials.forEach((m) => m.dispose());
      coreMaterial.dispose();
    };
  }, [
    waveRingGeo,
    coreSphereGeo,
    coreGimbalGeo,
    ringMaterials,
    coreMaterial,
  ]);

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 12]} intensity={1.3} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.5} color={accentHex} />

      <group
        rotation={[-0.45, Math.sin(angle) * 0.1, 0]}
        scale={[uiScale, uiScale, uiScale]}
      >
        <mesh geometry={coreSphereGeo} material={coreMaterial} />
        <mesh
          geometry={coreGimbalGeo}
          material={coreMaterial}
          rotation={[angle, angle * 2, 0]}
        />

        {Array.from({ length: RING_COUNT }).map((_, i) => {
          const u = (i / RING_COUNT + cycleProgress) % 1;
          const r = 0.25 + u * 3.55;
          const fade = Math.sin(u * Math.PI);
          return (
            <mesh
              key={i}
              geometry={waveRingGeo}
              material={ringMaterials[i]}
              scale={[r, r, Math.max(0.05, fade)]}
            />
          );
        })}
      </group>
    </>
  );
};

export const PulsingSonarWaveRings4K: React.FC<
  PulsingSonarWaveRings4KProps
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
        <PulsingSonarWaveScene
          props={props}
          cycleProgress={cycleProgress}
          angle={angle}
        />
      </ThreeCanvas>
    </div>
  );
};
