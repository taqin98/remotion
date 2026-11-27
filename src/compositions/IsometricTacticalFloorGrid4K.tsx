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

export const isometricTacticalFloorGridThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type IsometricTacticalFloorGridThemePreset =
  (typeof isometricTacticalFloorGridThemePresets)[number];

export const isometricTacticalFloorGrid4KSchema = z.object({
  themePreset: z.enum(isometricTacticalFloorGridThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type IsometricTacticalFloorGrid4KProps = z.infer<
  typeof isometricTacticalFloorGrid4KSchema
>;

export const defaultIsometricTacticalFloorGrid4KProps: IsometricTacticalFloorGrid4KProps =
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

export const isometricTacticalFloorGrid4KVariations: Record<
  IsometricTacticalFloorGridThemePreset,
  Omit<
    IsometricTacticalFloorGrid4KProps,
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

function resolveThemeColors(props: IsometricTacticalFloorGrid4KProps) {
  const preset = isometricTacticalFloorGrid4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultIsometricTacticalFloorGrid4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultIsometricTacticalFloorGrid4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultIsometricTacticalFloorGrid4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

const GRID_SPAN = 6.0;
const RAIL_COUNT = 7;

const SECTOR_CELLS: Array<{ gx: number; gy: number; phase: number }> = [
  { gx: -2, gy: -1, phase: 0.2 },
  { gx: -1, gy: 1, phase: 1.1 },
  { gx: 0, gy: 0, phase: 2.0 },
  { gx: 1, gy: -2, phase: 3.1 },
  { gx: 2, gy: 1, phase: 4.2 },
  { gx: 0, gy: 2, phase: 5.1 },
];

const IsometricTacticalGridScene: React.FC<{
  props: IsometricTacticalFloorGrid4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const uiScale = isVertical ? 0.72 : 1;

  const railThick = 0.025 * props.strokeWidth;
  const railGeo = useMemo(
    () => new RoundedBoxGeometry(GRID_SPAN, railThick, railThick, 2, 0.008),
    [railThick],
  );
  const sectorGeo = useMemo(
    () => new RoundedBoxGeometry(0.68, 0.68, 0.14, 2, 0.03),
    [],
  );
  const scannerBarGeo = useMemo(
    () => new RoundedBoxGeometry(GRID_SPAN + 0.4, 0.1, 0.22, 2, 0.03),
    [],
  );

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.35,
        roughness: 0.4,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.45,
        roughness: 0.32,
        transparent: true,
        opacity: 0.78,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.72,
        roughness: 0.18,
        emissive: accentHex,
        emissiveIntensity: 0.42,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      railGeo.dispose();
      sectorGeo.dispose();
      scannerBarGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [railGeo, sectorGeo, scannerBarGeo, materials]);

  const scanPos = Math.sin(angle) * (GRID_SPAN * 0.46);
  const step = GRID_SPAN / (RAIL_COUNT - 1);

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 12]} intensity={1.3} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.5} color={accentHex} />

      <group
        rotation={[-0.78, 0, Math.PI * 0.25]}
        scale={[uiScale, uiScale, uiScale]}
      >
        {Array.from({ length: RAIL_COUNT }).map((_, i) => {
          const offset = -GRID_SPAN * 0.5 + i * step;
          return (
            <React.Fragment key={i}>
              <mesh
                geometry={railGeo}
                material={i === 0 || i === RAIL_COUNT - 1 ? materials[2] : materials[1]}
                position={[0, offset, 0]}
              />
              <mesh
                geometry={railGeo}
                material={i === 0 || i === RAIL_COUNT - 1 ? materials[2] : materials[1]}
                position={[offset, 0, 0]}
                rotation={[0, 0, Math.PI * 0.5]}
              />
            </React.Fragment>
          );
        })}

        {SECTOR_CELLS.map((cell, idx) => {
          const cx = cell.gx * step;
          const cy = cell.gy * step;
          const dist = Math.abs(cy - scanPos);
          const highlight = Math.max(0, 1 - dist / 1.1);
          const zScale = 1 + highlight * 1.4 + 0.35 * Math.sin(angle * 2 + cell.phase);
          return (
            <mesh
              key={idx}
              geometry={sectorGeo}
              material={highlight > 0.4 ? materials[2] : materials[0]}
              position={[cx, cy, 0.08 * zScale]}
              scale={[1, 1, zScale]}
            />
          );
        })}

        <mesh
          geometry={scannerBarGeo}
          material={materials[2]}
          position={[0, scanPos, 0.14]}
        />
      </group>
    </>
  );
};

export const IsometricTacticalFloorGrid4K: React.FC<
  IsometricTacticalFloorGrid4KProps
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

  const { accentHex, secondaryHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const uiScale = isVertical ? 0.72 : 1;

  // Match Three.js XYZ Euler [-0.78, 0, PI/4]
  const rx = -0.78;
  const rz = Math.PI * 0.25;
  const cosZ = Math.cos(rz);
  const sinZ = Math.sin(rz);
  const cosX = Math.cos(rx);
  const projectPt = (wx: number, wy: number) => {
    const x1 = wx * cosZ - wy * sinZ;
    const y1 = wx * sinZ + wy * cosZ;
    const y2 = y1 * cosX;
    return {
      x: width * 0.5 + x1 * uiScale * zoom,
      y: height * 0.5 - y2 * uiScale * zoom,
    };
  };

  const step = GRID_SPAN / (RAIL_COUNT - 1);
  const strokePx = Math.max(1.4, props.strokeWidth * 1.3 * uiScale);
  const crossHalf = 10 * uiScale;

  const crosses: Array<{ x: number; y: number }> = [];
  for (let ix = -3; ix <= 3; ix += 2) {
    for (let iy = -3; iy <= 3; iy += 2) {
      crosses.push(projectPt(ix * step, iy * step));
    }
  }

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        backgroundColor: "transparent",
        overflow: "hidden",
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        {crosses.map((pt, i) => (
          <g key={i} stroke={accentHex} strokeOpacity={0.75} strokeWidth={strokePx}>
            <line
              x1={pt.x - crossHalf}
              y1={pt.y}
              x2={pt.x + crossHalf}
              y2={pt.y}
            />
            <line
              x1={pt.x}
              y1={pt.y - crossHalf}
              x2={pt.x}
              y2={pt.y + crossHalf}
            />
          </g>
        ))}

        {/* Outer HUD reference framing line */}
        <line
          x1={width * 0.14}
          y1={height * 0.5}
          x2={width * 0.2}
          y2={height * 0.5}
          stroke={secondaryHex}
          strokeOpacity={0.55}
          strokeWidth={strokePx}
        />
        <line
          x1={width * 0.8}
          y1={height * 0.5}
          x2={width * 0.86}
          y2={height * 0.5}
          stroke={secondaryHex}
          strokeOpacity={0.55}
          strokeWidth={strokePx}
        />
      </svg>

      <ThreeCanvas
        width={width}
        height={height}
        orthographic
        dpr={1}
        camera={CAMERA_CONFIG}
        gl={GL_CONFIG}
        style={{ position: "absolute", inset: 0 }}
      >
        <OrthographicCameraRig zoom={zoom} />
        <IsometricTacticalGridScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
