import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { noise4D } from "@remotion/noise";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  CylinderGeometry,
  MeshBasicMaterial,
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

export const hexagonalCyberWaveGrid4KSchema = z.object({
  themePreset: themePresetSchema.default("dark-tech"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#050B1A"),
  primaryColor: z.string().default("#162033"),
  secondaryColor: z.string().default("#38BDF8"),
  accentColor: z.string().default("#22D3EE"),
  waveAmplitude: z.number().min(0.2).max(2).default(0.9),
  speedMultiplier: z.number().int().positive().default(1),
  strokeWidth: z.number().min(0.5).max(3).default(1),
});

export type HexagonalCyberWaveGrid4KProps = z.infer<
  typeof hexagonalCyberWaveGrid4KSchema
>;

export const defaultHexagonalCyberWaveGrid4KProps: HexagonalCyberWaveGrid4KProps =
  {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "#050B1A",
    primaryColor: "#162033",
    secondaryColor: "#38BDF8",
    accentColor: "#22D3EE",
    waveAmplitude: 0.9,
    speedMultiplier: 1,
    strokeWidth: 1,
  };

export const hexagonalCyberWaveGrid4KVariations: Record<
  ThemePreset,
  HexagonalCyberWaveGrid4KProps
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "#F1F5F9",
    primaryColor: "#E2E8F0",
    secondaryColor: "#3B82F6",
    accentColor: "#2563EB",
    waveAmplitude: 0.9,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "dark-tech": defaultHexagonalCyberWaveGrid4KProps,
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "#FAF6F0",
    primaryColor: "#EFE5D7",
    secondaryColor: "#E07A5F",
    accentColor: "#D4A373",
    waveAmplitude: 0.9,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "#0B0B0E",
    primaryColor: "#19191F",
    secondaryColor: "#D4AF37",
    accentColor: "#FDE68A",
    waveAmplitude: 0.9,
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
  hexBody: string;
  rimColor: string;
  haloColor: string;
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
    hexBody: "#E2E8F0",
    rimColor: "#2563EB",
    haloColor: "#60A5FA",
    ambientIntensity: 0.9,
    keyColor: "#FFFFFF",
  },
  "dark-tech": {
    bgTop: "#071026",
    bgBottom: "#030714",
    bgGlow: "#22D3EE",
    bgGlowOpacity: 0.16,
    fogColor: "#050B1C",
    hexBody: "#131C30",
    rimColor: "#22D3EE",
    haloColor: "#38BDF8",
    ambientIntensity: 0.55,
    keyColor: "#E0F2FE",
  },
  "warm-minimalist": {
    bgTop: "#FDFBF7",
    bgBottom: "#EFE4D6",
    bgGlow: "#E07A5F",
    bgGlowOpacity: 0.1,
    fogColor: "#F5EEE3",
    hexBody: "#EFE5D7",
    rimColor: "#E07A5F",
    haloColor: "#F2CC8F",
    ambientIntensity: 0.92,
    keyColor: "#FFF7EB",
  },
  "monochrome-luxury": {
    bgTop: "#121216",
    bgBottom: "#060608",
    bgGlow: "#D4AF37",
    bgGlowOpacity: 0.14,
    fogColor: "#09090C",
    hexBody: "#18181E",
    rimColor: "#D4AF37",
    haloColor: "#FDE68A",
    ambientIntensity: 0.48,
    keyColor: "#FFF6DB",
  },
};

const resolveThemePalette = (
  props: HexagonalCyberWaveGrid4KProps,
): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  const hasCustomBg =
    props.backgroundColor !==
    defaultHexagonalCyberWaveGrid4KProps.backgroundColor;
  const hasCustomPrimary =
    props.primaryColor !== defaultHexagonalCyberWaveGrid4KProps.primaryColor;
  const hasCustomSecondary =
    props.secondaryColor !==
    defaultHexagonalCyberWaveGrid4KProps.secondaryColor;
  const hasCustomAccent =
    props.accentColor !== defaultHexagonalCyberWaveGrid4KProps.accentColor;

  return {
    ...base,
    bgTop: hasCustomBg ? props.backgroundColor : base.bgTop,
    fogColor: hasCustomBg ? props.backgroundColor : base.fogColor,
    hexBody: hasCustomPrimary ? props.primaryColor : base.hexBody,
    rimColor: hasCustomAccent
      ? props.accentColor
      : hasCustomSecondary
        ? props.secondaryColor
        : base.rimColor,
    haloColor: hasCustomSecondary ? props.secondaryColor : base.haloColor,
  };
};

const HEX_COLS = 15;
const HEX_ROWS = 11;
const HEX_RADIUS = 0.55;
const HEX_HEIGHT = 1.35;
const HEX_DX = HEX_RADIUS * Math.sqrt(3) * 1.07;
const HEX_DZ = HEX_RADIUS * 1.5 * 1.07;
const CANVAS_GL = { antialias: true, alpha: true } as const;

interface HexCellSpec {
  id: string;
  x: number;
  z: number;
  highlightRim: boolean;
}

const buildHexGrid = (): HexCellSpec[] => {
  const cells: HexCellSpec[] = [];
  const halfCols = (HEX_COLS - 1) / 2;
  const halfRows = (HEX_ROWS - 1) / 2;

  for (let row = 0; row < HEX_ROWS; row += 1) {
    const rowOffset = row % 2 === 1 ? HEX_DX * 0.5 : 0;
    for (let col = 0; col < HEX_COLS; col += 1) {
      const x = (col - halfCols) * HEX_DX + rowOffset - HEX_DX * 0.25;
      const z = (row - halfRows) * HEX_DZ - 1.2;
      cells.push({
        id: `hex-${row}-${col}`,
        x,
        z,
        highlightRim: (row + col * 2) % 3 === 0,
      });
    }
  }
  return cells;
};

