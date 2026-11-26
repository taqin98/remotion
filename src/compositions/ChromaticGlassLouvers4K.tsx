import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  setConsoleFunction,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { z } from "zod";

setConsoleFunction((type, message, ...params) => {
  if (
    type === "warn" &&
    typeof message === "string" &&
    message.startsWith("THREE.Clock:")
  ) {
    return;
  }
  if (type === "error") {
    console.error(message, ...params);
  } else if (type === "warn") {
    console.warn(message, ...params);
  } else {
    console.log(message, ...params);
  }
});

export const themePresetSchema = z.enum([
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
]);

export const aspectRatioSchema = z.enum(["16:9", "9:16"]);

export type ThemePreset = z.infer<typeof themePresetSchema>;
export type AspectRatio = z.infer<typeof aspectRatioSchema>;

export const chromaticGlassLouvers4KSchema = z.object({
  themePreset: themePresetSchema.default("clean-corporate"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#F8FAFC"),
  primaryColor: z.string().default("#E0F2FE"),
  secondaryColor: z.string().default("#3B82F6"),
  accentColor: z.string().default("#EC4899"),
  speedMultiplier: z.number().int().positive().default(1),
  strokeWidth: z.number().min(0.4).max(2.5).default(1),
});

export type ChromaticGlassLouvers4KProps = z.infer<
  typeof chromaticGlassLouvers4KSchema
>;

export const defaultChromaticGlassLouvers4KProps: ChromaticGlassLouvers4KProps =
  {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "#F8FAFC",
    primaryColor: "#E0F2FE",
    secondaryColor: "#3B82F6",
    accentColor: "#EC4899",
    speedMultiplier: 1,
    strokeWidth: 1,
  };

export const chromaticGlassLouvers4KVariations: Record<
  ThemePreset,
  ChromaticGlassLouvers4KProps
> = {
  "clean-corporate": defaultChromaticGlassLouvers4KProps,
  "dark-tech": {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "#060B18",
    primaryColor: "#BAE6FD",
    secondaryColor: "#06B6D4",
    accentColor: "#A855F7",
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "#FAF7F2",
    primaryColor: "#FFF5EB",
    secondaryColor: "#E07A5F",
    accentColor: "#F2CC8F",
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "#0D0D10",
    primaryColor: "#E4E4E7",
    secondaryColor: "#D4AF37",
    accentColor: "#F3D37A",
    speedMultiplier: 1,
    strokeWidth: 1,
  },
};

interface ThemePalette {
  bgTop: string;
  bgBottom: string;
  glassTint: string;
  shapePrimary: string;
  shapeSecondary: string;
  fogColor: string;
}

const THEME_PALETTES: Record<ThemePreset, ThemePalette> = {
  "clean-corporate": {
    bgTop: "#FFFFFF",
    bgBottom: "#E6EEF9",
    glassTint: "#F8FAFC",
    shapePrimary: "#3B82F6",
    shapeSecondary: "#EC4899",
    fogColor: "#F0F5FC",
  },
  "dark-tech": {
    bgTop: "#091124",
    bgBottom: "#040814",
    glassTint: "#BAE6FD",
    shapePrimary: "#06B6D4",
    shapeSecondary: "#A855F7",
    fogColor: "#060B1A",
  },
  "warm-minimalist": {
    bgTop: "#FDFBF7",
    bgBottom: "#EFE3D3",
    glassTint: "#FFF9F0",
    shapePrimary: "#E07A5F",
    shapeSecondary: "#F2CC8F",
    fogColor: "#F5EEE3",
  },
  "monochrome-luxury": {
    bgTop: "#141418",
    bgBottom: "#08080A",
    glassTint: "#E4E4E7",
    shapePrimary: "#D4AF37",
    shapeSecondary: "#F3D37A",
    fogColor: "#0D0D10",
  },
};

const resolvePalette = (
  props: ChromaticGlassLouvers4KProps,
): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  return {
    ...base,
    bgTop:
      props.backgroundColor !==
      defaultChromaticGlassLouvers4KProps.backgroundColor
        ? props.backgroundColor
        : base.bgTop,
    glassTint:
      props.primaryColor !== defaultChromaticGlassLouvers4KProps.primaryColor
        ? props.primaryColor
        : base.glassTint,
    shapePrimary:
      props.secondaryColor !==
      defaultChromaticGlassLouvers4KProps.secondaryColor
        ? props.secondaryColor
        : base.shapePrimary,
    shapeSecondary:
      props.accentColor !== defaultChromaticGlassLouvers4KProps.accentColor
        ? props.accentColor
        : base.shapeSecondary,
  };
};

const LOUVER_COUNT = 16;

interface BackgroundShapeSpec {
  id: string;
  basePos: [number, number, number];
  radius: number;
  phase: number;
  useSecondary: boolean;
}

const BACKDROP_SHAPES: readonly BackgroundShapeSpec[] = [
  { id: "shape-1", basePos: [-4.5, 1.4, -3.5], radius: 2.2, phase: 0.2, useSecondary: false },
  { id: "shape-2", basePos: [-1.2, -1.8, -3.8], radius: 2.0, phase: 1.8, useSecondary: true },
  { id: "shape-3", basePos: [2.4, 1.7, -3.4], radius: 2.3, phase: 3.1, useSecondary: false },
  { id: "shape-4", basePos: [5.2, -1.4, -3.7], radius: 2.1, phase: 4.5, useSecondary: true },
];

const CANVAS_GL = { antialias: true, alpha: true } as const;
const CAMERA_CONFIG = {
  position: [0, 0, 12] as [number, number, number],
  fov: 40,
  near: 0.1,
  far: 100,
};

interface LouversSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  speedMultiplier: number;
  strokeWidth: number;
  aspectRatio: AspectRatio;
}

