import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  CapsuleGeometry,
  CylinderGeometry,
  MeshPhysicalMaterial,
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

export const refractiveGlassPrisms4KSchema = z.object({
  themePreset: themePresetSchema.default("clean-corporate"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#F8FAFC"),
  primaryColor: z.string().default("#E0F2FE"),
  secondaryColor: z.string().default("#3B82F6"),
  accentColor: z.string().default("#06B6D4"),
  speedMultiplier: z.number().int().positive().default(1),
  strokeWidth: z.number().min(0.4).max(2.5).default(1),
});

export type RefractiveGlassPrisms4KProps = z.infer<
  typeof refractiveGlassPrisms4KSchema
>;

export const defaultRefractiveGlassPrisms4KProps: RefractiveGlassPrisms4KProps =
  {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "#F8FAFC",
    primaryColor: "#E0F2FE",
    secondaryColor: "#3B82F6",
    accentColor: "#06B6D4",
    speedMultiplier: 1,
    strokeWidth: 1,
  };

export const refractiveGlassPrisms4KVariations: Record<
  ThemePreset,
  RefractiveGlassPrisms4KProps
> = {
  "clean-corporate": defaultRefractiveGlassPrisms4KProps,
  "dark-tech": {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "#060B18",
    primaryColor: "#BAE6FD",
    secondaryColor: "#38BDF8",
    accentColor: "#818CF8",
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "#FAF7F2",
    primaryColor: "#FFF3E2",
    secondaryColor: "#E07A5F",
    accentColor: "#F2CC8F",
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "#0D0D10",
    primaryColor: "#F4F4F5",
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
  beamPrimary: string;
  beamSecondary: string;
  edgeColor: string;
  fogColor: string;
  ambientIntensity: number;
  keyIntensity: number;
}

const THEME_PALETTES: Record<ThemePreset, ThemePalette> = {
  "clean-corporate": {
    bgTop: "#FFFFFF",
    bgBottom: "#E6EEF9",
    glassColor: "#F0F9FF",
    beamPrimary: "#3B82F6",
    beamSecondary: "#06B6D4",
    edgeColor: "#FFFFFF",
    fogColor: "#F0F5FC",
    ambientIntensity: 1.0,
    keyIntensity: 1.6,
  },
  "dark-tech": {
    bgTop: "#091124",
    bgBottom: "#040814",
    glassColor: "#E0F2FE",
    beamPrimary: "#38BDF8",
    beamSecondary: "#818CF8",
    edgeColor: "#7DD3FC",
    fogColor: "#060B1A",
    ambientIntensity: 0.7,
    keyIntensity: 1.8,
  },
  "warm-minimalist": {
    bgTop: "#FDFBF7",
    bgBottom: "#EFE4D6",
    glassColor: "#FFF9F0",
    beamPrimary: "#E07A5F",
    beamSecondary: "#F2CC8F",
    edgeColor: "#FFFFFF",
    fogColor: "#F5EEE3",
    ambientIntensity: 0.98,
    keyIntensity: 1.5,
  },
  "monochrome-luxury": {
    bgTop: "#141418",
    bgBottom: "#08080B",
    glassColor: "#FAFAFA",
    beamPrimary: "#D4AF37",
    beamSecondary: "#F3D37A",
    edgeColor: "#FDE68A",
    fogColor: "#0D0D10",
    ambientIntensity: 0.58,
    keyIntensity: 1.75,
  },
};

const resolvePalette = (props: RefractiveGlassPrisms4KProps): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  return {
    ...base,
    bgTop:
      props.backgroundColor !==
      defaultRefractiveGlassPrisms4KProps.backgroundColor
        ? props.backgroundColor
        : base.bgTop,
    glassColor:
      props.primaryColor !== defaultRefractiveGlassPrisms4KProps.primaryColor
        ? props.primaryColor
        : base.glassColor,
    beamPrimary:
      props.secondaryColor !==
      defaultRefractiveGlassPrisms4KProps.secondaryColor
        ? props.secondaryColor
        : base.beamPrimary,
    beamSecondary:
      props.accentColor !== defaultRefractiveGlassPrisms4KProps.accentColor
        ? props.accentColor
        : base.beamSecondary,
  };
};

interface PrismSpec {
  id: string;
  basePos: [number, number, number];
  baseRot: [number, number, number];
  fullTurns: [number, number, number];
  scale: [number, number, number];
  phase: number;
}

// 5 large beveled triangular glass prisms arranged with clean center copy zone
const PRISM_SPECS: readonly PrismSpec[] = [
  {
    id: "prism-tl",
    basePos: [-5.5, 2.35, -0.4],
    baseRot: [0.42, 0.25, -0.48],
    fullTurns: [0, 1, 0],
    scale: [1.35, 1.45, 1.35],
    phase: 0.2,
  },
  {
    id: "prism-bl",
    basePos: [-4.85, -2.55, -1.1],
    baseRot: [-0.35, 0.55, 0.62],
    fullTurns: [1, 0, 0],
    scale: [1.2, 1.3, 1.2],
    phase: 1.5,
  },
  {
    id: "prism-tr",
    basePos: [5.4, 2.5, -0.9],
    baseRot: [0.28, -0.48, 0.52],
    fullTurns: [0, -1, 0],
    scale: [1.28, 1.4, 1.28],
    phase: 2.7,
  },
  {
    id: "prism-br",
    basePos: [5.1, -2.1, 0.25],
    baseRot: [-0.46, -0.32, -0.42],
    fullTurns: [0, 1, 0],
    scale: [1.45, 1.55, 1.45],
    phase: 3.9,
  },
  {
    id: "prism-top-horizon",
    basePos: [0.4, 3.6, -2.8],
    baseRot: [0.65, 0.15, 1.25],
    fullTurns: [0, 0, 1],
    scale: [1.15, 1.5, 1.15],
    phase: 5.1,
  },
];

const CANVAS_GL = { antialias: true, alpha: true } as const;
const CAMERA_CONFIG = {
  position: [0, 0, 12] as [number, number, number],
  fov: 40,
  near: 0.1,
  far: 100,
};

interface PrismsSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  speedMultiplier: number;
  strokeWidth: number;
  aspectRatio: AspectRatio;
}

