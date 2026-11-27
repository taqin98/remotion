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

export const concentricSciFiTargetReticleThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type ConcentricSciFiTargetReticleThemePreset =
  (typeof concentricSciFiTargetReticleThemePresets)[number];

export const concentricSciFiTargetReticle4KSchema = z.object({
  themePreset: z.enum(concentricSciFiTargetReticleThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type ConcentricSciFiTargetReticle4KProps = z.infer<
  typeof concentricSciFiTargetReticle4KSchema
>;

export const defaultConcentricSciFiTargetReticle4KProps: ConcentricSciFiTargetReticle4KProps =
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

export const concentricSciFiTargetReticle4KVariations: Record<
  ConcentricSciFiTargetReticleThemePreset,
  Omit<
    ConcentricSciFiTargetReticle4KProps,
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

function resolveThemeColors(props: ConcentricSciFiTargetReticle4KProps) {
  const preset = concentricSciFiTargetReticle4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultConcentricSciFiTargetReticle4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultConcentricSciFiTargetReticle4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultConcentricSciFiTargetReticle4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

const TargetReticleScene: React.FC<{
  props: ConcentricSciFiTargetReticle4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const uiScale = isVertical ? 0.78 : 1;

  const tubeScale = Math.max(0.6, props.strokeWidth * 0.55);

  const outerArcGeo = useMemo(
    () => new THREE.TorusGeometry(2.8, 0.08 * tubeScale, 18, 48, Math.PI * 0.36),
    [tubeScale],
  );
  const midArcGeo = useMemo(
    () => new THREE.TorusGeometry(2.15, 0.065 * tubeScale, 16, 42, Math.PI * 0.65),
    [tubeScale],
  );
  const innerArcGeo = useMemo(
    () => new THREE.TorusGeometry(0.95, 0.05 * tubeScale, 16, 36, Math.PI * 0.55),
    [tubeScale],
  );
  const clawGeo = useMemo(
    () => new RoundedBoxGeometry(0.16, 0.48, 0.2, 2, 0.03),
    [],
  );
  const centerDotGeo = useMemo(() => new THREE.SphereGeometry(0.08, 16, 16), []);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.38,
        roughness: 0.34,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.44,
        roughness: 0.28,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.72,
        roughness: 0.18,
        emissive: accentHex,
        emissiveIntensity: 0.34,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      outerArcGeo.dispose();
      midArcGeo.dispose();
      innerArcGeo.dispose();
      clawGeo.dispose();
      centerDotGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [
    outerArcGeo,
    midArcGeo,
    innerArcGeo,
    clawGeo,
    centerDotGeo,
    materials,
  ]);

  const clawRadius = 1.55 + Math.sin(angle * 2) * 0.16;

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 12]} intensity={1.3} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.5} color={accentHex} />

      <group scale={[uiScale, uiScale, uiScale]}>
        <mesh
          geometry={centerDotGeo}
          material={materials[2]}
          position={[0, 0, 0.2]}
        />

        {/* Outer 4 beveled arcs */}
        <group rotation={[0, 0, angle]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh
              key={i}
              geometry={outerArcGeo}
              material={i % 2 === 0 ? materials[2] : materials[0]}
              rotation={[0, 0, i * Math.PI * 0.5]}
            />
          ))}
        </group>

        {/* Mid 2 beveled arcs */}
        <group rotation={[0, 0, -angle * 2]} position={[0, 0, 0.08]}>
          {[0, 1].map((i) => (
            <mesh
              key={i}
              geometry={midArcGeo}
              material={materials[1]}
              rotation={[0, 0, i * Math.PI]}
            />
          ))}
        </group>

        {/* 4 Pulsing radial locking claws */}
        <group rotation={[0, 0, angle]} position={[0, 0, 0.16]}>
          {[0, 1, 2, 3].map((i) => (
            <group key={i} rotation={[0, 0, i * Math.PI * 0.5 + Math.PI * 0.25]}>
              <mesh
                geometry={clawGeo}
                material={materials[2]}
                position={[0, clawRadius, 0]}
              />
            </group>
          ))}
        </group>

        {/* Inner 2 counter-rotating arcs */}
        <group rotation={[0, 0, -angle * 3]} position={[0, 0, 0.2]}>
          {[0, 1].map((i) => (
            <mesh
              key={i}
              geometry={innerArcGeo}
              material={materials[2]}
              rotation={[0, 0, i * Math.PI]}
            />
          ))}
        </group>
      </group>
    </>
  );
};

export const ConcentricSciFiTargetReticle4K: React.FC<
  ConcentricSciFiTargetReticle4KProps
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
  const strokePx = Math.max(1.4, props.strokeWidth * 1.4 * uiScale);
  const rotDeg = (angle * 180) / Math.PI;
  const outerTickR = 3.25 * uiScale * zoom;
  const midTickR = 2.48 * uiScale * zoom;
  const diamondSize = 0.58 * uiScale * zoom;

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
        {/* Precision crosshairs */}
        <line
          x1={cx - outerTickR * 1.1}
          y1={cy}
          x2={cx - 0.55 * uiScale * zoom}
          y2={cy}
          stroke={accentHex}
          strokeOpacity={0.55}
          strokeWidth={strokePx}
        />
        <line
          x1={cx + 0.55 * uiScale * zoom}
          y1={cy}
          x2={cx + outerTickR * 1.1}
          y2={cy}
          stroke={accentHex}
          strokeOpacity={0.55}
          strokeWidth={strokePx}
        />
        <line
          x1={cx}
          y1={cy - outerTickR * 1.1}
          x2={cx}
          y2={cy - 0.55 * uiScale * zoom}
          stroke={accentHex}
          strokeOpacity={0.55}
          strokeWidth={strokePx}
        />
        <line
          x1={cx}
          y1={cy + 0.55 * uiScale * zoom}
          x2={cx}
          y2={cy + outerTickR * 1.1}
          stroke={accentHex}
          strokeOpacity={0.55}
          strokeWidth={strokePx}
        />

        {/* Counter-rotating outer ticks */}
        <g transform={`rotate(${-rotDeg} ${cx} ${cy})`}>
          {Array.from({ length: 60 }).map((_, i) => {
            const deg = (i * 360) / 60;
            const isMajor = i % 5 === 0;
            const len = (isMajor ? 0.16 : 0.08) * uiScale * zoom;
            return (
              <line
                key={i}
                x1={cx}
                y1={cy - outerTickR}
                x2={cx}
                y2={cy - outerTickR - len}
                stroke={isMajor ? accentHex : secondaryHex}
                strokeOpacity={isMajor ? 0.85 : 0.5}
                strokeWidth={isMajor ? strokePx * 1.2 : strokePx * 0.7}
                transform={`rotate(${deg} ${cx} ${cy})`}
              />
            );
          })}
        </g>

        {/* Mid dashed ring */}
        <g transform={`rotate(${rotDeg * 2} ${cx} ${cy})`}>
          <circle
            cx={cx}
            cy={cy}
            r={midTickR}
            fill="none"
            stroke={accentHex}
            strokeOpacity={0.5}
            strokeWidth={strokePx * 0.85}
            strokeDasharray={`${strokePx * 8} ${strokePx * 6}`}
          />
        </g>

        {/* Inner diamond reticle */}
        <g transform={`rotate(${45 + rotDeg} ${cx} ${cy})`}>
          <rect
            x={cx - diamondSize * 0.5}
            y={cy - diamondSize * 0.5}
            width={diamondSize}
            height={diamondSize}
            fill="none"
            stroke={accentHex}
            strokeOpacity={0.78}
            strokeWidth={strokePx}
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
        <TargetReticleScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
