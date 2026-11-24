import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  CapsuleGeometry,
  MeshStandardMaterial,
  TorusGeometry,
  setConsoleFunction,
} from "three";
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

export const orbitingSmoothPills4KSchema = z.object({
  themePreset: themePresetSchema.default("clean-corporate"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#F8FAFC"),
  primaryColor: z.string().default("#1E293B"),
  secondaryColor: z.string().default("#3B82F6"),
  accentColor: z.string().default("#0EA5E9"),
  orbitAmplitude: z.number().min(0.1).max(2.5).default(1),
  speedMultiplier: z.number().int().positive().default(1),
});

export type OrbitingSmoothPills4KProps = z.infer<
  typeof orbitingSmoothPills4KSchema
>;

export const defaultOrbitingSmoothPills4KProps: OrbitingSmoothPills4KProps = {
  themePreset: "clean-corporate",
  aspectRatio: "16:9",
  backgroundColor: "#F8FAFC",
  primaryColor: "#1E293B",
  secondaryColor: "#3B82F6",
  accentColor: "#0EA5E9",
  orbitAmplitude: 1,
  speedMultiplier: 1,
};

export const orbitingSmoothPills4KVariations: Record<
  ThemePreset,
  OrbitingSmoothPills4KProps
> = {
  "clean-corporate": defaultOrbitingSmoothPills4KProps,
  "dark-tech": {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "#070D1D",
    primaryColor: "#1E293B",
    secondaryColor: "#06B6D4",
    accentColor: "#6366F1",
    orbitAmplitude: 1,
    speedMultiplier: 1,
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "#FAF7F2",
    primaryColor: "#E07A5F",
    secondaryColor: "#D4A373",
    accentColor: "#F2CC8F",
    orbitAmplitude: 1,
    speedMultiplier: 1,
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "#0F0F12",
    primaryColor: "#18181B",
    secondaryColor: "#D4AF37",
    accentColor: "#F3D37A",
    orbitAmplitude: 1,
    speedMultiplier: 1,
  },
};

interface ThemePalette {
  bgTop: string;
  bgBottom: string;
  bgGlow: string;
  bgGlowOpacity: number;
  fogColor: string;
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  trim: string;
  ambientIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  keyColor: string;
  keyIntensity: number;
  fillColor: string;
  fillIntensity: number;
  rimColor: string;
  rimIntensity: number;
}

const THEME_PALETTES: Record<ThemePreset, ThemePalette> = {
  "clean-corporate": {
    bgTop: "#FFFFFF",
    bgBottom: "#EAF1F8",
    bgGlow: "#3B82F6",
    bgGlowOpacity: 0.08,
    fogColor: "#F3F6FB",
    primary: "#1E293B",
    secondary: "#3B82F6",
    accent: "#0EA5E9",
    neutral: "#E2E8F0",
    trim: "#F8FAFC",
    ambientIntensity: 0.9,
    hemiSky: "#FFFFFF",
    hemiGround: "#CBD5E1",
    hemiIntensity: 0.72,
    keyColor: "#FFFDF9",
    keyIntensity: 1.42,
    fillColor: "#DCEAFE",
    fillIntensity: 0.72,
    rimColor: "#FFFFFF",
    rimIntensity: 0.96,
  },
  "dark-tech": {
    bgTop: "#0B1328",
    bgBottom: "#040814",
    bgGlow: "#06B6D4",
    bgGlowOpacity: 0.14,
    fogColor: "#060D1E",
    primary: "#1E293B",
    secondary: "#06B6D4",
    accent: "#6366F1",
    neutral: "#172554",
    trim: "#38BDF8",
    ambientIntensity: 0.55,
    hemiSky: "#38BDF8",
    hemiGround: "#020617",
    hemiIntensity: 0.6,
    keyColor: "#E0F2FE",
    keyIntensity: 1.55,
    fillColor: "#6366F1",
    fillIntensity: 0.88,
    rimColor: "#22D3EE",
    rimIntensity: 1.28,
  },
  "warm-minimalist": {
    bgTop: "#FDFBF7",
    bgBottom: "#EFE5D7",
    bgGlow: "#E07A5F",
    bgGlowOpacity: 0.09,
    fogColor: "#F5EEE3",
    primary: "#E07A5F",
    secondary: "#D4A373",
    accent: "#F2CC8F",
    neutral: "#EAE0D0",
    trim: "#FAF8F5",
    ambientIntensity: 0.95,
    hemiSky: "#FFFDF9",
    hemiGround: "#D6C5B0",
    hemiIntensity: 0.76,
    keyColor: "#FFF7EB",
    keyIntensity: 1.35,
    fillColor: "#F5E1C8",
    fillIntensity: 0.68,
    rimColor: "#FFFFFF",
    rimIntensity: 0.88,
  },
  "monochrome-luxury": {
    bgTop: "#17171B",
    bgBottom: "#09090B",
    bgGlow: "#D4AF37",
    bgGlowOpacity: 0.11,
    fogColor: "#0D0D10",
    primary: "#18181B",
    secondary: "#D4AF37",
    accent: "#F3D37A",
    neutral: "#27272C",
    trim: "#FDE68A",
    ambientIntensity: 0.45,
    hemiSky: "#FDE68A",
    hemiGround: "#09090B",
    hemiIntensity: 0.48,
    keyColor: "#FFF6DB",
    keyIntensity: 1.5,
    fillColor: "#52525B",
    fillIntensity: 0.65,
    rimColor: "#D4AF37",
    rimIntensity: 1.32,
  },
};

const resolveThemePalette = (
  props: OrbitingSmoothPills4KProps,
): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  const hasCustomBg =
    props.backgroundColor !== defaultOrbitingSmoothPills4KProps.backgroundColor;
  const hasCustomPrimary =
    props.primaryColor !== defaultOrbitingSmoothPills4KProps.primaryColor;
  const hasCustomSecondary =
    props.secondaryColor !== defaultOrbitingSmoothPills4KProps.secondaryColor;
  const hasCustomAccent =
    props.accentColor !== defaultOrbitingSmoothPills4KProps.accentColor;

  return {
    ...base,
    bgTop: hasCustomBg ? props.backgroundColor : base.bgTop,
    fogColor: hasCustomBg ? props.backgroundColor : base.fogColor,
    primary: hasCustomPrimary ? props.primaryColor : base.primary,
    secondary: hasCustomSecondary ? props.secondaryColor : base.secondary,
    accent: hasCustomAccent ? props.accentColor : base.accent,
  };
};