const PrismsScene: React.FC<PrismsSceneProps> = ({
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
      prismBody: new CylinderGeometry(1.15, 1.15, 2.6, 3, 1),
      prismInnerCore: new CylinderGeometry(1.17, 1.17, 2.62, 3, 1),
      lightBeam: new CapsuleGeometry(0.18, 8.5, 16, 24),
    }),
    [],
  );

  const materials = useMemo(
    () => ({
      prismGlass: new MeshPhysicalMaterial({
        color: palette.glassColor,
        transmission: 0.92,
        opacity: 1,
        transparent: true,
        roughness: 0.08,
        metalness: 0.02,
        thickness: 1.8,
        ior: 1.52,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        iridescence: 0.65,
        iridescenceIOR: 1.35,
      }),
      prismEdge: new MeshStandardMaterial({
        color: palette.edgeColor,
        wireframe: true,
        transparent: true,
        opacity: Math.min(0.4, 0.18 * strokeWidth),
        roughness: 0.2,
        metalness: 0.5,
      }),
      beamPrimary: new MeshStandardMaterial({
        color: palette.beamPrimary,
        emissive: palette.beamPrimary,
        emissiveIntensity: 0.45,
        roughness: 0.35,
      }),
      beamSecondary: new MeshStandardMaterial({
        color: palette.beamSecondary,
        emissive: palette.beamSecondary,
        emissiveIntensity: 0.45,
        roughness: 0.35,
      }),
    }),
    [
      palette.glassColor,
      palette.edgeColor,
      palette.beamPrimary,
      palette.beamSecondary,
      strokeWidth,
    ],
  );

  useEffect(() => {
    return () => {
      geometries.prismBody.dispose();
      geometries.prismInnerCore.dispose();
      geometries.lightBeam.dispose();
    };
  }, [geometries]);

  useEffect(() => {
    return () => {
      materials.prismGlass.dispose();
      materials.prismEdge.dispose();
      materials.beamPrimary.dispose();
      materials.beamSecondary.dispose();
    };
  }, [materials]);

  return (
    <>
      <fog attach="fog" args={[palette.fogColor, 11, 25]} />
      <ambientLight intensity={palette.ambientIntensity} color="#FFFFFF" />
      <hemisphereLight args={["#FFFFFF", palette.bgBottom, 0.68]} />
      <directionalLight
        position={[9, 12, 10]}
        intensity={palette.keyIntensity}
        color="#FFFFFF"
      />
      <directionalLight
        position={[-10, -5, 8]}
        intensity={1.05}
        color={palette.beamPrimary}
      />
      <directionalLight
        position={[4, -8, -8]}
        intensity={0.95}
        color={palette.beamSecondary}
      />

      {/* Soft chromatic light bars behind prisms for refraction color */}
      <mesh
        geometry={geometries.lightBeam}
        material={materials.beamPrimary}
        position={[-5.2 * aspectXScale, 0, -4.4]}
        rotation={[0, 0, 0.65 + Math.sin(loopAngle) * 0.12]}
      />
      <mesh
        geometry={geometries.lightBeam}
        material={materials.beamSecondary}
        position={[5.2 * aspectXScale, 0, -4.4]}
        rotation={[0, 0, -0.65 + Math.cos(loopAngle) * 0.12]}
      />

      {/* 5 large rotating refractive glass prisms */}
      {PRISM_SPECS.map((prism) => {
        const phase = loopAngle + prism.phase;
        const posX = prism.basePos[0] * aspectXScale + Math.cos(phase) * 0.28;
        const posY = prism.basePos[1] + Math.sin(phase) * 0.34;
        const posZ = prism.basePos[2] + Math.sin(phase + 0.7) * 0.2;
        const rotX =
          prism.baseRot[0] +
          loopAngle * prism.fullTurns[0] +
          Math.sin(phase) * 0.15;
        const rotY =
          prism.baseRot[1] +
          loopAngle * prism.fullTurns[1] +
          Math.cos(phase) * 0.15;
        const rotZ =
          prism.baseRot[2] +
          loopAngle * prism.fullTurns[2] +
          Math.sin(phase * 2) * 0.08;

        return (
          <group
            key={prism.id}
            position={[posX, posY, posZ]}
            rotation={[rotX, rotY, rotZ]}
            scale={prism.scale}
          >
            <mesh geometry={geometries.prismBody} material={materials.prismGlass} />
            <mesh
              geometry={geometries.prismInnerCore}
              material={materials.prismEdge}
            />
          </group>
        );
      })}
    </>
  );
};

export const RefractiveGlassPrisms4K: React.FC<
  RefractiveGlassPrisms4KProps
> = (props) => {
  const {
    themePreset = "clean-corporate",
    aspectRatio = "16:9",
    backgroundColor = "#F8FAFC",
    primaryColor = "#E0F2FE",
    secondaryColor = "#3B82F6",
    accentColor = "#06B6D4",
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
            id="prisms-bg-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={palette.bgTop} />
            <stop offset="100%" stopColor={palette.bgBottom} />
          </linearGradient>
          <filter
            id="prisms-grain"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed="53"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width={width} height={height} fill="url(#prisms-bg-grad)" />
        <rect
          width={width}
          height={height}
          filter="url(#prisms-grain)"
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
        <PrismsScene
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

