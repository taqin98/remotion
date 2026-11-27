import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
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

export const floatingPieChartSegmentsThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type FloatingPieChartSegmentsThemePreset =
  (typeof floatingPieChartSegmentsThemePresets)[number];

export const floatingPieChartSegments4KSchema = z.object({
  themePreset: z.enum(floatingPieChartSegmentsThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type FloatingPieChartSegments4KProps = z.infer<
  typeof floatingPieChartSegments4KSchema
>;

export const defaultFloatingPieChartSegments4KProps: FloatingPieChartSegments4KProps =
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

export const floatingPieChartSegments4KVariations: Record<
  FloatingPieChartSegmentsThemePreset,
  Omit<
    FloatingPieChartSegments4KProps,
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

function resolveThemeColors(props: FloatingPieChartSegments4KProps) {
  const preset = floatingPieChartSegments4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultFloatingPieChartSegments4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultFloatingPieChartSegments4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultFloatingPieChartSegments4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

const WEDGE_ARCS = [1.65, 1.25, 1.15, 1.2, 1.033];

const FloatingPieChartScene: React.FC<{
  props: FloatingPieChartSegments4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const uiScale = isVertical ? 0.76 : 1;

  const wedgeGeometries = useMemo(() => {
    return WEDGE_ARCS.map((arc) => {
      const span = Math.max(0.2, arc - 0.1);
      return {
        outer: new THREE.TorusGeometry(2.15, 0.28, 18, 42, span),
        mid: new THREE.TorusGeometry(1.42, 0.44, 16, 36, span),
        inner: new THREE.TorusGeometry(0.68, 0.28, 16, 24, span),
      };
    });
  }, []);

  const hubGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(0.34, 0.34, 0.45, 32);
  }, []);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.65,
        roughness: 0.2,
        emissive: accentHex,
        emissiveIntensity: 0.24,
      }),
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.34,
        roughness: 0.38,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.42,
        roughness: 0.3,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      wedgeGeometries.forEach((wg) => {
        wg.outer.dispose();
        wg.mid.dispose();
        wg.inner.dispose();
      });
      hubGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [wedgeGeometries, hubGeometry, materials]);

  let runningAngle = 0;

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 10, 12]} intensity={1.35} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.5} color={accentHex} />

      <group
        rotation={[-Math.PI * 0.32, Math.sin(angle) * 0.14, angle]}
        scale={[uiScale, uiScale, uiScale]}
      >
        <mesh
          geometry={hubGeometry}
          material={materials[2]}
          rotation={[Math.PI * 0.5, 0, 0]}
        />

        {WEDGE_ARCS.map((arc, idx) => {
          const startAngle = runningAngle;
          const midAngle = startAngle + arc * 0.5;
          runningAngle += arc;

          const radialOffset =
            0.28 * (0.5 + 0.5 * Math.sin(angle * 2 + idx * 1.25));
          const zLift = 0.28 * Math.sin(angle + idx * 1.25);

          const mat =
            idx === 0
              ? materials[0]
              : idx % 2 === 1
                ? materials[1]
                : materials[2];

          return (
            <group
              key={idx}
              position={[
                Math.cos(midAngle) * radialOffset,
                Math.sin(midAngle) * radialOffset,
                zLift,
              ]}
              rotation={[0, 0, startAngle + 0.05]}
            >
              <mesh geometry={wedgeGeometries[idx].outer} material={mat} />
              <mesh geometry={wedgeGeometries[idx].mid} material={mat} />
              <mesh geometry={wedgeGeometries[idx].inner} material={mat} />
            </group>
          );
        })}
      </group>
    </>
  );
};

export const FloatingPieChartSegments4K: React.FC<
  FloatingPieChartSegments4KProps
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
  const uiScale = isVertical ? 0.76 : 1;

  const cx = width * 0.5;
  const cy = height * 0.5;
  const rx = 3.25 * uiScale * zoom;
  const ry = 3.25 * Math.cos(Math.PI * 0.32) * uiScale * zoom;
  const strokePx = Math.max(1.5, props.strokeWidth * 1.3 * uiScale);

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
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill="none"
          stroke={accentHex}
          strokeOpacity={0.35}
          strokeWidth={strokePx}
          strokeDasharray={`${strokePx * 10} ${strokePx * 6}`}
        />
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx * 1.08}
          ry={ry * 1.08}
          fill="none"
          stroke={secondaryHex}
          strokeOpacity={0.32}
          strokeWidth={strokePx * 0.8}
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
        <FloatingPieChartScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
