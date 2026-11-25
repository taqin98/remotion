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
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
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

export const lowPolyCyberTerrainFlyover4KSchema = z.object({
  themePreset: themePresetSchema.default("dark-tech"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#040917"),
  primaryColor: z.string().default("#0F172A"),
  secondaryColor: z.string().default("#38BDF8"),
  accentColor: z.string().default("#22D3EE"),
  terrainAmplitude: z.number().min(0.2).max(2).default(1),
  speedMultiplier: z.number().int().positive().default(1),
  strokeWidth: z.number().min(0.5).max(3).default(1),
});

export type LowPolyCyberTerrainFlyover4KProps = z.infer<
  typeof lowPolyCyberTerrainFlyover4KSchema
>;

export const defaultLowPolyCyberTerrainFlyover4KProps: LowPolyCyberTerrainFlyover4KProps =
  {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "#040917",
    primaryColor: "#0F172A",
    secondaryColor: "#38BDF8",
    accentColor: "#22D3EE",
    terrainAmplitude: 1,
    speedMultiplier: 1,
    strokeWidth: 1,
  };

export const lowPolyCyberTerrainFlyover4KVariations: Record<
  ThemePreset,
  LowPolyCyberTerrainFlyover4KProps
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "#EEF4FB",
    primaryColor: "#E2E8F0",
    secondaryColor: "#3B82F6",
    accentColor: "#2563EB",
    terrainAmplitude: 1,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "dark-tech": defaultLowPolyCyberTerrainFlyover4KProps,
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "#FAF6F0",
    primaryColor: "#EFE5D7",
    secondaryColor: "#E07A5F",
    accentColor: "#D4A373",
    terrainAmplitude: 1,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "#0A0A0D",
    primaryColor: "#17171D",
    secondaryColor: "#D4AF37",
    accentColor: "#FDE68A",
    terrainAmplitude: 1,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
};

interface ThemePalette {
  bgTop: string;
  bgBottom: string;
  horizonGlow: string;
  horizonGlowOpacity: number;
  fogColor: string;
  terrainSurface: string;
  wireColor: string;
  keyColor: string;
}

const THEME_PALETTES: Record<ThemePreset, ThemePalette> = {
  "clean-corporate": {
    bgTop: "#FFFFFF",
    bgBottom: "#E2ECF7",
    horizonGlow: "#3B82F6",
    horizonGlowOpacity: 0.14,
    fogColor: "#EAF1FA",
    terrainSurface: "#DCE6F2",
    wireColor: "#2563EB",
    keyColor: "#FFFFFF",
  },
  "dark-tech": {
    bgTop: "#081229",
    bgBottom: "#030714",
    horizonGlow: "#22D3EE",
    horizonGlowOpacity: 0.22,
    fogColor: "#050B1C",
    terrainSurface: "#0E172B",
    wireColor: "#38BDF8",
    keyColor: "#38BDF8",
  },
  "warm-minimalist": {
    bgTop: "#FDFBF7",
    bgBottom: "#EFE4D6",
    horizonGlow: "#E07A5F",
    horizonGlowOpacity: 0.15,
    fogColor: "#F5EEE3",
    terrainSurface: "#EFE5D7",
    wireColor: "#E07A5F",
    keyColor: "#FFF5E8",
  },
  "monochrome-luxury": {
    bgTop: "#141418",
    bgBottom: "#060608",
    horizonGlow: "#D4AF37",
    horizonGlowOpacity: 0.18,
    fogColor: "#0A0A0D",
    terrainSurface: "#16161C",
    wireColor: "#D4AF37",
    keyColor: "#FDE68A",
  },
};

