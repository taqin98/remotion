import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { MeshBasicMaterial, MeshStandardMaterial, setConsoleFunction } from "three";
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

export const isometricDataPillarMatrix4KSchema = z.object({
  themePreset: themePresetSchema.default("dark-tech"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#050B1A"),
  primaryColor: z.string().default("#162033"),
  secondaryColor: z.string().default("#1E293B"),
  accentColor: z.string().default("#22D3EE"),
  waveAmplitude: z.number().min(0.2).max(2).default(0.75),
  speedMultiplier: z.number().int().positive().default(1),
  strokeWidth: z.number().min(0.5).max(3).default(1),
});

export type IsometricDataPillarMatrix4KProps = z.infer<
  typeof isometricDataPillarMatrix4KSchema
>;

export const defaultIsometricDataPillarMatrix4KProps: IsometricDataPillarMatrix4KProps =
  {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "#050B1A",
    primaryColor: "#162033",
    secondaryColor: "#1E293B",
    accentColor: "#22D3EE",
    waveAmplitude: 0.75,
    speedMultiplier: 1,
    strokeWidth: 1,
  };

export const isometricDataPillarMatrix4KVariations: Record<
  ThemePreset,
  IsometricDataPillarMatrix4KProps
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "#F1F5F9",
    primaryColor: "#E2E8F0",
    secondaryColor: "#CBD5E1",
    accentColor: "#2563EB",
    waveAmplitude: 0.75,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "dark-tech": defaultIsometricDataPillarMatrix4KProps,
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "#FAF6F0",
    primaryColor: "#EFE5D7",
    secondaryColor: "#DFD0BC",
    accentColor: "#E07A5F",
    waveAmplitude: 0.75,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "#0B0B0E",
    primaryColor: "#19191F",
    secondaryColor: "#272730",
    accentColor: "#D4AF37",
    waveAmplitude: 0.75,
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
  pillarBody: string;
  pillarSecondary: string;
  capEmissive: string;
  haloColor: string;
  ambientIntensity: number;
  keyColor: string;
  keyIntensity: number;
}

const THEME_PALETTES: Record<ThemePreset, ThemePalette> = {
  "clean-corporate": {
    bgTop: "#F8FAFC",
    bgBottom: "#E2E8F0",
    bgGlow: "#3B82F6",
    bgGlowOpacity: 0.1,
    fogColor: "#EAF0F7",
    pillarBody: "#E2E8F0",
    pillarSecondary: "#CBD5E1",
    capEmissive: "#2563EB",
    haloColor: "#60A5FA",
    ambientIntensity: 0.9,
    keyColor: "#FFFFFF",
    keyIntensity: 1.35,
  },
  "dark-tech": {
    bgTop: "#071026",
    bgBottom: "#030714",
    bgGlow: "#22D3EE",
    bgGlowOpacity: 0.16,
    fogColor: "#050B1C",
    pillarBody: "#111A2E",
    pillarSecondary: "#1B2842",
    capEmissive: "#22D3EE",
    haloColor: "#38BDF8",
    ambientIntensity: 0.55,
    keyColor: "#E0F2FE",
    keyIntensity: 1.45,
  },
  "warm-minimalist": {
    bgTop: "#FDFBF7",
    bgBottom: "#EFE4D6",
    bgGlow: "#E07A5F",
    bgGlowOpacity: 0.1,
    fogColor: "#F5EEE3",
    pillarBody: "#EFE5D7",
    pillarSecondary: "#DFD0BC",
    capEmissive: "#E07A5F",
    haloColor: "#F2CC8F",
    ambientIntensity: 0.9,
    keyColor: "#FFF7EB",
    keyIntensity: 1.3,
  },
  "monochrome-luxury": {
    bgTop: "#121216",
    bgBottom: "#060608",
    bgGlow: "#D4AF37",
    bgGlowOpacity: 0.14,
    fogColor: "#09090C",
    pillarBody: "#16161B",
    pillarSecondary: "#23232B",
    capEmissive: "#D4AF37",
    haloColor: "#FDE68A",
    ambientIntensity: 0.5,
    keyColor: "#FFF6DB",
    keyIntensity: 1.4,
  },
};

