import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { makePie } from "@remotion/shapes";
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

export const radialGaugeDialLoopThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type RadialGaugeDialLoopThemePreset =
  (typeof radialGaugeDialLoopThemePresets)[number];

export const radialGaugeDialLoop4KSchema = z.object({
  themePreset: z.enum(radialGaugeDialLoopThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type RadialGaugeDialLoop4KProps = z.infer<
  typeof radialGaugeDialLoop4KSchema
>;

export const defaultRadialGaugeDialLoop4KProps: RadialGaugeDialLoop4KProps = {
  themePreset: "dark-tech",
  aspectRatio: "16:9",
  backgroundColor: "transparent",
  primaryColor: "#0F172A",
  secondaryColor: "#1E293B",
  accentColor: "#38BDF8",
  speedMultiplier: 1,
  strokeWidth: 2,
};

export const radialGaugeDialLoop4KVariations: Record<
  RadialGaugeDialLoopThemePreset,
  Omit<
    RadialGaugeDialLoop4KProps,
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

function resolveThemeColors(props: RadialGaugeDialLoop4KProps) {
  const preset = radialGaugeDialLoop4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor === defaultRadialGaugeDialLoop4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultRadialGaugeDialLoop4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultRadialGaugeDialLoop4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

function computeSweepFraction(angle: number): number {
  const raw = 0.5 + 0.36 * Math.sin(angle) + 0.12 * Math.sin(angle * 3);
  return Math.max(0.05, Math.min(0.95, raw));
}

const RadialGaugeScene: React.FC<{
  props: RadialGaugeDialLoop4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const uiScale = isVertical ? 0.78 : 1;

  const bezelGeo = useMemo(() => new THREE.TorusGeometry(2.65, 0.14, 24, 72), []);
  const innerRingGeo = useMemo(() => new THREE.TorusGeometry(2.2, 0.07, 16, 64), []);
  const lugGeo = useMemo(
    () => new RoundedBoxGeometry(0.14, 0.26, 0.22, 2, 0.03),
    [],
  );
  const hubGeo = useMemo(
    () => new THREE.CylinderGeometry(0.32, 0.36, 0.22, 32),
    [],
  );
  const needleGeo = useMemo(
    () => new RoundedBoxGeometry(0.09, 1.95, 0.14, 2, 0.02),
    [],
  );
  const counterWeightGeo = useMemo(
    () => new RoundedBoxGeometry(0.18, 0.46, 0.16, 2, 0.03),
    [],
  );

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.42,
        roughness: 0.32,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.52,
        roughness: 0.28,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.72,
        roughness: 0.18,
        emissive: accentHex,
        emissiveIntensity: 0.3,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      bezelGeo.dispose();
      innerRingGeo.dispose();
      lugGeo.dispose();
      hubGeo.dispose();
      needleGeo.dispose();
      counterWeightGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [
    bezelGeo,
    innerRingGeo,
    lugGeo,
    hubGeo,
    needleGeo,
    counterWeightGeo,
    materials,
  ]);

  const sweepFrac = computeSweepFraction(angle);
  // Start at -135 deg (bottom-left) and sweep clockwise over 270 deg (1.5 * PI)
  // Clockwise rotation around +Z is negative Z rotation.
  const needleClockAngle = -Math.PI * 0.75 + sweepFrac * Math.PI * 1.5;

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 12]} intensity={1.35} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.5} color={accentHex} />

      <group scale={[uiScale, uiScale, uiScale]}>
        <mesh geometry={bezelGeo} material={materials[0]} />
        <mesh
          geometry={innerRingGeo}
          material={materials[1]}
          position={[0, 0, -0.05]}
        />

        {Array.from({ length: 12 }).map((_, i) => {
          const theta = (i / 12) * Math.PI * 2;
          return (
            <group key={i} rotation={[0, 0, theta]}>
              <mesh
                geometry={lugGeo}
                material={i % 3 === 0 ? materials[2] : materials[1]}
                position={[0, 2.72, 0.04]}
              />
            </group>
          );
        })}

        <mesh
          geometry={hubGeo}
          material={materials[0]}
          rotation={[Math.PI * 0.5, 0, 0]}
          position={[0, 0, 0.12]}
        />

        <group rotation={[0, 0, -needleClockAngle]} position={[0, 0, 0.18]}>
          <mesh
            geometry={needleGeo}
            material={materials[2]}
            position={[0, 0.85, 0]}
          />
          <mesh
            geometry={counterWeightGeo}
            material={materials[1]}
            position={[0, -0.32, 0]}
          />
        </group>
      </group>
    </>
  );
};

export const RadialGaugeDialLoop4K: React.FC<RadialGaugeDialLoop4KProps> = (
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

  const { secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const uiScale = isVertical ? 0.78 : 1;

  const cx = width * 0.5;
  const cy = height * 0.5;
  const strokePx = Math.max(1.5, props.strokeWidth * 1.8 * uiScale);

  const sweepFrac = computeSweepFraction(angle);
  const arcRadius = 2.02 * uiScale * zoom;
  const activePie = makePie({
    radius: arcRadius,
    progress: sweepFrac * 0.75,
    closePath: false,
    rotation: -Math.PI * 0.75,
  });

  const bgPie = makePie({
    radius: arcRadius,
    progress: 0.75,
    closePath: false,
    rotation: -Math.PI * 0.75,
  });

  const rotRingDeg = (angle * 180) / Math.PI;
  const tickR = 1.68 * uiScale * zoom;

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
        <g transform={`translate(${cx - arcRadius}, ${cy - arcRadius})`}>
          <path
            d={bgPie.path}
            fill="none"
            stroke={secondaryHex}
            strokeWidth={strokePx * 1.4}
            strokeLinecap="round"
            strokeOpacity={0.35}
          />
          <path
            d={activePie.path}
            fill="none"
            stroke={accentHex}
            strokeWidth={strokePx * 1.6}
            strokeLinecap="round"
            strokeOpacity={0.9}
          />
        </g>

        {/* Static 60 minor + 12 major gauge ticks across 270 deg */}
        {Array.from({ length: 49 }).map((_, i) => {
          const deg = -135 + (i / 48) * 270;
          const isMajor = i % 4 === 0;
          const len = (isMajor ? 0.18 : 0.09) * uiScale * zoom;
          return (
            <line
              key={i}
              x1={cx}
              y1={cy - tickR}
              x2={cx}
              y2={cy - tickR - len}
              stroke={isMajor ? accentHex : secondaryHex}
              strokeWidth={isMajor ? strokePx * 0.9 : strokePx * 0.5}
              strokeOpacity={isMajor ? 0.85 : 0.5}
              transform={`rotate(${deg} ${cx} ${cy})`}
            />
          );
        })}

        {/* Rotating inner compass ring */}
        <g transform={`rotate(${rotRingDeg} ${cx} ${cy})`}>
          <circle
            cx={cx}
            cy={cy}
            r={1.15 * uiScale * zoom}
            fill="none"
            stroke={accentHex}
            strokeWidth={strokePx * 0.6}
            strokeOpacity={0.5}
            strokeDasharray={`${strokePx * 6} ${strokePx * 4}`}
          />
        </g>
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
        <RadialGaugeScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
