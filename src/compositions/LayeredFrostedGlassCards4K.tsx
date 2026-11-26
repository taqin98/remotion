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

export const layeredFrostedGlassCards4KSchema = z.object({
  themePreset: themePresetSchema.default("clean-corporate"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#F4F7FC"),
  primaryColor: z.string().default("#E0ECFF"),
  secondaryColor: z.string().default("#3B82F6"),
  accentColor: z.string().default("#A855F7"),
  speedMultiplier: z.number().int().positive().default(1),
  strokeWidth: z.number().min(0.4).max(2.5).default(1),
});

export type LayeredFrostedGlassCards4KProps = z.infer<
  typeof layeredFrostedGlassCards4KSchema
>;

export const defaultLayeredFrostedGlassCards4KProps: LayeredFrostedGlassCards4KProps =
  {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "#F4F7FC",
    primaryColor: "#E0ECFF",
    secondaryColor: "#3B82F6",
    accentColor: "#A855F7",
    speedMultiplier: 1,
    strokeWidth: 1,
  };

export const layeredFrostedGlassCards4KVariations: Record<
  ThemePreset,
  LayeredFrostedGlassCards4KProps
> = {
  "clean-corporate": defaultLayeredFrostedGlassCards4KProps,
  "dark-tech": {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "#060B18",
    primaryColor: "#1E293B",
    secondaryColor: "#38BDF8",
    accentColor: "#6366F1",
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "#FAF6F0",
    primaryColor: "#F6E7D8",
    secondaryColor: "#E07A5F",
    accentColor: "#F2CC8F",
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "#0D0D10",
    primaryColor: "#232329",
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
  orbPrimary: string;
  orbSecondary: string;
  rimColor: string;
  fogColor: string;
  ambientIntensity: number;
  keyIntensity: number;
}

const THEME_PALETTES: Record<ThemePreset, ThemePalette> = {
  "clean-corporate": {
    bgTop: "#F8FAFF",
    bgBottom: "#E2ECFA",
    glassTint: "#FFFFFF",
    orbPrimary: "#60A5FA",
    orbSecondary: "#C084FC",
    rimColor: "#FFFFFF",
    fogColor: "#EFF4FC",
    ambientIntensity: 1.05,
    keyIntensity: 1.4,
  },
  "dark-tech": {
    bgTop: "#081024",
    bgBottom: "#040814",
    glassTint: "#BAE6FD",
    orbPrimary: "#06B6D4",
    orbSecondary: "#6366F1",
    rimColor: "#38BDF8",
    fogColor: "#060B1A",
    ambientIntensity: 0.75,
    keyIntensity: 1.6,
  },
  "warm-minimalist": {
    bgTop: "#FDF9F3",
    bgBottom: "#F1E3D3",
    glassTint: "#FFFBF5",
    orbPrimary: "#E07A5F",
    orbSecondary: "#F2CC8F",
    rimColor: "#FFF5E6",
    fogColor: "#F6EDE2",
    ambientIntensity: 1.0,
    keyIntensity: 1.35,
  },
  "monochrome-luxury": {
    bgTop: "#141418",
    bgBottom: "#08080A",
    glassTint: "#E4E4E7",
    orbPrimary: "#D4AF37",
    orbSecondary: "#52525B",
    rimColor: "#D4AF37",
    fogColor: "#0E0E11",
    ambientIntensity: 0.65,
    keyIntensity: 1.5,
  },
};

const resolvePalette = (props: LayeredFrostedGlassCards4KProps): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  return {
    ...base,
    bgTop:
      props.backgroundColor !==
      defaultLayeredFrostedGlassCards4KProps.backgroundColor
        ? props.backgroundColor
        : base.bgTop,
    glassTint:
      props.primaryColor !== defaultLayeredFrostedGlassCards4KProps.primaryColor
        ? props.primaryColor
        : base.glassTint,
    orbPrimary:
      props.secondaryColor !==
      defaultLayeredFrostedGlassCards4KProps.secondaryColor
        ? props.secondaryColor
        : base.orbPrimary,
    orbSecondary:
      props.accentColor !== defaultLayeredFrostedGlassCards4KProps.accentColor
        ? props.accentColor
        : base.orbSecondary,
  };
};

type CardShape = "wide" | "tall" | "square";

interface GlassCardSpec {
  id: string;
  shape: CardShape;
  basePos: [number, number, number];
  baseRot: [number, number, number];
  drift: [number, number, number];
  phase: number;
  scale: number;
}

const CARD_SPECS: readonly GlassCardSpec[] = [
  {
    id: "card-tl-1",
    shape: "wide",
    basePos: [-5.6, 2.75, -0.6],
    baseRot: [0.14, 0.28, -0.06],
    drift: [0.45, 0.25, 0.16],
    phase: 0.2,
    scale: 1.05,
  },
  {
    id: "card-tl-2",
    shape: "square",
    basePos: [-4.4, 3.2, -2.1],
    baseRot: [-0.1, 0.18, 0.08],
    drift: [0.35, 0.3, 0.14],
    phase: 1.4,
    scale: 1.15,
  },
  {
    id: "card-left-1",
    shape: "tall",
    basePos: [-6.45, -0.4, 0.3],
    baseRot: [0.08, 0.35, 0.04],
    drift: [0.28, 0.38, 0.18],
    phase: 2.3,
    scale: 1.0,
  },
  {
    id: "card-bl-1",
    shape: "wide",
    basePos: [-4.9, -2.95, -0.9],
    baseRot: [-0.15, 0.22, -0.04],
    drift: [0.48, 0.22, 0.15],
    phase: 3.1,
    scale: 1.08,
  },
  {
    id: "card-bl-2",
    shape: "square",
    basePos: [-6.2, -2.35, -2.6],
    baseRot: [0.12, -0.15, 0.06],
    drift: [0.32, 0.28, 0.12],
    phase: 4.5,
    scale: 0.95,
  },
  {
    id: "card-tr-1",
    shape: "tall",
    basePos: [5.75, 2.3, -0.4],
    baseRot: [0.12, -0.32, -0.05],
    drift: [0.38, 0.32, 0.16],
    phase: 0.85,
    scale: 1.06,
  },
  {
    id: "card-tr-2",
    shape: "wide",
    basePos: [4.55, 3.15, -2.2],
    baseRot: [-0.08, -0.2, 0.05],
    drift: [0.46, 0.22, 0.14],
    phase: 2.6,
    scale: 1.1,
  },
  {
    id: "card-right-1",
    shape: "square",
    basePos: [6.4, -0.35, 0.45],
    baseRot: [0.06, -0.38, 0.04],
    drift: [0.25, 0.4, 0.18],
    phase: 3.7,
    scale: 1.12,
  },
  {
    id: "card-br-1",
    shape: "wide",
    basePos: [5.15, -2.8, -0.75],
    baseRot: [-0.14, -0.26, -0.06],
    drift: [0.5, 0.26, 0.15],
    phase: 4.9,
    scale: 1.04,
  },
  {
    id: "card-br-2",
    shape: "tall",
    basePos: [3.85, -3.35, -2.8],
    baseRot: [0.1, -0.18, 0.08],
    drift: [0.34, 0.3, 0.12],
    phase: 5.6,
    scale: 0.96,
  },
];

interface BackdropOrbSpec {
  id: string;
  basePos: [number, number, number];
  radius: number;
  phase: number;
  useSecondary: boolean;
}

const BACKDROP_ORBS: readonly BackdropOrbSpec[] = [
  { id: "orb-1", basePos: [-5.5, 2.4, -4.5], radius: 2.1, phase: 0.4, useSecondary: false },
  { id: "orb-2", basePos: [-4.8, -2.5, -4.8], radius: 1.8, phase: 2.1, useSecondary: true },
  { id: "orb-3", basePos: [5.4, 2.2, -4.4], radius: 2.2, phase: 3.4, useSecondary: true },
  { id: "orb-4", basePos: [4.9, -2.4, -4.7], radius: 1.9, phase: 5.0, useSecondary: false },
];

const CANVAS_GL = { antialias: true, alpha: true } as const;
const CAMERA_CONFIG = {
  position: [0, 0, 12] as [number, number, number],
  fov: 40,
  near: 0.1,
  far: 100,
};

interface FrostedCardsSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  speedMultiplier: number;
  strokeWidth: number;
  aspectRatio: AspectRatio;
}

