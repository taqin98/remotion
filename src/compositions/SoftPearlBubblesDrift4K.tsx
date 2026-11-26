import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  MeshPhysicalMaterial,
  SphereGeometry,
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

export const softPearlBubblesDrift4KSchema = z.object({
  themePreset: themePresetSchema.default("clean-corporate"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#F8FAFC"),
  primaryColor: z.string().default("#F8FAFC"),
  secondaryColor: z.string().default("#DBEAFE"),
  accentColor: z.string().default("#FCE7F3"),
  speedMultiplier: z.number().int().positive().default(1),
  strokeWidth: z.number().min(0.4).max(2.5).default(1),
});

export type SoftPearlBubblesDrift4KProps = z.infer<
  typeof softPearlBubblesDrift4KSchema
>;

export const defaultSoftPearlBubblesDrift4KProps: SoftPearlBubblesDrift4KProps =
  {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "#F8FAFC",
    primaryColor: "#F8FAFC",
    secondaryColor: "#DBEAFE",
    accentColor: "#FCE7F3",
    speedMultiplier: 1,
    strokeWidth: 1,
  };

export const softPearlBubblesDrift4KVariations: Record<
  ThemePreset,
  SoftPearlBubblesDrift4KProps
> = {
  "clean-corporate": defaultSoftPearlBubblesDrift4KProps,
  "dark-tech": {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "#060B18",
    primaryColor: "#E0F2FE",
    secondaryColor: "#38BDF8",
    accentColor: "#818CF8",
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "#FAF7F2",
    primaryColor: "#FFFBF5",
    secondaryColor: "#F5D0C5",
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
  pearlWhite: string;
  pearlTint: string;
  pearlWarm: string;
  fogColor: string;
}

const THEME_PALETTES: Record<ThemePreset, ThemePalette> = {
  "clean-corporate": {
    bgTop: "#FFFFFF",
    bgBottom: "#E7EFF9",
    pearlWhite: "#F8FAFC",
    pearlTint: "#DBEAFE",
    pearlWarm: "#FCE7F3",
    fogColor: "#EFF4FB",
  },
  "dark-tech": {
    bgTop: "#091124",
    bgBottom: "#040814",
    pearlWhite: "#E0F2FE",
    pearlTint: "#38BDF8",
    pearlWarm: "#818CF8",
    fogColor: "#060B1A",
  },
  "warm-minimalist": {
    bgTop: "#FDFBF7",
    bgBottom: "#EFE3D3",
    pearlWhite: "#FFFDF8",
    pearlTint: "#F5D0C5",
    pearlWarm: "#F2CC8F",
    fogColor: "#F5EEE3",
  },
  "monochrome-luxury": {
    bgTop: "#141418",
    bgBottom: "#08080A",
    pearlWhite: "#E4E4E7",
    pearlTint: "#D4AF37",
    pearlWarm: "#F3D37A",
    fogColor: "#0D0D10",
  },
};

const resolvePalette = (props: SoftPearlBubblesDrift4KProps): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  return {
    ...base,
    bgTop:
      props.backgroundColor !==
      defaultSoftPearlBubblesDrift4KProps.backgroundColor
        ? props.backgroundColor
        : base.bgTop,
    pearlWhite:
      props.primaryColor !== defaultSoftPearlBubblesDrift4KProps.primaryColor
        ? props.primaryColor
        : base.pearlWhite,
    pearlTint:
      props.secondaryColor !==
      defaultSoftPearlBubblesDrift4KProps.secondaryColor
        ? props.secondaryColor
        : base.pearlTint,
    pearlWarm:
      props.accentColor !== defaultSoftPearlBubblesDrift4KProps.accentColor
        ? props.accentColor
        : base.pearlWarm,
  };
};

type PearlTone = "white" | "tint" | "warm";

interface PearlBubbleSpec {
  id: string;
  baseX: number;
  startY: number;
  baseZ: number;
  radius: number;
  swayAmp: number;
  speedCycles: number;
  phase: number;
  tone: PearlTone;
}

const SPAN_Y = 11.0;
const HALF_SPAN_Y = SPAN_Y / 2;
const WRAP_EASING = Easing.inOut(Easing.sin);

// 24 deterministic satin pearl bubbles rising across depth layers
const PEARL_BUBBLE_SPECS: readonly PearlBubbleSpec[] = [
  { id: "pb-1", baseX: -6.4, startY: -4.2, baseZ: 0.4, radius: 0.56, swayAmp: 0.25, speedCycles: 1, phase: 0.1, tone: "white" },
  { id: "pb-2", baseX: -5.2, startY: -1.1, baseZ: -0.8, radius: 0.72, swayAmp: 0.3, speedCycles: 1, phase: 0.8, tone: "tint" },
  { id: "pb-3", baseX: -6.9, startY: 2.3, baseZ: -1.6, radius: 0.42, swayAmp: 0.22, speedCycles: 2, phase: 1.5, tone: "warm" },
  { id: "pb-4", baseX: -4.1, startY: 4.1, baseZ: -2.4, radius: 0.85, swayAmp: 0.28, speedCycles: 1, phase: 2.2, tone: "white" },
  { id: "pb-5", baseX: -5.8, startY: -2.9, baseZ: -3.2, radius: 0.38, swayAmp: 0.2, speedCycles: 2, phase: 2.9, tone: "tint" },
  { id: "pb-6", baseX: -3.5, startY: 0.5, baseZ: -3.8, radius: 0.64, swayAmp: 0.26, speedCycles: 1, phase: 3.6, tone: "warm" },
  { id: "pb-7", baseX: -4.7, startY: -5.0, baseZ: 0.8, radius: 0.48, swayAmp: 0.24, speedCycles: 1, phase: 4.3, tone: "white" },
  { id: "pb-8", baseX: -6.1, startY: 1.4, baseZ: -2.1, radius: 0.52, swayAmp: 0.22, speedCycles: 1, phase: 5.0, tone: "tint" },
  { id: "pb-9", baseX: -1.9, startY: -3.6, baseZ: -3.9, radius: 0.45, swayAmp: 0.3, speedCycles: 1, phase: 0.4, tone: "white" },
  { id: "pb-10", baseX: -0.6, startY: 2.8, baseZ: -4.4, radius: 0.58, swayAmp: 0.26, speedCycles: 1, phase: 1.9, tone: "warm" },
  { id: "pb-11", baseX: 0.9, startY: -1.8, baseZ: -4.1, radius: 0.4, swayAmp: 0.28, speedCycles: 2, phase: 3.2, tone: "tint" },
  { id: "pb-12", baseX: 2.2, startY: 3.7, baseZ: -3.6, radius: 0.5, swayAmp: 0.25, speedCycles: 1, phase: 4.7, tone: "white" },
  { id: "pb-13", baseX: 4.3, startY: -4.5, baseZ: -1.5, radius: 0.78, swayAmp: 0.28, speedCycles: 1, phase: 0.7, tone: "tint" },
  { id: "pb-14", baseX: 5.6, startY: -0.8, baseZ: 0.5, radius: 0.62, swayAmp: 0.24, speedCycles: 1, phase: 1.4, tone: "white" },
  { id: "pb-15", baseX: 6.7, startY: 2.9, baseZ: -0.9, radius: 0.46, swayAmp: 0.22, speedCycles: 2, phase: 2.1, tone: "warm" },
  { id: "pb-16", baseX: 4.9, startY: 4.4, baseZ: -2.8, radius: 0.88, swayAmp: 0.3, speedCycles: 1, phase: 2.8, tone: "white" },
  { id: "pb-17", baseX: 6.2, startY: -2.4, baseZ: -2.2, radius: 0.44, swayAmp: 0.22, speedCycles: 2, phase: 3.5, tone: "tint" },
  { id: "pb-18", baseX: 3.8, startY: 0.9, baseZ: -3.5, radius: 0.68, swayAmp: 0.26, speedCycles: 1, phase: 4.2, tone: "warm" },
  { id: "pb-19", baseX: 5.3, startY: -3.8, baseZ: 0.9, radius: 0.5, swayAmp: 0.24, speedCycles: 1, phase: 4.9, tone: "white" },
  { id: "pb-20", baseX: 6.9, startY: 1.2, baseZ: -1.7, radius: 0.54, swayAmp: 0.22, speedCycles: 1, phase: 5.6, tone: "tint" },
  { id: "pb-21", baseX: -2.8, startY: -0.4, baseZ: -4.6, radius: 0.36, swayAmp: 0.2, speedCycles: 2, phase: 1.1, tone: "warm" },
  { id: "pb-22", baseX: 2.9, startY: -2.9, baseZ: -4.2, radius: 0.42, swayAmp: 0.24, speedCycles: 2, phase: 2.6, tone: "white" },
  { id: "pb-23", baseX: -5.9, startY: 4.7, baseZ: -1.1, radius: 0.48, swayAmp: 0.26, speedCycles: 1, phase: 3.9, tone: "tint" },
  { id: "pb-24", baseX: 5.8, startY: 3.3, baseZ: -0.4, radius: 0.58, swayAmp: 0.24, speedCycles: 1, phase: 5.2, tone: "warm" },
];

const CANVAS_GL = { antialias: true, alpha: true } as const;
const CAMERA_CONFIG = {
  position: [0, 0, 12] as [number, number, number],
  fov: 40,
  near: 0.1,
  far: 100,
};

interface PearlBubblesSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  speedMultiplier: number;
  aspectRatio: AspectRatio;
}

