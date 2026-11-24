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
  SphereGeometry,
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

export const floatingMinimalistArches4KSchema = z.object({
  themePreset: themePresetSchema.default("clean-corporate"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#F8FAFC"),
  primaryColor: z.string().default("#1E293B"),
  secondaryColor: z.string().default("#3B82F6"),
  accentColor: z.string().default("#0EA5E9"),
  floatAmplitude: z.number().min(0.05).max(1.5).default(0.42),
  speedMultiplier: z.number().int().positive().default(1),
});

export type FloatingMinimalistArches4KProps = z.infer<
  typeof floatingMinimalistArches4KSchema
>;

export const defaultFloatingMinimalistArches4KProps: FloatingMinimalistArches4KProps =
  {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "#F8FAFC",
    primaryColor: "#1E293B",
    secondaryColor: "#3B82F6",
    accentColor: "#0EA5E9",
    floatAmplitude: 0.42,
    speedMultiplier: 1,
  };

export const floatingMinimalistArches4KVariations: Record<
  ThemePreset,
  FloatingMinimalistArches4KProps
> = {
  "clean-corporate": defaultFloatingMinimalistArches4KProps,
  "dark-tech": {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "#070D1D",
    primaryColor: "#1E293B",
    secondaryColor: "#06B6D4",
    accentColor: "#6366F1",
    floatAmplitude: 0.42,
    speedMultiplier: 1,
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "#FAF7F2",
    primaryColor: "#E07A5F",
    secondaryColor: "#D4A373",
    accentColor: "#F2CC8F",
    floatAmplitude: 0.42,
    speedMultiplier: 1,
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "#101012",
    primaryColor: "#18181B",
    secondaryColor: "#D4AF37",
    accentColor: "#F3D37A",
    floatAmplitude: 0.42,
    speedMultiplier: 1,
  },
};

interface ThemePalette {
  bgTop: string;
  bgBottom: string;
  bgGlow: string;
  bgGlowOpacity: number;
  fogColor: string;
  archBodyLight: string;
  archBodyMain: string;
  archTrim: string;
  ambientIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  keyColor: string;
  keyIntensity: number;
  fillColor: string;
  fillIntensity: number;
  rimColor: string;
  rimIntensity: number;
}

const THEME_PALETTES: Record<ThemePreset, ThemePalette> = {
  "clean-corporate": {
    bgTop: "#FFFFFF",
    bgBottom: "#E8EFF7",
    bgGlow: "#3B82F6",
    bgGlowOpacity: 0.08,
    fogColor: "#F1F5FA",
    archBodyLight: "#E2E8F0",
    archBodyMain: "#CBD5E1",
    archTrim: "#3B82F6",
    ambientIntensity: 0.9,
    hemiSky: "#FFFFFF",
    hemiGround: "#CBD5E1",
    hemiIntensity: 0.72,
    keyColor: "#FFFDF9",
    keyIntensity: 1.4,
    fillColor: "#DBEAFE",
    fillIntensity: 0.72,
    rimColor: "#FFFFFF",
    rimIntensity: 0.95,
  },
  "dark-tech": {
    bgTop: "#0B1328",
    bgBottom: "#040814",
    bgGlow: "#06B6D4",
    bgGlowOpacity: 0.14,
    fogColor: "#060D1E",
    archBodyLight: "#1E293B",
    archBodyMain: "#0F172A",
    archTrim: "#06B6D4",
    ambientIntensity: 0.55,
    hemiSky: "#38BDF8",
    hemiGround: "#020617",
    hemiIntensity: 0.58,
    keyColor: "#E0F2FE",
    keyIntensity: 1.5,
    fillColor: "#6366F1",
    fillIntensity: 0.85,
    rimColor: "#22D3EE",
    rimIntensity: 1.25,
  },
  "warm-minimalist": {
    bgTop: "#FDFBF7",
    bgBottom: "#EEE3D4",
    bgGlow: "#E07A5F",
    bgGlowOpacity: 0.09,
    fogColor: "#F4EDE2",
    archBodyLight: "#F2E9DF",
    archBodyMain: "#E5D5C3",
    archTrim: "#E07A5F",
    ambientIntensity: 0.95,
    hemiSky: "#FFFDF9",
    hemiGround: "#D6C5B0",
    hemiIntensity: 0.76,
    keyColor: "#FFF7EB",
    keyIntensity: 1.32,
    fillColor: "#F5E1C8",
    fillIntensity: 0.68,
    rimColor: "#FFFFFF",
    rimIntensity: 0.85,
  },
  "monochrome-luxury": {
    bgTop: "#17171B",
    bgBottom: "#09090B",
    bgGlow: "#D4AF37",
    bgGlowOpacity: 0.11,
    fogColor: "#0D0D10",
    archBodyLight: "#27272C",
    archBodyMain: "#16161A",
    archTrim: "#D4AF37",
    ambientIntensity: 0.45,
    hemiSky: "#FDE68A",
    hemiGround: "#09090B",
    hemiIntensity: 0.48,
    keyColor: "#FFF6DB",
    keyIntensity: 1.48,
    fillColor: "#52525B",
    fillIntensity: 0.65,
    rimColor: "#D4AF37",
    rimIntensity: 1.32,
  },
};

const resolveThemePalette = (
  props: FloatingMinimalistArches4KProps,
): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  const hasCustomBg =
    props.backgroundColor !==
    defaultFloatingMinimalistArches4KProps.backgroundColor;
  const hasCustomPrimary =
    props.primaryColor !== defaultFloatingMinimalistArches4KProps.primaryColor;
  const hasCustomSecondary =
    props.secondaryColor !==
    defaultFloatingMinimalistArches4KProps.secondaryColor;
  const hasCustomAccent =
    props.accentColor !== defaultFloatingMinimalistArches4KProps.accentColor;

  return {
    ...base,
    bgTop: hasCustomBg ? props.backgroundColor : base.bgTop,
    fogColor: hasCustomBg ? props.backgroundColor : base.fogColor,
    archBodyMain: hasCustomPrimary ? props.primaryColor : base.archBodyMain,
    archTrim: hasCustomSecondary
      ? props.secondaryColor
      : hasCustomAccent
        ? props.accentColor
        : base.archTrim,
  };
};