type PillSilhouette = "standard" | "compact" | "slender";
type MaterialTone = "primary" | "secondary" | "accent" | "neutral";

interface PillSpec {
  id: string;
  silhouette: PillSilhouette;
  tone: MaterialTone;
  basePosition: [number, number, number];
  baseRotation: [number, number, number];
  scale: number;
  orbitRadius: [number, number, number];
  rotationAmplitude: [number, number, number];
  fullTurns: [number, number, number];
  phase: number;
}

// 14 smooth pills orbiting outer perimeter, keeping center [-3.7..3.7, -1.9..1.9] clear
const PERIMETER_PILL_SPECS: readonly PillSpec[] = [
  // Top-left perimeter (3 pills)
  {
    id: "pill-tl-1",
    silhouette: "standard",
    tone: "secondary",
    basePosition: [-6.1, 2.95, -0.5],
    baseRotation: [0.45, 0.3, -0.62],
    scale: 1.12,
    orbitRadius: [0.36, 0.28, 0.2],
    rotationAmplitude: [0.22, 0.18, 0.2],
    fullTurns: [0, 1, 0],
    phase: 0.2,
  },
  {
    id: "pill-tl-2",
    silhouette: "compact",
    tone: "neutral",
    basePosition: [-4.65, 3.35, -1.9],
    baseRotation: [-0.3, 0.65, 0.42],
    scale: 1.05,
    orbitRadius: [0.28, 0.34, 0.18],
    rotationAmplitude: [0.18, 0.24, 0.16],
    fullTurns: [1, 0, 0],
    phase: 1.15,
  },
  {
    id: "pill-tl-3",
    silhouette: "slender",
    tone: "primary",
    basePosition: [-6.8, 1.15, -2.5],
    baseRotation: [0.25, -0.45, 0.85],
    scale: 1.16,
    orbitRadius: [0.24, 0.4, 0.22],
    rotationAmplitude: [0.2, 0.22, 0.18],
    fullTurns: [0, 0, -1],
    phase: 2.1,
  },

  // Left & bottom-left perimeter (4 pills)
  {
    id: "pill-bl-1",
    silhouette: "standard",
    tone: "accent",
    basePosition: [-6.45, -1.45, 0.45],
    baseRotation: [0.55, 0.4, 0.52],
    scale: 1.08,
    orbitRadius: [0.3, 0.38, 0.2],
    rotationAmplitude: [0.2, 0.24, 0.18],
    fullTurns: [0, -1, 0],
    phase: 2.95,
  },
  {
    id: "pill-bl-2",
    silhouette: "compact",
    tone: "primary",
    basePosition: [-5.55, -3.1, -0.8],
    baseRotation: [-0.42, 0.55, -0.48],
    scale: 1.18,
    orbitRadius: [0.38, 0.26, 0.22],
    rotationAmplitude: [0.22, 0.18, 0.2],
    fullTurns: [0, 1, 0],
    phase: 0.75,
  },
  {
    id: "pill-bl-3",
    silhouette: "slender",
    tone: "neutral",
    basePosition: [-3.95, -3.45, -2.9],
    baseRotation: [0.18, 0.72, 1.12],
    scale: 1.02,
    orbitRadius: [0.42, 0.22, 0.18],
    rotationAmplitude: [0.18, 0.2, 0.16],
    fullTurns: [1, 0, 0],
    phase: 3.8,
  },
  {
    id: "pill-top-center",
    silhouette: "slender",
    tone: "accent",
    basePosition: [-0.85, 3.55, -3.2],
    baseRotation: [0.28, 0.35, 1.38],
    scale: 0.98,
    orbitRadius: [0.48, 0.18, 0.16],
    rotationAmplitude: [0.14, 0.18, 0.14],
    fullTurns: [0, 0, 0],
    phase: 4.5,
  },

  // Bottom center-right & top-right perimeter (4 pills)
  {
    id: "pill-bottom-center",
    silhouette: "compact",
    tone: "secondary",
    basePosition: [1.45, -3.5, -2.75],
    baseRotation: [-0.35, 0.42, 1.24],
    scale: 0.96,
    orbitRadius: [0.44, 0.2, 0.16],
    rotationAmplitude: [0.16, 0.2, 0.15],
    fullTurns: [0, 1, 0],
    phase: 5.25,
  },
  {
    id: "pill-tr-1",
    silhouette: "standard",
    tone: "primary",
    basePosition: [5.45, 3.1, -0.7],
    baseRotation: [0.48, -0.52, 0.65],
    scale: 1.14,
    orbitRadius: [0.34, 0.3, 0.2],
    rotationAmplitude: [0.2, 0.22, 0.18],
    fullTurns: [0, -1, 0],
    phase: 0.55,
  },
  {
    id: "pill-tr-2",
    silhouette: "compact",
    tone: "accent",
    basePosition: [6.65, 2.05, 0.55],
    baseRotation: [-0.38, -0.45, -0.54],
    scale: 0.96,
    orbitRadius: [0.26, 0.36, 0.2],
    rotationAmplitude: [0.24, 0.2, 0.18],
    fullTurns: [1, 0, 0],
    phase: 1.7,
  },
  {
    id: "pill-tr-3",
    silhouette: "slender",
    tone: "neutral",
    basePosition: [4.25, 3.5, -3.5],
    baseRotation: [0.22, -0.68, -1.05],
    scale: 1.04,
    orbitRadius: [0.38, 0.24, 0.18],
    rotationAmplitude: [0.18, 0.2, 0.16],
    fullTurns: [0, 0, 1],
    phase: 3.15,
  },

  // Right & bottom-right perimeter (3 pills)
  {
    id: "pill-right-1",
    silhouette: "slender",
    tone: "secondary",
    basePosition: [6.75, -0.2, -1.35],
    baseRotation: [0.32, -0.55, 0.42],
    scale: 1.15,
    orbitRadius: [0.26, 0.42, 0.22],
    rotationAmplitude: [0.2, 0.22, 0.18],
    fullTurns: [0, 1, 0],
    phase: 2.55,
  },
  {
    id: "pill-br-1",
    silhouette: "standard",
    tone: "neutral",
    basePosition: [6.15, -2.55, 0.4],
    baseRotation: [-0.46, -0.38, -0.68],
    scale: 1.1,
    orbitRadius: [0.34, 0.3, 0.2],
    rotationAmplitude: [0.22, 0.2, 0.18],
    fullTurns: [0, -1, 0],
    phase: 4.1,
  },
  {
    id: "pill-br-2",
    silhouette: "compact",
    tone: "primary",
    basePosition: [4.75, -3.2, -1.85],
    baseRotation: [0.36, 0.58, 0.35],
    scale: 1.06,
    orbitRadius: [0.36, 0.28, 0.18],
    rotationAmplitude: [0.18, 0.22, 0.16],
    fullTurns: [-1, 0, 0],
    phase: 5.75,
  },
];

