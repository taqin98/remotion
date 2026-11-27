import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Easing, useCurrentFrame, useVideoConfig } from "remotion";
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

export const minimalistLoadingSpinner3DThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type MinimalistLoadingSpinner3DThemePreset =
  (typeof minimalistLoadingSpinner3DThemePresets)[number];

export const minimalistLoadingSpinner3D4KSchema = z.object({
  themePreset: z.enum(minimalistLoadingSpinner3DThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type MinimalistLoadingSpinner3D4KProps = z.infer<
  typeof minimalistLoadingSpinner3D4KSchema
>;

export const defaultMinimalistLoadingSpinner3D4KProps: MinimalistLoadingSpinner3D4KProps =
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

export const minimalistLoadingSpinner3D4KVariations: Record<
  MinimalistLoadingSpinner3DThemePreset,
  Omit<
    MinimalistLoadingSpinner3D4KProps,
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

  React.useLayoutEffect(() => {
    camera.position.set(0, 0, 12);
    camera.zoom = zoom;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, zoom]);

  return null;
};

function resolveThemeColors(props: MinimalistLoadingSpinner3D4KProps) {
  const preset = minimalistLoadingSpinner3D4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultMinimalistLoadingSpinner3D4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultMinimalistLoadingSpinner3D4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultMinimalistLoadingSpinner3D4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

const MinimalistSpinnerScene: React.FC<{
  props: MinimalistLoadingSpinner3D4KProps;
  cycleProgress: number;
}> = ({ props, cycleProgress }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const uiScale = isVertical ? 0.85 : 1;

  const tubeScale = Math.max(0.6, props.strokeWidth * 0.55);

  const outerSegGeo = useMemo(
    () => new THREE.TorusGeometry(1.55, 0.14 * tubeScale, 24, 48, Math.PI * 0.48),
    [tubeScale],
  );
  const innerSegGeo = useMemo(
    () => new THREE.TorusGeometry(0.96, 0.1 * tubeScale, 20, 40, Math.PI * 0.45),
    [tubeScale],
  );
  const coreGeo = useMemo(() => new THREE.IcosahedronGeometry(0.32, 0), []);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.45,
        roughness: 0.28,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.52,
        roughness: 0.24,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.72,
        roughness: 0.16,
        emissive: accentHex,
        emissiveIntensity: 0.34,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      outerSegGeo.dispose();
      innerSegGeo.dispose();
      coreGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [outerSegGeo, innerSegGeo, coreGeo, materials]);

  const ramped = Easing.bezier(0.22, 1, 0.36, 1)(cycleProgress);
  const outerSpin = -ramped * Math.PI * 2;
  const innerSpin = ramped * Math.PI * 4;
  const breathe = 1 + Math.sin(cycleProgress * Math.PI) * 0.12;
  const tilt = Math.sin(cycleProgress * Math.PI * 2) * 0.18;

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 12]} intensity={1.35} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.5} color={accentHex} />

      <group
        rotation={[tilt, tilt * 0.8, 0]}
        scale={[uiScale, uiScale, uiScale]}
      >
        {/* Outer 3 interlocking torus segments */}
        <group rotation={[0, 0, outerSpin]} scale={[breathe, breathe, 1]}>
          {[0, 1, 2].map((i) => (
            <mesh
              key={i}
              geometry={outerSegGeo}
              material={i === 0 ? materials[2] : materials[0]}
              rotation={[0.18, 0, (i * Math.PI * 2) / 3]}
            />
          ))}
        </group>

        {/* Inner 3 counter-rotating segments */}
        <group rotation={[0, 0, innerSpin]} position={[0, 0, 0.14]}>
          {[0, 1, 2].map((i) => (
            <mesh
              key={i}
              geometry={innerSegGeo}
              material={i === 1 ? materials[2] : materials[1]}
              rotation={[-0.18, 0, (i * Math.PI * 2) / 3 + 0.4]}
            />
          ))}
        </group>

        {/* Central faceted crystal */}
        <mesh
          geometry={coreGeo}
          material={materials[2]}
          position={[0, 0, 0.24]}
          rotation={[outerSpin * 0.5, innerSpin * 0.5, 0]}
        />
      </group>
    </>
  );
};

export const MinimalistLoadingSpinner3D4K: React.FC<
  MinimalistLoadingSpinner3D4KProps
> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const progress =
    ((frame % durationInFrames) / durationInFrames) * props.speedMultiplier;
  const cycleProgress = progress % 1;

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
        <MinimalistSpinnerScene props={props} cycleProgress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};
