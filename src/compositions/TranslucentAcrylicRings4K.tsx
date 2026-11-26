import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  MeshPhysicalMaterial,
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

export const translucentAcrylicRings4KSchema = z.object({
  themePreset: themePresetSchema.default("clean-corporate"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#F8FAFC"),
  primaryColor: z.string().default("#E0F2FE"),
  secondaryColor: z.string().default("#3B82F6"),
  accentColor: z.string().default("#38BDF8"),
  speedMultiplier: z.number().int().positive().default(1),
  strokeWidth: z.number().min(0.4).max(2.5).default(1),
});

export type TranslucentAcrylicRings4KProps = z.infer<
  typeof translucentAcrylicRings4KSchema
>;

export const defaultTranslucentAcrylicRings4KProps: TranslucentAcrylicRings4KProps =
  {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "#F8FAFC",
    primaryColor: "#E0F2FE",
    secondaryColor: "#3B82F6",
    accentColor: "#38BDF8",
    speedMultiplier: 1,
    strokeWidth: 1,
  };

export const translucentAcrylicRings4KVariations: Record<
  ThemePreset,
  TranslucentAcrylicRings4KProps
> = {
  "clean-corporate": defaultTranslucentAcrylicRings4KProps,
  "dark-tech": {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "#060B18",
    primaryColor: "#BAE6FD",
    secondaryColor: "#06B6D4",
    accentColor: "#6366F1",
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "#FAF7F2",
    primaryColor: "#FFF3E2",
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
  acrylicMain: string;
  acrylicTint: string;
  acrylicAccent: string;
  fogColor: string;
  shadowColor: string;
}

const THEME_PALETTES: Record<ThemePreset, ThemePalette> = {
  "clean-corporate": {
    bgTop: "#FFFFFF",
    bgBottom: "#E6EEF9",
    acrylicMain: "#F8FAFC",
    acrylicTint: "#BAE6FD",
    acrylicAccent: "#93C5FD",
    fogColor: "#F1F5FB",
    shadowColor: "#60A5FA",
  },
  "dark-tech": {
    bgTop: "#091124",
    bgBottom: "#040814",
    acrylicMain: "#BAE6FD",
    acrylicTint: "#38BDF8",
    acrylicAccent: "#818CF8",
    fogColor: "#060B1A",
    shadowColor: "#06B6D4",
  },
  "warm-minimalist": {
    bgTop: "#FDFBF7",
    bgBottom: "#EFE3D3",
    acrylicMain: "#FFF8EF",
    acrylicTint: "#F5C2B0",
    acrylicAccent: "#F2CC8F",
    fogColor: "#F5EEE3",
    shadowColor: "#E07A5F",
  },
  "monochrome-luxury": {
    bgTop: "#141418",
    bgBottom: "#08080A",
    acrylicMain: "#E4E4E7",
    acrylicTint: "#D4AF37",
    acrylicAccent: "#F3D37A",
    fogColor: "#0D0D10",
    shadowColor: "#D4AF37",
  },
};

const resolvePalette = (
  props: TranslucentAcrylicRings4KProps,
): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  return {
    ...base,
    bgTop:
      props.backgroundColor !==
      defaultTranslucentAcrylicRings4KProps.backgroundColor
        ? props.backgroundColor
        : base.bgTop,
    acrylicMain:
      props.primaryColor !== defaultTranslucentAcrylicRings4KProps.primaryColor
        ? props.primaryColor
        : base.acrylicMain,
    acrylicTint:
      props.secondaryColor !==
      defaultTranslucentAcrylicRings4KProps.secondaryColor
        ? props.secondaryColor
        : base.acrylicTint,
    acrylicAccent:
      props.accentColor !== defaultTranslucentAcrylicRings4KProps.accentColor
        ? props.accentColor
        : base.acrylicAccent,
  };
};

type AcrylicTone = "main" | "tint" | "accent";

interface AcrylicRingSpec {
  id: string;
  basePos: [number, number, number];
  baseRot: [number, number, number];
  fullTurns: [number, number, number];
  scale: number;
  phase: number;
  tone: AcrylicTone;
}

// 10 interlocking frosted acrylic rings arranged around outer frame leaving center open
const ACRYLIC_RING_SPECS: readonly AcrylicRingSpec[] = [
  // Left interlocking pair
  {
    id: "ring-l1",
    basePos: [-5.75, 1.9, -0.4],
    baseRot: [0.4, 0.5, 0.2],
    fullTurns: [0, 1, 0],
    scale: 1.15,
    phase: 0.0,
    tone: "main",
  },
  {
    id: "ring-l2",
    basePos: [-4.85, 2.55, -0.8],
    baseRot: [-0.6, 0.2, 0.7],
    fullTurns: [1, 0, 0],
    scale: 0.92,
    phase: 0.9,
    tone: "tint",
  },
  // Bottom-left interlocking pair
  {
    id: "ring-bl1",
    basePos: [-5.35, -2.35, -0.6],
    baseRot: [0.7, -0.3, 0.4],
    fullTurns: [0, -1, 0],
    scale: 1.08,
    phase: 1.8,
    tone: "accent",
  },
  {
    id: "ring-bl2",
    basePos: [-4.35, -2.95, -1.2],
    baseRot: [-0.25, 0.65, -0.3],
    fullTurns: [0, 0, 1],
    scale: 0.88,
    phase: 2.7,
    tone: "main",
  },
  // Right interlocking triple
  {
    id: "ring-r1",
    basePos: [5.65, 0.45, -0.35],
    baseRot: [0.35, -0.55, 0.15],
    fullTurns: [0, 1, 0],
    scale: 1.24,
    phase: 0.6,
    tone: "tint",
  },
  {
    id: "ring-r2",
    basePos: [4.95, 1.45, -0.9],
    baseRot: [-0.5, 0.35, 0.8],
    fullTurns: [1, 0, 0],
    scale: 0.95,
    phase: 1.5,
    tone: "main",
  },
  {
    id: "ring-r3",
    basePos: [5.45, -2.2, -0.5],
    baseRot: [0.6, 0.4, -0.4],
    fullTurns: [0, -1, 0],
    scale: 1.1,
    phase: 3.1,
    tone: "accent",
  },
  // Depth horizon rings
  {
    id: "ring-top-bg",
    basePos: [-0.9, 3.55, -2.8],
    baseRot: [0.85, 0.2, 0.35],
    fullTurns: [0, 0, -1],
    scale: 0.85,
    phase: 4.1,
    tone: "main",
  },
  {
    id: "ring-bot-bg",
    basePos: [1.3, -3.5, -2.9],
    baseRot: [-0.7, -0.35, 0.5],
    fullTurns: [1, 0, 0],
    scale: 0.82,
    phase: 4.9,
    tone: "tint",
  },
  {
    id: "ring-tr-bg",
    basePos: [4.4, 3.1, -2.4],
    baseRot: [0.3, -0.7, -0.25],
    fullTurns: [0, 1, 0],
    scale: 0.9,
    phase: 5.5,
    tone: "accent",
  },
];

const CANVAS_GL = { antialias: true, alpha: true } as const;
const CAMERA_CONFIG = {
  position: [0, 0, 12] as [number, number, number],
  fov: 40,
  near: 0.1,
  far: 100,
};

interface AcrylicRingsSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  speedMultiplier: number;
  strokeWidth: number;
  aspectRatio: AspectRatio;
}

