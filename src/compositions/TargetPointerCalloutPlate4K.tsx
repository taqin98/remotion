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

export const targetPointerCalloutPlateThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type TargetPointerCalloutPlateThemePreset =
  (typeof targetPointerCalloutPlateThemePresets)[number];

export const targetPointerCalloutPlate4KSchema = z.object({
  themePreset: z.enum(targetPointerCalloutPlateThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type TargetPointerCalloutPlate4KProps = z.infer<
  typeof targetPointerCalloutPlate4KSchema
>;

export const defaultTargetPointerCalloutPlate4KProps: TargetPointerCalloutPlate4KProps =
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

export const targetPointerCalloutPlate4KVariations: Record<
  TargetPointerCalloutPlateThemePreset,
  Omit<
    TargetPointerCalloutPlate4KProps,
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

const TargetPointerCalloutScene: React.FC<{
  props: TargetPointerCalloutPlate4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset = targetPointerCalloutPlate4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultTargetPointerCalloutPlate4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultTargetPointerCalloutPlate4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultTargetPointerCalloutPlate4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const anchorX = isVertical ? -2.4 : -3.8;
  const anchorY = isVertical ? -2.9 : -1.8;
  const uiScale = isVertical ? 0.84 : 1;

  const diagAngle = Math.PI * 0.25;
  const diagLen = 1.45;
  const shelfLen = 1.2;
  const boxW = 4.2;
  const boxH = 0.92;
  const lineThick = 0.03 * props.strokeWidth;

  const innerRingGeometry = useMemo(() => {
    return new THREE.TorusGeometry(0.26, 0.022 * props.strokeWidth, 16, 48);
  }, [props.strokeWidth]);

  const outerRingGeometry = useMemo(() => {
    return new THREE.TorusGeometry(0.42, 0.016 * props.strokeWidth, 16, 48);
  }, [props.strokeWidth]);

  const dotGeometry = useMemo(() => {
    return new THREE.SphereGeometry(0.09, 20, 20);
  }, []);

  const diagLineGeometry = useMemo(() => {
    return new RoundedBoxGeometry(diagLen, lineThick, 0.08, 2, 0.012);
  }, [diagLen, lineThick]);

  const shelfLineGeometry = useMemo(() => {
    return new RoundedBoxGeometry(shelfLen, lineThick, 0.08, 2, 0.012);
  }, [shelfLen, lineThick]);

  const elbowDotGeometry = useMemo(() => {
    return new THREE.SphereGeometry(0.06, 16, 16);
  }, []);

  const dataBoxGeometry = useMemo(() => {
    return new RoundedBoxGeometry(boxW, boxH, 0.14, 3, 0.04);
  }, [boxW, boxH]);

  const innerPlateGeometry = useMemo(() => {
    return new RoundedBoxGeometry(boxW - 0.18, boxH - 0.24, 0.08, 2, 0.03);
  }, [boxW, boxH]);

  const headerStripGeometry = useMemo(() => {
    return new RoundedBoxGeometry(boxW, 0.055 * props.strokeWidth, 0.18, 2, 0.02);
  }, [boxW, props.strokeWidth]);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.25,
        roughness: 0.42,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.3,
        roughness: 0.35,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.65,
        roughness: 0.2,
        emissive: accentHex,
        emissiveIntensity: 0.24,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      innerRingGeometry.dispose();
      outerRingGeometry.dispose();
      dotGeometry.dispose();
      diagLineGeometry.dispose();
      shelfLineGeometry.dispose();
      elbowDotGeometry.dispose();
      dataBoxGeometry.dispose();
      innerPlateGeometry.dispose();
      headerStripGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [
    innerRingGeometry,
    outerRingGeometry,
    dotGeometry,
    diagLineGeometry,
    shelfLineGeometry,
    elbowDotGeometry,
    dataBoxGeometry,
    innerPlateGeometry,
    headerStripGeometry,
    materials,
  ]);

  const ringT =
    progress <= 0.17
      ? interpolate(progress, [0, 0.07], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.93, 1], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const diagT =
    progress <= 0.17
      ? interpolate(progress, [0.05, 0.1], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.89, 0.94], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const shelfT =
    progress <= 0.17
      ? interpolate(progress, [0.09, 0.13], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.86, 0.9], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const boxT =
    progress <= 0.17
      ? interpolate(progress, [0.12, 0.17], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.83, 0.87], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const pulse = 1 + Math.sin(progress * Math.PI * 6) * 0.14;
  const elbowX = Math.cos(diagAngle) * diagLen;
  const elbowY = Math.sin(diagAngle) * diagLen;
  const visible = ringT > 0.002;

  return (
    <>
      <ambientLight intensity={0.82} />
      <directionalLight position={[6, 8, 12]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.45} color={accentHex} />

      <group
        position={[anchorX, anchorY, 0]}
        scale={[uiScale, uiScale, uiScale]}
        visible={visible}
      >
        <group
          position={[0, 0, 0.16]}
          scale={
            ringT > 0.002
              ? [ringT, ringT, ringT]
              : [0.0001, 0.0001, 0.0001]
          }
        >
          <mesh geometry={dotGeometry} material={materials[2]} />
          <mesh geometry={innerRingGeometry} material={materials[2]} />
          <mesh
            geometry={outerRingGeometry}
            material={materials[1]}
            scale={[pulse, pulse, 1]}
          />
        </group>

        <group
          position={[0, 0, 0.06]}
          rotation={[0, 0, diagAngle]}
          scale={diagT > 0.002 ? [diagT, 1, 1] : [0.0001, 1, 1]}
          visible={diagT > 0.002}
        >
          <mesh
            geometry={diagLineGeometry}
            material={materials[2]}
            position={[diagLen * 0.5, 0, 0]}
          />
        </group>

        <mesh
          geometry={elbowDotGeometry}
          material={materials[2]}
          position={[elbowX, elbowY, 0.1]}
          scale={
            shelfT > 0.002
              ? [shelfT, shelfT, shelfT]
              : [0.0001, 0.0001, 0.0001]
          }
          visible={shelfT > 0.002}
        />

        <group
          position={[elbowX, elbowY, 0.06]}
          scale={shelfT > 0.002 ? [shelfT, 1, 1] : [0.0001, 1, 1]}
          visible={shelfT > 0.002}
        >
          <mesh
            geometry={shelfLineGeometry}
            material={materials[2]}
            position={[shelfLen * 0.5, 0, 0]}
          />
        </group>

        <group
          position={[elbowX + shelfLen + boxW * 0.5, elbowY, 0]}
          scale={boxT > 0.002 ? [1, boxT, 1] : [1, 0.0001, 1]}
          visible={boxT > 0.002}
        >
          <mesh geometry={dataBoxGeometry} material={materials[0]} />
          <mesh
            geometry={innerPlateGeometry}
            material={materials[1]}
            position={[0, -0.04, 0.06]}
          />
          <mesh
            geometry={headerStripGeometry}
            material={materials[2]}
            position={[0, boxH * 0.5 - 0.02, 0.08]}
          />
        </group>
      </group>
    </>
  );
};

export const TargetPointerCalloutPlate4K: React.FC<
  TargetPointerCalloutPlate4KProps
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
        <TargetPointerCalloutScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};
