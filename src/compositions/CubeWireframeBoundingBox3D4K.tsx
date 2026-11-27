import React, { useEffect, useMemo } from "react";
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

export const cubeWireframeBoundingBox3DThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type CubeWireframeBoundingBox3DThemePreset =
  (typeof cubeWireframeBoundingBox3DThemePresets)[number];

export const cubeWireframeBoundingBox3D4KSchema = z.object({
  themePreset: z.enum(cubeWireframeBoundingBox3DThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type CubeWireframeBoundingBox3D4KProps = z.infer<
  typeof cubeWireframeBoundingBox3D4KSchema
>;

export const defaultCubeWireframeBoundingBox3D4KProps: CubeWireframeBoundingBox3D4KProps =
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

export const cubeWireframeBoundingBox3D4KVariations: Record<
  CubeWireframeBoundingBox3DThemePreset,
  Omit<
    CubeWireframeBoundingBox3D4KProps,
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

  React.useLayoutEffect(() => {
    camera.position.set(0, 0, 12);
    camera.zoom = zoom;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, zoom]);

  return null;
};

function resolveThemeColors(props: CubeWireframeBoundingBox3D4KProps) {
  const preset = cubeWireframeBoundingBox3D4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultCubeWireframeBoundingBox3D4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultCubeWireframeBoundingBox3D4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultCubeWireframeBoundingBox3D4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

const CUBE_SIZE = 3.6;

const CubeWireframeBoundingBoxScene: React.FC<{
  props: CubeWireframeBoundingBox3D4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const uiScale = isVertical ? 0.8 : 1;

  const beamThick = 0.022 * props.strokeWidth;
  const bracketThick = 0.065 * Math.max(0.6, props.strokeWidth * 0.5);
  const armLen = 0.72;
  const half = CUBE_SIZE * 0.5;

  const xBeamGeo = useMemo(
    () => new RoundedBoxGeometry(CUBE_SIZE, beamThick, beamThick, 2, 0.008),
    [beamThick],
  );
  const yBeamGeo = useMemo(
    () => new RoundedBoxGeometry(beamThick, CUBE_SIZE, beamThick, 2, 0.008),
    [beamThick],
  );
  const zBeamGeo = useMemo(
    () => new RoundedBoxGeometry(beamThick, beamThick, CUBE_SIZE, 2, 0.008),
    [beamThick],
  );
  const bracketXGeo = useMemo(
    () => new RoundedBoxGeometry(armLen, bracketThick, bracketThick, 2, 0.015),
    [armLen, bracketThick],
  );
  const bracketYGeo = useMemo(
    () => new RoundedBoxGeometry(bracketThick, armLen, bracketThick, 2, 0.015),
    [armLen, bracketThick],
  );
  const bracketZGeo = useMemo(
    () => new RoundedBoxGeometry(bracketThick, bracketThick, armLen, 2, 0.015),
    [armLen, bracketThick],
  );
  const coreSolidGeo = useMemo(() => new THREE.IcosahedronGeometry(1.12, 0), []);
  const coreWireGeo = useMemo(() => new THREE.IcosahedronGeometry(1.38, 1), []);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.36,
        roughness: 0.32,
        flatShading: true,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.45,
        roughness: 0.3,
        transparent: true,
        opacity: 0.72,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.72,
        roughness: 0.18,
        emissive: accentHex,
        emissiveIntensity: 0.34,
      }),
      new THREE.MeshBasicMaterial({
        color: accentHex,
        wireframe: true,
        transparent: true,
        opacity: 0.75,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      xBeamGeo.dispose();
      yBeamGeo.dispose();
      zBeamGeo.dispose();
      bracketXGeo.dispose();
      bracketYGeo.dispose();
      bracketZGeo.dispose();
      coreSolidGeo.dispose();
      coreWireGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [
    xBeamGeo,
    yBeamGeo,
    zBeamGeo,
    bracketXGeo,
    bracketYGeo,
    bracketZGeo,
    coreSolidGeo,
    coreWireGeo,
    materials,
  ]);

  const cornerSigns: Array<[number, number, number]> = [
    [-1, -1, -1],
    [1, -1, -1],
    [-1, 1, -1],
    [1, 1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [-1, 1, 1],
    [1, 1, 1],
  ];

  const spread = Math.sin(angle * 2) * 0.12;
  const morphX = 1 + 0.18 * Math.sin(angle * 2);
  const morphY = 1 + 0.18 * Math.cos(angle * 2);
  const morphZ = 1 - 0.15 * Math.sin(angle * 2);

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 12]} intensity={1.35} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.5} color={accentHex} />

      <group
        rotation={[angle * 0.5, angle, 0.35]}
        scale={[uiScale, uiScale, uiScale]}
      >
        {/* 12 Wireframe cube rails */}
        <mesh geometry={xBeamGeo} material={materials[1]} position={[0, half, half]} />
        <mesh geometry={xBeamGeo} material={materials[1]} position={[0, -half, half]} />
        <mesh geometry={xBeamGeo} material={materials[1]} position={[0, half, -half]} />
        <mesh geometry={xBeamGeo} material={materials[1]} position={[0, -half, -half]} />

        <mesh geometry={yBeamGeo} material={materials[1]} position={[-half, 0, half]} />
        <mesh geometry={yBeamGeo} material={materials[1]} position={[half, 0, half]} />
        <mesh geometry={yBeamGeo} material={materials[1]} position={[-half, 0, -half]} />
        <mesh geometry={yBeamGeo} material={materials[1]} position={[half, 0, -half]} />

        <mesh geometry={zBeamGeo} material={materials[1]} position={[-half, half, 0]} />
        <mesh geometry={zBeamGeo} material={materials[1]} position={[half, half, 0]} />
        <mesh geometry={zBeamGeo} material={materials[1]} position={[-half, -half, 0]} />
        <mesh geometry={zBeamGeo} material={materials[1]} position={[half, -half, 0]} />

        {/* 8 Highlighted RoundedBox corner brackets */}
        {cornerSigns.map(([sx, sy, sz], idx) => {
          const cx = sx * (half + spread);
          const cy = sy * (half + spread);
          const cz = sz * (half + spread);
          return (
            <group key={idx} position={[cx, cy, cz]}>
              <mesh
                geometry={bracketXGeo}
                material={materials[2]}
                position={[-sx * armLen * 0.5, 0, 0]}
              />
              <mesh
                geometry={bracketYGeo}
                material={materials[2]}
                position={[0, -sy * armLen * 0.5, 0]}
              />
              <mesh
                geometry={bracketZGeo}
                material={materials[2]}
                position={[0, 0, -sz * armLen * 0.5]}
              />
            </group>
          );
        })}

        {/* Inner morphing polyhedron core */}
        <group
          rotation={[-angle * 2, angle, 0]}
          scale={[morphX, morphY, morphZ]}
        >
          <mesh geometry={coreSolidGeo} material={materials[0]} />
          <mesh geometry={coreWireGeo} material={materials[3]} />
        </group>
      </group>
    </>
  );
};

export const CubeWireframeBoundingBox3D4K: React.FC<
  CubeWireframeBoundingBox3D4KProps
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
        <CubeWireframeBoundingBoxScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