const resolveThemePalette = (
  props: LowPolyCyberTerrainFlyover4KProps,
): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  const hasCustomBg =
    props.backgroundColor !==
    defaultLowPolyCyberTerrainFlyover4KProps.backgroundColor;
  const hasCustomPrimary =
    props.primaryColor !==
    defaultLowPolyCyberTerrainFlyover4KProps.primaryColor;
  const hasCustomSecondary =
    props.secondaryColor !==
    defaultLowPolyCyberTerrainFlyover4KProps.secondaryColor;
  const hasCustomAccent =
    props.accentColor !==
    defaultLowPolyCyberTerrainFlyover4KProps.accentColor;

  return {
    ...base,
    bgTop: hasCustomBg ? props.backgroundColor : base.bgTop,
    fogColor: hasCustomBg ? props.backgroundColor : base.fogColor,
    terrainSurface: hasCustomPrimary ? props.primaryColor : base.terrainSurface,
    wireColor: hasCustomAccent
      ? props.accentColor
      : hasCustomSecondary
        ? props.secondaryColor
        : base.wireColor,
  };
};

const applyTerrainDisplacement = (
  geometry: PlaneGeometry,
  initialPositions: Float32Array,
  loopAngle: number,
  terrainAmplitude: number,
): void => {
  const pos = geometry.attributes.position;
  const c4 = Math.cos(loopAngle) * 0.95;
  const s4 = Math.sin(loopAngle) * 0.95;

  for (let i = 0; i < pos.count; i += 1) {
    const offset = i * 3;
    const bx = initialPositions[offset];
    const by = initialPositions[offset + 1];
    const bz = initialPositions[offset + 2];

    const ridge = noise4D("cyber-terrain-1", bx * 0.17, by * 0.17, c4, s4);
    const detail = noise4D(
      "cyber-terrain-2",
      bx * 0.34 + 3.1,
      by * 0.34 - 1.7,
      c4 * 1.2,
      s4 * 1.2,
    );
    const flyWave = Math.sin(loopAngle * 2 + by * 0.45) * 0.25;
    const canyonMask = 0.22 + 0.78 * Math.min(1, Math.abs(bx) / 7.5);

    const height =
      ((ridge * 1.6 + detail * 0.55) * canyonMask + flyWave) *
      terrainAmplitude;
    pos.setXYZ(i, bx, by, bz + height);
  }

  pos.needsUpdate = true;
  geometry.computeVertexNormals();
};

const CANVAS_GL = { antialias: true, alpha: true } as const;

const TerrainCameraRig: React.FC<{ aspectRatio: AspectRatio }> = ({
  aspectRatio,
}) => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    if (aspectRatio === "9:16") {
      camera.position.set(0, 2.75, 11.4);
    } else {
      camera.position.set(0, 2.25, 9.6);
    }
    camera.lookAt(0, -0.35, -6);
    camera.updateProjectionMatrix();
  }, [camera, aspectRatio]);

  return null;
};

interface TerrainSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  terrainAmplitude: number;
  speedMultiplier: number;
  strokeWidth: number;
  aspectRatio: AspectRatio;
}

