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

export const kineticChevronArrowSweepThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type KineticChevronArrowSweepThemePreset =
  (typeof kineticChevronArrowSweepThemePresets)[number];

export const kineticChevronArrowSweep4KSchema = z.object({
  themePreset: z.enum(kineticChevronArrowSweepThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type KineticChevronArrowSweep4KProps = z.infer<
  typeof kineticChevronArrowSweep4KSchema
>;

export const defaultKineticChevronArrowSweep4KProps: KineticChevronArrowSweep4KProps =
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

export const kineticChevronArrowSweep4KVariations: Record<
  KineticChevronArrowSweepThemePreset,
  Omit<
    KineticChevronArrowSweep4KProps,
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

const KineticChevronArrowSweepScene: React.FC<{
  props: KineticChevronArrowSweep4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset = kineticChevronArrowSweep4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultKineticChevronArrowSweep4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultKineticChevronArrowSweep4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultKineticChevronArrowSweep4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const worldW = isVertical ? 10 : 17.5;
  const worldH = isVertical ? 16.5 : 9.6;

  const backSlabGeometry = useMemo(() => {
    return new RoundedBoxGeometry(worldW * 1.15, worldH, 0.24, 3, 0.05);
  }, [worldW, worldH]);

  const wingGeometry = useMemo(() => {
    return new RoundedBoxGeometry(10.5, 11.5, 0.24, 3, 0.05);
  }, []);

  const accentRibGeometry = useMemo(() => {
    return new RoundedBoxGeometry(0.18 * props.strokeWidth, 11.6, 0.28, 2, 0.03);
  }, [props.strokeWidth]);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.3,
        roughness: 0.34,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.36,
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
      backSlabGeometry.dispose();
      wingGeometry.dispose();
      accentRibGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [backSlabGeometry, wingGeometry, accentRibGeometry, materials]);

  const chevrons = useMemo(() => {
    return [
      { key: "ch0", delayNorm: 0.0, z: 0.36, matIndex: 2, hasSlab: false },
      { key: "ch1", delayNorm: 0.22, z: 0.28, matIndex: 1, hasSlab: false },
      { key: "ch2", delayNorm: 0.44, z: 0.2, matIndex: 0, hasSlab: true },
      { key: "ch3", delayNorm: 0.66, z: 0.12, matIndex: 1, hasSlab: true },
      { key: "ch4", delayNorm: 0.88, z: 0.04, matIndex: 0, hasSlab: true },
    ];
  }, []);

  const travelX = worldW * 1.45;
  const dur = 0.26;
  const enterSpan = 0.42 - dur;
  const exitStart = 0.58;
  const exitSpan = 1 - exitStart - dur;

  return (
    <>
      <ambientLight intensity={0.78} />
      <directionalLight position={[6, 8, 12]} intensity={1.18} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.44} color={accentHex} />

      <group>
        {chevrons.map((ch) => {
          const inStart = ch.delayNorm * enterSpan;
          const inT = interpolate(progress, [inStart, inStart + dur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });

          const outBegin = exitStart + ch.delayNorm * exitSpan;
          const outT = interpolate(progress, [outBegin, outBegin + dur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          });

          const x =
            progress <= 0.5
              ? interpolate(inT, [0, 1], [-travelX, 0])
              : interpolate(outT, [0, 1], [0, travelX]);

          const onScreen = Math.abs(x) < travelX - 0.5;

          return (
            <group key={ch.key} position={[x, 0, ch.z]} visible={onScreen}>
              {ch.hasSlab && (
                <mesh
                  geometry={backSlabGeometry}
                  material={materials[ch.matIndex]}
                  position={[-1.2, 0, -0.04]}
                />
              )}
              <group position={[3.6, 3.2, 0]} rotation={[0, 0, Math.PI / 4]}>
                <mesh geometry={wingGeometry} material={materials[ch.matIndex]} />
                <mesh
                  geometry={accentRibGeometry}
                  material={materials[2]}
                  position={[5.15, 0, 0.02]}
                />
              </group>
              <group position={[3.6, -3.2, 0]} rotation={[0, 0, -Math.PI / 4]}>
                <mesh geometry={wingGeometry} material={materials[ch.matIndex]} />
                <mesh
                  geometry={accentRibGeometry}
                  material={materials[2]}
                  position={[5.15, 0, 0.02]}
                />
              </group>
            </group>
          );
        })}
      </group>
    </>
  );
};

export const KineticChevronArrowSweep4K: React.FC<
  KineticChevronArrowSweep4KProps
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
        <KineticChevronArrowSweepScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

