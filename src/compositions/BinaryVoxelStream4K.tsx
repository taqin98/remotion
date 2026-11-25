import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import {
  AbsoluteFill,
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

export const binaryVoxelStream4KSchema = z.object({
  themePreset: themePresetSchema.default("dark-tech"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#050B1A"),
  primaryColor: z.string().default("#162033"),
  secondaryColor: z.string().default("#38BDF8"),
  accentColor: z.string().default("#22D3EE"),
  streamSpread: z.number().min(0.5).max(1.5).default(1),
  speedMultiplier: z.number().int().positive().default(1),
  strokeWidth: z.number().min(0.5).max(3).default(1),
});

export type BinaryVoxelStream4KProps = z.infer<
  typeof binaryVoxelStream4KSchema
>;

export const defaultBinaryVoxelStream4KProps: BinaryVoxelStream4KProps = {
  themePreset: "dark-tech",
  aspectRatio: "16:9",
  backgroundColor: "#050B1A",
  primaryColor: "#162033",
  secondaryColor: "#38BDF8",
  accentColor: "#22D3EE",
  streamSpread: 1,
  speedMultiplier: 1,
  strokeWidth: 1,
};

export const binaryVoxelStream4KVariations: Record<
  ThemePreset,
  BinaryVoxelStream4KProps
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "#F1F5F9",
    primaryColor: "#CBD5E1",
    secondaryColor: "#3B82F6",
    accentColor: "#1D4ED8",
    streamSpread: 1,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "dark-tech": defaultBinaryVoxelStream4KProps,
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "#FAF6F0",
    primaryColor: "#E4D6C3",
    secondaryColor: "#E07A5F",
    accentColor: "#D4A373",
    streamSpread: 1,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "#0B0B0E",
    primaryColor: "#222229",
    secondaryColor: "#D4AF37",
    accentColor: "#FDE68A",
    streamSpread: 1,
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
  voxelDark: string;
  voxelBlue: string;
  voxelEmissive: string;
  bloomHalo: string;
  ambientIntensity: number;
}

const THEME_PALETTES: Record<ThemePreset, ThemePalette> = {
  "clean-corporate": {
    bgTop: "#F8FAFC",
    bgBottom: "#E2E8F0",
    bgGlow: "#3B82F6",
    bgGlowOpacity: 0.1,
    fogColor: "#EAF0F7",
    voxelDark: "#CBD5E1",
    voxelBlue: "#3B82F6",
    voxelEmissive: "#1D4ED8",
    bloomHalo: "#60A5FA",
    ambientIntensity: 0.9,
  },
  "dark-tech": {
    bgTop: "#071026",
    bgBottom: "#030714",
    bgGlow: "#38BDF8",
    bgGlowOpacity: 0.16,
    fogColor: "#050B1C",
    voxelDark: "#16223A",
    voxelBlue: "#38BDF8",
    voxelEmissive: "#22D3EE",
    bloomHalo: "#60A5FA",
    ambientIntensity: 0.6,
  },
  "warm-minimalist": {
    bgTop: "#FDFBF7",
    bgBottom: "#EFE4D6",
    bgGlow: "#E07A5F",
    bgGlowOpacity: 0.1,
    fogColor: "#F5EEE3",
    voxelDark: "#DFD0BC",
    voxelBlue: "#E07A5F",
    voxelEmissive: "#C85A3F",
    bloomHalo: "#F2CC8F",
    ambientIntensity: 0.92,
  },
  "monochrome-luxury": {
    bgTop: "#121216",
    bgBottom: "#060608",
    bgGlow: "#D4AF37",
    bgGlowOpacity: 0.14,
    fogColor: "#09090C",
    voxelDark: "#222229",
    voxelBlue: "#D4AF37",
    voxelEmissive: "#FDE68A",
    bloomHalo: "#D4AF37",
    ambientIntensity: 0.55,
  },
};

const resolveThemePalette = (
  props: BinaryVoxelStream4KProps,
): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  const hasCustomBg =
    props.backgroundColor !== defaultBinaryVoxelStream4KProps.backgroundColor;
  const hasCustomPrimary =
    props.primaryColor !== defaultBinaryVoxelStream4KProps.primaryColor;
  const hasCustomSecondary =
    props.secondaryColor !== defaultBinaryVoxelStream4KProps.secondaryColor;
  const hasCustomAccent =
    props.accentColor !== defaultBinaryVoxelStream4KProps.accentColor;

  return {
    ...base,
    bgTop: hasCustomBg ? props.backgroundColor : base.bgTop,
    fogColor: hasCustomBg ? props.backgroundColor : base.fogColor,
    voxelDark: hasCustomPrimary ? props.primaryColor : base.voxelDark,
    voxelBlue: hasCustomSecondary ? props.secondaryColor : base.voxelBlue,
    voxelEmissive: hasCustomAccent ? props.accentColor : base.voxelEmissive,
    bloomHalo: hasCustomAccent ? props.accentColor : base.bloomHalo,
  };
};

