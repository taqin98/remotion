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

export const isometricBarChartLoopThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type IsometricBarChartLoopThemePreset =
  (typeof isometricBarChartLoopThemePresets)[number];

export const isometricBarChartLoop4KSchema = z.object({
  themePreset: z.enum(isometricBarChartLoopThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type IsometricBarChartLoop4KProps = z.infer<
  typeof isometricBarChartLoop4KSchema
>;

export const defaultIsometricBarChartLoop4KProps: IsometricBarChartLoop4KProps =
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

export const isometricBarChartLoop4KVariations: Record<
  IsometricBarChartLoopThemePreset,
  Omit<
    IsometricBarChartLoop4KProps,
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

function resolveThemeColors(props: IsometricBarChartLoop4KProps) {
  const preset = isometricBarChartLoop4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor === defaultIsometricBarChartLoop4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultIsometricBarChartLoop4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultIsometricBarChartLoop4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

const BAR_COUNT = 8;

const IsometricBarChartScene: React.FC<{
  props: IsometricBarChartLoop4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const uiScale = isVertical ? 0.72 : 1;

  const baseGeometry = useMemo(() => {
    return new RoundedBoxGeometry(6.8, 0.18, 2.2, 3, 0.04);
  }, []);

  const pillarGeometry = useMemo(() => {
    return new RoundedBoxGeometry(0.52, 1, 0.52, 3, 0.05);
  }, []);

  const capGeometry = useMemo(() => {
    return new RoundedBoxGeometry(0.54, 0.08, 0.54, 2, 0.02);
  }, []);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.35,
        roughness: 0.42,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.42,
        roughness: 0.34,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.65,
        roughness: 0.2,
        emissive: accentHex,
        emissiveIntensity: 0.35,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      baseGeometry.dispose();
      pillarGeometry.dispose();
      capGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [baseGeometry, pillarGeometry, capGeometry, materials]);

  const spacing = 0.78;
  const startX = -((BAR_COUNT - 1) * spacing) * 0.5;

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 10, 12]} intensity={1.35} color="#ffffff" />
      <directionalLight position={[-7, 4, 8]} intensity={0.55} color={accentHex} />

      <group
        position={[0, -0.85 * uiScale, 0]}
        rotation={[0.52, -0.62, 0]}
        scale={[uiScale, uiScale, uiScale]}
      >
        <mesh
          geometry={baseGeometry}
          material={materials[0]}
          position={[0, -0.1, 0]}
        />

        {Array.from({ length: BAR_COUNT }).map((_, i) => {
          const h =
            0.8 +
            1.85 *
              (0.5 +
                0.5 *
                  Math.sin(angle + i * 0.75) *
                  Math.cos(angle * 2 - i * 0.4));
          const x = startX + i * spacing;

          return (
            <group key={i} position={[x, 0, 0]}>
              <mesh
                geometry={pillarGeometry}
                material={i % 2 === 0 ? materials[1] : materials[0]}
                position={[0, h * 0.5, 0]}
                scale={[1, h, 1]}
              />
              <mesh
                geometry={capGeometry}
                material={materials[2]}
                position={[0, h + 0.05, 0]}
              />
            </group>
          );
        })}
      </group>
    </>
  );
};

export const IsometricBarChartLoop4K: React.FC<
  IsometricBarChartLoop4KProps
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

  const { secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const uiScale = isVertical ? 0.72 : 1;

  // Project isometric floor grid points using matching Euler rotation [0.52, -0.62, 0]
  const isoEuler = new THREE.Euler(0.52, -0.62, 0, "XYZ");
  const projectPoint = (wx: number, wy: number, wz: number) => {
    const v = new THREE.Vector3(wx, wy, wz);
    const q = new THREE.Quaternion();
    // Apply Euler manually via trigonometric projection matching XYZ order
    const cx = Math.cos(0.52);
    const sx = Math.sin(0.52);
    const cy = Math.cos(-0.62);
    const sy = Math.sin(-0.62);
    void isoEuler;
    void q;
    // Y rotation then X rotation in world
    const x1 = v.x * cy + v.z * sy;
    const z1 = -v.x * sy + v.z * cy;
    const y2 = v.y * cx - z1 * sx;
    const px = width * 0.5 + x1 * uiScale * zoom;
    const py = height * 0.5 - (y2 - 0.85) * uiScale * zoom;
    return `${px.toFixed(1)},${py.toFixed(1)}`;
  };

  const gridLines: Array<{ x1: string; y1: string; x2: string; y2: string }> = [];
  const halfW = 4.0;
  const halfD = 1.8;
  for (let i = -4; i <= 4; i++) {
    const x = (i / 4) * halfW;
    const p1 = projectPoint(x, -0.2, -halfD).split(",");
    const p2 = projectPoint(x, -0.2, halfD).split(",");
    gridLines.push({ x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1] });
  }
  for (let j = -2; j <= 2; j++) {
    const z = (j / 2) * halfD;
    const p1 = projectPoint(-halfW, -0.2, z).split(",");
    const p2 = projectPoint(halfW, -0.2, z).split(",");
    gridLines.push({ x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1] });
  }

  const strokePx = Math.max(1.5, props.strokeWidth * 1.4 * uiScale);

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
        {gridLines.map((line, idx) => (
          <line
            key={idx}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={idx % 2 === 0 ? accentHex : secondaryHex}
            strokeOpacity={idx % 2 === 0 ? 0.36 : 0.42}
            strokeWidth={strokePx}
          />
        ))}
        <polygon
          points={[
            projectPoint(-halfW, -0.2, -halfD),
            projectPoint(halfW, -0.2, -halfD),
            projectPoint(halfW, -0.2, halfD),
            projectPoint(-halfW, -0.2, halfD),
          ].join(" ")}
          fill="none"
          stroke={accentHex}
          strokeOpacity={0.55}
          strokeWidth={strokePx * 1.3}
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
        <IsometricBarChartScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
