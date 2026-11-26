import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  CylinderGeometry,
  MeshPhysicalMaterial,
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

export const floatingGlassHexagons4KSchema = z.object({
  themePreset: themePresetSchema.default("clean-corporate"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#F8FAFC"),
  primaryColor: z.string().default("#E0F2FE"),
  secondaryColor: z.string().default("#3B82F6"),
  accentColor: z.string().default("#0EA5E9"),
  speedMultiplier: z.number().int().positive().default(1),
  strokeWidth: z.number().min(0.4).max(2.5).default(1),
});

export type FloatingGlassHexagons4KProps = z.infer<
  typeof floatingGlassHexagons4KSchema
>;

export const defaultFloatingGlassHexagons4KProps: FloatingGlassHexagons4KProps =
  {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "#F8FAFC",
    primaryColor: "#E0F2FE",
    secondaryColor: "#3B82F6",
    accentColor: "#0EA5E9",
    speedMultiplier: 1,
    strokeWidth: 1,
  };

export const floatingGlassHexagons4KVariations: Record<
  ThemePreset,
  FloatingGlassHexagons4KProps
> = {
  "clean-corporate": defaultFloatingGlassHexagons4KProps,
  "dark-tech": {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "#060B1A",
    primaryColor: "#BAE6FD",
    secondaryColor: "#06B6D4",
    accentColor: "#38BDF8",
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "#FAF7F2",
    primaryColor: "#FFF5EB",
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
  glassColor: string;
  rimColor: string;
  accentLight: string;
  fogColor: string;
}

const THEME_PALETTES: Record<ThemePreset, ThemePalette> = {
  "clean-corporate": {
    bgTop: "#FFFFFF",
    bgBottom: "#E5EEF9",
    glassColor: "#F0F9FF",
    rimColor: "#3B82F6",
    accentLight: "#0EA5E9",
    fogColor: "#F0F5FC",
  },
  "dark-tech": {
    bgTop: "#091124",
    bgBottom: "#040814",
    glassColor: "#BAE6FD",
    rimColor: "#38BDF8",
    accentLight: "#06B6D4",
    fogColor: "#060B1A",
  },
  "warm-minimalist": {
    bgTop: "#FDFBF7",
    bgBottom: "#EFE3D3",
    glassColor: "#FFF9F0",
    rimColor: "#E07A5F",
    accentLight: "#F2CC8F",
    fogColor: "#F5EEE3",
  },
  "monochrome-luxury": {
    bgTop: "#141418",
    bgBottom: "#08080A",
    glassColor: "#E4E4E7",
    rimColor: "#D4AF37",
    accentLight: "#F3D37A",
    fogColor: "#0D0D10",
  },
};

const resolvePalette = (props: FloatingGlassHexagons4KProps): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  return {
    ...base,
    bgTop:
      props.backgroundColor !==
      defaultFloatingGlassHexagons4KProps.backgroundColor
        ? props.backgroundColor
        : base.bgTop,
    glassColor:
      props.primaryColor !== defaultFloatingGlassHexagons4KProps.primaryColor
        ? props.primaryColor
        : base.glassColor,
    rimColor:
      props.secondaryColor !==
      defaultFloatingGlassHexagons4KProps.secondaryColor
        ? props.secondaryColor
        : base.rimColor,
    accentLight:
      props.accentColor !== defaultFloatingGlassHexagons4KProps.accentColor
        ? props.accentColor
        : base.accentLight,
  };
};

interface HexTileSpec {
  id: string;
  basePos: [number, number, number];
  baseRot: [number, number, number];
  drift: [number, number, number];
  scale: number;
  phase: number;
}

// 14 floating beveled glass hexagons framing perimeter around clean center
const HEX_TILE_SPECS: readonly HexTileSpec[] = [
  { id: "hex-1", basePos: [-6.1, 2.8, -0.5], baseRot: [0.6, 0.3, 0.2], drift: [0.35, 0.28, 0.16], scale: 1.05, phase: 0.2 },
  { id: "hex-2", basePos: [-4.6, 3.25, -2.0], baseRot: [0.9, -0.2, 0.4], drift: [0.3, 0.25, 0.14], scale: 0.92, phase: 0.9 },
  { id: "hex-3", basePos: [-6.65, 0.35, 0.25], baseRot: [0.45, 0.5, -0.2], drift: [0.24, 0.36, 0.18], scale: 1.12, phase: 1.7 },
  { id: "hex-4", basePos: [-5.5, -1.9, -1.2], baseRot: [0.75, 0.25, 0.35], drift: [0.32, 0.3, 0.15], scale: 0.98, phase: 2.5 },
  { id: "hex-5", basePos: [-4.3, -3.15, -2.5], baseRot: [1.1, -0.3, 0.15], drift: [0.38, 0.24, 0.14], scale: 0.88, phase: 3.3 },
  { id: "hex-6", basePos: [-6.2, -2.85, 0.3], baseRot: [0.55, 0.4, -0.35], drift: [0.28, 0.32, 0.16], scale: 1.02, phase: 4.1 },
  { id: "hex-7", basePos: [-1.1, 3.65, -3.1], baseRot: [1.2, 0.15, 0.25], drift: [0.42, 0.18, 0.12], scale: 0.86, phase: 4.9 },
  { id: "hex-8", basePos: [1.2, -3.55, -2.9], baseRot: [1.05, -0.2, -0.2], drift: [0.4, 0.2, 0.12], scale: 0.9, phase: 5.5 },
  { id: "hex-9", basePos: [5.5, 2.95, -0.6], baseRot: [0.65, -0.35, -0.25], drift: [0.32, 0.28, 0.16], scale: 1.08, phase: 0.6 },
  { id: "hex-10", basePos: [4.2, 3.4, -2.3], baseRot: [0.95, 0.2, -0.4], drift: [0.35, 0.24, 0.14], scale: 0.9, phase: 1.4 },
  { id: "hex-11", basePos: [6.55, 0.6, 0.35], baseRot: [0.5, -0.48, 0.2], drift: [0.25, 0.38, 0.18], scale: 1.15, phase: 2.2 },
  { id: "hex-12", basePos: [5.25, -1.65, -1.4], baseRot: [0.8, -0.3, -0.3], drift: [0.3, 0.32, 0.15], scale: 1.0, phase: 3.0 },
  { id: "hex-13", basePos: [6.1, -2.85, 0.25], baseRot: [0.58, -0.42, 0.32], drift: [0.32, 0.28, 0.16], scale: 1.04, phase: 3.8 },
  { id: "hex-14", basePos: [4.45, -3.25, -2.7], baseRot: [1.08, 0.25, -0.18], drift: [0.36, 0.22, 0.12], scale: 0.85, phase: 4.6 },
];

const CANVAS_GL = { antialias: true, alpha: true } as const;
const CAMERA_CONFIG = {
  position: [0, 0, 12] as [number, number, number],
  fov: 40,
  near: 0.1,
  far: 100,
};

interface HexagonsSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  speedMultiplier: number;
  strokeWidth: number;
  aspectRatio: AspectRatio;
}