const HexCameraRig: React.FC<{ aspectRatio: AspectRatio }> = ({
  aspectRatio,
}) => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    if (aspectRatio === "9:16") {
      camera.position.set(0, 7.2, 12.6);
    } else {
      camera.position.set(0, 6.0, 10.2);
    }
    camera.lookAt(0, -0.5, -1.0);
    camera.updateProjectionMatrix();
  }, [camera, aspectRatio]);

  return null;
};

interface HexGridSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  waveAmplitude: number;
  speedMultiplier: number;
  strokeWidth: number;
  aspectRatio: AspectRatio;
}

const HexGridScene: React.FC<HexGridSceneProps> = ({
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
  const c4 = Math.cos(loopAngle) * 0.9;
  const s4 = Math.sin(loopAngle) * 0.9;

  const cells = useMemo(() => buildHexGrid(), []);

  const geometries = useMemo(
    () => ({
      prism: new CylinderGeometry(HEX_RADIUS, HEX_RADIUS, HEX_HEIGHT, 6, 1),
      rim: new TorusGeometry(HEX_RADIUS * 0.95, 0.02 * strokeWidth, 8, 6),
      halo: new TorusGeometry(HEX_RADIUS * 0.95, 0.052 * strokeWidth, 8, 6),
    }),
    [strokeWidth],
  );

  const materials = useMemo(
    () => ({
      body: new MeshStandardMaterial({
        color: palette.hexBody,
        roughness: 0.68,
        metalness: 0.18,
      }),
      rim: new MeshStandardMaterial({
        color: palette.rimColor,
        emissive: palette.rimColor,
        emissiveIntensity: 1.45,
        roughness: 0.2,
        metalness: 0.2,
      }),
      halo: new MeshBasicMaterial({
        color: palette.haloColor,
        transparent: true,
        opacity: 0.22,
      }),
    }),
    [palette.hexBody, palette.rimColor, palette.haloColor],
  );

  useEffect(() => {
    return () => {
      geometries.prism.dispose();
      geometries.rim.dispose();
      geometries.halo.dispose();
    };
  }, [geometries]);

  useEffect(() => {
    return () => {
      materials.body.dispose();
      materials.rim.dispose();
      materials.halo.dispose();
    };
  }, [materials]);

  return (
    <>
      <fog attach="fog" args={[palette.fogColor, 11.5, 23]} />
      <HexCameraRig aspectRatio={aspectRatio} />

      <ambientLight intensity={palette.ambientIntensity} color="#FFFFFF" />
      <hemisphereLight args={[palette.rimColor, palette.bgBottom, 0.5]} />
      <directionalLight
        position={[8, 13, 8]}
        intensity={1.3}
        color={palette.keyColor}
      />
      <directionalLight
        position={[-9, 5, -9]}
        intensity={0.95}
        color={palette.haloColor}
      />

      {cells.map((cell) => {
        const n = noise4D("hex-wave", cell.x * 0.22, cell.z * 0.22, c4, s4);
        const posY = n * 0.85 * waveAmplitude - 1.1;

        return (
          <group key={cell.id} position={[cell.x, posY, cell.z]}>
            <mesh geometry={geometries.prism} material={materials.body} />
            <mesh
              geometry={geometries.rim}
              material={materials.rim}
              position={[0, HEX_HEIGHT * 0.5 + 0.008, 0]}
              rotation={[Math.PI / 2, 0, Math.PI / 6]}
            />
            {cell.highlightRim ? (
              <mesh
                geometry={geometries.halo}
                material={materials.halo}
                position={[0, HEX_HEIGHT * 0.5 + 0.012, 0]}
                rotation={[Math.PI / 2, 0, Math.PI / 6]}
              />
            ) : null}
          </group>
        );
      })}
    </>
  );
};

export const HexagonalCyberWaveGrid4K: React.FC<
  HexagonalCyberWaveGrid4KProps
> = (props) => {
  const {
    themePreset = "dark-tech",
    aspectRatio = "16:9",
    backgroundColor = "#050B1A",
    primaryColor = "#162033",
    secondaryColor = "#38BDF8",
    accentColor = "#22D3EE",
    waveAmplitude = 0.9,
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
      position: (aspectRatio === "9:16"
        ? [0, 7.2, 12.6]
        : [0, 6.0, 10.2]) as [number, number, number],
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
          <linearGradient id="hex-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.bgTop} />
            <stop offset="100%" stopColor={palette.bgBottom} />
          </linearGradient>
          <radialGradient id="hex-bg-glow" cx="50%" cy="55%" r="58%">
            <stop
              offset="0%"
              stopColor={palette.bgGlow}
              stopOpacity={palette.bgGlowOpacity}
            />
            <stop offset="100%" stopColor={palette.bgBottom} stopOpacity="0" />
          </radialGradient>
          <filter id="hex-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed="64"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <pattern
            id="hex-grain-pattern"
            width="256"
            height="256"
            patternUnits="userSpaceOnUse"
          >
            <rect
              width="256"
              height="256"
              filter="url(#hex-grain)"
              opacity="0.012"
            />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#hex-bg-grad)" />
        <rect width={width} height={height} fill="url(#hex-bg-glow)" />
        <rect width={width} height={height} fill="url(#hex-grain-pattern)" />
      </svg>

      <ThreeCanvas
        width={width}
        height={height}
        dpr={1}
        camera={cameraConfig}
        gl={CANVAS_GL}
        style={{ position: "absolute", inset: 0 }}
      >
        <HexGridScene
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