const AcrylicRingsScene: React.FC<AcrylicRingsSceneProps> = ({
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

  const ringGeometry = useMemo(
    () => new TorusGeometry(1.05, 0.22 * strokeWidth, 32, 96),
    [strokeWidth],
  );

  const materials = useMemo<Record<AcrylicTone, MeshPhysicalMaterial>>(
    () => ({
      main: new MeshPhysicalMaterial({
        color: palette.acrylicMain,
        transmission: 0.84,
        transparent: true,
        opacity: 1,
        roughness: 0.24,
        metalness: 0.04,
        thickness: 1.1,
        ior: 1.49,
        clearcoat: 0.75,
        clearcoatRoughness: 0.12,
      }),
      tint: new MeshPhysicalMaterial({
        color: palette.acrylicTint,
        transmission: 0.8,
        transparent: true,
        opacity: 1,
        roughness: 0.22,
        metalness: 0.06,
        thickness: 1.2,
        ior: 1.49,
        clearcoat: 0.8,
        clearcoatRoughness: 0.12,
      }),
      accent: new MeshPhysicalMaterial({
        color: palette.acrylicAccent,
        transmission: 0.78,
        transparent: true,
        opacity: 1,
        roughness: 0.24,
        metalness: 0.06,
        thickness: 1.2,
        ior: 1.49,
        clearcoat: 0.8,
        clearcoatRoughness: 0.14,
      }),
    }),
    [palette.acrylicMain, palette.acrylicTint, palette.acrylicAccent],
  );

  useEffect(() => {
    return () => {
      ringGeometry.dispose();
    };
  }, [ringGeometry]);

  useEffect(() => {
    return () => {
      materials.main.dispose();
      materials.tint.dispose();
      materials.accent.dispose();
    };
  }, [materials]);

  return (
    <>
      <fog attach="fog" args={[palette.fogColor, 11, 25]} />
      <ambientLight intensity={0.95} color="#FFFFFF" />
      <hemisphereLight args={["#FFFFFF", palette.bgBottom, 0.75]} />
      <directionalLight position={[9, 12, 10]} intensity={1.5} color="#FFFFFF" />
      <directionalLight
        position={[-10, -4, 8]}
        intensity={1.05}
        color={palette.shadowColor}
      />
      <directionalLight
        position={[4, 8, -10]}
        intensity={0.95}
        color={palette.acrylicAccent}
      />

      {ACRYLIC_RING_SPECS.map((spec) => {
        const phase = loopAngle + spec.phase;
        return (
          <mesh
            key={spec.id}
            geometry={ringGeometry}
            material={materials[spec.tone]}
            position={[
              spec.basePos[0] * aspectXScale + Math.cos(phase) * 0.26,
              spec.basePos[1] + Math.sin(phase) * 0.3,
              spec.basePos[2] + Math.sin(phase + 0.6) * 0.18,
            ]}
            rotation={[
              spec.baseRot[0] +
                loopAngle * spec.fullTurns[0] +
                Math.sin(phase) * 0.14,
              spec.baseRot[1] +
                loopAngle * spec.fullTurns[1] +
                Math.cos(phase) * 0.14,
              spec.baseRot[2] +
                loopAngle * spec.fullTurns[2] +
                Math.sin(phase * 2) * 0.08,
            ]}
            scale={[spec.scale, spec.scale, spec.scale]}
          />
        );
      })}
    </>
  );
};

export const TranslucentAcrylicRings4K: React.FC<
  TranslucentAcrylicRings4KProps
> = (props) => {
  const {
    themePreset = "clean-corporate",
    aspectRatio = "16:9",
    backgroundColor = "#F8FAFC",
    primaryColor = "#E0F2FE",
    secondaryColor = "#3B82F6",
    accentColor = "#38BDF8",
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
            id="acrylic-rings-bg-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={palette.bgTop} />
            <stop offset="100%" stopColor={palette.bgBottom} />
          </linearGradient>
          <filter
            id="acrylic-rings-grain"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed="61"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect
          width={width}
          height={height}
          fill="url(#acrylic-rings-bg-grad)"
        />
        <rect
          width={width}
          height={height}
          filter="url(#acrylic-rings-grain)"
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
        <AcrylicRingsScene
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

