import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  CylinderGeometry,
  MeshStandardMaterial,
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

export const abstractOrigamiHelix4KSchema = z.object({
  themePreset: themePresetSchema.default("clean-corporate"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#F8FAFC"),
  primaryColor: z.string().default("#E2E8F0"),
  secondaryColor: z.string().default("#3B82F6"),
  accentColor: z.string().default("#0EA5E9"),
  speedMultiplier: z.number().int().positive().default(1),
  strokeWidth: z.number().min(0.4).max(2.5).default(1),
});

export type AbstractOrigamiHelix4KProps = z.infer<
  typeof abstractOrigamiHelix4KSchema
>;

export const defaultAbstractOrigamiHelix4KProps: AbstractOrigamiHelix4KProps = {
  themePreset: "clean-corporate",
  aspectRatio: "16:9",
  backgroundColor: "#F8FAFC",
  primaryColor: "#E2E8F0",
  secondaryColor: "#3B82F6",
  accentColor: "#0EA5E9",
  speedMultiplier: 1,
  strokeWidth: 1,
};

export const abstractOrigamiHelix4KVariations: Record<
  ThemePreset,
  AbstractOrigamiHelix4KProps
> = {
  "clean-corporate": defaultAbstractOrigamiHelix4KProps,
  "dark-tech": {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "#060B18",
    primaryColor: "#1E293B",
    secondaryColor: "#38BDF8",
    accentColor: "#6366F1",
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "#FAF7F2",
    primaryColor: "#EFE5D7",
    secondaryColor: "#E07A5F",
    accentColor: "#F2CC8F",
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "#0D0D10",
    primaryColor: "#1D1D23",
    secondaryColor: "#D4AF37",
    accentColor: "#F3D37A",
    speedMultiplier: 1,
    strokeWidth: 1,
  },
};

interface ThemePalette {
  bgTop: string;
  bgBottom: string;
  facetA: string;
  facetB: string;
  rungColor: string;
  wireColor: string;
  fogColor: string;
  ambientIntensity: number;
}

const THEME_PALETTES: Record<ThemePreset, ThemePalette> = {
  "clean-corporate": {
    bgTop: "#FFFFFF",
    bgBottom: "#E7EFF9",
    facetA: "#F1F5F9",
    facetB: "#3B82F6",
    rungColor: "#0EA5E9",
    wireColor: "#FFFFFF",
    fogColor: "#F0F5FC",
    ambientIntensity: 0.9,
  },
  "dark-tech": {
    bgTop: "#091124",
    bgBottom: "#040814",
    facetA: "#1E293B",
    facetB: "#38BDF8",
    rungColor: "#6366F1",
    wireColor: "#7DD3FC",
    fogColor: "#060B1A",
    ambientIntensity: 0.58,
  },
  "warm-minimalist": {
    bgTop: "#FDFBF7",
    bgBottom: "#EFE3D3",
    facetA: "#F4ECE1",
    facetB: "#E07A5F",
    rungColor: "#F2CC8F",
    wireColor: "#FFFFFF",
    fogColor: "#F5EEE3",
    ambientIntensity: 0.94,
  },
  "monochrome-luxury": {
    bgTop: "#141418",
    bgBottom: "#08080A",
    facetA: "#1D1D23",
    facetB: "#D4AF37",
    rungColor: "#F3D37A",
    wireColor: "#FDE68A",
    fogColor: "#0D0D10",
    ambientIntensity: 0.48,
  },
};

const resolvePalette = (props: AbstractOrigamiHelix4KProps): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  return {
    ...base,
    bgTop:
      props.backgroundColor !==
      defaultAbstractOrigamiHelix4KProps.backgroundColor
        ? props.backgroundColor
        : base.bgTop,
    facetA:
      props.primaryColor !== defaultAbstractOrigamiHelix4KProps.primaryColor
        ? props.primaryColor
        : base.facetA,
    facetB:
      props.secondaryColor !==
      defaultAbstractOrigamiHelix4KProps.secondaryColor
        ? props.secondaryColor
        : base.facetB,
    rungColor:
      props.accentColor !== defaultAbstractOrigamiHelix4KProps.accentColor
        ? props.accentColor
        : base.rungColor,
  };
};

const PAIR_COUNT = 18;
const HELIX_RADIUS = 1.45;
const HELIX_PITCH = 0.54;

const CANVAS_GL = { antialias: true, alpha: true } as const;
const CAMERA_CONFIG = {
  position: [0, 0, 12] as [number, number, number],
  fov: 40,
  near: 0.1,
  far: 100,
};

interface HelixSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  speedMultiplier: number;
  strokeWidth: number;
  aspectRatio: AspectRatio;
}