const resolveThemePalette = (
  props: IsometricDataPillarMatrix4KProps,
): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  const hasCustomBg =
    props.backgroundColor !==
    defaultIsometricDataPillarMatrix4KProps.backgroundColor;
  const hasCustomPrimary =
    props.primaryColor !== defaultIsometricDataPillarMatrix4KProps.primaryColor;
  const hasCustomSecondary =
    props.secondaryColor !==
    defaultIsometricDataPillarMatrix4KProps.secondaryColor;
  const hasCustomAccent =
    props.accentColor !== defaultIsometricDataPillarMatrix4KProps.accentColor;

  return {
    ...base,
    bgTop: hasCustomBg ? props.backgroundColor : base.bgTop,
    fogColor: hasCustomBg ? props.backgroundColor : base.fogColor,
    pillarBody: hasCustomPrimary ? props.primaryColor : base.pillarBody,
    pillarSecondary: hasCustomSecondary
      ? props.secondaryColor
      : base.pillarSecondary,
    capEmissive: hasCustomAccent ? props.accentColor : base.capEmissive,
    haloColor: hasCustomAccent ? props.accentColor : base.haloColor,
  };
};

const MATRIX_SIZE = 12;
const PILLAR_SPACING = 0.92;
const PILLAR_HEIGHT = 2.3;
const CANVAS_GL = { antialias: true, alpha: true } as const;

interface MatrixPillarSpec {
  id: string;
  col: number;
  row: number;
  x: number;
  z: number;
  radialDist: number;
  useSecondary: boolean;
}

const buildMatrixPillars = (): MatrixPillarSpec[] => {
  const items: MatrixPillarSpec[] = [];
  const half = (MATRIX_SIZE - 1) / 2;

  for (let row = 0; row < MATRIX_SIZE; row += 1) {
    for (let col = 0; col < MATRIX_SIZE; col += 1) {
      const x = (col - half) * PILLAR_SPACING;
      const z = (row - half) * PILLAR_SPACING;
      items.push({
        id: `matrix-${row}-${col}`,
        col,
        row,
        x,
        z,
        radialDist: Math.hypot(x, z),
        useSecondary: (row + col) % 2 === 1,
      });
    }
  }
  return items;
};

const IsometricMatrixCameraRig: React.FC<{ zoom: number }> = ({ zoom }) => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    camera.position.set(10, 10, 10);
    camera.zoom = zoom;
    camera.lookAt(0, -0.35, 0);
    camera.updateProjectionMatrix();
  }, [camera, zoom]);

  return null;
};

interface MatrixSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  waveAmplitude: number;
  speedMultiplier: number;
  strokeWidth: number;
  zoom: number;
}

