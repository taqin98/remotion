import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
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

export const rotatingConcentricTorusRings4KSchema = z.object({
  themePreset: themePresetSchema.default("clean-corporate"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#F8FAFC"),
  primaryColor: z.string().default("#1E293B"),
  secondaryColor: z.string().default("#3B82F6"),
  accentColor: z.string().default("#0EA5E9"),
  horizontalOffset: z.number().min(-4.5).max(4.5).default(2.15),
  speedMultiplier: z.number().int().positive().default(1),
});

export type RotatingConcentricTorusRings4KProps = z.infer<
  typeof rotatingConcentricTorusRings4KSchema
>;

export const defaultRotatingConcentricTorusRings4KProps: RotatingConcentricTorusRings4KProps =
  {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "#F8FAFC",
    primaryColor: "#1E293B",
    secondaryColor: "#3B82F6",
    accentColor: "#0EA5E9",
    horizontalOffset: 2.15,
    speedMultiplier: 1,
  };

export const rotatingConcentricTorusRings4KVariations: Record<
  ThemePreset,
  RotatingConcentricTorusRings4KProps
> = {
  "clean-corporate": defaultRotatingConcentricTorusRings4KProps,
  "dark-tech": {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "#070D1D",
    primaryColor: "#1E293B",
    secondaryColor: "#06B6D4",
    accentColor: "#6366F1",
    horizontalOffset: 2.15,
    speedMultiplier: 1,
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "#FAF7F2",
    primaryColor: "#E07A5F",
    secondaryColor: "#D4A373",
    accentColor: "#F2CC8F",
    horizontalOffset: 2.15,
    speedMultiplier: 1,
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "#0F0F12",
    primaryColor: "#18181B",
    secondaryColor: "#D4AF37",
    accentColor: "#F3D37A",
    horizontalOffset: 2.15,
    speedMultiplier: 1,
  },
};

interface ThemePalette {
  bgTop: string;
  bgBottom: string;
  bgGlow: string;
  bgGlowOpacity: number;
  aoShadowColor: string;
  fogColor: string;
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
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
    bgBottom: "#E9F0F8",
    bgGlow: "#3B82F6",
    bgGlowOpacity: 0.08,
    aoShadowColor: "#94A3B8",
    fogColor: "#F2F6FB",
    primary: "#1E293B",
    secondary: "#3B82F6",
    accent: "#0EA5E9",
    neutral: "#E2E8F0",
    ambientIntensity: 0.85,
    hemiSky: "#FFFFFF",
    hemiGround: "#CBD5E1",
    hemiIntensity: 0.78,
    keyColor: "#FFFDF9",
    keyIntensity: 1.4,
    fillColor: "#DCEAFE",
    fillIntensity: 0.7,
    rimColor: "#FFFFFF",
    rimIntensity: 0.95,
  },
  "dark-tech": {
    bgTop: "#0B1328",
    bgBottom: "#040814",
    bgGlow: "#06B6D4",
    bgGlowOpacity: 0.14,
    aoShadowColor: "#020617",
    fogColor: "#060D1E",
    primary: "#1E293B",
    secondary: "#06B6D4",
    accent: "#6366F1",
    neutral: "#172554",
    ambientIntensity: 0.52,
    hemiSky: "#38BDF8",
    hemiGround: "#020617",
    hemiIntensity: 0.62,
    keyColor: "#E0F2FE",
    keyIntensity: 1.5,
    fillColor: "#6366F1",
    fillIntensity: 0.85,
    rimColor: "#22D3EE",
    rimIntensity: 1.25,
  },
  "warm-minimalist": {
    bgTop: "#FDFBF7",
    bgBottom: "#EEE4D5",
    bgGlow: "#E07A5F",
    bgGlowOpacity: 0.09,
    aoShadowColor: "#C2B29C",
    fogColor: "#F5EEE3",
    primary: "#E07A5F",
    secondary: "#D4A373",
    accent: "#F2CC8F",
    neutral: "#EAE0D0",
    ambientIntensity: 0.9,
    hemiSky: "#FFFDF9",
    hemiGround: "#D6C5B0",
    hemiIntensity: 0.78,
    keyColor: "#FFF7EB",
    keyIntensity: 1.35,
    fillColor: "#F5E1C8",
    fillIntensity: 0.68,
    rimColor: "#FFFFFF",
    rimIntensity: 0.86,
  },
  "monochrome-luxury": {
    bgTop: "#17171B",
    bgBottom: "#09090B",
    bgGlow: "#D4AF37",
    bgGlowOpacity: 0.11,
    aoShadowColor: "#000000",
    fogColor: "#0D0D10",
    primary: "#18181B",
    secondary: "#D4AF37",
    accent: "#F3D37A",
    neutral: "#27272C",
    ambientIntensity: 0.44,
    hemiSky: "#FDE68A",
    hemiGround: "#09090B",
    hemiIntensity: 0.52,
    keyColor: "#FFF6DB",
    keyIntensity: 1.48,
    fillColor: "#52525B",
    fillIntensity: 0.65,
    rimColor: "#D4AF37",
    rimIntensity: 1.3,
  },
};