const STREAM_SPAN = 26;
const SLOTS_PER_LANE = 12;
const SLOT_STEP = STREAM_SPAN / SLOTS_PER_LANE;
const CANVAS_GL = { antialias: true, alpha: true } as const;

interface StreamLaneSpec {
  id: string;
  y: number;
  z: number;
  direction: 1 | -1;
  cycles: 1 | 2;
  phase: number;
  scale: number;
}

// 12 horizontal parallax streams across 3 depth layers (144 micro voxels total)
const STREAM_LANES: readonly StreamLaneSpec[] = [
  // Foreground layer (z = +0.8..+1.4, faster 2x cycle)
  { id: "lane-fg-0", y: 3.1, z: 1.2, direction: 1, cycles: 2, phase: 0.2, scale: 1.05 },
  { id: "lane-fg-1", y: 1.35, z: 0.8, direction: 1, cycles: 2, phase: 1.7, scale: 0.96 },
  { id: "lane-fg-2", y: -1.45, z: 1.0, direction: 1, cycles: 2, phase: 3.1, scale: 1.02 },
  { id: "lane-fg-3", y: -3.15, z: 1.35, direction: 1, cycles: 2, phase: 4.5, scale: 1.08 },

  // Midground layer (z = -0.9..-0.3, 1x cycle)
  { id: "lane-mid-0", y: 2.35, z: -0.4, direction: 1, cycles: 1, phase: 0.8, scale: 0.92 },
  { id: "lane-mid-1", y: 0.45, z: -0.75, direction: -1, cycles: 1, phase: 2.4, scale: 0.88 },
  { id: "lane-mid-2", y: -0.55, z: -0.5, direction: 1, cycles: 1, phase: 3.9, scale: 0.9 },
  { id: "lane-mid-3", y: -2.4, z: -0.9, direction: 1, cycles: 1, phase: 5.2, scale: 0.94 },

  // Background depth layer (z = -3.4..-2.4, slower 1x cycle)
  { id: "lane-bg-0", y: 3.55, z: -2.6, direction: 1, cycles: 1, phase: 1.1, scale: 0.82 },
  { id: "lane-bg-1", y: 1.8, z: -3.2, direction: 1, cycles: 1, phase: 2.9, scale: 0.78 },
  { id: "lane-bg-2", y: -1.9, z: -2.8, direction: -1, cycles: 1, phase: 4.2, scale: 0.8 },
  { id: "lane-bg-3", y: -3.6, z: -3.4, direction: 1, cycles: 1, phase: 5.6, scale: 0.84 },
];

const VoxelCameraRig: React.FC<{ aspectRatio: AspectRatio }> = ({
  aspectRatio,
}) => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    if (aspectRatio === "9:16") {
      camera.position.set(0, 0, 14.2);
    } else {
      camera.position.set(0, 0, 11.5);
    }
    camera.lookAt(0, 0, -0.8);
    camera.updateProjectionMatrix();
  }, [camera, aspectRatio]);

  return null;
};

interface VoxelSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  streamSpread: number;
  speedMultiplier: number;
  strokeWidth: number;
  aspectRatio: AspectRatio;
}