const TerrainScene: React.FC<TerrainSceneProps> = ({
  frame,
  durationInFrames,
  palette,
  terrainAmplitude,
  speedMultiplier,
  strokeWidth,
  aspectRatio,
}) => {
  const progress = (frame % durationInFrames) / durationInFrames;
  const loopAngle = progress * Math.PI * 2 * speedMultiplier;

  const { geometry, initialPositions } = useMemo(() => {
    const geo = new PlaneGeometry(34, 28, 34, 28);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const bx = pos.getX(i);
      const by = pos.getY(i);
      const bz = pos.getZ(i);
      pos.setXYZ(
        i,
        bx + Math.sin(i * 1.37) * 0.12,
        by + Math.cos(i * 1.91) * 0.12,
        bz,
      );
    }
    const snapshot = new Float32Array(pos.array);
    return { geometry: geo, initialPositions: snapshot };
  }, []);

  const materials = useMemo(
    () => ({
      surface: new MeshStandardMaterial({
        color: palette.terrainSurface,
        flatShading: true,
        roughness: 0.72,
        metalness: 0.25,
      }),
      wire: new MeshBasicMaterial({
        color: palette.wireColor,
        wireframe: true,
        transparent: true,
        opacity: Math.min(0.85, 0.34 * strokeWidth),
      }),
    }),
    [palette.terrainSurface, palette.wireColor, strokeWidth],
  );

  useLayoutEffect(() => {
    applyTerrainDisplacement(
      geometry,
      initialPositions,
      loopAngle,
      terrainAmplitude,
    );
  }, [geometry, initialPositions, loopAngle, terrainAmplitude]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useEffect(() => {
    return () => {
      materials.surface.dispose();
      materials.wire.dispose();
    };
  }, [materials]);

  return (
    <>
      <fog attach="fog" args={[palette.fogColor, 9, 24.5]} />
      <TerrainCameraRig aspectRatio={aspectRatio} />

      <ambientLight intensity={0.6} color="#FFFFFF" />
      <hemisphereLight args={[palette.wireColor, palette.bgBottom, 0.5]} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.3}
        color={palette.keyColor}
      />
      <directionalLight
        position={[-10, 6, -8]}
        intensity={0.9}
        color={palette.wireColor}
      />

      <group position={[0, -2.0, -3.4]} rotation={[-Math.PI / 2 + 0.14, 0, 0]}>
        <mesh geometry={geometry} material={materials.surface} />
        <mesh
          geometry={geometry}
          material={materials.wire}
          position={[0, 0, 0.015]}
        />
      </group>
    </>
  );
};

export const LowPolyCyberTerrainFlyover4K: React.FC<
  LowPolyCyberTerrainFlyover4KProps
> = (props) => {
  const {
    themePreset = "dark-tech",
    aspectRatio = "16:9",
    backgroundColor = "#040917",
    primaryColor = "#0F172A",
    secondaryColor = "#38BDF8",
    accentColor = "#22D3EE",
    terrainAmplitude = 1,
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
        terrainAmplitude,
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
      terrainAmplitude,
      speedMultiplier,
      strokeWidth,
    ],
  );

  const cameraConfig = useMemo(
    () => ({
      position: (aspectRatio === "9:16" ? [0, 2.75, 11.4] : [0, 2.25, 9.6]) as [
        number,
        number,
        number,
      ],
      fov: 42,
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
          <linearGradient
            id="terrain-bg-grad"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={palette.bgTop} />
            <stop offset="55%" stopColor={palette.fogColor} />
            <stop offset="100%" stopColor={palette.bgBottom} />
          </linearGradient>
          <radialGradient id="terrain-horizon-glow" cx="50%" cy="46%" r="55%">
            <stop
              offset="0%"
              stopColor={palette.horizonGlow}
              stopOpacity={palette.horizonGlowOpacity}
            />
            <stop offset="100%" stopColor={palette.bgBottom} stopOpacity="0" />
          </radialGradient>
          <filter id="terrain-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed="67"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <pattern
            id="terrain-grain-pattern"
            width="256"
            height="256"
            patternUnits="userSpaceOnUse"
          >
            <rect
              width="256"
              height="256"
              filter="url(#terrain-grain)"
              opacity="0.012"
            />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#terrain-bg-grad)" />
        <rect width={width} height={height} fill="url(#terrain-horizon-glow)" />
        <rect
          width={width}
          height={height}
          fill="url(#terrain-grain-pattern)"
        />
      </svg>

      <ThreeCanvas
        width={width}
        height={height}
        dpr={1}
        camera={cameraConfig}
        gl={CANVAS_GL}
        style={{ position: "absolute", inset: 0 }}
      >
        <TerrainScene
          frame={frame}
          durationInFrames={durationInFrames}
          palette={palette}
          terrainAmplitude={terrainAmplitude}
          speedMultiplier={speedMultiplier}
          strokeWidth={strokeWidth}
          aspectRatio={aspectRatio}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
