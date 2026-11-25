import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { MeshStandardMaterial, setConsoleFunction } from "three";
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

export const harmonicSineWaveBars4KSchema = z.object({
  themePreset: themePresetSchema.default("dark-tech"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#050B1A"),
  primaryColor: z.string().default("#162033"),
  secondaryColor: z.string().default("#38BDF8"),
  accentColor: z.string().default("#22D3EE"),
  waveAmplitude: z.number().min(0.2).max(2).default(1),
  speedMultiplier: z.number().int().positive().default(1),
  strokeWidth: z.number().min(0.5).max(3).default(1),
});

export type HarmonicSineWaveBars4KProps = z.infer<
  typeof harmonicSineWaveBars4KSchema
>;

export const defaultHarmonicSineWaveBars4KProps: HarmonicSineWaveBars4KProps =
  {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "#050B1A",
    primaryColor: "#162033",
    secondaryColor: "#38BDF8",
    accentColor: "#22D3EE",
    waveAmplitude: 1,
    speedMultiplier: 1,
    strokeWidth: 1,
  };

export const harmonicSineWaveBars4KVariations: Record<
  ThemePreset,
  HarmonicSineWaveBars4KProps
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "#F1F5F9",
    primaryColor: "#E2E8F0",
    secondaryColor: "#3B82F6",
    accentColor: "#1D4ED8",
    waveAmplitude: 1,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "dark-tech": defaultHarmonicSineWaveBars4KProps,
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "#FAF6F0",
    primaryColor: "#EFE5D7",
    secondaryColor: "#E07A5F",
    accentColor: "#D4A373",
    waveAmplitude: 1,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "#0B0B0E",
    primaryColor: "#1D1D24",
    secondaryColor: "#D4AF37",
    accentColor: "#FDE68A",
    waveAmplitude: 1,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
};

interface ThemePalette {
  bgTop: string;
  bgBottom: string;
  bgGlow: string;
  bgGlowOpacity: number;
  fogColor: string;
  barFront: string;
  barBack: string;
  collarAccent: string;
  ambientIntensity: number;
  keyColor: string;
}

const THEME_PALETTES: Record<ThemePreset, ThemePalette> = {
  "clean-corporate": {
    bgTop: "#F8FAFC",
    bgBottom: "#E2E8F0",
    bgGlow: "#3B82F6",
    bgGlowOpacity: 0.1,
    fogColor: "#EAF0F7",
    barFront: "#F8FAFC",
    barBack: "#CBD5E1",
    collarAccent: "#2563EB",
    ambientIntensity: 0.9,
    keyColor: "#FFFFFF",
  },
  "dark-tech": {
    bgTop: "#071026",
    bgBottom: "#030714",
    bgGlow: "#38BDF8",
    bgGlowOpacity: 0.16,
    fogColor: "#050B1C",
    barFront: "#1B2842",
    barBack: "#111A2E",
    collarAccent: "#22D3EE",
    ambientIntensity: 0.65,
    keyColor: "#E0F2FE",
  },
  "warm-minimalist": {
    bgTop: "#FDFBF7",
    bgBottom: "#EFE4D6",
    bgGlow: "#E07A5F",
    bgGlowOpacity: 0.1,
    fogColor: "#F5EEE3",
    barFront: "#FAF6EF",
    barBack: "#DFD0BC",
    collarAccent: "#E07A5F",
    ambientIntensity: 0.92,
    keyColor: "#FFF7EB",
  },
  "monochrome-luxury": {
    bgTop: "#121216",
    bgBottom: "#060608",
    bgGlow: "#D4AF37",
    bgGlowOpacity: 0.14,
    fogColor: "#09090C",
    barFront: "#222229",
    barBack: "#16161B",
    collarAccent: "#D4AF37",
    ambientIntensity: 0.55,
    keyColor: "#FFF6DB",
  },
};

