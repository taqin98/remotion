import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  DoubleSide,
  MeshPhysicalMaterial,
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

export const velvetGoldLuxuryWaves4KSchema = z.object({
  themePreset: themePresetSchema.default("monochrome-luxury"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#0B0B0E"),
  primaryColor: z.string().default("#16161B"),
  secondaryColor: z.string().default("#D4AF37"),
  accentColor: z.string().default("#F3D37A"),
  waveAmplitude: z.number().min(0.2).max(2.5).default(1.05),
  speedMultiplier: z.number().int().positive().default(1),
  strokeWidth: z.number().min(0.4).max(2.5).default(1),
});

export type VelvetGoldLuxuryWaves4KProps = z.infer<
  typeof velvetGoldLuxuryWaves4KSchema
>;

export const defaultVelvetGoldLuxuryWaves4KProps: VelvetGoldLuxuryWaves4KProps =
  {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "#0B0B0E",
    primaryColor: "#16161B",
    secondaryColor: "#D4AF37",
    accentColor: "#F3D37A",
    waveAmplitude: 1.05,
    speedMultiplier: 1,
    strokeWidth: 1,
  };

export const velvetGoldLuxuryWaves4KVariations: Record<
  ThemePreset,
  VelvetGoldLuxuryWaves4KProps
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "#EEF3FA",
    primaryColor: "#E2E8F0",
    secondaryColor: "#3B82F6",
    accentColor: "#60A5FA",
    waveAmplitude: 1.05,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "dark-tech": {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "#050A17",
    primaryColor: "#0F172A",
    secondaryColor: "#38BDF8",
    accentColor: "#22D3EE",
    waveAmplitude: 1.05,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "#F5EEE4",
    primaryColor: "#EBE0D0",
    secondaryColor: "#D4A373",
    accentColor: "#E07A5F",
    waveAmplitude: 1.05,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "monochrome-luxury": defaultVelvetGoldLuxuryWaves4KProps,
};

interface ThemePalette {
  bgColor: string;
  velvetColor: string;
  sheenColor: string;
  goldColor: string;
  accentLight: string;
  ambientIntensity: number;
}

const THEME_PALETTES: Record<ThemePreset, ThemePalette> = {
  "clean-corporate": {
    bgColor: "#EEF3FA",
    velvetColor: "#DDE6F2",
    sheenColor: "#FFFFFF",
    goldColor: "#3B82F6",
    accentLight: "#60A5FA",
    ambientIntensity: 0.95,
  },
  "dark-tech": {
    bgColor: "#050A17",
    velvetColor: "#0F172A",
    sheenColor: "#1E3A5F",
    goldColor: "#38BDF8",
    accentLight: "#22D3EE",
    ambientIntensity: 0.55,
  },
  "warm-minimalist": {
    bgColor: "#F5EEE4",
    velvetColor: "#E8DAC7",
    sheenColor: "#FFFDF9",
    goldColor: "#D4A373",
    accentLight: "#E07A5F",
    ambientIntensity: 0.92,
  },
  "monochrome-luxury": {
    bgColor: "#0B0B0E",
    velvetColor: "#16161B",
    sheenColor: "#3F3F46",
    goldColor: "#D4AF37",
    accentLight: "#F3D37A",
    ambientIntensity: 0.45,
  },
};

const resolvePalette = (props: VelvetGoldLuxuryWaves4KProps): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  return {
    ...base,
    bgColor:
      props.backgroundColor !==
      defaultVelvetGoldLuxuryWaves4KProps.backgroundColor
        ? props.backgroundColor
        : base.bgColor,
    velvetColor:
      props.primaryColor !== defaultVelvetGoldLuxuryWaves4KProps.primaryColor
        ? props.primaryColor
        : base.velvetColor,
    goldColor:
      props.secondaryColor !==
      defaultVelvetGoldLuxuryWaves4KProps.secondaryColor
        ? props.secondaryColor
        : base.goldColor,
    accentLight:
      props.accentColor !== defaultVelvetGoldLuxuryWaves4KProps.accentColor
        ? props.accentColor
        : base.accentLight,
  };
};

const STRIP_Y_OFFSETS = [-4.2, -2.8, -1.4, 0, 1.4, 2.8, 4.2] as const;

const computeWaveZ = (
  x: number,
  y: number,
  loopAngle: number,
  amplitude: number,
): number => {
  const w1 = Math.sin(loopAngle + x * 0.28 + y * 0.35) * 0.72;
  const w2 = Math.cos(loopAngle - x * 0.2 + y * 0.46) * 0.42;
  return (w1 + w2) * amplitude;
};

const updateWaveGeometry = (
  geometry: PlaneGeometry,
  initialPositions: Float32Array,
  loopAngle: number,
  amplitude: number,
  yShift: number,
  zBias: number,
): void => {
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const offset = i * 3;
    const bx = initialPositions[offset];
    const by = initialPositions[offset + 1];
    const worldY = by + yShift;
    const nextZ = computeWaveZ(bx, worldY, loopAngle, amplitude) + zBias;
    pos.setXYZ(i, bx, by, nextZ);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
};