const resolveThemePalette = (
  props: RotatingConcentricTorusRings4KProps,
): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  const hasCustomBg =
    props.backgroundColor !==
    defaultRotatingConcentricTorusRings4KProps.backgroundColor;
  const hasCustomPrimary =
    props.primaryColor !==
    defaultRotatingConcentricTorusRings4KProps.primaryColor;
  const hasCustomSecondary =
    props.secondaryColor !==
    defaultRotatingConcentricTorusRings4KProps.secondaryColor;
  const hasCustomAccent =
    props.accentColor !==
    defaultRotatingConcentricTorusRings4KProps.accentColor;

  return {
    ...base,
    bgTop: hasCustomBg ? props.backgroundColor : base.bgTop,
    fogColor: hasCustomBg ? props.backgroundColor : base.fogColor,
    primary: hasCustomPrimary ? props.primaryColor : base.primary,
    secondary: hasCustomSecondary ? props.secondaryColor : base.secondary,
    accent: hasCustomAccent ? props.accentColor : base.accent,
  };
};

type RingTone = "primary" | "secondary" | "accent" | "neutral";

interface ConcentricRingSpec {
  id: string;
  radius: number;
  tubeRadius: number;
  tone: RingTone;
  baseRotation: [number, number, number];
  fullTurns: [number, number, number];
  wobbleAmplitude: [number, number, number];
  phase: number;
}

// 6 nested non-intersecting matte torus rings (R_k - r_k > R_{k-1} + r_{k-1})
const CONCENTRIC_RING_SPECS: readonly ConcentricRingSpec[] = [
  {
    id: "ring-1-core",
    radius: 0.72,
    tubeRadius: 0.105,
    tone: "accent",
    baseRotation: [0.35, 0.25, 0.1],
    fullTurns: [0, 1, 0],
    wobbleAmplitude: [0.16, 0.08, 0.14],
    phase: 0.0,
  },
  {
    id: "ring-2",
    radius: 1.08,
    tubeRadius: 0.115,
    tone: "neutral",
    baseRotation: [-0.28, 0.42, -0.18],
    fullTurns: [1, 0, 0],
    wobbleAmplitude: [0.08, 0.18, 0.12],
    phase: 0.9,
  },
  {
    id: "ring-3",
    radius: 1.47,
    tubeRadius: 0.125,
    tone: "secondary",
    baseRotation: [0.48, -0.3, 0.22],
    fullTurns: [0, -1, 0],
    wobbleAmplitude: [0.15, 0.08, 0.14],
    phase: 1.85,
  },
  {
    id: "ring-4",
    radius: 1.89,
    tubeRadius: 0.135,
    tone: "primary",
    baseRotation: [-0.36, -0.48, 0.15],
    fullTurns: [-1, 0, 0],
    wobbleAmplitude: [0.08, 0.16, 0.12],
    phase: 2.75,
  },
  {
    id: "ring-5",
    radius: 2.34,
    tubeRadius: 0.145,
    tone: "neutral",
    baseRotation: [0.22, 0.34, -0.26],
    fullTurns: [0, 0, 1],
    wobbleAmplitude: [0.14, 0.14, 0.06],
    phase: 3.65,
  },
  {
    id: "ring-6-outer",
    radius: 2.83,
    tubeRadius: 0.155,
    tone: "secondary",
    baseRotation: [0.38, -0.26, 0.12],
    fullTurns: [0, 1, 0],
    wobbleAmplitude: [0.12, 0.06, 0.12],
    phase: 4.55,
  },
];