const FrostedCardsScene: React.FC<FrostedCardsSceneProps> = ({
  frame,
  durationInFrames,
  palette,
  speedMultiplier,
  strokeWidth,
  aspectRatio,
}) => {
  const progress = (frame % durationInFrames) / durationInFrames;
  const loopAngle = progress * Math.PI * 2 * speedMultiplier;
  const aspectXScale = aspectRatio === "9:16" ? 0.46 : 1;

  const geometries = useMemo(
    () => ({
      wide: new RoundedBoxGeometry(3.4, 1.9, 0.14, 4, 0.18),
      wideRim: new RoundedBoxGeometry(3.46, 1.96, 0.08, 3, 0.19),
      tall: new RoundedBoxGeometry(2.0, 3.3, 0.14, 4, 0.18),
      tallRim: new RoundedBoxGeometry(2.06, 3.36, 0.08, 3, 0.19),
      square: new RoundedBoxGeometry(2.3, 2.3, 0.14, 4, 0.2),
      squareRim: new RoundedBoxGeometry(2.36, 2.36, 0.08, 3, 0.21),
      orb: new SphereGeometry(1, 36, 36),
    }),
    [],
  );

  const materials = useMemo(
    () => ({
      frostedGlass: new MeshPhysicalMaterial({
        color: palette.glassTint,
        transmission: 0.88,
        opacity: 1,
        transparent: true,
        roughness: 0.28,
        metalness: 0.02,
        thickness: 0.9,
        ior: 1.45,
        clearcoat: 0.85,
        clearcoatRoughness: 0.18,
      }),
      rim: new MeshStandardMaterial({
        color: palette.rimColor,
        roughness: 0.25,
        metalness: 0.35,
        wireframe: true,
        transparent: true,
        opacity: Math.min(0.45, 0.22 * strokeWidth),
      }),
      orbPrimary: new MeshStandardMaterial({
        color: palette.orbPrimary,
        emissive: palette.orbPrimary,
        emissiveIntensity: 0.35,
        roughness: 0.4,
        metalness: 0.05,
      }),
      orbSecondary: new MeshStandardMaterial({
        color: palette.orbSecondary,
        emissive: palette.orbSecondary,
        emissiveIntensity: 0.35,
        roughness: 0.4,
        metalness: 0.05,
      }),
    }),
    [
      palette.glassTint,
      palette.rimColor,
      palette.orbPrimary,
      palette.orbSecondary,
      strokeWidth,
    ],
  );

  useEffect(() => {
    return () => {
      geometries.wide.dispose();
      geometries.wideRim.dispose();
      geometries.tall.dispose();
      geometries.tallRim.dispose();
      geometries.square.dispose();
      geometries.squareRim.dispose();
      geometries.orb.dispose();
    };
  }, [geometries]);

  useEffect(() => {
    return () => {
      materials.frostedGlass.dispose();
      materials.rim.dispose();
      materials.orbPrimary.dispose();
      materials.orbSecondary.dispose();
    };
  }, [materials]);

  return (
    <>
      <fog attach="fog" args={[palette.fogColor, 11, 25]} />
      <ambientLight intensity={palette.ambientIntensity} color="#FFFFFF" />
      <hemisphereLight args={["#FFFFFF", palette.bgBottom, 0.7]} />
      <directionalLight
        position={[8, 12, 10]}
        intensity={palette.keyIntensity}
        color="#FFFFFF"
      />
      <directionalLight
        position={[-10, -4, 8]}
        intensity={0.85}
        color={palette.orbPrimary}
      />
      <directionalLight
        position={[6, -6, 6]}
        intensity={0.65}
        color={palette.orbSecondary}
      />

      {/* Glowing pastel depth orbs behind frosted glass cards */}
      {BACKDROP_ORBS.map((orb) => {
        const phase = loopAngle + orb.phase;
        return (
          <mesh
            key={orb.id}
            geometry={geometries.orb}
            material={
              orb.useSecondary ? materials.orbSecondary : materials.orbPrimary
            }
            position={[
              orb.basePos[0] * aspectXScale + Math.cos(phase) * 0.6,
              orb.basePos[1] + Math.sin(phase) * 0.5,
              orb.basePos[2],
            ]}
            scale={[orb.radius, orb.radius, orb.radius]}
          />
        );
      })}

      {/* 10 drifting translucent frosted glass cards */}
      {CARD_SPECS.map((card) => {
        const phase = loopAngle + card.phase;
        const posX =
          card.basePos[0] * aspectXScale + Math.cos(phase) * card.drift[0];
        const posY = card.basePos[1] + Math.sin(phase) * card.drift[1];
        const posZ = card.basePos[2] + Math.sin(phase + 0.8) * card.drift[2];
        const rotX = card.baseRot[0] + Math.sin(phase) * 0.08;
        const rotY = card.baseRot[1] + Math.cos(phase) * 0.1;
        const rotZ = card.baseRot[2] + Math.sin(phase * 2) * 0.04;

        const cardGeo =
          card.shape === "wide"
            ? geometries.wide
            : card.shape === "tall"
              ? geometries.tall
              : geometries.square;
        const rimGeo =
          card.shape === "wide"
            ? geometries.wideRim
            : card.shape === "tall"
              ? geometries.tallRim
              : geometries.squareRim;

        return (
          <group
            key={card.id}
            position={[posX, posY, posZ]}
            rotation={[rotX, rotY, rotZ]}
            scale={[card.scale, card.scale, card.scale]}
          >
            <mesh geometry={cardGeo} material={materials.frostedGlass} />
            <mesh geometry={rimGeo} material={materials.rim} />
          </group>
        );
      })}
    </>
  );
};

export const LayeredFrostedGlassCards4K: React.FC<
  LayeredFrostedGlassCards4KProps
> = (props) => {
  const {
    themePreset = "clean-corporate",
    aspectRatio = "16:9",
    backgroundColor = "#F4F7FC",
    primaryColor = "#E0ECFF",
    secondaryColor = "#3B82F6",
    accentColor = "#A855F7",
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
            id="frosted-cards-bg-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={palette.bgTop} />
            <stop offset="100%" stopColor={palette.bgBottom} />
          </linearGradient>
          <filter
            id="frosted-cards-grain"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed="51"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width={width} height={height} fill="url(#frosted-cards-bg-grad)" />
        <rect
          width={width}
          height={height}
          filter="url(#frosted-cards-grain)"
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
        <FrostedCardsScene
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