type ArchTone = "light" | "main";

interface ArchColonnadeSpec {
  id: string;
  baseX: number;
  baseY: number;
  baseZ: number;
  rotY: number;
  rotZ: number;
  scale: number;
  depthWeight: number;
  phase: number;
  tone: ArchTone;
}

// 8 matte ceramic arches arranged in perspective depth around clean center copy space
const ARCH_COLONNADE_SPECS: readonly ArchColonnadeSpec[] = [
  // Left perspective colonnade (4 arches)
  {
    id: "left-arch-1",
    baseX: -6.35,
    baseY: -0.55,
    baseZ: 0.6,
    rotY: 0.48,
    rotZ: -0.05,
    scale: 1.15,
    depthWeight: 1.15,
    phase: 0.0,
    tone: "light",
  },
  {
    id: "left-arch-2",
    baseX: -5.45,
    baseY: 0.35,
    baseZ: -1.3,
    rotY: 0.42,
    rotZ: 0.04,
    scale: 1.08,
    depthWeight: 0.98,
    phase: 1.1,
    tone: "main",
  },
  {
    id: "left-arch-3",
    baseX: -4.95,
    baseY: -0.35,
    baseZ: -3.2,
    rotY: 0.36,
    rotZ: -0.03,
    scale: 1.02,
    depthWeight: 0.85,
    phase: 2.2,
    tone: "light",
  },
  {
    id: "left-arch-4",
    baseX: -4.55,
    baseY: 0.45,
    baseZ: -5.2,
    rotY: 0.3,
    rotZ: 0.03,
    scale: 0.96,
    depthWeight: 0.72,
    phase: 3.3,
    tone: "main",
  },

  // Right perspective colonnade (4 arches)
  {
    id: "right-arch-1",
    baseX: 6.35,
    baseY: 0.45,
    baseZ: 0.6,
    rotY: -0.48,
    rotZ: 0.05,
    scale: 1.15,
    depthWeight: 1.15,
    phase: 0.65,
    tone: "main",
  },
  {
    id: "right-arch-2",
    baseX: 5.45,
    baseY: -0.4,
    baseZ: -1.3,
    rotY: -0.42,
    rotZ: -0.04,
    scale: 1.08,
    depthWeight: 0.98,
    phase: 1.75,
    tone: "light",
  },
  {
    id: "right-arch-3",
    baseX: 4.95,
    baseY: 0.3,
    baseZ: -3.2,
    rotY: -0.36,
    rotZ: 0.03,
    scale: 1.02,
    depthWeight: 0.85,
    phase: 2.85,
    tone: "main",
  },
  {
    id: "right-arch-4",
    baseX: 4.55,
    baseY: -0.45,
    baseZ: -5.2,
    rotY: -0.3,
    rotZ: -0.03,
    scale: 0.96,
    depthWeight: 0.72,
    phase: 3.95,
    tone: "light",
  },
];