const HexagonsScene: React.FC<HexagonsSceneProps> = ({
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

  const geometries = useMemo(
    () => ({
      hexTile: new CylinderGeometry(0.95, 0.95, 0.16, 6),
      hexRim: new TorusGeometry(0.96, 0.024 * strokeWidth, 12, 6),
    }),
    [strokeWidth],
  );

  const materials = useMemo(
    () => ({
      glassHex: new MeshPhysicalMaterial({
        color: palette.glassColor,
        transmission: 0.86,
        transparent: true,
        opacity: 1,
        roughness: 0.18,
        metalness: 0.04,
        thickness: 0.8,
        ior: 1.48,
        clearcoat: 0.95,
        clearcoatRoughness: 0.08,
      }),
      rim: new MeshStandardMaterial({
        color: palette.rimColor,
        roughness: 0.25,
        metalness: 0.45,
        transparent: true,
        opacity: 0.72,
      }),
    }),
    [palette.glassColor, palette.rimColor],
  );

  useEffect(() => {
    return () => {
      geometries.hexTile.dispose();
      geometries.hexRim.dispose();
    };
  }, [geometries]);

  useEffect(() => {
    return () => {
      materials.glassHex.dispose();
      materials.rim.dispose();
    };
  }, [materials]);

  return (
    <>
      <fog attach="fog" args={[palette.fogColor, 11, 25]} />
      <ambientLight intensity={0.95} color="#FFFFFF" />
      <hemisphereLight args={["#FFFFFF", palette.bgBottom, 0.75]} />
      <directionalLight position={[9, 12, 10]} intensity={1.65} color="#FFFFFF" />
      <directionalLight
        position={[-10, -4, 8]}
        intensity={1.05}
        color={palette.rimColor}
      />
      <directionalLight
        position={[4, 8, -10]}
        intensity={0.95}
        color={palette.accentLight}
      />

      {HEX_TILE_SPECS.map((hex) => {
        const phase = loopAngle + hex.phase;
        return (
          <group
            key={hex.id}
            position={[
              hex.basePos[0] * aspectXScale + Math.cos(phase) * hex.drift[0],
              hex.basePos[1] + Math.sin(phase) * hex.drift[1],
              hex.basePos[2] + Math.sin(phase + 0.7) * hex.drift[2],
            ]}
            rotation={[
              hex.baseRot[0] + Math.sin(phase) * 0.18,
              hex.baseRot[1] + Math.cos(phase) * 0.22,
              hex.baseRot[2] + Math.sin(phase * 2) * 0.1,
            ]}
            scale={[hex.scale, hex.scale, hex.scale]}
          >
            <mesh geometry={geometries.hexTile} material={materials.glassHex} />
            <mesh
              geometry={geometries.hexRim}
              material={materials.rim}
              rotation={[Math.PI / 2, 0, Math.PI / 2]}
            />
          </group>
        );
      })}
    </>
  );
};

export const FloatingGlassHexagons4K: React.FC<
  FloatingGlassHexagons4KProps
> = (props) => {
  const {
    themePreset = "clean-corporate",
    aspectRatio = "16:9",
    backgroundColor = "#F8FAFC",
    primaryColor = "#E0F2FE",
    secondaryColor = "#3B82F6",
    accentColor = "#0EA5E9",
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
            id="hexagons-bg-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={palette.bgTop} />
            <stop offset="100%" stopColor={palette.bgBottom} />
          </linearGradient>
          <filter
            id="hexagons-grain"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed="71"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width={width} height={height} fill="url(#hexagons-bg-grad)" />
        <rect
          width={width}
          height={height}
          filter="url(#hexagons-grain)"
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
        <HexagonsScene
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