const CANVAS_GL = { antialias: true, alpha: false } as const;
const CAMERA_CONFIG = {
  position: [0, -0.4, 10.6] as [number, number, number],
  fov: 40,
  near: 0.1,
  far: 100,
};

interface VelvetSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  waveAmplitude: number;
  speedMultiplier: number;
  strokeWidth: number;
  aspectRatio: AspectRatio;
}

const VelvetScene: React.FC<VelvetSceneProps> = ({
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

  const { velvetGeo, velvetInitial } = useMemo(() => {
    const geo = new PlaneGeometry(28, 16, 48, 28);
    return { velvetGeo: geo, velvetInitial: new Float32Array(geo.attributes.position.array) };
  }, []);

  const stripGeometries = useMemo(
    () =>
      STRIP_Y_OFFSETS.map(() => {
        const geo = new PlaneGeometry(28, 0.2 * strokeWidth, 48, 1);
        return {
          geo,
          initial: new Float32Array(geo.attributes.position.array),
        };
      }),
    [strokeWidth],
  );

  const materials = useMemo(
    () => ({
      velvet: new MeshPhysicalMaterial({
        color: palette.velvetColor,
        roughness: 0.82,
        metalness: 0.08,
        sheen: 1.0,
        sheenRoughness: 0.35,
        sheenColor: palette.sheenColor,
        side: DoubleSide,
      }),
      gold: new MeshStandardMaterial({
        color: palette.goldColor,
        metalness: 0.86,
        roughness: 0.22,
        side: DoubleSide,
      }),
    }),
    [palette.velvetColor, palette.sheenColor, palette.goldColor],
  );

  useLayoutEffect(() => {
    updateWaveGeometry(velvetGeo, velvetInitial, loopAngle, waveAmplitude, 0, 0);
    stripGeometries.forEach((item, index) => {
      updateWaveGeometry(
        item.geo,
        item.initial,
        loopAngle,
        waveAmplitude,
        STRIP_Y_OFFSETS[index],
        0.045,
      );
    });
  }, [velvetGeo, velvetInitial, stripGeometries, loopAngle, waveAmplitude]);

  useEffect(() => {
    return () => {
      velvetGeo.dispose();
    };
  }, [velvetGeo]);

  useEffect(() => {
    return () => {
      stripGeometries.forEach((item) => item.geo.dispose());
    };
  }, [stripGeometries]);

  useEffect(() => {
    return () => {
      materials.velvet.dispose();
      materials.gold.dispose();
    };
  }, [materials]);

  return (
    <>
      <color attach="background" args={[palette.bgColor]} />
      <fog attach="fog" args={[palette.bgColor, 10, 23]} />

      <ambientLight intensity={palette.ambientIntensity} color="#FFFFFF" />
      <hemisphereLight args={[palette.sheenColor, palette.bgColor, 0.5]} />
      <directionalLight position={[8, 10, 8]} intensity={1.55} color="#FFFFFF" />
      <directionalLight
        position={[-9, -6, 7]}
        intensity={1.15}
        color={palette.accentLight}
      />
      <directionalLight
        position={[0, 8, -8]}
        intensity={0.95}
        color={palette.goldColor}
      />

      <group rotation={[-0.24, 0.08, aspectRatio === "9:16" ? 0.35 : -0.1]}>
        <mesh geometry={velvetGeo} material={materials.velvet} />
        {stripGeometries.map((item, idx) => (
          <mesh
            key={`gold-strip-${idx}`}
            geometry={item.geo}
            material={materials.gold}
            position={[0, STRIP_Y_OFFSETS[idx], 0]}
          />
        ))}
      </group>
    </>
  );
};

export const VelvetGoldLuxuryWaves4K: React.FC<
  VelvetGoldLuxuryWaves4KProps
> = (props) => {
  const {
    themePreset = "monochrome-luxury",
    aspectRatio = "16:9",
    backgroundColor = "#0B0B0E",
    primaryColor = "#16161B",
    secondaryColor = "#D4AF37",
    accentColor = "#F3D37A",
    waveAmplitude = 1.05,
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

  return (
    <AbsoluteFill style={{ backgroundColor: palette.bgColor, overflow: "hidden" }}>
      <ThreeCanvas
        width={width}
        height={height}
        dpr={1}
        camera={CAMERA_CONFIG}
        gl={CANVAS_GL}
        style={{ position: "absolute", inset: 0 }}
      >
        <VelvetScene
          frame={frame}
          durationInFrames={durationInFrames}
          palette={palette}
          waveAmplitude={waveAmplitude}
          speedMultiplier={speedMultiplier}
          strokeWidth={strokeWidth}
          aspectRatio={aspectRatio}
        />
      </ThreeCanvas>

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
          <filter
            id="velvet-waves-grain"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed="73"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect
          width={width}
          height={height}
          filter="url(#velvet-waves-grain)"
          opacity="0.012"
        />
      </svg>
    </AbsoluteFill>
  );
};