const CANVAS_GL = { antialias: true, alpha: true } as const;
const CAMERA_CONFIG = {
  position: [0, 0, 12] as [number, number, number],
  fov: 40,
  near: 0.1,
  far: 100,
};

interface ArchGeometries {
  topTorus: TorusGeometry;
  column: CylinderGeometry;
  baseCap: SphereGeometry;
  innerTrim: TorusGeometry;
}

interface FloatingArchMeshProps {
  spec: ArchColonnadeSpec;
  loopAngle: number;
  floatAmplitude: number;
  aspectXScale: number;
  geometries: ArchGeometries;
  bodyMaterial: MeshStandardMaterial;
  trimMaterial: MeshStandardMaterial;
}

const FloatingArchMesh: React.FC<FloatingArchMeshProps> = ({
  spec,
  loopAngle,
  floatAmplitude,
  aspectXScale,
  geometries,
  bodyMaterial,
  trimMaterial,
}) => {
  const phaseAngle = loopAngle + spec.phase;
  const posX = spec.baseX * aspectXScale;
  const posY =
    spec.baseY + Math.sin(phaseAngle) * floatAmplitude * spec.depthWeight;
  const posZ = spec.baseZ + Math.cos(phaseAngle) * 0.14;

  const rotX = Math.sin(phaseAngle) * 0.04;
  const rotZ = spec.rotZ + Math.cos(phaseAngle) * 0.035;

  return (
    <group
      position={[posX, posY, posZ]}
      rotation={[rotX, spec.rotY, rotZ]}
      scale={[spec.scale, spec.scale, spec.scale]}
    >
      {/* Top semicircular ceramic arch */}
      <mesh
        geometry={geometries.topTorus}
        material={bodyMaterial}
        position={[0, 0.75, 0]}
        castShadow
        receiveShadow
      />
      {/* Left vertical column + rounded cap */}
      <mesh
        geometry={geometries.column}
        material={bodyMaterial}
        position={[-0.95, 0, 0]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={geometries.baseCap}
        material={bodyMaterial}
        position={[-0.95, -0.75, 0]}
        castShadow
        receiveShadow
      />
      {/* Right vertical column + rounded cap */}
      <mesh
        geometry={geometries.column}
        material={bodyMaterial}
        position={[0.95, 0, 0]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={geometries.baseCap}
        material={bodyMaterial}
        position={[0.95, -0.75, 0]}
        castShadow
        receiveShadow
      />
      {/* Inner accent arch trim */}
      <mesh
        geometry={geometries.innerTrim}
        material={trimMaterial}
        position={[0, 0.75, 0]}
      />
    </group>
  );
};

interface ArchesSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  floatAmplitude: number;
  speedMultiplier: number;
  aspectRatio: AspectRatio;
}

const ArchesScene: React.FC<ArchesSceneProps> = ({
  frame,
  durationInFrames,
  palette,
  floatAmplitude,
  speedMultiplier,
  aspectRatio,
}) => {
  const progress = (frame % durationInFrames) / durationInFrames;
  const loopAngle = progress * Math.PI * 2 * speedMultiplier;

  const geometries = useMemo<ArchGeometries>(
    () => ({
      topTorus: new TorusGeometry(0.95, 0.22, 28, 64, Math.PI),
      column: new CylinderGeometry(0.22, 0.22, 1.5, 28),
      baseCap: new SphereGeometry(0.22, 24, 24),
      innerTrim: new TorusGeometry(0.73, 0.045, 20, 48, Math.PI),
    }),
    [],
  );

  const materials = useMemo(
    () => ({
      light: new MeshStandardMaterial({
        color: palette.archBodyLight,
        roughness: 0.44,
        metalness: 0.05,
      }),
      main: new MeshStandardMaterial({
        color: palette.archBodyMain,
        roughness: 0.44,
        metalness: 0.05,
      }),
      trim: new MeshStandardMaterial({
        color: palette.archTrim,
        roughness: 0.38,
        metalness: 0.14,
      }),
    }),
    [palette.archBodyLight, palette.archBodyMain, palette.archTrim],
  );

  useEffect(() => {
    return () => {
      geometries.topTorus.dispose();
      geometries.column.dispose();
      geometries.baseCap.dispose();
      geometries.innerTrim.dispose();
    };
  }, [geometries]);

  useEffect(() => {
    return () => {
      materials.light.dispose();
      materials.main.dispose();
      materials.trim.dispose();
    };
  }, [materials]);

  const aspectXScale = aspectRatio === "9:16" ? 0.44 : 1;
  const cameraBreathY = Math.sin(loopAngle) * 0.08;

  return (
    <>
      <fog attach="fog" args={[palette.fogColor, 10, 23]} />

      {/* Three-point studio lighting + soft ambient/hemisphere bounce */}
      <ambientLight intensity={palette.ambientIntensity} color="#FFFFFF" />
      <hemisphereLight
        args={[palette.hemiSky, palette.hemiGround, palette.hemiIntensity]}
      />
      <directionalLight
        position={[9, 12, 10]}
        intensity={palette.keyIntensity}
        color={palette.keyColor}
      />
      <directionalLight
        position={[-10, -4, 8]}
        intensity={palette.fillIntensity}
        color={palette.fillColor}
      />
      <directionalLight
        position={[0, 8, -10]}
        intensity={palette.rimIntensity}
        color={palette.rimColor}
      />

      <group position={[0, cameraBreathY, 0]}>
        {ARCH_COLONNADE_SPECS.map((spec) => (
          <FloatingArchMesh
            key={spec.id}
            spec={spec}
            loopAngle={loopAngle}
            floatAmplitude={floatAmplitude}
            aspectXScale={aspectXScale}
            geometries={geometries}
            bodyMaterial={spec.tone === "light" ? materials.light : materials.main}
            trimMaterial={materials.trim}
          />
        ))}
      </group>
    </>
  );
};

export const FloatingMinimalistArches4K: React.FC<
  FloatingMinimalistArches4KProps
> = (props) => {
  const {
    themePreset = "clean-corporate",
    aspectRatio = "16:9",
    backgroundColor = "#F8FAFC",
    primaryColor = "#1E293B",
    secondaryColor = "#3B82F6",
    accentColor = "#0EA5E9",
    floatAmplitude = 0.42,
    speedMultiplier = 1,
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
        floatAmplitude,
        speedMultiplier,
      }),
    [
      themePreset,
      aspectRatio,
      backgroundColor,
      primaryColor,
      secondaryColor,
      accentColor,
      floatAmplitude,
      speedMultiplier,
    ],
  );

  return (
    <AbsoluteFill style={{ backgroundColor: palette.bgTop, overflow: "hidden" }}>
      {/* Soft studio gradient backdrop + subtle anti-banding grain */}
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
            id="arches-bg-grad"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={palette.bgTop} />
            <stop offset="100%" stopColor={palette.bgBottom} />
          </linearGradient>
          <radialGradient id="arches-bg-glow" cx="50%" cy="42%" r="58%">
            <stop
              offset="0%"
              stopColor={palette.bgGlow}
              stopOpacity={palette.bgGlowOpacity}
            />
            <stop offset="100%" stopColor={palette.bgBottom} stopOpacity="0" />
          </radialGradient>
          <filter id="arches-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed="17"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width={width} height={height} fill="url(#arches-bg-grad)" />
        <rect width={width} height={height} fill="url(#arches-bg-glow)" />
        <rect
          width={width}
          height={height}
          filter="url(#arches-grain)"
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
        <ArchesScene
          frame={frame}
          durationInFrames={durationInFrames}
          palette={palette}
          floatAmplitude={floatAmplitude}
          speedMultiplier={speedMultiplier}
          aspectRatio={aspectRatio}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