const CANVAS_GL = { antialias: true, alpha: true } as const;
const CAMERA_CONFIG = {
  position: [0, 0, 11.5] as [number, number, number],
  fov: 40,
  near: 0.1,
  far: 100,
};

interface ConcentricRingMeshProps {
  spec: ConcentricRingSpec;
  geometry: TorusGeometry;
  material: MeshStandardMaterial;
  loopAngle: number;
}

const ConcentricRingMesh: React.FC<ConcentricRingMeshProps> = ({
  spec,
  geometry,
  material,
  loopAngle,
}) => {
  const phaseAngle = loopAngle + spec.phase;
  const rotX =
    spec.baseRotation[0] +
    loopAngle * spec.fullTurns[0] +
    Math.sin(phaseAngle) * spec.wobbleAmplitude[0];
  const rotY =
    spec.baseRotation[1] +
    loopAngle * spec.fullTurns[1] +
    Math.cos(phaseAngle) * spec.wobbleAmplitude[1];
  const rotZ =
    spec.baseRotation[2] +
    loopAngle * spec.fullTurns[2] +
    Math.sin(phaseAngle * 2) * spec.wobbleAmplitude[2];

  return (
    <mesh
      geometry={geometry}
      material={material}
      rotation={[rotX, rotY, rotZ]}
      castShadow
      receiveShadow
    />
  );
};

interface TorusRingsSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  horizontalOffset: number;
  speedMultiplier: number;
  aspectRatio: AspectRatio;
}

const TorusRingsScene: React.FC<TorusRingsSceneProps> = ({
  frame,
  durationInFrames,
  palette,
  horizontalOffset,
  speedMultiplier,
  aspectRatio,
}) => {
  const progress = (frame % durationInFrames) / durationInFrames;
  const loopAngle = progress * Math.PI * 2 * speedMultiplier;

  const geometries = useMemo(
    () =>
      CONCENTRIC_RING_SPECS.map(
        (spec) => new TorusGeometry(spec.radius, spec.tubeRadius, 40, 112),
      ),
    [],
  );

  const materials = useMemo<Record<RingTone, MeshStandardMaterial>>(
    () => ({
      primary: new MeshStandardMaterial({
        color: palette.primary,
        roughness: 0.48,
        metalness: 0.05,
      }),
      secondary: new MeshStandardMaterial({
        color: palette.secondary,
        roughness: 0.48,
        metalness: 0.05,
      }),
      accent: new MeshStandardMaterial({
        color: palette.accent,
        roughness: 0.46,
        metalness: 0.06,
      }),
      neutral: new MeshStandardMaterial({
        color: palette.neutral,
        roughness: 0.5,
        metalness: 0.04,
      }),
    }),
    [palette.primary, palette.secondary, palette.accent, palette.neutral],
  );

  useEffect(() => {
    return () => {
      geometries.forEach((geo) => geo.dispose());
    };
  }, [geometries]);

  useEffect(() => {
    return () => {
      materials.primary.dispose();
      materials.secondary.dispose();
      materials.accent.dispose();
      materials.neutral.dispose();
    };
  }, [materials]);

  const effectiveOffsetX = aspectRatio === "9:16" ? 0 : horizontalOffset;
  const assemblyScale = aspectRatio === "9:16" ? 0.68 : 1;
  const levitationY = Math.sin(loopAngle) * 0.12;

  return (
    <>
      <fog attach="fog" args={[palette.fogColor, 11, 24]} />

      {/* Soft studio lighting + hemisphere bounce + soft inter-ring shadows */}
      <ambientLight intensity={palette.ambientIntensity} color="#FFFFFF" />
      <hemisphereLight
        args={[palette.hemiSky, palette.hemiGround, palette.hemiIntensity]}
      />
      <directionalLight
        position={[8, 12, 10]}
        intensity={palette.keyIntensity}
        color={palette.keyColor}
        castShadow
      />
      <directionalLight
        position={[-10, -5, 8]}
        intensity={palette.fillIntensity}
        color={palette.fillColor}
      />
      <directionalLight
        position={[-2, 7, -10]}
        intensity={palette.rimIntensity}
        color={palette.rimColor}
      />

      <group
        position={[effectiveOffsetX, levitationY, 0]}
        scale={[assemblyScale, assemblyScale, assemblyScale]}
      >
        {CONCENTRIC_RING_SPECS.map((spec, index) => (
          <ConcentricRingMesh
            key={spec.id}
            spec={spec}
            geometry={geometries[index]}
            material={materials[spec.tone]}
            loopAngle={loopAngle}
          />
        ))}
      </group>
    </>
  );
};