const HelixScene: React.FC<HelixSceneProps> = ({
  frame,
  durationInFrames,
  palette,
  speedMultiplier,
  strokeWidth,
  aspectRatio,
}) => {
  const progress = (frame % durationInFrames) / durationInFrames;
  const loopAngle = progress * Math.PI * 2 * speedMultiplier;

  const pairIndices = useMemo(
    () => Array.from({ length: PAIR_COUNT }, (_, idx) => idx),
    [],
  );

  const geometries = useMemo(
    () => ({
      facet: new CylinderGeometry(0.48, 0.22, 0.92, 3, 1),
      facetWire: new CylinderGeometry(0.495, 0.235, 0.94, 3, 1),
      rung: new CylinderGeometry(
        0.028 * strokeWidth,
        0.028 * strokeWidth,
        HELIX_RADIUS * 2,
        12,
      ),
    }),
    [strokeWidth],
  );

  const materials = useMemo(
    () => ({
      facetA: new MeshStandardMaterial({
        color: palette.facetA,
        flatShading: true,
        roughness: 0.54,
        metalness: 0.08,
      }),
      facetB: new MeshStandardMaterial({
        color: palette.facetB,
        flatShading: true,
        roughness: 0.46,
        metalness: 0.14,
      }),
      rung: new MeshStandardMaterial({
        color: palette.rungColor,
        roughness: 0.32,
        metalness: 0.35,
      }),
      wire: new MeshStandardMaterial({
        color: palette.wireColor,
        wireframe: true,
        transparent: true,
        opacity: Math.min(0.45, 0.22 * strokeWidth),
      }),
    }),
    [
      palette.facetA,
      palette.facetB,
      palette.rungColor,
      palette.wireColor,
      strokeWidth,
    ],
  );

  useEffect(() => {
    return () => {
      geometries.facet.dispose();
      geometries.facetWire.dispose();
      geometries.rung.dispose();
    };
  }, [geometries]);

  useEffect(() => {
    return () => {
      materials.facetA.dispose();
      materials.facetB.dispose();
      materials.rung.dispose();
      materials.wire.dispose();
    };
  }, [materials]);

  const offsetX = aspectRatio === "9:16" ? 0 : 2.35;
  const helixScale = aspectRatio === "9:16" ? 0.78 : 1;

  return (
    <>
      <fog attach="fog" args={[palette.fogColor, 11, 25]} />
      <ambientLight intensity={palette.ambientIntensity} color="#FFFFFF" />
      <hemisphereLight args={["#FFFFFF", palette.bgBottom, 0.72]} />
      <directionalLight position={[9, 12, 10]} intensity={1.55} color="#FFFFFF" />
      <directionalLight
        position={[-10, -4, 8]}
        intensity={0.95}
        color={palette.facetB}
      />
      <directionalLight
        position={[4, 8, -10]}
        intensity={0.85}
        color={palette.rungColor}
      />

      <group
        position={[offsetX, 0, -0.5]}
        rotation={[0.22, 0, -0.34]}
        scale={[helixScale, helixScale, helixScale]}
      >
        {pairIndices.map((idx) => {
          const y = (idx - (PAIR_COUNT - 1) / 2) * HELIX_PITCH;
          const theta = idx * 0.42 + loopAngle;
          const xA = Math.cos(theta) * HELIX_RADIUS;
          const zA = Math.sin(theta) * HELIX_RADIUS;
          const xB = -xA;
          const zB = -zA;

          return (
            <group key={`helix-pair-${idx}`}>
              {/* Strand A folded origami prism */}
              <group
                position={[xA, y, zA]}
                rotation={[0.35, -theta, 0.28]}
              >
                <mesh geometry={geometries.facet} material={materials.facetA} />
                <mesh geometry={geometries.facetWire} material={materials.wire} />
              </group>

              {/* Strand B folded origami prism */}
              <group
                position={[xB, y, zB]}
                rotation={[-0.35, -theta + Math.PI, -0.28]}
              >
                <mesh geometry={geometries.facet} material={materials.facetB} />
                <mesh geometry={geometries.facetWire} material={materials.wire} />
              </group>

              {/* Connecting structural rung */}
              <mesh
                geometry={geometries.rung}
                material={materials.rung}
                position={[0, y, 0]}
                rotation={[0, -theta, Math.PI / 2]}
              />
            </group>
          );
        })}
      </group>
    </>
  );
};

export const AbstractOrigamiHelix4K: React.FC<AbstractOrigamiHelix4KProps> = (
  props,
) => {
  const {
    themePreset = "clean-corporate",
    aspectRatio = "16:9",
    backgroundColor = "#F8FAFC",
    primaryColor = "#E2E8F0",
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
            id="helix-bg-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={palette.bgTop} />
            <stop offset="100%" stopColor={palette.bgBottom} />
          </linearGradient>
          <filter id="helix-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed="89"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width={width} height={height} fill="url(#helix-bg-grad)" />
        <rect
          width={width}
          height={height}
          filter="url(#helix-grain)"
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
        <HelixScene
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