const CANVAS_GL = { antialias: true, alpha: true } as const;
const CAMERA_CONFIG = {
  position: [0, 0, 12] as [number, number, number],
  fov: 40,
  near: 0.1,
  far: 100,
};

interface PillGeometries {
  standard: CapsuleGeometry;
  standardCollar: TorusGeometry;
  compact: CapsuleGeometry;
  compactCollar: TorusGeometry;
  slender: CapsuleGeometry;
  slenderCollar: TorusGeometry;
}

interface OrbitingPillMeshProps {
  spec: PillSpec;
  loopAngle: number;
  orbitAmplitude: number;
  aspectXScale: number;
  geometries: PillGeometries;
  bodyMaterial: MeshStandardMaterial;
  trimMaterial: MeshStandardMaterial;
}

const OrbitingPillMesh: React.FC<OrbitingPillMeshProps> = ({
  spec,
  loopAngle,
  orbitAmplitude,
  aspectXScale,
  geometries,
  bodyMaterial,
  trimMaterial,
}) => {
  const phaseAngle = loopAngle + spec.phase;
  const posX =
    spec.basePosition[0] * aspectXScale +
    Math.cos(phaseAngle) * spec.orbitRadius[0] * orbitAmplitude;
  const posY =
    spec.basePosition[1] +
    Math.sin(phaseAngle) * spec.orbitRadius[1] * orbitAmplitude;
  const posZ =
    spec.basePosition[2] +
    Math.sin(phaseAngle + 0.75) * spec.orbitRadius[2] * orbitAmplitude;

  const rotX =
    spec.baseRotation[0] +
    loopAngle * spec.fullTurns[0] +
    Math.sin(phaseAngle) * spec.rotationAmplitude[0];
  const rotY =
    spec.baseRotation[1] +
    loopAngle * spec.fullTurns[1] +
    Math.cos(phaseAngle) * spec.rotationAmplitude[1];
  const rotZ =
    spec.baseRotation[2] +
    loopAngle * spec.fullTurns[2] +
    Math.sin(phaseAngle * 2) * spec.rotationAmplitude[2];

  const breathing = 1 + Math.sin(phaseAngle) * 0.035;
  const finalScale = spec.scale * breathing;

  const capsuleGeo =
    spec.silhouette === "standard"
      ? geometries.standard
      : spec.silhouette === "compact"
        ? geometries.compact
        : geometries.slender;

  const collarGeo =
    spec.silhouette === "standard"
      ? geometries.standardCollar
      : spec.silhouette === "compact"
        ? geometries.compactCollar
        : geometries.slenderCollar;

  return (
    <group
      position={[posX, posY, posZ]}
      rotation={[rotX, rotY, rotZ]}
      scale={[finalScale, finalScale, finalScale]}
    >
      <mesh
        geometry={capsuleGeo}
        material={bodyMaterial}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={collarGeo}
        material={trimMaterial}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </group>
  );
};