const resolveThemePalette = (
  props: HarmonicSineWaveBars4KProps,
): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  const hasCustomBg =
    props.backgroundColor !==
    defaultHarmonicSineWaveBars4KProps.backgroundColor;
  const hasCustomPrimary =
    props.primaryColor !== defaultHarmonicSineWaveBars4KProps.primaryColor;
  const hasCustomSecondary =
    props.secondaryColor !==
    defaultHarmonicSineWaveBars4KProps.secondaryColor;
  const hasCustomAccent =
    props.accentColor !== defaultHarmonicSineWaveBars4KProps.accentColor;

  return {
    ...base,
    bgTop: hasCustomBg ? props.backgroundColor : base.bgTop,
    fogColor: hasCustomBg ? props.backgroundColor : base.fogColor,
    barFront: hasCustomPrimary ? props.primaryColor : base.barFront,
    barBack: hasCustomSecondary ? props.secondaryColor : base.barBack,
    collarAccent: hasCustomAccent ? props.accentColor : base.collarAccent,
  };
};

const BARS_PER_ROW = 20;
const BAR_SPACING = 0.68;
const CANVAS_GL = { antialias: true, alpha: true } as const;

interface WaveBarSpec {
  id: string;
  index: number;
  row: 0 | 1;
  x: number;
  z: number;
  baseY: number;
}

const buildWaveBars = (): WaveBarSpec[] => {
  const bars: WaveBarSpec[] = [];
  const half = (BARS_PER_ROW - 1) / 2;

  for (let row = 0; row < 2; row += 1) {
    const r = row as 0 | 1;
    const z = r === 0 ? 0.45 : -1.35;
    const baseY = r === 0 ? -0.35 : 0.25;
    const xShift = r === 0 ? 0 : BAR_SPACING * 0.5;

    for (let i = 0; i < BARS_PER_ROW; i += 1) {
      bars.push({
        id: `bar-${r}-${i}`,
        index: i + r * 0.5,
        row: r,
        x: (i - half) * BAR_SPACING + xShift,
        z,
        baseY,
      });
    }
  }
  return bars;
};

const BarsCameraRig: React.FC<{ aspectRatio: AspectRatio }> = ({
  aspectRatio,
}) => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    if (aspectRatio === "9:16") {
      camera.position.set(0, 0.5, 15.2);
    } else {
      camera.position.set(0, 0.4, 12.2);
    }
    camera.lookAt(0, 0, -0.4);
    camera.updateProjectionMatrix();
  }, [camera, aspectRatio]);

  return null;
};

interface BarsSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  waveAmplitude: number;
  speedMultiplier: number;
  strokeWidth: number;
  aspectRatio: AspectRatio;
}

