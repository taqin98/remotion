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

export const glowingNeonGeometricFrameThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type GlowingNeonGeometricFrameThemePreset =
  (typeof glowingNeonGeometricFrameThemePresets)[number];

export const glowingNeonGeometricFrame4KSchema = z.object({
  themePreset: z.enum(glowingNeonGeometricFrameThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type GlowingNeonGeometricFrame4KProps = z.infer<
  typeof glowingNeonGeometricFrame4KSchema
>;

export const defaultGlowingNeonGeometricFrame4KProps: GlowingNeonGeometricFrame4KProps =
  {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#0F172A",
    secondaryColor: "#6366F1",
    accentColor: "#38BDF8",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const glowingNeonGeometricFrame4KVariations: Record<
  GlowingNeonGeometricFrameThemePreset,
  Omit<
    GlowingNeonGeometricFrame4KProps,
    "aspectRatio" | "speedMultiplier" | "strokeWidth"
  >
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    backgroundColor: "transparent",
    primaryColor: "#1E293B",
    secondaryColor: "#3B82F6",
    accentColor: "#2563EB",
  },
  "dark-tech": {
    themePreset: "dark-tech",
    backgroundColor: "transparent",
    primaryColor: "#0F172A",
    secondaryColor: "#6366F1",
    accentColor: "#38BDF8",
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    backgroundColor: "transparent",
    primaryColor: "#44403C",
    secondaryColor: "#F59E0B",
    accentColor: "#D97706",
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    backgroundColor: "transparent",
    primaryColor: "#18181B",
    secondaryColor: "#E4E4E7",
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

function resolveThemeColors(props: GlowingNeonGeometricFrame4KProps) {
  const preset = glowingNeonGeometricFrame4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultGlowingNeonGeometricFrame4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultGlowingNeonGeometricFrame4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultGlowingNeonGeometricFrame4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

function evalPerimeterPoint(
  u: number,
  halfW: number,
  halfH: number,
): { x: number; y: number; rotZ: number } {
  const w = halfW * 2;
  const h = halfH * 2;
  const perim = 2 * (w + h);
  const d = (u % 1) * perim;

  if (d < w) {
    return { x: -halfW + d, y: halfH, rotZ: Math.PI * 0.5 };
  }
  if (d < w + h) {
    return { x: halfW, y: halfH - (d - w), rotZ: 0 };
  }
  if (d < 2 * w + h) {
    return { x: halfW - (d - (w + h)), y: -halfH, rotZ: Math.PI * 0.5 };
  }
  return { x: -halfW, y: -halfH + (d - (2 * w + h)), rotZ: 0 };
}

const PULSE_COUNT = 8;

const GlowingNeonFrameScene: React.FC<{
  props: GlowingNeonGeometricFrame4KProps;
  cycleProgress: number;
  angle: number;
}> = ({ props, cycleProgress, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const outerHalfW = isVertical ? 3.95 : 7.15;
  const outerHalfH = isVertical ? 7.15 : 3.95;
  const innerHalfW = outerHalfW - 0.18;
  const innerHalfH = outerHalfH - 0.18;

  const railThick = 0.028 * props.strokeWidth;

  const hOuterGeo = useMemo(
    () => new RoundedBoxGeometry(outerHalfW * 2, railThick, 0.1, 2, 0.01),
    [outerHalfW, railThick],
  );
  const vOuterGeo = useMemo(
    () => new RoundedBoxGeometry(railThick, outerHalfH * 2, 0.1, 2, 0.01),
    [outerHalfH, railThick],
  );
  const hInnerGeo = useMemo(
    () => new RoundedBoxGeometry(innerHalfW * 2, railThick * 0.65, 0.08, 2, 0.008),
    [innerHalfW, railThick],
  );
  const vInnerGeo = useMemo(
    () => new RoundedBoxGeometry(railThick * 0.65, innerHalfH * 2, 0.08, 2, 0.008),
    [innerHalfH, railThick],
  );
  const cornerNodeGeo = useMemo(() => new THREE.IcosahedronGeometry(0.11, 0), []);
  const pulseGeo = useMemo(
    () => new THREE.CapsuleGeometry(0.036 * Math.max(0.6, props.strokeWidth * 0.5), 0.72, 6, 12),
    [props.strokeWidth],
  );

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.45,
        roughness: 0.3,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.68,
        roughness: 0.2,
        emissive: secondaryHex,
        emissiveIntensity: 0.45,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.75,
        roughness: 0.16,
        emissive: accentHex,
        emissiveIntensity: 0.75,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      hOuterGeo.dispose();
      vOuterGeo.dispose();
      hInnerGeo.dispose();
      vInnerGeo.dispose();
      cornerNodeGeo.dispose();
      pulseGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [
    hOuterGeo,
    vOuterGeo,
    hInnerGeo,
    vInnerGeo,
    cornerNodeGeo,
    pulseGeo,
    materials,
  ]);

  const corners: Array<[number, number]> = [
    [-outerHalfW, outerHalfH],
    [outerHalfW, outerHalfH],
    [-outerHalfW, -outerHalfH],
    [outerHalfW, -outerHalfH],
  ];

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 12]} intensity={1.3} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.55} color={accentHex} />

      {/* Outer neon rails */}
      <mesh geometry={hOuterGeo} material={materials[2]} position={[0, outerHalfH, 0]} />
      <mesh geometry={hOuterGeo} material={materials[2]} position={[0, -outerHalfH, 0]} />
      <mesh geometry={vOuterGeo} material={materials[2]} position={[-outerHalfW, 0, 0]} />
      <mesh geometry={vOuterGeo} material={materials[2]} position={[outerHalfW, 0, 0]} />

      {/* Inner secondary rails */}
      <mesh geometry={hInnerGeo} material={materials[1]} position={[0, innerHalfH, -0.04]} />
      <mesh geometry={hInnerGeo} material={materials[1]} position={[0, -innerHalfH, -0.04]} />
      <mesh geometry={vInnerGeo} material={materials[1]} position={[-innerHalfW, 0, -0.04]} />
      <mesh geometry={vInnerGeo} material={materials[1]} position={[innerHalfW, 0, -0.04]} />

      {/* 4 Corner jewels */}
      {corners.map(([cx, cy], idx) => (
        <mesh
          key={idx}
          geometry={cornerNodeGeo}
          material={materials[2]}
          position={[cx, cy, 0.08]}
          rotation={[angle, angle * 2, 0]}
        />
      ))}

      {/* Traveling perimeter light pulses */}
      {Array.from({ length: PULSE_COUNT }).map((_, i) => {
        const u = (i / PULSE_COUNT + cycleProgress) % 1;
        const pt = evalPerimeterPoint(u, outerHalfW, outerHalfH);
        return (
          <mesh
            key={i}
            geometry={pulseGeo}
            material={i % 2 === 0 ? materials[2] : materials[1]}
            position={[pt.x, pt.y, 0.08]}
            rotation={[0, 0, pt.rotZ]}
          />
        );
      })}
    </>
  );
};

export const GlowingNeonGeometricFrame4K: React.FC<
  GlowingNeonGeometricFrame4KProps
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
  const innerHalfW = (isVertical ? 3.95 : 7.15) - 0.32;
  const innerHalfH = (isVertical ? 7.15 : 3.95) - 0.32;
  const rectW = innerHalfW * 2 * zoom;
  const rectH = innerHalfH * 2 * zoom;
  const leftPx = width * 0.5 - rectW * 0.5;
  const topPx = height * 0.5 - rectH * 0.5;
  const perimPx = 2 * (rectW + rectH);

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
        <rect
          x={leftPx}
          y={topPx}
          width={rectW}
          height={rectH}
          fill="none"
          stroke={secondaryHex}
          strokeOpacity={0.38}
          strokeWidth={Math.max(1.5, props.strokeWidth * 1.2)}
        />
        <rect
          x={leftPx}
          y={topPx}
          width={rectW}
          height={rectH}
          fill="none"
          stroke={accentHex}
          strokeOpacity={0.85}
          strokeWidth={Math.max(2, props.strokeWidth * 1.6)}
          strokeDasharray={`${perimPx * 0.06} ${perimPx * 0.19}`}
          strokeDashoffset={-cycleProgress * perimPx}
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
        <GlowingNeonFrameScene
          props={props}
          cycleProgress={cycleProgress}
          angle={angle}
        />
      </ThreeCanvas>
    </div>
  );
};
