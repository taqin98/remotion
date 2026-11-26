import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
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

export const concentricCircleIrisApertureThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type ConcentricCircleIrisApertureThemePreset =
  (typeof concentricCircleIrisApertureThemePresets)[number];

export const concentricCircleIrisAperture4KSchema = z.object({
  themePreset: z.enum(concentricCircleIrisApertureThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type ConcentricCircleIrisAperture4KProps = z.infer<
  typeof concentricCircleIrisAperture4KSchema
>;

export const defaultConcentricCircleIrisAperture4KProps: ConcentricCircleIrisAperture4KProps =
  {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#1E293B",
    secondaryColor: "#334155",
    accentColor: "#38BDF8",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const concentricCircleIrisAperture4KVariations: Record<
  ConcentricCircleIrisApertureThemePreset,
  Omit<
    ConcentricCircleIrisAperture4KProps,
    "aspectRatio" | "speedMultiplier" | "strokeWidth"
  >
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    backgroundColor: "transparent",
    primaryColor: "#FFFFFF",
    secondaryColor: "#E2E8F0",
    accentColor: "#2563EB",
  },
  "dark-tech": {
    themePreset: "dark-tech",
    backgroundColor: "transparent",
    primaryColor: "#1E293B",
    secondaryColor: "#334155",
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
    accentColor: "#E4E4E7",
  },
};

const CAMERA_CONFIG = {
  position: [0, 0, 10] as [number, number, number],
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
    camera.position.set(0, 0, 10);
    camera.zoom = zoom;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, zoom]);

  return null;
};

const ConcentricIrisScene: React.FC<{
  props: ConcentricCircleIrisAperture4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset = concentricCircleIrisAperture4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultConcentricCircleIrisAperture4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultConcentricCircleIrisAperture4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultConcentricCircleIrisAperture4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  const bladeCount = 12;
  const maxCoverRadius = 11.2;

  const bladeGeometry = useMemo(() => {
    return new THREE.BoxGeometry(11.5, 5.2, 0.16);
  }, []);

  const ringOneGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(maxCoverRadius, maxCoverRadius, 0.12, 64);
  }, [maxCoverRadius]);

  const ringAccentGeometry = useMemo(() => {
    return new THREE.TorusGeometry(3.6, 0.045 * props.strokeWidth, 16, 72);
  }, [props.strokeWidth]);

  const hubGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(2.1, 2.25, 0.24, 48);
  }, []);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.34,
        roughness: 0.32,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.38,
        roughness: 0.28,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.55,
        roughness: 0.2,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      bladeGeometry.dispose();
      ringOneGeometry.dispose();
      ringAccentGeometry.dispose();
      hubGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [bladeGeometry, ringOneGeometry, ringAccentGeometry, hubGeometry, materials]);

  const closeAmount =
    progress <= 0.42
      ? interpolate(progress, [0, 0.42], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.inOut(Easing.cubic),
        })
      : progress >= 0.58
        ? interpolate(progress, [0.58, 1], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.cubic),
          })
        : 1;

  const bladeRadius = interpolate(closeAmount, [0, 1], [11.8, 1.35]);
  const bladeSwing = interpolate(closeAmount, [0, 1], [-0.92, -0.18]);
  const irisRotation = interpolate(progress, [0, 0.5, 1], [0, Math.PI * 0.38, Math.PI * 0.76]);

  const sealScale = interpolate(closeAmount, [0.45, 0.96], [0, 1.05], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const hubScale = interpolate(closeAmount, [0.68, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const activeVisible = closeAmount > 0.002;

  return (
    <>
      <ambientLight intensity={0.76} />
      <directionalLight position={[6, 8, 12]} intensity={1.15} color="#ffffff" />
      <directionalLight position={[-6, -5, 8]} intensity={0.45} color={accentHex} />

      <group rotation={[0, 0, irisRotation]} visible={activeVisible}>
        {sealScale > 0.002 && (
          <group position={[0, 0, -0.35]} scale={[sealScale, sealScale, 1]}>
            <mesh
              geometry={ringOneGeometry}
              material={materials[0]}
              rotation={[Math.PI / 2, 0, 0]}
            />
          </group>
        )}

        {Array.from({ length: bladeCount }, (_, i) => {
          const baseAngle = (i / bladeCount) * Math.PI * 2;
          const matIndex = i % 2;
          const zLayer = 0.04 + (i % 3) * 0.025;
          const pivotX = Math.cos(baseAngle) * bladeRadius;
          const pivotY = Math.sin(baseAngle) * bladeRadius;

          return (
            <group
              key={`blade-${i}`}
              position={[pivotX, pivotY, zLayer]}
              rotation={[0, 0, baseAngle + bladeSwing]}
            >
              <mesh
                geometry={bladeGeometry}
                material={materials[matIndex]}
                position={[-4.6, 0, 0]}
              />
            </group>
          );
        })}

        {hubScale > 0.002 && (
          <>
            <group position={[0, 0, 0.2]} scale={[hubScale, hubScale, 1]}>
              <mesh
                geometry={hubGeometry}
                material={materials[1]}
                rotation={[Math.PI / 2, 0, 0]}
              />
            </group>
            <mesh
              geometry={ringAccentGeometry}
              material={materials[2]}
              position={[0, 0, 0.34]}
              scale={[hubScale, hubScale, 1]}
            />
          </>
        )}
      </group>
    </>
  );
};

export const ConcentricCircleIrisAperture4K: React.FC<
  ConcentricCircleIrisAperture4KProps
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
        <ConcentricIrisScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