const LouversScene: React.FC<LouversSceneProps> = ({
  frame,
  durationInFrames,
  palette,
  speedMultiplier,
  strokeWidth,
  aspectRatio,
}) => {
  const progress = (frame % durationInFrames) / durationInFrames;
  const loopAngle = progress * Math.PI * 2 * speedMultiplier;
  const aspectXScale = aspectRatio === "9:16" ? 0.45 : 1;

  const louverIndices = useMemo(
    () => Array.from({ length: LOUVER_COUNT }, (_, idx) => idx),
    [],
  );

  const geometries = useMemo(
    () => ({
      louver: new RoundedBoxGeometry(0.86 * strokeWidth, 10.6, 0.26, 3, 0.12),
      orb: new SphereGeometry(1, 36, 36),
    }),
    [strokeWidth],
  );

  const materials = useMemo(
    () => ({
      glassLouver: new MeshPhysicalMaterial({
        color: palette.glassTint,
        transmission: 0.9,
        transparent: true,
        opacity: 1,
        roughness: 0.16,
        metalness: 0.03,
        thickness: 1.2,
        ior: 1.5,
        clearcoat: 0.9,
        clearcoatRoughness: 0.1,
        iridescence: 0.5,
      }),
      shapePrimary: new MeshStandardMaterial({
        color: palette.shapePrimary,
        emissive: palette.shapePrimary,
        emissiveIntensity: 0.42,
        roughness: 0.35,
      }),
      shapeSecondary: new MeshStandardMaterial({
        color: palette.shapeSecondary,
        emissive: palette.shapeSecondary,
        emissiveIntensity: 0.42,
        roughness: 0.35,
      }),
    }),
    [palette.glassTint, palette.shapePrimary, palette.shapeSecondary],
  );

  useEffect(() => {
    return () => {
      geometries.louver.dispose();
      geometries.orb.dispose();
    };
  }, [geometries]);

  useEffect(() => {
    return () => {
      materials.glassLouver.dispose();
      materials.shapePrimary.dispose();
      materials.shapeSecondary.dispose();
    };
  }, [materials]);

  return (
    <>
      <fog attach="fog" args={[palette.fogColor, 11, 25]} />
      <ambientLight intensity={0.95} color="#FFFFFF" />
      <hemisphereLight args={["#FFFFFF", palette.bgBottom, 0.7]} />
      <directionalLight position={[9, 12, 10]} intensity={1.55} color="#FFFFFF" />
      <directionalLight
        position={[-10, -4, 8]}
        intensity={1.0}
        color={palette.shapePrimary}
      />

      {/* Colorful abstract geometric shapes drifting behind glass louvers */}
      {BACKDROP_SHAPES.map((shape) => {
        const phase = loopAngle + shape.phase;
        return (
          <mesh
            key={shape.id}
            geometry={geometries.orb}
            material={
              shape.useSecondary
                ? materials.shapeSecondary
                : materials.shapePrimary
            }
            position={[
              shape.basePos[0] * aspectXScale + Math.cos(phase) * 1.4,
              shape.basePos[1] + Math.sin(phase) * 0.85,
              shape.basePos[2],
            ]}
            scale={[shape.radius, shape.radius, shape.radius]}
          />
        );
      })}

      {/* 16 vertical ribbed glass louvers rotating sequentially */}
      <group rotation={[0, 0, -0.06]}>
        {louverIndices.map((idx) => {
          const xPos = (idx - (LOUVER_COUNT - 1) / 2) * 1.02 * aspectXScale;
          const rotY = Math.sin(loopAngle - idx * 0.35) * 0.68;
          return (
            <mesh
              key={`louver-${idx}`}
              geometry={geometries.louver}
              material={materials.glassLouver}
              position={[xPos, 0, 0]}
              rotation={[0, rotY, 0]}
            />
          );
        })}
      </group>
    </>
  );
};

export const ChromaticGlassLouvers4K: React.FC<
  ChromaticGlassLouvers4KProps
> = (props) => {
  const {
    themePreset = "clean-corporate",
    aspectRatio = "16:9",
    backgroundColor = "#F8FAFC",
    primaryColor = "#E0F2FE",
    secondaryColor = "#3B82F6",
    accentColor = "#EC4899",
    speedMultiplier = 1,
    strokeWidth = 1,
  } = props;

  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const palette = useMemo(
    () =>
      resolvePalette({
        themePreset,
        aspectRatio,
        backgroundColor,
        primaryColor,
        secondaryColor,
        accentColor,
        speedMultiplier,
        strokeWidth,
      }),
    [
      themePreset,
      aspectRatio,
      backgroundColor,
      primaryColor,
      secondaryColor,
      accentColor,
      speedMultiplier,
      strokeWidth,
    ],
  );

  return (
    <AbsoluteFill style={{ backgroundColor: palette.bgTop, overflow: "hidden" }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <defs>
          <linearGradient
            id="louvers-bg-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={palette.bgTop} />
            <stop offset="100%" stopColor={palette.bgBottom} />
          </linearGradient>
          <filter
            id="louvers-grain"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed="67"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width={width} height={height} fill="url(#louvers-bg-grad)" />
        <rect
          width={width}
          height={height}
          filter="url(#louvers-grain)"
          opacity="0.012"
        />
      </svg>

      <ThreeCanvas
        width={width}
        height={height}
        dpr={1}
        camera={CAMERA_CONFIG}
        gl={CANVAS_GL}
        style={{ position: "absolute", inset: 0 }}
      >
        <LouversScene
          frame={frame}
          durationInFrames={durationInFrames}
          palette={palette}
          speedMultiplier={speedMultiplier}
          strokeWidth={strokeWidth}
          aspectRatio={aspectRatio}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

