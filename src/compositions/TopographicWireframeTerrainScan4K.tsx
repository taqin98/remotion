import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useCurrentFrame, useVideoConfig } from "remotion";
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

export const topographicWireframeTerrainScanThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type TopographicWireframeTerrainScanThemePreset =
  (typeof topographicWireframeTerrainScanThemePresets)[number];

export const topographicWireframeTerrainScan4KSchema = z.object({
  themePreset: z.enum(topographicWireframeTerrainScanThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type TopographicWireframeTerrainScan4KProps = z.infer<
  typeof topographicWireframeTerrainScan4KSchema
>;

export const defaultTopographicWireframeTerrainScan4KProps: TopographicWireframeTerrainScan4KProps =
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

export const topographicWireframeTerrainScan4KVariations: Record<
  TopographicWireframeTerrainScanThemePreset,
  Omit<
    TopographicWireframeTerrainScan4KProps,
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

  useLayoutEffect(() => {
    camera.position.set(0, 0, 12);
    camera.zoom = zoom;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, zoom]);

  return null;
};

function resolveThemeColors(props: TopographicWireframeTerrainScan4KProps) {
  const preset = topographicWireframeTerrainScan4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultTopographicWireframeTerrainScan4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultTopographicWireframeTerrainScan4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultTopographicWireframeTerrainScan4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

const GRID_SIZE = 5.6;
const GRID_SEGS = 34;

const TopographicTerrainScene: React.FC<{
  props: TopographicWireframeTerrainScan4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const uiScale = isVertical ? 0.72 : 1;

  const surfaceGeo = useMemo(
    () => new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE, GRID_SEGS, GRID_SEGS),
    [],
  );
  const wireGeo = useMemo(
    () => new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE, GRID_SEGS, GRID_SEGS),
    [],
  );
  const scanBarGeo = useMemo(
    () => new RoundedBoxGeometry(GRID_SIZE + 0.25, 0.055 * props.strokeWidth, 1.15, 2, 0.02),
    [props.strokeWidth],
  );
  const frameRailGeo = useMemo(
    () => new RoundedBoxGeometry(GRID_SIZE + 0.2, 0.04, 0.04, 2, 0.01),
    [],
  );

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.25,
        roughness: 0.6,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
      }),
      new THREE.MeshBasicMaterial({
        color: accentHex,
        wireframe: true,
        transparent: true,
        opacity: 0.8,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.7,
        roughness: 0.18,
        emissive: accentHex,
        emissiveIntensity: 0.45,
        transparent: true,
        opacity: 0.65,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.45,
        roughness: 0.3,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useLayoutEffect(() => {
    const updateHeight = (geo: THREE.PlaneGeometry) => {
      const pos = geo.attributes.position;
      const cols = GRID_SEGS + 1;
      for (let i = 0; i < pos.count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = (col / GRID_SEGS - 0.5) * GRID_SIZE;
        const y = (row / GRID_SEGS - 0.5) * GRID_SIZE;
        const edgeFade =
          Math.sin((col / GRID_SEGS) * Math.PI) *
          Math.sin((row / GRID_SEGS) * Math.PI);
        const z =
          edgeFade *
          (0.68 *
            Math.sin(x * 0.9 + Math.cos(angle) * 1.4) *
            Math.cos(y * 0.9 + Math.sin(angle) * 1.4) +
            0.32 * Math.cos((x + y) * 1.15 - angle));
        pos.setXYZ(i, x, y, z);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    };

    updateHeight(surfaceGeo);
    updateHeight(wireGeo);
  }, [surfaceGeo, wireGeo, angle]);

  useEffect(() => {
    return () => {
      surfaceGeo.dispose();
      wireGeo.dispose();
      scanBarGeo.dispose();
      frameRailGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [surfaceGeo, wireGeo, scanBarGeo, frameRailGeo, materials]);

  const scanY = Math.sin(angle * 2) * (GRID_SIZE * 0.44);
  const half = GRID_SIZE * 0.5 + 0.08;

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 12]} intensity={1.3} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.5} color={accentHex} />

      <group
        rotation={[-Math.PI * 0.34, 0, angle * 0.5]}
        scale={[uiScale, uiScale, uiScale]}
      >
        <mesh geometry={surfaceGeo} material={materials[0]} />
        <mesh
          geometry={wireGeo}
          material={materials[1]}
          position={[0, 0, 0.015]}
        />

        {/* Base bounding frame */}
        <mesh
          geometry={frameRailGeo}
          material={materials[3]}
          position={[0, half, -0.05]}
        />
        <mesh
          geometry={frameRailGeo}
          material={materials[3]}
          position={[0, -half, -0.05]}
        />
        <mesh
          geometry={frameRailGeo}
          material={materials[3]}
          position={[half, 0, -0.05]}
          rotation={[0, 0, Math.PI * 0.5]}
        />
        <mesh
          geometry={frameRailGeo}
          material={materials[3]}
          position={[-half, 0, -0.05]}
          rotation={[0, 0, Math.PI * 0.5]}
        />

        {/* Glowing scanning laser plane */}
        <mesh
          geometry={scanBarGeo}
          material={materials[2]}
          position={[0, scanY, 0.45]}
        />
      </group>
    </>
  );
};

export const TopographicWireframeTerrainScan4K: React.FC<
  TopographicWireframeTerrainScan4KProps
> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const progress =
    ((frame % durationInFrames) / durationInFrames) * props.speedMultiplier;
  const cycleProgress = progress % 1;
  const angle = cycleProgress * Math.PI * 2;

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
        <TopographicTerrainScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
