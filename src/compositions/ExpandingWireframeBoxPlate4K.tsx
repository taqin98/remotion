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

export const expandingWireframeBoxPlateThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type ExpandingWireframeBoxPlateThemePreset =
  (typeof expandingWireframeBoxPlateThemePresets)[number];

export const expandingWireframeBoxPlate4KSchema = z.object({
  themePreset: z.enum(expandingWireframeBoxPlateThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type ExpandingWireframeBoxPlate4KProps = z.infer<
  typeof expandingWireframeBoxPlate4KSchema
>;

export const defaultExpandingWireframeBoxPlate4KProps: ExpandingWireframeBoxPlate4KProps =
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

export const expandingWireframeBoxPlate4KVariations: Record<
  ExpandingWireframeBoxPlateThemePreset,
  Omit<
    ExpandingWireframeBoxPlate4KProps,
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

const ExpandingWireframeBoxScene: React.FC<{
  props: ExpandingWireframeBoxPlate4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset = expandingWireframeBoxPlate4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultExpandingWireframeBoxPlate4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultExpandingWireframeBoxPlate4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultExpandingWireframeBoxPlate4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const anchorX = isVertical ? -3.3 : -6.1;
  const anchorY = isVertical ? -4.55 : -2.55;
  const uiScale = isVertical ? 0.88 : 1;

  const boxW = 5.8;
  const boxH = 1.1;
  const boxD = 0.32;
  const beamThick = 0.028 * props.strokeWidth;

  const xBeamGeometry = useMemo(() => {
    return new RoundedBoxGeometry(boxW, beamThick, beamThick, 2, 0.01);
  }, [boxW, beamThick]);

  const yBeamGeometry = useMemo(() => {
    return new RoundedBoxGeometry(beamThick, boxH, beamThick, 2, 0.01);
  }, [boxH, beamThick]);

  const zBeamGeometry = useMemo(() => {
    return new RoundedBoxGeometry(beamThick, beamThick, boxD, 2, 0.01);
  }, [boxD, beamThick]);

  const nodeGeometry = useMemo(() => {
    return new RoundedBoxGeometry(0.085, 0.085, 0.085, 2, 0.018);
  }, []);

  const coreGeometry = useMemo(() => {
    return new RoundedBoxGeometry(5.64, 0.94, 0.18, 3, 0.04);
  }, []);

  const innerStripeGeometry = useMemo(() => {
    return new RoundedBoxGeometry(5.32, 0.06, 0.22, 2, 0.02);
  }, []);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.25,
        roughness: 0.45,
        transparent: true,
        opacity: 0.88,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.35,
        roughness: 0.34,
        transparent: true,
        opacity: 0.9,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.72,
        roughness: 0.18,
        emissive: accentHex,
        emissiveIntensity: 0.24,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      xBeamGeometry.dispose();
      yBeamGeometry.dispose();
      zBeamGeometry.dispose();
      nodeGeometry.dispose();
      coreGeometry.dispose();
      innerStripeGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [
    xBeamGeometry,
    yBeamGeometry,
    zBeamGeometry,
    nodeGeometry,
    coreGeometry,
    innerStripeGeometry,
    materials,
  ]);

  const frameScale =
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

  const coreFill =
    progress <= 0.17
      ? interpolate(progress, [0.07, 0.17], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.83, 0.92], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const tiltX = interpolate(frameScale, [0, 1], [0.45, 0.08]);
  const halfW = boxW * 0.5;
  const halfH = boxH * 0.5;
  const halfD = boxD * 0.5;
  const visible = frameScale > 0.002;

  const corners: [number, number, number][] = [
    [-halfW, -halfH, -halfD],
    [halfW, -halfH, -halfD],
    [-halfW, halfH, -halfD],
    [halfW, halfH, -halfD],
    [-halfW, -halfH, halfD],
    [halfW, -halfH, halfD],
    [-halfW, halfH, halfD],
    [halfW, halfH, halfD],
  ];

  return (
    <>
      <ambientLight intensity={0.82} />
      <directionalLight position={[6, 8, 12]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.48} color={accentHex} />

      <group
        position={[anchorX + halfW * uiScale, anchorY, 0]}
        rotation={[tiltX, 0, 0]}
        scale={
          visible
            ? [frameScale * uiScale, frameScale * uiScale, frameScale * uiScale]
            : [0.0001, 0.0001, 0.0001]
        }
        visible={visible}
      >
        {/* 4 Horizontal X-beams */}
        <mesh geometry={xBeamGeometry} material={materials[2]} position={[0, halfH, halfD]} />
        <mesh geometry={xBeamGeometry} material={materials[2]} position={[0, -halfH, halfD]} />
        <mesh geometry={xBeamGeometry} material={materials[1]} position={[0, halfH, -halfD]} />
        <mesh geometry={xBeamGeometry} material={materials[1]} position={[0, -halfH, -halfD]} />

        {/* 4 Vertical Y-beams */}
        <mesh geometry={yBeamGeometry} material={materials[2]} position={[-halfW, 0, halfD]} />
        <mesh geometry={yBeamGeometry} material={materials[2]} position={[halfW, 0, halfD]} />
        <mesh geometry={yBeamGeometry} material={materials[1]} position={[-halfW, 0, -halfD]} />
        <mesh geometry={yBeamGeometry} material={materials[1]} position={[halfW, 0, -halfD]} />

        {/* 4 Depth Z-beams */}
        <mesh geometry={zBeamGeometry} material={materials[2]} position={[-halfW, halfH, 0]} />
        <mesh geometry={zBeamGeometry} material={materials[2]} position={[halfW, halfH, 0]} />
        <mesh geometry={zBeamGeometry} material={materials[2]} position={[-halfW, -halfH, 0]} />
        <mesh geometry={zBeamGeometry} material={materials[2]} position={[halfW, -halfH, 0]} />

        {/* 8 Corner Nodes */}
        {corners.map(([cx, cy, cz], idx) => (
          <mesh
            key={idx}
            geometry={nodeGeometry}
            material={materials[2]}
            position={[cx, cy, cz]}
          />
        ))}

        {/* Semi-transparent dark core */}
        <group
          scale={coreFill > 0.002 ? [coreFill, 1, 1] : [0.0001, 1, 1]}
          visible={coreFill > 0.002}
        >
          <mesh geometry={coreGeometry} material={materials[0]} position={[0, 0, 0]} />
          <mesh
            geometry={innerStripeGeometry}
            material={materials[1]}
            position={[0, -0.32, 0.02]}
          />
        </group>
      </group>
    </>
  );
};

export const ExpandingWireframeBoxPlate4K: React.FC<
  ExpandingWireframeBoxPlate4KProps
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
        <ExpandingWireframeBoxScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};
