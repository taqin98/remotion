import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import {
  AbsoluteFill,
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

export const iridescentLiquidSpheres4KSchema = z.object({
  themePreset: themePresetSchema.default("clean-corporate"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#F4F7FC"),
  primaryColor: z.string().default("#E0ECFF"),
  secondaryColor: z.string().default("#38BDF8"),
  accentColor: z.string().default("#A855F7"),
  displacementIntensity: z.number().min(0.02).max(0.4).default(0.14),
  speedMultiplier: z.number().int().positive().default(1),
  strokeWidth: z.number().min(0.4).max(2.5).default(1),
});

export type IridescentLiquidSpheres4KProps = z.infer<
  typeof iridescentLiquidSpheres4KSchema
>;

export const defaultIridescentLiquidSpheres4KProps: IridescentLiquidSpheres4KProps =
  {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "#F4F7FC",
    primaryColor: "#E0ECFF",
    secondaryColor: "#38BDF8",
    accentColor: "#A855F7",
    displacementIntensity: 0.14,
    speedMultiplier: 1,
    strokeWidth: 1,
  };

export const iridescentLiquidSpheres4KVariations: Record<
  ThemePreset,
  IridescentLiquidSpheres4KProps
> = {
  "clean-corporate": defaultIridescentLiquidSpheres4KProps,
  "dark-tech": {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "#060B1A",
    primaryColor: "#1E293B",
    secondaryColor: "#22D3EE",
    accentColor: "#818CF8",
    displacementIntensity: 0.14,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "#FAF6F0",
    primaryColor: "#FFF5EB",
    secondaryColor: "#E07A5F",
    accentColor: "#F2CC8F",
    displacementIntensity: 0.14,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "#0D0D10",
    primaryColor: "#1C1C22",
    secondaryColor: "#D4AF37",
    accentColor: "#F3D37A",
    displacementIntensity: 0.14,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
};

interface ThemePalette {
  bgTop: string;
  bgBottom: string;
  sphereBase: string;
  lightPrimary: string;
  lightAccent: string;
  fogColor: string;
  ambientIntensity: number;
}

const THEME_PALETTES: Record<ThemePreset, ThemePalette> = {
  "clean-corporate": {
    bgTop: "#FFFFFF",
    bgBottom: "#E6EEF9",
    sphereBase: "#EFF6FF",
    lightPrimary: "#38BDF8",
    lightAccent: "#C084FC",
    fogColor: "#F0F5FC",
    ambientIntensity: 0.95,
  },
  "dark-tech": {
    bgTop: "#091124",
    bgBottom: "#040814",
    sphereBase: "#1E293B",
    lightPrimary: "#22D3EE",
    lightAccent: "#818CF8",
    fogColor: "#060B1A",
    ambientIntensity: 0.65,
  },
  "warm-minimalist": {
    bgTop: "#FDFBF7",
    bgBottom: "#EFE3D3",
    sphereBase: "#FFF6EB",
    lightPrimary: "#E07A5F",
    lightAccent: "#F2CC8F",
    fogColor: "#F5EEE3",
    ambientIntensity: 0.95,
  },
  "monochrome-luxury": {
    bgTop: "#141418",
    bgBottom: "#08080A",
    sphereBase: "#1C1C22",
    lightPrimary: "#D4AF37",
    lightAccent: "#F3D37A",
    fogColor: "#0D0D10",
    ambientIntensity: 0.55,
  },
};

const resolvePalette = (
  props: IridescentLiquidSpheres4KProps,
): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  return {
    ...base,
    bgTop:
      props.backgroundColor !==
      defaultIridescentLiquidSpheres4KProps.backgroundColor
        ? props.backgroundColor
        : base.bgTop,
    sphereBase:
      props.primaryColor !== defaultIridescentLiquidSpheres4KProps.primaryColor
        ? props.primaryColor
        : base.sphereBase,
    lightPrimary:
      props.secondaryColor !==
      defaultIridescentLiquidSpheres4KProps.secondaryColor
        ? props.secondaryColor
        : base.lightPrimary,
    lightAccent:
      props.accentColor !== defaultIridescentLiquidSpheres4KProps.accentColor
        ? props.accentColor
        : base.lightAccent,
  };
};

interface LiquidSphereSpec {
  id: string;
  basePos: [number, number, number];
  orbit: [number, number, number];
  radius: number;
  phase: number;
}

// 6 liquid spheres orbiting outer edges keeping center clear
const LIQUID_SPHERE_SPECS: readonly LiquidSphereSpec[] = [
  {
    id: "liq-tl",
    basePos: [-5.6, 2.55, -0.4],
    orbit: [0.45, 0.35, 0.25],
    radius: 1.35,
    phase: 0.1,
  },
  {
    id: "liq-bl",
    basePos: [-5.1, -2.5, -1.2],
    orbit: [0.38, 0.42, 0.2],
    radius: 1.15,
    phase: 1.3,
  },
  {
    id: "liq-tr",
    basePos: [5.5, 2.45, -1.0],
    orbit: [0.4, 0.32, 0.22],
    radius: 1.25,
    phase: 2.5,
  },
  {
    id: "liq-br",
    basePos: [5.45, -2.25, 0.35],
    orbit: [0.45, 0.38, 0.25],
    radius: 1.48,
    phase: 3.7,
  },
  {
    id: "liq-top-mid",
    basePos: [-0.8, 3.65, -2.9],
    orbit: [0.55, 0.22, 0.18],
    radius: 0.92,
    phase: 4.8,
  },
  {
    id: "liq-bot-mid",
    basePos: [1.1, -3.55, -2.7],
    orbit: [0.52, 0.24, 0.18],
    radius: 0.98,
    phase: 5.6,
  },
];

const displaceLiquidSphere = (
  geometry: SphereGeometry,
  initialPositions: Float32Array,
  loopAngle: number,
  intensity: number,
): void => {
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const offset = i * 3;
    const bx = initialPositions[offset];
    const by = initialPositions[offset + 1];
    const bz = initialPositions[offset + 2];

    const wave1 = Math.sin(loopAngle + bx * 2.4 + by * 2.1);
    const wave2 = Math.cos(loopAngle - bz * 2.3 + by * 1.9);
    const radialScale = 1 + (wave1 * 0.6 + wave2 * 0.4) * intensity;

    position.setXYZ(i, bx * radialScale, by * radialScale, bz * radialScale);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
};

const CANVAS_GL = { antialias: true, alpha: true } as const;
const CAMERA_CONFIG = {
  position: [0, 0, 12] as [number, number, number],
  fov: 40,
  near: 0.1,
  far: 100,
};

interface LiquidSpheresSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  displacementIntensity: number;
  speedMultiplier: number;
  aspectRatio: AspectRatio;
}

const LiquidSpheresScene: React.FC<LiquidSpheresSceneProps> = ({
  frame,
  durationInFrames,
  palette,
  displacementIntensity,
  speedMultiplier,
  aspectRatio,
}) => {
  const progress = (frame % durationInFrames) / durationInFrames;
  const loopAngle = progress * Math.PI * 2 * speedMultiplier;
  const aspectXScale = aspectRatio === "9:16" ? 0.45 : 1;

  const { sphereGeometry, initialPositions } = useMemo(() => {
    const geometry = new SphereGeometry(1, 48, 48);
    const snapshot = new Float32Array(geometry.attributes.position.array);
    return { sphereGeometry: geometry, initialPositions: snapshot };
  }, []);

  const liquidMaterial = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: palette.sphereBase,
        roughness: 0.12,
        metalness: 0.25,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        iridescence: 1.0,
        iridescenceIOR: 1.35,
        iridescenceThicknessRange: [120, 620],
        reflectivity: 0.95,
      }),
    [palette.sphereBase],
  );

  useLayoutEffect(() => {
    displaceLiquidSphere(
      sphereGeometry,
      initialPositions,
      loopAngle,
      displacementIntensity,
    );
  }, [sphereGeometry, initialPositions, loopAngle, displacementIntensity]);

  useEffect(() => {
    return () => {
      sphereGeometry.dispose();
    };
  }, [sphereGeometry]);

  useEffect(() => {
    return () => {
      liquidMaterial.dispose();
    };
  }, [liquidMaterial]);

  return (
    <>
      <fog attach="fog" args={[palette.fogColor, 11, 25]} />
      <ambientLight intensity={palette.ambientIntensity} color="#FFFFFF" />
      <hemisphereLight args={["#FFFFFF", palette.bgBottom, 0.72]} />
      <directionalLight position={[9, 12, 10]} intensity={1.55} color="#FFFFFF" />
      <directionalLight
        position={[-10, -4, 8]}
        intensity={1.15}
        color={palette.lightPrimary}
      />
      <directionalLight
        position={[4, 8, -10]}
        intensity={1.1}
        color={palette.lightAccent}
      />

      {LIQUID_SPHERE_SPECS.map((spec) => {
        const phase = loopAngle + spec.phase;
        return (
          <mesh
            key={spec.id}
            geometry={sphereGeometry}
            material={liquidMaterial}
            position={[
              spec.basePos[0] * aspectXScale + Math.cos(phase) * spec.orbit[0],
              spec.basePos[1] + Math.sin(phase) * spec.orbit[1],
              spec.basePos[2] + Math.sin(phase + 0.8) * spec.orbit[2],
            ]}
            rotation={[
              Math.sin(phase) * 0.4,
              loopAngle + spec.phase,
              Math.cos(phase) * 0.3,
            ]}
            scale={[spec.radius, spec.radius, spec.radius]}
          />
        );
      })}
    </>
  );
};

export const IridescentLiquidSpheres4K: React.FC<
  IridescentLiquidSpheres4KProps
> = (props) => {
  const {
    themePreset = "clean-corporate",
    aspectRatio = "16:9",
    backgroundColor = "#F4F7FC",
    primaryColor = "#E0ECFF",
    secondaryColor = "#38BDF8",
    accentColor = "#A855F7",
    displacementIntensity = 0.14,
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
        displacementIntensity,
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
      displacementIntensity,
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
            id="liquid-spheres-bg-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={palette.bgTop} />
            <stop offset="100%" stopColor={palette.bgBottom} />
          </linearGradient>
          <filter
            id="liquid-spheres-grain"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed="59"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect
          width={width}
          height={height}
          fill="url(#liquid-spheres-bg-grad)"
        />
        <rect
          width={width}
          height={height}
          filter="url(#liquid-spheres-grain)"
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
        <LiquidSpheresScene
          frame={frame}
          durationInFrames={durationInFrames}
          palette={palette}
          displacementIntensity={displacementIntensity}
          speedMultiplier={speedMultiplier}
          aspectRatio={aspectRatio}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

