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

export const circularAudioEqualizerRingThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type CircularAudioEqualizerRingThemePreset =
  (typeof circularAudioEqualizerRingThemePresets)[number];

export const circularAudioEqualizerRing4KSchema = z.object({
  themePreset: z.enum(circularAudioEqualizerRingThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type CircularAudioEqualizerRing4KProps = z.infer<
  typeof circularAudioEqualizerRing4KSchema
>;

export const defaultCircularAudioEqualizerRing4KProps: CircularAudioEqualizerRing4KProps =
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

export const circularAudioEqualizerRing4KVariations: Record<
  CircularAudioEqualizerRingThemePreset,
  Omit<
    CircularAudioEqualizerRing4KProps,
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

function resolveThemeColors(props: CircularAudioEqualizerRing4KProps) {
  const preset = circularAudioEqualizerRing4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultCircularAudioEqualizerRing4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultCircularAudioEqualizerRing4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultCircularAudioEqualizerRing4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

const BAR_COUNT = 48;

const CircularEqualizerScene: React.FC<{
  props: CircularAudioEqualizerRing4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const uiScale = isVertical ? 0.78 : 1;

  const barGeometry = useMemo(() => {
    return new RoundedBoxGeometry(0.11, 1, 0.16, 2, 0.025);
  }, []);

  const peakGeometry = useMemo(() => {
    return new RoundedBoxGeometry(0.11, 0.08, 0.18, 2, 0.02);
  }, []);

  const innerRingGeometry = useMemo(() => {
    return new THREE.TorusGeometry(1.96, 0.032 * props.strokeWidth, 16, 72);
  }, [props.strokeWidth]);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.34,
        roughness: 0.38,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.42,
        roughness: 0.32,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.68,
        roughness: 0.2,
        emissive: accentHex,
        emissiveIntensity: 0.32,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      barGeometry.dispose();
      peakGeometry.dispose();
      innerRingGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [barGeometry, peakGeometry, innerRingGeometry, materials]);

  const baseRadius = 2.1;

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 12]} intensity={1.3} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.5} color={accentHex} />

      <group scale={[uiScale, uiScale, uiScale]}>
        <mesh geometry={innerRingGeometry} material={materials[1]} />

        {Array.from({ length: BAR_COUNT }).map((_, i) => {
          const theta = (i / BAR_COUNT) * Math.PI * 2;
          const barLen =
            0.35 +
            0.95 *
              (0.5 +
                0.5 *
                  Math.sin(angle * 2 + i * ((Math.PI * 2) / 12)) *
                  Math.cos(angle - i * ((Math.PI * 2) / 16)));
          const centerR = baseRadius + barLen * 0.5;
          const peakR = baseRadius + barLen + 0.14;

          return (
            <group key={i} rotation={[0, 0, theta]}>
              <mesh
                geometry={barGeometry}
                material={i % 3 === 0 ? materials[2] : materials[0]}
                position={[0, centerR, 0]}
                scale={[1, barLen, 1]}
              />
              <mesh
                geometry={peakGeometry}
                material={materials[2]}
                position={[0, peakR, 0]}
              />
            </group>
          );
        })}
      </group>
    </>
  );
};

export const CircularAudioEqualizerRing4K: React.FC<
  CircularAudioEqualizerRing4KProps
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
  const uiScale = isVertical ? 0.78 : 1;

  const cx = width * 0.5;
  const cy = height * 0.5;
  const innerR = 1.68 * uiScale * zoom;
  const outerR = 3.55 * uiScale * zoom;
  const strokePx = Math.max(1.5, props.strokeWidth * 1.5 * uiScale);
  const rotDeg = (angle * 180) / Math.PI;

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
        <g transform={`rotate(${rotDeg} ${cx} ${cy})`}>
          <circle
            cx={cx}
            cy={cy}
            r={innerR}
            fill="none"
            stroke={accentHex}
            strokeWidth={strokePx}
            strokeOpacity={0.65}
            strokeDasharray={`${strokePx * 8} ${strokePx * 5}`}
          />
        </g>

        <g transform={`rotate(${-rotDeg} ${cx} ${cy})`}>
          <circle
            cx={cx}
            cy={cy}
            r={outerR}
            fill="none"
            stroke={secondaryHex}
            strokeWidth={strokePx}
            strokeOpacity={0.55}
          />
          {Array.from({ length: 36 }).map((_, i) => {
            const deg = (i * 360) / 36;
            const len = i % 3 === 0 ? 0.16 * uiScale * zoom : 0.08 * uiScale * zoom;
            return (
              <line
                key={i}
                x1={cx}
                y1={cy - outerR}
                x2={cx}
                y2={cy - outerR - len}
                stroke={i % 3 === 0 ? accentHex : secondaryHex}
                strokeWidth={i % 3 === 0 ? strokePx * 1.4 : strokePx * 0.9}
                strokeOpacity={0.75}
                transform={`rotate(${deg} ${cx} ${cy})`}
              />
            );
          })}
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
        <CircularEqualizerScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
