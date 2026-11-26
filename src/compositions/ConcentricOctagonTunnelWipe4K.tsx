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

export const concentricOctagonTunnelWipeThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type ConcentricOctagonTunnelWipeThemePreset =
  (typeof concentricOctagonTunnelWipeThemePresets)[number];

export const concentricOctagonTunnelWipe4KSchema = z.object({
  themePreset: z.enum(concentricOctagonTunnelWipeThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type ConcentricOctagonTunnelWipe4KProps = z.infer<
  typeof concentricOctagonTunnelWipe4KSchema
>;

export const defaultConcentricOctagonTunnelWipe4KProps: ConcentricOctagonTunnelWipe4KProps =
  {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#18181B",
    secondaryColor: "#3F3F46",
    accentColor: "#E4E4E7",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const concentricOctagonTunnelWipe4KVariations: Record<
  ConcentricOctagonTunnelWipeThemePreset,
  Omit<
    ConcentricOctagonTunnelWipe4KProps,
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

const ConcentricOctagonTunnelScene: React.FC<{
  props: ConcentricOctagonTunnelWipe4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset = concentricOctagonTunnelWipe4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultConcentricOctagonTunnelWipe4KProps.primaryColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultConcentricOctagonTunnelWipe4KProps.secondaryColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultConcentricOctagonTunnelWipe4KProps.accentColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.accentColor
      : props.accentColor;

  const unitOctagonGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(1, 0.96, 0.2, 8);
  }, []);

  const ringTorusGeometry = useMemo(() => {
    return new THREE.TorusGeometry(1, 0.015 * props.strokeWidth, 12, 8);
  }, [props.strokeWidth]);

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
        metalness: 0.56,
        roughness: 0.2,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      unitOctagonGeometry.dispose();
      ringTorusGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [unitOctagonGeometry, ringTorusGeometry, materials]);

  const layers = useMemo(() => {
    const radii = [12.4, 9.8, 7.8, 6.0, 4.4, 3.0, 1.8, 0.9];
    return radii.map((r, i) => ({
      key: `oct-${i}`,
      targetRadius: r,
      z: i * 0.14,
      delayNorm: i / Math.max(1, radii.length - 1),
      matIndex: i % 3 === 2 ? 2 : i % 2,
      rotZ: Math.PI / 8 + i * 0.06,
    }));
  }, []);

  const phaseDur = 0.24;
  const enterSpan = 0.42 - phaseDur;
  const exitStart = 0.58;
  const exitSpan = 1 - exitStart - phaseDur;

  return (
    <>
      <ambientLight intensity={0.78} />
      <directionalLight position={[6, 8, 12]} intensity={1.15} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.44} color={accentHex} />

      <group>
        {layers.map((layer) => {
          const inStart = layer.delayNorm * enterSpan;
          const inT = interpolate(progress, [inStart, inStart + phaseDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });

          const outBegin = exitStart + (1 - layer.delayNorm) * exitSpan;
          const outT = interpolate(progress, [outBegin, outBegin + phaseDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          });

          const scaleMul =
            progress <= 0.5
              ? interpolate(inT, [0, 1], [0, 1])
              : interpolate(outT, [0, 1], [1, 0]);

          const curRadius = layer.targetRadius * scaleMul;
          const twist =
            progress <= 0.5
              ? interpolate(inT, [0, 1], [-0.45, 0])
              : interpolate(outT, [0, 1], [0, 0.45]);

          const visible = curRadius > 0.005;

          return (
            <group
              key={layer.key}
              position={[0, 0, layer.z]}
              rotation={[0, 0, layer.rotZ + twist]}
              scale={visible ? [curRadius, curRadius, 1] : [0.0001, 0.0001, 1]}
              visible={visible}
            >
              <mesh
                geometry={unitOctagonGeometry}
                material={materials[layer.matIndex]}
                rotation={[Math.PI / 2, 0, 0]}
              />
              {layer.matIndex !== 2 && (
                <mesh
                  geometry={ringTorusGeometry}
                  material={materials[2]}
                  position={[0, 0, 0.11]}
                  rotation={[0, 0, Math.PI / 8]}
                />
              )}
            </group>
          );
        })}
      </group>
    </>
  );
};

export const ConcentricOctagonTunnelWipe4K: React.FC<
  ConcentricOctagonTunnelWipe4KProps
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
        <ConcentricOctagonTunnelScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

