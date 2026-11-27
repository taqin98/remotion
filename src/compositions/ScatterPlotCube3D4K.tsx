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

export const scatterPlotCube3DThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type ScatterPlotCube3DThemePreset =
  (typeof scatterPlotCube3DThemePresets)[number];

export const scatterPlotCube3D4KSchema = z.object({
  themePreset: z.enum(scatterPlotCube3DThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type ScatterPlotCube3D4KProps = z.infer<
  typeof scatterPlotCube3D4KSchema
>;

export const defaultScatterPlotCube3D4KProps: ScatterPlotCube3D4KProps = {
  themePreset: "dark-tech",
  aspectRatio: "16:9",
  backgroundColor: "transparent",
  primaryColor: "#0F172A",
  secondaryColor: "#1E293B",
  accentColor: "#38BDF8",
  speedMultiplier: 1,
  strokeWidth: 2,
};

export const scatterPlotCube3D4KVariations: Record<
  ScatterPlotCube3DThemePreset,
  Omit<
    ScatterPlotCube3D4KProps,
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

function resolveThemeColors(props: ScatterPlotCube3D4KProps) {
  const preset = scatterPlotCube3D4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor === defaultScatterPlotCube3D4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor === defaultScatterPlotCube3D4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultScatterPlotCube3D4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

const SPHERE_COUNT = 40;
const CUBE_SIZE = 4.2;

function pseudoHash(n: number): number {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

const ScatterPlotCubeScene: React.FC<{
  props: ScatterPlotCube3D4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const uiScale = isVertical ? 0.8 : 1;

  const beamThick = 0.026 * props.strokeWidth;
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
  const cornerNodeGeo = useMemo(
    () => new RoundedBoxGeometry(0.11, 0.11, 0.11, 2, 0.02),
    [],
  );
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(0.11, 20, 20), []);
  const dropLineGeo = useMemo(
    () => new THREE.CylinderGeometry(0.012, 0.012, 1, 8),
    [],
  );

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.35,
        roughness: 0.38,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.42,
        roughness: 0.32,
        transparent: true,
        opacity: 0.72,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.7,
        roughness: 0.18,
        emissive: accentHex,
        emissiveIntensity: 0.36,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      xBeamGeo.dispose();
      yBeamGeo.dispose();
      zBeamGeo.dispose();
      cornerNodeGeo.dispose();
      sphereGeo.dispose();
      dropLineGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [
    xBeamGeo,
    yBeamGeo,
    zBeamGeo,
    cornerNodeGeo,
    sphereGeo,
    dropLineGeo,
    materials,
  ]);

  const corners: [number, number, number][] = [
    [-half, -half, -half],
    [half, -half, -half],
    [-half, half, -half],
    [half, half, -half],
    [-half, -half, half],
    [half, -half, half],
    [-half, half, half],
    [half, half, half],
  ];

  const dataPoints = useMemo(() => {
    return Array.from({ length: SPHERE_COUNT }).map((_, i) => ({
      bx: (pseudoHash(i * 3 + 1) - 0.5) * (CUBE_SIZE - 0.7),
      by: (pseudoHash(i * 3 + 2) - 0.5) * (CUBE_SIZE - 0.7),
      bz: (pseudoHash(i * 3 + 3) - 0.5) * (CUBE_SIZE - 0.7),
      phase: i * 0.7,
    }));
  }, []);

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 12]} intensity={1.3} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.5} color={accentHex} />

      <group
        rotation={[0.35 + Math.sin(angle) * 0.12, angle, 0.1]}
        scale={[uiScale, uiScale, uiScale]}
      >
        {/* 12 Bounding cube edges */}
        <mesh geometry={xBeamGeo} material={materials[2]} position={[0, half, half]} />
        <mesh geometry={xBeamGeo} material={materials[2]} position={[0, -half, half]} />
        <mesh geometry={xBeamGeo} material={materials[1]} position={[0, half, -half]} />
        <mesh geometry={xBeamGeo} material={materials[1]} position={[0, -half, -half]} />

        <mesh geometry={yBeamGeo} material={materials[2]} position={[-half, 0, half]} />
        <mesh geometry={yBeamGeo} material={materials[2]} position={[half, 0, half]} />
        <mesh geometry={yBeamGeo} material={materials[1]} position={[-half, 0, -half]} />
        <mesh geometry={yBeamGeo} material={materials[1]} position={[half, 0, -half]} />

        <mesh geometry={zBeamGeo} material={materials[2]} position={[-half, half, 0]} />
        <mesh geometry={zBeamGeo} material={materials[2]} position={[half, half, 0]} />
        <mesh geometry={zBeamGeo} material={materials[2]} position={[-half, -half, 0]} />
        <mesh geometry={zBeamGeo} material={materials[2]} position={[half, -half, 0]} />

        {/* 8 Corner nodes */}
        {corners.map(([cx, cy, cz], idx) => (
          <mesh
            key={idx}
            geometry={cornerNodeGeo}
            material={materials[2]}
            position={[cx, cy, cz]}
          />
        ))}

        {/* 3 Internal orthogonal coordinate axes */}
        <mesh geometry={xBeamGeo} material={materials[1]} position={[0, 0, 0]} />
        <mesh geometry={yBeamGeo} material={materials[1]} position={[0, 0, 0]} />
        <mesh geometry={zBeamGeo} material={materials[1]} position={[0, 0, 0]} />

        {/* 40 Orbiting & pulsing glowing data spheres */}
        {dataPoints.map((pt, i) => {
          const px = pt.bx + Math.sin(angle + pt.phase) * 0.22;
          const py = pt.by + Math.cos(angle * 2 + pt.phase) * 0.22;
          const pz = pt.bz + Math.sin(angle - pt.phase) * 0.22;
          const sc = 0.78 + 0.38 * Math.sin(angle * 2 + pt.phase);
          const dropLen = Math.max(0.05, py + half);

          return (
            <React.Fragment key={i}>
              <mesh
                geometry={sphereGeo}
                material={i % 3 === 0 ? materials[2] : materials[0]}
                position={[px, py, pz]}
                scale={[sc, sc, sc]}
              />
              {i % 4 === 0 && (
                <mesh
                  geometry={dropLineGeo}
                  material={materials[1]}
                  position={[px, -half + dropLen * 0.5, pz]}
                  scale={[1, dropLen, 1]}
                />
              )}
            </React.Fragment>
          );
        })}
      </group>
    </>
  );
};

export const ScatterPlotCube3D4K: React.FC<ScatterPlotCube3D4KProps> = (
  props,
) => {
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
        <ScatterPlotCubeScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