interface PillsSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  orbitAmplitude: number;
  speedMultiplier: number;
  aspectRatio: AspectRatio;
}

const PillsScene: React.FC<PillsSceneProps> = ({
  frame,
  durationInFrames,
  palette,
  orbitAmplitude,
  speedMultiplier,
  aspectRatio,
}) => {
  const progress = (frame % durationInFrames) / durationInFrames;
  const loopAngle = progress * Math.PI * 2 * speedMultiplier;

  const geometries = useMemo<PillGeometries>(
    () => ({
      standard: new CapsuleGeometry(0.32, 0.98, 24, 48),
      standardCollar: new TorusGeometry(0.33, 0.022, 16, 48),
      compact: new CapsuleGeometry(0.38, 0.64, 24, 48),
      compactCollar: new TorusGeometry(0.39, 0.024, 16, 48),
      slender: new CapsuleGeometry(0.24, 1.32, 24, 48),
      slenderCollar: new TorusGeometry(0.25, 0.018, 16, 48),
    }),
    [],
  );

  const materials = useMemo(
    () => ({
      primary: new MeshStandardMaterial({
        color: palette.primary,
        roughness: 0.34,
        metalness: 0.14,
      }),
      secondary: new MeshStandardMaterial({
        color: palette.secondary,
        roughness: 0.34,
        metalness: 0.14,
      }),
      accent: new MeshStandardMaterial({
        color: palette.accent,
        roughness: 0.34,
        metalness: 0.14,
      }),
      neutral: new MeshStandardMaterial({
        color: palette.neutral,
        roughness: 0.36,
        metalness: 0.1,
      }),
      trim: new MeshStandardMaterial({
        color: palette.trim,
        roughness: 0.26,
        metalness: 0.32,
      }),
    }),
    [
      palette.primary,
      palette.secondary,
      palette.accent,
      palette.neutral,
      palette.trim,
    ],
  );

  useEffect(() => {
    return () => {
      geometries.standard.dispose();
      geometries.standardCollar.dispose();
      geometries.compact.dispose();
      geometries.compactCollar.dispose();
      geometries.slender.dispose();
      geometries.slenderCollar.dispose();
    };
  }, [geometries]);

  useEffect(() => {
    return () => {
      materials.primary.dispose();
      materials.secondary.dispose();
      materials.accent.dispose();
      materials.neutral.dispose();
      materials.trim.dispose();
    };
  }, [materials]);

  const aspectXScale = aspectRatio === "9:16" ? 0.44 : 1;
  const rigRotX = Math.sin(loopAngle) * 0.014;
  const rigRotY = Math.cos(loopAngle) * 0.02;

  return (
    <>
      <fog attach="fog" args={[palette.fogColor, 11, 24]} />

      {/* Soft three-point studio lighting for smooth satin capsule speculars */}
      <ambientLight intensity={palette.ambientIntensity} color="#FFFFFF" />
      <hemisphereLight
        args={[palette.hemiSky, palette.hemiGround, palette.hemiIntensity]}
      />
      <directionalLight
        position={[9, 11, 10]}
        intensity={palette.keyIntensity}
        color={palette.keyColor}
      />
      <directionalLight
        position={[-10, -4, 8]}
        intensity={palette.fillIntensity}
        color={palette.fillColor}
      />
      <directionalLight
        position={[0, 8, -10]}
        intensity={palette.rimIntensity}
        color={palette.rimColor}
      />

      <group rotation={[rigRotX, rigRotY, 0]}>
        {PERIMETER_PILL_SPECS.map((spec) => (
          <OrbitingPillMesh
            key={spec.id}
            spec={spec}
            loopAngle={loopAngle}
            orbitAmplitude={orbitAmplitude}
            aspectXScale={aspectXScale}
            geometries={geometries}
            bodyMaterial={materials[spec.tone]}
            trimMaterial={materials.trim}
          />
        ))}
      </group>
    </>
  );
};