const VoxelScene: React.FC<VoxelSceneProps> = ({
  frame,
  durationInFrames,
  palette,
  streamSpread,
  speedMultiplier,
  strokeWidth,
  aspectRatio,
}) => {
  const progress = (frame % durationInFrames) / durationInFrames;
  const loopAngle = progress * Math.PI * 2 * speedMultiplier;

  const slotIndices = useMemo(
    () => Array.from({ length: SLOTS_PER_LANE }, (_, i) => i),
    [],
  );

  const geometries = useMemo(
    () => ({
      cube: new RoundedBoxGeometry(
        0.26 * strokeWidth,
        0.24 * strokeWidth,
        0.24 * strokeWidth,
        2,
        0.04,
      ),
      packet: new RoundedBoxGeometry(
        0.82 * strokeWidth,
        0.18 * strokeWidth,
        0.18 * strokeWidth,
        2,
        0.04,
      ),
      packetHalo: new RoundedBoxGeometry(
        0.96 * strokeWidth,
        0.3 * strokeWidth,
        0.3 * strokeWidth,
        2,
        0.06,
      ),
    }),
    [strokeWidth],
  );

  const materials = useMemo(
    () => ({
      dark: new MeshStandardMaterial({
        color: palette.voxelDark,
        roughness: 0.48,
        metalness: 0.35,
      }),
      blue: new MeshStandardMaterial({
        color: palette.voxelBlue,
        emissive: palette.voxelBlue,
        emissiveIntensity: 0.75,
        roughness: 0.28,
        metalness: 0.25,
      }),
      emissive: new MeshStandardMaterial({
        color: palette.voxelEmissive,
        emissive: palette.voxelEmissive,
        emissiveIntensity: 1.55,
        roughness: 0.2,
        metalness: 0.15,
      }),
      halo: new MeshBasicMaterial({
        color: palette.bloomHalo,
        transparent: true,
        opacity: 0.2,
      }),
    }),
    [palette],
  );

  useEffect(() => {
    return () => {
      geometries.cube.dispose();
      geometries.packet.dispose();
      geometries.packetHalo.dispose();
    };
  }, [geometries]);

  useEffect(() => {
    return () => {
      materials.dark.dispose();
      materials.blue.dispose();
      materials.emissive.dispose();
      materials.halo.dispose();
    };
  }, [materials]);

  const yScale = (aspectRatio === "9:16" ? 1.48 : 1) * streamSpread;

  return (
    <>
      <fog attach="fog" args={[palette.fogColor, 11, 22]} />
      <VoxelCameraRig aspectRatio={aspectRatio} />

      <ambientLight intensity={palette.ambientIntensity} color="#FFFFFF" />
      <directionalLight
        position={[8, 10, 10]}
        intensity={1.2}
        color={palette.voxelBlue}
      />
      <directionalLight
        position={[-8, -6, 8]}
        intensity={0.75}
        color={palette.voxelEmissive}
      />

      {STREAM_LANES.map((lane, laneIdx) => {
        const travel = progress * speedMultiplier * lane.cycles * STREAM_SPAN;

        return slotIndices.map((slotIdx) => {
          const jitter = Math.sin(slotIdx * 2.13 + laneIdx * 1.47) * 0.45;
          const rawX =
            -STREAM_SPAN * 0.5 +
            slotIdx * SLOT_STEP +
            jitter +
            lane.direction * travel;
          const wrappedX =
            (((rawX + STREAM_SPAN * 0.5) % STREAM_SPAN) + STREAM_SPAN) %
              STREAM_SPAN -
            STREAM_SPAN * 0.5;

          const isPacket = (slotIdx + laneIdx) % 3 === 0;
          const isEmissive = (slotIdx * 3 + laneIdx) % 5 === 0;
          const isBlue = !isEmissive && (slotIdx + laneIdx) % 2 === 0;
          const bobY =
            Math.sin(loopAngle + slotIdx * 0.65 + lane.phase) * 0.06;

          const bodyMat = isEmissive
            ? materials.emissive
            : isBlue
              ? materials.blue
              : materials.dark;

          return (
            <group
              key={`${lane.id}-${slotIdx}`}
              position={[wrappedX, lane.y * yScale + bobY, lane.z]}
              scale={[lane.scale, lane.scale, lane.scale]}
            >
              <mesh
                geometry={isPacket ? geometries.packet : geometries.cube}
                material={bodyMat}
              />
              {isEmissive && isPacket ? (
                <mesh
                  geometry={geometries.packetHalo}
                  material={materials.halo}
                />
              ) : null}
            </group>
          );
        });
      })}
    </>
  );
};

export const BinaryVoxelStream4K: React.FC<BinaryVoxelStream4KProps> = (
  props,
) => {
  const {
    themePreset = "dark-tech",
    aspectRatio = "16:9",
    backgroundColor = "#050B1A",
    primaryColor = "#162033",
    secondaryColor = "#38BDF8",
    accentColor = "#22D3EE",
    streamSpread = 1,
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
        streamSpread,
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
      streamSpread,
      speedMultiplier,
      strokeWidth,
    ],
  );

  const cameraConfig = useMemo(
    () => ({
      position: (aspectRatio === "9:16" ? [0, 0, 14.2] : [0, 0, 11.5]) as [
        number,
        number,
        number,
      ],
      fov: 40,
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
            id="voxel-bg-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={palette.bgTop} />
            <stop offset="100%" stopColor={palette.bgBottom} />
          </linearGradient>
          <radialGradient id="voxel-bg-glow" cx="50%" cy="50%" r="58%">
            <stop
              offset="0%"
              stopColor={palette.bgGlow}
              stopOpacity={palette.bgGlowOpacity}
            />
            <stop offset="100%" stopColor={palette.bgBottom} stopOpacity="0" />
          </radialGradient>
          <filter id="voxel-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed="66"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <pattern
            id="voxel-grain-pattern"
            width="256"
            height="256"
            patternUnits="userSpaceOnUse"
          >
            <rect
              width="256"
              height="256"
              filter="url(#voxel-grain)"
              opacity="0.012"
            />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#voxel-bg-grad)" />
        <rect width={width} height={height} fill="url(#voxel-bg-glow)" />
        <rect
          width={width}
          height={height}
          fill="url(#voxel-grain-pattern)"
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
        <VoxelScene
          frame={frame}
          durationInFrames={durationInFrames}
          palette={palette}
          streamSpread={streamSpread}
          speedMultiplier={speedMultiplier}
          strokeWidth={strokeWidth}
          aspectRatio={aspectRatio}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