const MatrixScene: React.FC<MatrixSceneProps> = ({
  frame,
  durationInFrames,
  palette,
  waveAmplitude,
  speedMultiplier,
  strokeWidth,
  zoom,
}) => {
  const progress = (frame % durationInFrames) / durationInFrames;
  const loopAngle = progress * Math.PI * 2 * speedMultiplier;

  const pillars = useMemo(() => buildMatrixPillars(), []);

  const geometries = useMemo(
    () => ({
      body: new RoundedBoxGeometry(0.76, PILLAR_HEIGHT, 0.76, 2, 0.06),
      cap: new RoundedBoxGeometry(0.78, 0.055 * strokeWidth, 0.78, 1, 0.025),
      halo: new RoundedBoxGeometry(0.88, 0.09 * strokeWidth, 0.88, 1, 0.035),
    }),
    [strokeWidth],
  );

  const materials = useMemo(
    () => ({
      primary: new MeshStandardMaterial({
        color: palette.pillarBody,
        roughness: 0.36,
        metalness: 0.55,
      }),
      secondary: new MeshStandardMaterial({
        color: palette.pillarSecondary,
        roughness: 0.38,
        metalness: 0.52,
      }),
      cap: new MeshStandardMaterial({
        color: palette.capEmissive,
        emissive: palette.capEmissive,
        emissiveIntensity: 1.5,
        roughness: 0.2,
        metalness: 0.2,
      }),
      halo: new MeshBasicMaterial({
        color: palette.haloColor,
        transparent: true,
        opacity: 0.22,
      }),
    }),
    [
      palette.pillarBody,
      palette.pillarSecondary,
      palette.capEmissive,
      palette.haloColor,
    ],
  );

  useEffect(() => {
    return () => {
      geometries.body.dispose();
      geometries.cap.dispose();
      geometries.halo.dispose();
    };
  }, [geometries]);

  useEffect(() => {
    return () => {
      materials.primary.dispose();
      materials.secondary.dispose();
      materials.cap.dispose();
      materials.halo.dispose();
    };
  }, [materials]);

  return (
    <>
      <fog attach="fog" args={[palette.fogColor, 14.5, 29]} />
      <IsometricMatrixCameraRig zoom={zoom} />

      <ambientLight intensity={palette.ambientIntensity} color="#FFFFFF" />
      <hemisphereLight args={[palette.capEmissive, palette.bgBottom, 0.45]} />
      <directionalLight
        position={[12, 18, 9]}
        intensity={palette.keyIntensity}
        color={palette.keyColor}
      />
      <directionalLight
        position={[-10, 8, -12]}
        intensity={1.1}
        color={palette.capEmissive}
      />
      <directionalLight
        position={[-10, 4, 10]}
        intensity={0.7}
        color={palette.haloColor}
      />

      {pillars.map((pillar) => {
        const wave =
          Math.sin(loopAngle - pillar.radialDist * 0.58) * 0.7 +
          Math.cos(loopAngle + (pillar.col - pillar.row) * 0.35) * 0.3;
        const posY = wave * waveAmplitude - 0.55;
        const scaleY = interpolate(wave, [-1, 1], [0.76, 1.38]);
        const capY = (PILLAR_HEIGHT * scaleY) / 2 + 0.012;

        return (
          <group key={pillar.id} position={[pillar.x, posY, pillar.z]}>
            <mesh
              geometry={geometries.body}
              material={
                pillar.useSecondary ? materials.secondary : materials.primary
              }
              scale={[1, scaleY, 1]}
            />
            <mesh
              geometry={geometries.cap}
              material={materials.cap}
              position={[0, capY, 0]}
            />
            <mesh
              geometry={geometries.halo}
              material={materials.halo}
              position={[0, capY + 0.008, 0]}
            />
          </group>
        );
      })}
    </>
  );
};

export const IsometricDataPillarMatrix4K: React.FC<
  IsometricDataPillarMatrix4KProps
> = (props) => {
  const {
    themePreset = "dark-tech",
    aspectRatio = "16:9",
    backgroundColor = "#050B1A",
    primaryColor = "#162033",
    secondaryColor = "#1E293B",
    accentColor = "#22D3EE",
    waveAmplitude = 0.75,
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

  const zoom = aspectRatio === "9:16" ? 120 : 185;

  const cameraConfig = useMemo(
    () => ({
      position: [10, 10, 10] as [number, number, number],
      zoom,
      near: -50,
      far: 100,
    }),
    [zoom],
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
            id="matrix-bg-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={palette.bgTop} />
            <stop offset="100%" stopColor={palette.bgBottom} />
          </linearGradient>
          <radialGradient id="matrix-bg-glow" cx="50%" cy="50%" r="58%">
            <stop
              offset="0%"
              stopColor={palette.bgGlow}
              stopOpacity={palette.bgGlowOpacity}
            />
            <stop offset="100%" stopColor={palette.bgBottom} stopOpacity="0" />
          </radialGradient>
          <filter id="matrix-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed="62"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <pattern
            id="matrix-grain-pattern"
            width="256"
            height="256"
            patternUnits="userSpaceOnUse"
          >
            <rect
              width="256"
              height="256"
              filter="url(#matrix-grain)"
              opacity="0.012"
            />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#matrix-bg-grad)" />
        <rect width={width} height={height} fill="url(#matrix-bg-glow)" />
        <rect
          width={width}
          height={height}
          fill="url(#matrix-grain-pattern)"
        />
      </svg>

      <ThreeCanvas
        width={width}
        height={height}
        orthographic
        dpr={1}
        camera={cameraConfig}
        gl={CANVAS_GL}
        style={{ position: "absolute", inset: 0 }}
      >
        <MatrixScene
          frame={frame}
          durationInFrames={durationInFrames}
          palette={palette}
          waveAmplitude={waveAmplitude}
          speedMultiplier={speedMultiplier}
          strokeWidth={strokeWidth}
          zoom={zoom}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
