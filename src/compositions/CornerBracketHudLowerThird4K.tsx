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

export const cornerBracketHudLowerThirdThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type CornerBracketHudLowerThirdThemePreset =
  (typeof cornerBracketHudLowerThirdThemePresets)[number];

export const cornerBracketHudLowerThird4KSchema = z.object({
  themePreset: z.enum(cornerBracketHudLowerThirdThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type CornerBracketHudLowerThird4KProps = z.infer<
  typeof cornerBracketHudLowerThird4KSchema
>;

export const defaultCornerBracketHudLowerThird4KProps: CornerBracketHudLowerThird4KProps =
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

export const cornerBracketHudLowerThird4KVariations: Record<
  CornerBracketHudLowerThirdThemePreset,
  Omit<
    CornerBracketHudLowerThird4KProps,
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
    secondaryColor: "#27272A",
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

const CornerBracketHudScene: React.FC<{
  props: CornerBracketHudLowerThird4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset = cornerBracketHudLowerThird4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultCornerBracketHudLowerThird4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultCornerBracketHudLowerThird4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultCornerBracketHudLowerThird4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const anchorX = isVertical ? -3.3 : -6.0;
  const anchorY = isVertical ? -4.55 : -2.55;
  const uiScale = isVertical ? 0.88 : 1;

  const plateW = 5.6;
  const plateH = 1.0;
  const frameW = 5.8;
  const frameH = 1.15;
  const armH = 0.75;
  const armV = 0.48;
  const armThick = 0.042 * props.strokeWidth;

  const frostedPlateGeometry = useMemo(() => {
    return new RoundedBoxGeometry(plateW, plateH, 0.14, 3, 0.04);
  }, [plateW, plateH]);

  const innerCoreGeometry = useMemo(() => {
    return new RoundedBoxGeometry(plateW * 0.94, plateH * 0.76, 0.08, 2, 0.03);
  }, [plateW, plateH]);

  const hArmGeometry = useMemo(() => {
    return new RoundedBoxGeometry(armH, armThick, 0.24, 2, 0.015);
  }, [armH, armThick]);

  const vArmGeometry = useMemo(() => {
    return new RoundedBoxGeometry(armThick, armV, 0.24, 2, 0.015);
  }, [armV, armThick]);

  const sideTickGeometry = useMemo(() => {
    return new RoundedBoxGeometry(0.05, 0.36, 0.18, 2, 0.015);
  }, []);

  const frostedMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: primaryHex,
      roughness: 0.22,
      metalness: 0.08,
      transmission: 0.48,
      ior: 1.46,
      thickness: 0.9,
      clearcoat: 1,
      transparent: true,
      opacity: 0.88,
    });
  }, [primaryHex]);

  const coreMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: secondaryHex,
      metalness: 0.26,
      roughness: 0.42,
      transparent: true,
      opacity: 0.84,
    });
  }, [secondaryHex]);

  const accentMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: accentHex,
      metalness: 0.72,
      roughness: 0.2,
      emissive: accentHex,
      emissiveIntensity: 0.24,
    });
  }, [accentHex]);

  useEffect(() => {
    return () => {
      frostedPlateGeometry.dispose();
      innerCoreGeometry.dispose();
      hArmGeometry.dispose();
      vArmGeometry.dispose();
      sideTickGeometry.dispose();
      frostedMaterial.dispose();
      coreMaterial.dispose();
      accentMaterial.dispose();
    };
  }, [
    frostedPlateGeometry,
    innerCoreGeometry,
    hArmGeometry,
    vArmGeometry,
    sideTickGeometry,
    frostedMaterial,
    coreMaterial,
    accentMaterial,
  ]);

  const bracketT =
    progress <= 0.17
      ? interpolate(progress, [0, 0.11], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.89, 1], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const plateScale =
    progress <= 0.17
      ? interpolate(progress, [0.05, 0.16], [0, 1], {
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

  const spreadX = interpolate(bracketT, [0, 1], [0.85, 0]);
  const spreadY = interpolate(bracketT, [0, 1], [0.5, 0]);
  const halfW = frameW * 0.5 + spreadX;
  const halfH = frameH * 0.5 + spreadY;

  const visible = bracketT > 0.002 || plateScale > 0.002;

  return (
    <>
      <ambientLight intensity={0.82} />
      <directionalLight position={[6, 8, 12]} intensity={1.22} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.48} color={accentHex} />

      <group
        position={[anchorX + frameW * 0.5 * uiScale, anchorY, 0]}
        scale={[uiScale, uiScale, uiScale]}
        visible={visible}
      >
        <group
          scale={
            plateScale > 0.002
              ? [plateScale, plateScale, 1]
              : [0.0001, 0.0001, 1]
          }
          visible={plateScale > 0.002}
        >
          <mesh
            geometry={innerCoreGeometry}
            material={coreMaterial}
            position={[0, 0, -0.06]}
          />
          <mesh
            geometry={frostedPlateGeometry}
            material={frostedMaterial}
            position={[0, 0, 0.04]}
          />
          <mesh
            geometry={sideTickGeometry}
            material={accentMaterial}
            position={[-plateW * 0.47, 0, 0.12]}
          />
          <mesh
            geometry={sideTickGeometry}
            material={accentMaterial}
            position={[plateW * 0.47, 0, 0.12]}
          />
        </group>

        <group
          position={[0, 0, 0.16]}
          scale={
            bracketT > 0.002
              ? [bracketT, bracketT, 1]
              : [0.0001, 0.0001, 1]
          }
          visible={bracketT > 0.002}
        >
          {/* Top-left */}
          <mesh
            geometry={hArmGeometry}
            material={accentMaterial}
            position={[-halfW + armH * 0.5, halfH, 0]}
          />
          <mesh
            geometry={vArmGeometry}
            material={accentMaterial}
            position={[-halfW, halfH - armV * 0.5, 0]}
          />
          {/* Top-right */}
          <mesh
            geometry={hArmGeometry}
            material={accentMaterial}
            position={[halfW - armH * 0.5, halfH, 0]}
          />
          <mesh
            geometry={vArmGeometry}
            material={accentMaterial}
            position={[halfW, halfH - armV * 0.5, 0]}
          />
          {/* Bottom-left */}
          <mesh
            geometry={hArmGeometry}
            material={accentMaterial}
            position={[-halfW + armH * 0.5, -halfH, 0]}
          />
          <mesh
            geometry={vArmGeometry}
            material={accentMaterial}
            position={[-halfW, -halfH + armV * 0.5, 0]}
          />
          {/* Bottom-right */}
          <mesh
            geometry={hArmGeometry}
            material={accentMaterial}
            position={[halfW - armH * 0.5, -halfH, 0]}
          />
          <mesh
            geometry={vArmGeometry}
            material={accentMaterial}
            position={[halfW, -halfH + armV * 0.5, 0]}
          />
        </group>
      </group>
    </>
  );
};

export const CornerBracketHudLowerThird4K: React.FC<
  CornerBracketHudLowerThird4KProps
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
        <CornerBracketHudScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};