export const RotatingConcentricTorusRings4K: React.FC<
  RotatingConcentricTorusRings4KProps
> = (props) => {
  const {
    themePreset = "clean-corporate",
    aspectRatio = "16:9",
    backgroundColor = "#F8FAFC",
    primaryColor = "#1E293B",
    secondaryColor = "#3B82F6",
    accentColor = "#0EA5E9",
    horizontalOffset = 2.15,
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
        horizontalOffset,
        speedMultiplier,
      }),
    [
      themePreset,
      aspectRatio,
      backgroundColor,
      primaryColor,
      secondaryColor,
      accentColor,
      horizontalOffset,
      speedMultiplier,
    ],
  );

  // Align subtle ground AO halo beneath the ring assembly
  const glowCenterX = aspectRatio === "9:16" ? 50 : 50 + horizontalOffset * 6.5;

  return (
    <AbsoluteFill style={{ backgroundColor: palette.bgTop, overflow: "hidden" }}>
      {/* Gentle studio gradient backdrop + subtle AO halo + anti-banding grain */}
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
            id="torus-bg-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={palette.bgTop} />
            <stop offset="100%" stopColor={palette.bgBottom} />
          </linearGradient>
          <radialGradient
            id="torus-bg-glow"
            cx={`${glowCenterX}%`}
            cy="48%"
            r="52%"
          >
            <stop
              offset="0%"
              stopColor={palette.bgGlow}
              stopOpacity={palette.bgGlowOpacity}
            />
            <stop offset="100%" stopColor={palette.bgBottom} stopOpacity="0" />
          </radialGradient>
          <radialGradient
            id="torus-ao-shadow"
            cx={`${glowCenterX}%`}
            cy="88%"
            r="28%"
          >
            <stop
              offset="0%"
              stopColor={palette.aoShadowColor}
              stopOpacity="0.16"
            />
            <stop
              offset="100%"
              stopColor={palette.aoShadowColor}
              stopOpacity="0"
            />
          </radialGradient>
          <filter id="torus-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed="31"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width={width} height={height} fill="url(#torus-bg-grad)" />
        <rect width={width} height={height} fill="url(#torus-bg-glow)" />
        <rect width={width} height={height} fill="url(#torus-ao-shadow)" />
        <rect
          width={width}
          height={height}
          filter="url(#torus-grain)"
          opacity="0.012"
        />
      </svg>

      <ThreeCanvas
        width={width}
        height={height}
        shadows="soft"
        dpr={1}
        camera={CAMERA_CONFIG}
        gl={CANVAS_GL}
        style={{ position: "absolute", inset: 0 }}
      >
        <TorusRingsScene
          frame={frame}
          durationInFrames={durationInFrames}
          palette={palette}
          horizontalOffset={horizontalOffset}
          speedMultiplier={speedMultiplier}
          aspectRatio={aspectRatio}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

