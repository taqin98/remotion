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

export const luxuryGoldTrimmedSlateLowerThirdThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type LuxuryGoldTrimmedSlateLowerThirdThemePreset =
  (typeof luxuryGoldTrimmedSlateLowerThirdThemePresets)[number];

export const luxuryGoldTrimmedSlateLowerThird4KSchema = z.object({
  themePreset: z.enum(luxuryGoldTrimmedSlateLowerThirdThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type LuxuryGoldTrimmedSlateLowerThird4KProps = z.infer<
  typeof luxuryGoldTrimmedSlateLowerThird4KSchema
>;

export const defaultLuxuryGoldTrimmedSlateLowerThird4KProps: LuxuryGoldTrimmedSlateLowerThird4KProps =
  {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#18181B",
    secondaryColor: "#27272A",
    accentColor: "#D4AF37",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const luxuryGoldTrimmedSlateLowerThird4KVariations: Record<
  LuxuryGoldTrimmedSlateLowerThirdThemePreset,
  Omit<
    LuxuryGoldTrimmedSlateLowerThird4KProps,
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
    secondaryColor: "#27272A",
    accentColor: "#D4AF37",
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

const LuxuryGoldTrimmedSlateScene: React.FC<{
  props: LuxuryGoldTrimmedSlateLowerThird4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset =
    luxuryGoldTrimmedSlateLowerThird4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultLuxuryGoldTrimmedSlateLowerThird4KProps.primaryColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultLuxuryGoldTrimmedSlateLowerThird4KProps.secondaryColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultLuxuryGoldTrimmedSlateLowerThird4KProps.accentColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const anchorX = isVertical ? -3.3 : -6.1;
  const anchorY = isVertical ? -4.55 : -2.55;
  const uiScale = isVertical ? 0.88 : 1;

  const slateW = 5.8;
  const slateH = 1.05;
  const armLen = 0.68;
  const armThick = 0.036 * props.strokeWidth;

  const slateGeometry = useMemo(() => {
    return new RoundedBoxGeometry(slateW, slateH, 0.18, 3, 0.04);
  }, [slateW, slateH]);

  const innerBevelGeometry = useMemo(() => {
    return new RoundedBoxGeometry(slateW * 0.94, slateH * 0.78, 0.08, 2, 0.03);
  }, [slateW, slateH]);

  const hBracketGeometry = useMemo(() => {
    return new RoundedBoxGeometry(armLen, armThick, 0.24, 2, 0.015);
  }, [armLen, armThick]);

  const vBracketGeometry = useMemo(() => {
    return new RoundedBoxGeometry(armThick, armLen * 0.72, 0.24, 2, 0.015);
  }, [armLen, armThick]);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.24,
        roughness: 0.52,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.28,
        roughness: 0.44,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.82,
        roughness: 0.22,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      slateGeometry.dispose();
      innerBevelGeometry.dispose();
      hBracketGeometry.dispose();
      vBracketGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [
    slateGeometry,
    innerBevelGeometry,
    hBracketGeometry,
    vBracketGeometry,
    materials,
  ]);

  const bracketT =
    progress <= 0.17
      ? interpolate(progress, [0, 0.11], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.89, 1], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const slateScale =
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

  const spreadX = interpolate(bracketT, [0, 1], [0.55, 0]);
  const spreadY = interpolate(bracketT, [0, 1], [0.35, 0]);
  const halfW = slateW * 0.5 + 0.08 + spreadX;
  const halfH = slateH * 0.5 + 0.08 + spreadY;

  const visible = bracketT > 0.002 || slateScale > 0.002;

  return (
    <>
      <ambientLight intensity={0.78} />
      <directionalLight position={[6, 8, 12]} intensity={1.18} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.46} color={accentHex} />

      <group
        position={[anchorX + slateW * 0.5 * uiScale, anchorY, 0]}
        scale={[uiScale, uiScale, uiScale]}
        visible={visible}
      >
        {slateScale > 0.002 && (
          <group scale={[slateScale, slateScale, 1]}>
            <mesh geometry={slateGeometry} material={materials[0]} position={[0, 0, 0]} />
            <mesh
              geometry={innerBevelGeometry}
              material={materials[1]}
              position={[0, 0, 0.08]}
            />
          </group>
        )}

        {bracketT > 0.002 && (
          <group
            scale={[bracketT, bracketT, 1]}
            position={[0, 0, 0.14]}
          >
            {/* Top-left bracket */}
            <mesh
              geometry={hBracketGeometry}
              material={materials[2]}
              position={[-halfW + armLen * 0.5, halfH, 0]}
            />
            <mesh
              geometry={vBracketGeometry}
              material={materials[2]}
              position={[-halfW, halfH - armLen * 0.36, 0]}
            />

            {/* Top-right bracket */}
            <mesh
              geometry={hBracketGeometry}
              material={materials[2]}
              position={[halfW - armLen * 0.5, halfH, 0]}
            />
            <mesh
              geometry={vBracketGeometry}
              material={materials[2]}
              position={[halfW, halfH - armLen * 0.36, 0]}
            />

            {/* Bottom-left bracket */}
            <mesh
              geometry={hBracketGeometry}
              material={materials[2]}
              position={[-halfW + armLen * 0.5, -halfH, 0]}
            />
            <mesh
              geometry={vBracketGeometry}
              material={materials[2]}
              position={[-halfW, -halfH + armLen * 0.36, 0]}
            />

            {/* Bottom-right bracket */}
            <mesh
              geometry={hBracketGeometry}
              material={materials[2]}
              position={[halfW - armLen * 0.5, -halfH, 0]}
            />
            <mesh
              geometry={vBracketGeometry}
              material={materials[2]}
              position={[halfW, -halfH + armLen * 0.36, 0]}
            />
          </group>
        )}
      </group>
    </>
  );
};

export const LuxuryGoldTrimmedSlateLowerThird4K: React.FC<
  LuxuryGoldTrimmedSlateLowerThird4KProps
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
        <LuxuryGoldTrimmedSlateScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