const BarsScene: React.FC<BarsSceneProps> = ({
  frame,
  durationInFrames,
  palette,
  waveAmplitude,
  speedMultiplier,
  strokeWidth,
  aspectRatio,
}) => {
  const progress = (frame % durationInFrames) / durationInFrames;
  const loopAngle = progress * Math.PI * 2 * speedMultiplier;

  const bars = useMemo(() => buildWaveBars(), []);

  const geometries = useMemo(
    () => ({
      bar: new RoundedBoxGeometry(
        0.28 * strokeWidth,
        3.1,
        0.28 * strokeWidth,
        3,
        0.06,
      ),
      collar: new RoundedBoxGeometry(
        0.31 * strokeWidth,
        0.14 * strokeWidth,
        0.31 * strokeWidth,
        2,
        0.03,
      ),
    }),
    [strokeWidth],
  );

  const materials = useMemo(
    () => ({
      front: new MeshStandardMaterial({
        color: palette.barFront,
        roughness: 0.24,
        metalness: 0.65,
      }),
      back: new MeshStandardMaterial({
        color: palette.barBack,
        roughness: 0.34,
        metalness: 0.5,
      }),
      collar: new MeshStandardMaterial({
        color: palette.collarAccent,
        emissive: palette.collarAccent,
        emissiveIntensity: 1.25,
        roughness: 0.2,
        metalness: 0.35,
      }),
    }),
    [palette],
  );

  useEffect(() => {
    return () => {
      geometries.bar.dispose();
      geometries.collar.dispose();
    };
  }, [geometries]);

  useEffect(() => {
    return () => {
      materials.front.dispose();
      materials.back.dispose();
      materials.collar.dispose();
    };
  }, [materials]);

  const xScale = aspectRatio === "9:16" ? 0.56 : 1;

  return (
    <>
      <fog attach="fog" args={[palette.fogColor, 11.5, 22]} />
      <BarsCameraRig aspectRatio={aspectRatio} />

      <ambientLight intensity={palette.ambientIntensity} color="#FFFFFF" />
      <hemisphereLight args={[palette.collarAccent, palette.bgBottom, 0.5]} />
      <directionalLight
        position={[9, 11, 10]}
        intensity={1.35}
        color={palette.keyColor}
      />
      <directionalLight
        position={[-9, -5, 8]}
        intensity={0.85}
        color={palette.collarAccent}
      />

      <group rotation={[0.04, 0.18, 0]}>
        {bars.map((bar) => {
          const phaseOffset = bar.row * 1.45;
          const harmonic =
            Math.sin(loopAngle + bar.index * 0.36 + phaseOffset) * 0.65 +
            Math.cos(loopAngle * 2 - bar.index * 0.5 + phaseOffset) * 0.35;

          const posY = bar.baseY + harmonic * 0.72 * waveAmplitude;
          const scaleY = 0.72 + (harmonic + 1) * 0.24 * waveAmplitude;
          const rotZ =
            Math.cos(loopAngle + bar.index * 0.36 + phaseOffset) *
            0.055 *
            waveAmplitude;

          return (
            <group
              key={bar.id}
              position={[bar.x * xScale, posY, bar.z]}
              rotation={[0, 0, rotZ]}
            >
              <mesh
                geometry={geometries.bar}
                material={bar.row === 0 ? materials.front : materials.back}
                scale={[1, scaleY, 1]}
              />
              <mesh
                geometry={geometries.collar}
                material={materials.collar}
                position={[0, 1.55 * scaleY - 0.16, 0]}
              />
            </group>
          );
        })}
      </group>
    </>
  );
};

export const HarmonicSineWaveBars4K: React.FC<HarmonicSineWaveBars4KProps> = (
  props,
) => {
  const {
    themePreset = "dark-tech",
    aspectRatio = "16:9",
    backgroundColor = "#050B1A",
    primaryColor = "#162033",
    secondaryColor = "#38BDF8",
    accentColor = "#22D3EE",
    waveAmplitude = 1,
    speedMultiplier = 1,
    strokeWidth = 1,
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
        waveAmplitude,
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
      waveAmplitude,
      speedMultiplier,
      strokeWidth,
    ],
  );

  const cameraConfig = useMemo(
    () => ({
      position: (aspectRatio === "9:16" ? [0, 0.5, 15.2] : [0, 0.4, 12.2]) as [
        number,
        number,
        number,
      ],
      fov: 38,
      near: 0.1,
      far: 100,
    }),
    [aspectRatio],
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
          <linearGradient id="bars-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.bgTop} />
            <stop offset="100%" stopColor={palette.bgBottom} />
          </linearGradient>
          <radialGradient id="bars-bg-glow" cx="50%" cy="50%" r="58%">
            <stop
              offset="0%"
              stopColor={palette.bgGlow}
              stopOpacity={palette.bgGlowOpacity}
            />
            <stop offset="100%" stopColor={palette.bgBottom} stopOpacity="0" />
          </radialGradient>
          <filter id="bars-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed="70"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <pattern
            id="bars-grain-pattern"
            width="256"
            height="256"
            patternUnits="userSpaceOnUse"
          >
            <rect
              width="256"
              height="256"
              filter="url(#bars-grain)"
              opacity="0.012"
            />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#bars-bg-grad)" />
        <rect width={width} height={height} fill="url(#bars-bg-glow)" />
        <rect width={width} height={height} fill="url(#bars-grain-pattern)" />
      </svg>

      <ThreeCanvas
        width={width}
        height={height}
        dpr={1}
        camera={cameraConfig}
        gl={CANVAS_GL}
        style={{ position: "absolute", inset: 0 }}
      >
        <BarsScene
          frame={frame}
          durationInFrames={durationInFrames}
          palette={palette}
          waveAmplitude={waveAmplitude}
          speedMultiplier={speedMultiplier}
          strokeWidth={strokeWidth}
          aspectRatio={aspectRatio}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