export const OrbitingSmoothPills4K: React.FC<OrbitingSmoothPills4KProps> = (
  props,
) => {
  const {
    themePreset = "clean-corporate",
    aspectRatio = "16:9",
    backgroundColor = "#F8FAFC",
    primaryColor = "#1E293B",
    secondaryColor = "#3B82F6",
    accentColor = "#0EA5E9",
    orbitAmplitude = 1,
    speedMultiplier = 1,
  } = props;

  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const palette = useMemo(
    () =>
      resolveThemePalette({
        themePreset,
        aspectRatio,
        backgroundColor,
        primaryColor,
        secondaryColor,
        accentColor,
        orbitAmplitude,
        speedMultiplier,
      }),
    [
      themePreset,
      aspectRatio,
      backgroundColor,
      primaryColor,
      secondaryColor,
      accentColor,
      orbitAmplitude,
      speedMultiplier,
    ],
  );

  return (
    <AbsoluteFill style={{ backgroundColor: palette.bgTop, overflow: "hidden" }}>
      {/* Soft gradient backdrop + anti-banding grain */}
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
            id="pills-bg-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={palette.bgTop} />
            <stop offset="100%" stopColor={palette.bgBottom} />
          </linearGradient>
          <radialGradient id="pills-bg-glow" cx="50%" cy="50%" r="58%">
            <stop
              offset="0%"
              stopColor={palette.bgGlow}
              stopOpacity={palette.bgGlowOpacity}
            />
            <stop offset="100%" stopColor={palette.bgBottom} stopOpacity="0" />
          </radialGradient>
          <filter id="pills-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed="29"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width={width} height={height} fill="url(#pills-bg-grad)" />
        <rect width={width} height={height} fill="url(#pills-bg-glow)" />
        <rect
          width={width}
          height={height}
          filter="url(#pills-grain)"
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
        <PillsScene
          frame={frame}
          durationInFrames={durationInFrames}
          palette={palette}
          orbitAmplitude={orbitAmplitude}
          speedMultiplier={speedMultiplier}
          aspectRatio={aspectRatio}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