const PearlBubblesScene: React.FC<PearlBubblesSceneProps> = ({
  frame,
  durationInFrames,
  palette,
  speedMultiplier,
  aspectRatio,
}) => {
  const progress = (frame % durationInFrames) / durationInFrames;
  const loopAngle = progress * Math.PI * 2 * speedMultiplier;
  const aspectXScale = aspectRatio === "9:16" ? 0.45 : 1;

  const sphereGeometry = useMemo(() => new SphereGeometry(1, 36, 36), []);

  const materials = useMemo<Record<PearlTone, MeshPhysicalMaterial>>(
    () => ({
      white: new MeshPhysicalMaterial({
        color: palette.pearlWhite,
        roughness: 0.26,
        metalness: 0.06,
        clearcoat: 0.92,
        clearcoatRoughness: 0.14,
        iridescence: 0.48,
        iridescenceIOR: 1.32,
        sheen: 0.85,
        sheenRoughness: 0.25,
        sheenColor: "#FFFFFF",
      }),
      tint: new MeshPhysicalMaterial({
        color: palette.pearlTint,
        roughness: 0.28,
        metalness: 0.08,
        clearcoat: 0.9,
        clearcoatRoughness: 0.16,
        iridescence: 0.52,
        iridescenceIOR: 1.34,
        sheen: 0.85,
        sheenRoughness: 0.25,
        sheenColor: "#FFFFFF",
      }),
      warm: new MeshPhysicalMaterial({
        color: palette.pearlWarm,
        roughness: 0.28,
        metalness: 0.08,
        clearcoat: 0.9,
        clearcoatRoughness: 0.16,
        iridescence: 0.45,
        iridescenceIOR: 1.32,
        sheen: 0.85,
        sheenRoughness: 0.25,
        sheenColor: "#FFFFFF",
      }),
    }),
    [palette.pearlWhite, palette.pearlTint, palette.pearlWarm],
  );

  useEffect(() => {
    return () => {
      sphereGeometry.dispose();
    };
  }, [sphereGeometry]);

  useEffect(() => {
    return () => {
      materials.white.dispose();
      materials.tint.dispose();
      materials.warm.dispose();
    };
  }, [materials]);

  return (
    <>
      <fog attach="fog" args={[palette.fogColor, 10, 23]} />
      <ambientLight intensity={0.95} color="#FFFFFF" />
      <hemisphereLight args={["#FFFFFF", palette.bgBottom, 0.78]} />
      <directionalLight position={[9, 12, 10]} intensity={1.45} color="#FFFFFF" />
      <directionalLight
        position={[-10, -4, 8]}
        intensity={0.9}
        color={palette.pearlTint}
      />
      <directionalLight
        position={[4, 8, -10]}
        intensity={0.85}
        color={palette.pearlWarm}
      />

      {PEARL_BUBBLE_SPECS.map((bubble) => {
        const yWrapped =
          ((bubble.startY +
            HALF_SPAN_Y +
            progress * SPAN_Y * bubble.speedCycles * speedMultiplier) %
            SPAN_Y) -
          HALF_SPAN_Y;

        const enterEnv = interpolate(yWrapped, [-HALF_SPAN_Y, -3.9], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: WRAP_EASING,
        });
        const exitEnv = interpolate(yWrapped, [3.9, HALF_SPAN_Y], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: WRAP_EASING,
        });
        const scale = bubble.radius * enterEnv * exitEnv;

        const posX =
          bubble.baseX * aspectXScale +
          Math.sin(loopAngle + bubble.phase) * bubble.swayAmp;
        const posZ =
          bubble.baseZ + Math.cos(loopAngle + bubble.phase) * 0.18;

        return (
          <mesh
            key={bubble.id}
            geometry={sphereGeometry}
            material={materials[bubble.tone]}
            position={[posX, yWrapped, posZ]}
            scale={[scale, scale, scale]}
            visible={scale > 0.001}
          />
        );
      })}
    </>
  );
};

export const SoftPearlBubblesDrift4K: React.FC<
  SoftPearlBubblesDrift4KProps
> = (props) => {
  const {
    themePreset = "clean-corporate",
    aspectRatio = "16:9",
    backgroundColor = "#F8FAFC",
    primaryColor = "#F8FAFC",
    secondaryColor = "#DBEAFE",
    accentColor = "#FCE7F3",
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
            id="pearl-bg-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={palette.bgTop} />
            <stop offset="100%" stopColor={palette.bgBottom} />
          </linearGradient>
          <filter id="pearl-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed="83"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width={width} height={height} fill="url(#pearl-bg-grad)" />
        <rect
          width={width}
          height={height}
          filter="url(#pearl-grain)"
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
        <PearlBubblesScene
          frame={frame}
          durationInFrames={durationInFrames}
          palette={palette}
          speedMultiplier={speedMultiplier}
          aspectRatio={aspectRatio}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

