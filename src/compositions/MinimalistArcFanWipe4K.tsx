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

export const minimalistArcFanWipeThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type MinimalistArcFanWipeThemePreset =
  (typeof minimalistArcFanWipeThemePresets)[number];

export const minimalistArcFanWipe4KSchema = z.object({
  themePreset: z.enum(minimalistArcFanWipeThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type MinimalistArcFanWipe4KProps = z.infer<
  typeof minimalistArcFanWipe4KSchema
>;

export const defaultMinimalistArcFanWipe4KProps: MinimalistArcFanWipe4KProps = {
  themePreset: "warm-minimalist",
  aspectRatio: "16:9",
  backgroundColor: "transparent",
  primaryColor: "#F5F0E6",
  secondaryColor: "#E5DAC8",
  accentColor: "#D97706",
  speedMultiplier: 1,
  strokeWidth: 2,
};

export const minimalistArcFanWipe4KVariations: Record<
  MinimalistArcFanWipeThemePreset,
  Omit<MinimalistArcFanWipe4KProps, "aspectRatio" | "speedMultiplier" | "strokeWidth">
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

const MinimalistArcFanScene: React.FC<{
  props: MinimalistArcFanWipe4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset = minimalistArcFanWipe4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor === defaultMinimalistArcFanWipe4KProps.primaryColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultMinimalistArcFanWipe4KProps.secondaryColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultMinimalistArcFanWipe4KProps.accentColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const worldW = isVertical ? 9 : 16;
  const worldH = isVertical ? 16 : 9;
  const pivotX = -worldW * 0.56;
  const pivotY = -worldH * 0.56;
  const bladeLen = Math.hypot(worldW, worldH) * 1.25;
  const bladeWidth = bladeLen * 0.44;

  const bladeGeometry = useMemo(() => {
    return new RoundedBoxGeometry(bladeLen, bladeWidth, 0.16, 3, 0.04);
  }, [bladeLen, bladeWidth]);

  const trimGeometry = useMemo(() => {
    return new RoundedBoxGeometry(
      bladeLen,
      0.08 * props.strokeWidth,
      0.2,
      2,
      0.02,
    );
  }, [bladeLen, props.strokeWidth]);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.18,
        roughness: 0.4,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.24,
        roughness: 0.34,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.46,
        roughness: 0.24,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      bladeGeometry.dispose();
      trimGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [bladeGeometry, trimGeometry, materials]);

  const blades = useMemo(() => {
    const targetAngles = [0.06, 0.42, 0.78, 1.14, 1.5];
    return targetAngles.map((targetAngle, i) => ({
      key: `fan-${i}`,
      targetAngle,
      z: i * 0.16,
      delayNorm: i / Math.max(1, targetAngles.length - 1),
      matIndex: i === 2 ? 2 : i % 2,
    }));
  }, []);

  const phaseDur = 0.26;
  const enterSpan = 0.42 - phaseDur;
  const exitStart = 0.58;
  const exitSpan = 1 - exitStart - phaseDur;

  return (
    <>
      <ambientLight intensity={0.78} />
      <directionalLight position={[6, 8, 12]} intensity={1.15} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.4} color={accentHex} />

      <group position={[pivotX, pivotY, 0]}>
        {blades.map((blade) => {
          const inStart = blade.delayNorm * enterSpan;
          const inT = interpolate(progress, [inStart, inStart + phaseDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });

          const outBegin = exitStart + (1 - blade.delayNorm) * exitSpan;
          const outT = interpolate(progress, [outBegin, outBegin + phaseDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          });

          const angle =
            progress <= 0.5
              ? interpolate(inT, [0, 1], [-0.45, blade.targetAngle])
              : interpolate(outT, [0, 1], [blade.targetAngle, -0.45]);

          const scale =
            progress <= 0.5
              ? interpolate(inT, [0, 0.2, 1], [0, 1, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              : interpolate(outT, [0, 0.8, 1], [1, 1, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });

          const visible = scale > 0.002;

          return (
            <group
              key={blade.key}
              position={[0, 0, blade.z]}
              rotation={[0, 0, angle]}
              scale={visible ? [scale, scale, 1] : [0.0001, 0.0001, 1]}
              visible={visible}
            >
              <mesh
                geometry={bladeGeometry}
                material={materials[blade.matIndex]}
                position={[bladeLen * 0.5, 0, 0]}
              />
              <mesh
                geometry={trimGeometry}
                material={materials[2]}
                position={[bladeLen * 0.5, bladeWidth * 0.44, 0.02]}
              />
            </group>
          );
        })}
      </group>
    </>
  );
};

export const MinimalistArcFanWipe4K: React.FC<MinimalistArcFanWipe4KProps> = (
  props,
) => {
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
        <MinimalistArcFanScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

