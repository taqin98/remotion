import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
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

export const architecturalArchBadgeLowerThirdThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type ArchitecturalArchBadgeLowerThirdThemePreset =
  (typeof architecturalArchBadgeLowerThirdThemePresets)[number];

export const architecturalArchBadgeLowerThird4KSchema = z.object({
  themePreset: z.enum(architecturalArchBadgeLowerThirdThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type ArchitecturalArchBadgeLowerThird4KProps = z.infer<
  typeof architecturalArchBadgeLowerThird4KSchema
>;

export const defaultArchitecturalArchBadgeLowerThird4KProps: ArchitecturalArchBadgeLowerThird4KProps =
  {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#F5F0E6",
    secondaryColor: "#E5DAC8",
    accentColor: "#D97706",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const architecturalArchBadgeLowerThird4KVariations: Record<
  ArchitecturalArchBadgeLowerThirdThemePreset,
  Omit<
    ArchitecturalArchBadgeLowerThird4KProps,
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

const ArchitecturalArchBadgeScene: React.FC<{
  props: ArchitecturalArchBadgeLowerThird4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset =
    architecturalArchBadgeLowerThird4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultArchitecturalArchBadgeLowerThird4KProps.primaryColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultArchitecturalArchBadgeLowerThird4KProps.secondaryColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultArchitecturalArchBadgeLowerThird4KProps.accentColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const anchorX = isVertical ? -3.15 : -5.95;
  const anchorY = isVertical ? -4.55 : -2.55;
  const uiScale = isVertical ? 0.88 : 1;

  const backingW = 5.4;

  const archDomeGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(0.48, 0.48, 0.24, 32);
  }, []);

  const archBaseGeometry = useMemo(() => {
    return new RoundedBoxGeometry(0.96, 0.65, 0.24, 2, 0.04);
  }, []);

  const innerArchRingGeometry = useMemo(() => {
    return new THREE.TorusGeometry(0.28, 0.03 * props.strokeWidth, 14, 36);
  }, [props.strokeWidth]);

  const innerPillarGeometry = useMemo(() => {
    return new RoundedBoxGeometry(0.14, 0.56, 0.28, 2, 0.03);
  }, []);

  const backingBarGeometry = useMemo(() => {
    return new RoundedBoxGeometry(backingW, 0.88, 0.14, 3, 0.05);
  }, [backingW]);

  const accentFooterGeometry = useMemo(() => {
    return new RoundedBoxGeometry(backingW * 0.85, 0.09, 0.16, 2, 0.02);
  }, [backingW]);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.16,
        roughness: 0.44,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.22,
        roughness: 0.36,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.56,
        roughness: 0.22,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      archDomeGeometry.dispose();
      archBaseGeometry.dispose();
      innerArchRingGeometry.dispose();
      innerPillarGeometry.dispose();
      backingBarGeometry.dispose();
      accentFooterGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [
    archDomeGeometry,
    archBaseGeometry,
    innerArchRingGeometry,
    innerPillarGeometry,
    backingBarGeometry,
    accentFooterGeometry,
    materials,
  ]);

  const badgeScale =
    progress <= 0.17
      ? interpolate(progress, [0, 0.1], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.9, 1], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const barWipe =
    progress <= 0.17
      ? interpolate(progress, [0.05, 0.17], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.83, 0.94], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const emblemTurn = Math.sin(progress * Math.PI * 2) * 0.14;
  const visible = badgeScale > 0.002 || barWipe > 0.002;

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[6, 8, 12]} intensity={1.12} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.4} color={accentHex} />

      <group
        position={[anchorX, anchorY, 0]}
        scale={[uiScale, uiScale, uiScale]}
        visible={visible}
      >
        <group
          position={[0, 0.02, 0.2]}
          rotation={[0, emblemTurn, 0]}
          scale={
            badgeScale > 0.002
              ? [badgeScale, badgeScale, badgeScale]
              : [0.0001, 0.0001, 0.0001]
          }
          visible={badgeScale > 0.002}
        >
          <mesh
            geometry={archDomeGeometry}
            material={materials[1]}
            position={[0, 0.22, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            geometry={archBaseGeometry}
            material={materials[1]}
            position={[0, -0.1, 0]}
          />
          <mesh
            geometry={innerArchRingGeometry}
            material={materials[2]}
            position={[0, 0.16, 0.14]}
          />
          <mesh
            geometry={innerPillarGeometry}
            material={materials[2]}
            position={[0, -0.12, 0.04]}
          />
        </group>

        <group
          position={[0.6, 0, -0.02]}
          scale={barWipe > 0.002 ? [barWipe, 1, 1] : [0.0001, 1, 1]}
          visible={barWipe > 0.002}
        >
          <mesh
            geometry={backingBarGeometry}
            material={materials[0]}
            position={[backingW * 0.5, 0.04, 0]}
          />
          <mesh
            geometry={accentFooterGeometry}
            material={materials[2]}
            position={[backingW * 0.425, -0.48, 0.02]}
          />
        </group>
      </group>
    </>
  );
};

export const ArchitecturalArchBadgeLowerThird4K: React.FC<
  ArchitecturalArchBadgeLowerThird4KProps
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
        <ArchitecturalArchBadgeScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

