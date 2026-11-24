import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  CapsuleGeometry,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  setConsoleFunction,
} from "three";
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

export type ThemePreset = z.infer<typeof themePresetSchema>;

export const commercialArchGeometry4KSchema = z.object({
  themePreset: themePresetSchema.default("clean-corporate"),
  backgroundColor: z.string().default("#F8FAFC"),
  primaryColor: z.string().default("#1E293B"),
  secondaryColor: z.string().default("#3B82F6"),
  accentColor: z.string().default("#0EA5E9"),
  speedMultiplier: z.number().int().positive().default(1),
  cameraZoom: z.number().min(0.6).max(2).default(1),
});

export type CommercialArchGeometry4KProps = z.infer<
  typeof commercialArchGeometry4KSchema
>;

export const defaultCommercialArchGeometry4KProps: CommercialArchGeometry4KProps =
  {
    themePreset: "clean-corporate",
    backgroundColor: "#F8FAFC",
    primaryColor: "#1E293B",
    secondaryColor: "#3B82F6",
    accentColor: "#0EA5E9",
    speedMultiplier: 1,
    cameraZoom: 1,
  };

export const commercialArchGeometry4KVariations: Record<
  ThemePreset,
  CommercialArchGeometry4KProps
> = {
  "clean-corporate": defaultCommercialArchGeometry4KProps,
  "dark-tech": {
    themePreset: "dark-tech",
    backgroundColor: "#070D1D",
    primaryColor: "#1E293B",
    secondaryColor: "#06B6D4",
    accentColor: "#6366F1",
    speedMultiplier: 1,
    cameraZoom: 1,
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    backgroundColor: "#FAF7F2",
    primaryColor: "#E07A5F",
    secondaryColor: "#D4A373",
    accentColor: "#F2CC8F",
    speedMultiplier: 1,
    cameraZoom: 1,
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    backgroundColor: "#101012",
    primaryColor: "#18181B",
    secondaryColor: "#D4AF37",
    accentColor: "#F3D37A",
    speedMultiplier: 1,
    cameraZoom: 1,
  },
};

interface ThemePalette {
  bgTop: string;
  bgBottom: string;
  bgGlow: string;
  bgGlowOpacity: number;
  fogColor: string;
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
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
    bgBottom: "#EAF0F7",
    bgGlow: "#3B82F6",
    bgGlowOpacity: 0.08,
    fogColor: "#F3F6FB",
    primary: "#1E293B",
    secondary: "#3B82F6",
    accent: "#0EA5E9",
    neutral: "#E2E8F0",
    ambientIntensity: 0.9,
    hemiSky: "#FFFFFF",
    hemiGround: "#CBD5E1",
    hemiIntensity: 0.75,
    keyColor: "#FFFDF9",
    keyIntensity: 1.45,
    fillColor: "#DCEAFE",
    fillIntensity: 0.7,
    rimColor: "#FFFFFF",
    rimIntensity: 0.95,
  },
  "dark-tech": {
    bgTop: "#0A1328",
    bgBottom: "#040814",
    bgGlow: "#06B6D4",
    bgGlowOpacity: 0.14,
    fogColor: "#060D1E",
    primary: "#1E293B",
    secondary: "#06B6D4",
    accent: "#6366F1",
    neutral: "#172554",
    ambientIntensity: 0.55,
    hemiSky: "#38BDF8",
    hemiGround: "#030712",
    hemiIntensity: 0.6,
    keyColor: "#E0F2FE",
    keyIntensity: 1.55,
    fillColor: "#6366F1",
    fillIntensity: 0.9,
    rimColor: "#22D3EE",
    rimIntensity: 1.25,
  },
  "warm-minimalist": {
    bgTop: "#FDFBF7",
    bgBottom: "#EFE6D8",
    bgGlow: "#E07A5F",
    bgGlowOpacity: 0.09,
    fogColor: "#F5EFE4",
    primary: "#E07A5F",
    secondary: "#D4A373",
    accent: "#F2CC8F",
    neutral: "#EAE0D0",
    ambientIntensity: 0.95,
    hemiSky: "#FFFDF8",
    hemiGround: "#D6C7B2",
    hemiIntensity: 0.78,
    keyColor: "#FFF7EB",
    keyIntensity: 1.35,
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
    primary: "#161619",
    secondary: "#D4AF37",
    accent: "#F3D37A",
    neutral: "#27272C",
    ambientIntensity: 0.45,
    hemiSky: "#FDE68A",
    hemiGround: "#09090B",
    hemiIntensity: 0.5,
    keyColor: "#FFF6DB",
    keyIntensity: 1.5,
    fillColor: "#52525B",
    fillIntensity: 0.65,
    rimColor: "#D4AF37",
    rimIntensity: 1.3,
  },
};

const resolveThemePalette = (
  props: CommercialArchGeometry4KProps,
): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  const hasCustomBg =
    props.backgroundColor !==
    defaultCommercialArchGeometry4KProps.backgroundColor;
  const hasCustomPrimary =
    props.primaryColor !== defaultCommercialArchGeometry4KProps.primaryColor;
  const hasCustomSecondary =
    props.secondaryColor !==
    defaultCommercialArchGeometry4KProps.secondaryColor;
  const hasCustomAccent =
    props.accentColor !== defaultCommercialArchGeometry4KProps.accentColor;

  return {
    ...base,
    bgTop: hasCustomBg ? props.backgroundColor : base.bgTop,
    fogColor: hasCustomBg ? props.backgroundColor : base.fogColor,
    primary: hasCustomPrimary ? props.primaryColor : base.primary,
    secondary: hasCustomSecondary ? props.secondaryColor : base.secondary,
    accent: hasCustomAccent ? props.accentColor : base.accent,
  };
};

type ArchPrimitiveKind = "arch" | "ring" | "pill" | "sphere" | "slab";
type MaterialTone = "primary" | "secondary" | "accent" | "neutral";

interface ArchitecturalPrimitiveSpec {
  id: string;
  kind: ArchPrimitiveKind;
  tone: MaterialTone;
  basePosition: [number, number, number];
  baseRotation: [number, number, number];
  scale: number;
  orbitRadius: [number, number, number];
  rotationAmplitude: [number, number, number];
  fullTurns: [number, number, number];
  phase: number;
}

// 16 architectural primitives framing outer perimeter while keeping center negative space open
const ARCHITECTURAL_PRIMITIVES: readonly ArchitecturalPrimitiveSpec[] = [
  // Top-left cluster
  {
    id: "tl-arch",
    kind: "arch",
    tone: "neutral",
    basePosition: [-6.15, 2.85, -1.2],
    baseRotation: [0.35, 0.45, -0.45],
    scale: 1.08,
    orbitRadius: [0.24, 0.28, 0.16],
    rotationAmplitude: [0.16, 0.18, 0.14],
    fullTurns: [0, 0, 0],
    phase: 0.2,
  },
  {
    id: "tl-sphere-accent",
    kind: "sphere",
    tone: "secondary",
    basePosition: [-4.65, 3.35, -0.35],
    baseRotation: [0, 0, 0],
    scale: 0.78,
    orbitRadius: [0.22, 0.3, 0.2],
    rotationAmplitude: [0, 0, 0],
    fullTurns: [0, 1, 0],
    phase: 1.1,
  },
  {
    id: "left-pill",
    kind: "pill",
    tone: "primary",
    basePosition: [-6.7, 0.25, -0.6],
    baseRotation: [0.28, 0.42, 0.68],
    scale: 1.05,
    orbitRadius: [0.18, 0.34, 0.14],
    rotationAmplitude: [0.18, 0.2, 0.16],
    fullTurns: [0, 1, 0],
    phase: 1.9,
  },
  {
    id: "left-ring-depth",
    kind: "ring",
    tone: "accent",
    basePosition: [-5.4, -0.95, -3.2],
    baseRotation: [0.65, 0.55, 0.15],
    scale: 1.28,
    orbitRadius: [0.2, 0.26, 0.16],
    rotationAmplitude: [0.2, 0.16, 0.14],
    fullTurns: [1, 0, 0],
    phase: 2.6,
  },

  // Bottom-left cluster
  {
    id: "bl-slab",
    kind: "slab",
    tone: "neutral",
    basePosition: [-6.05, -2.85, -0.75],
    baseRotation: [0.45, 0.6, -0.25],
    scale: 1.12,
    orbitRadius: [0.22, 0.24, 0.18],
    rotationAmplitude: [0.18, 0.22, 0.15],
    fullTurns: [0, 1, 0],
    phase: 0.75,
  },
  {
    id: "bl-ring",
    kind: "ring",
    tone: "secondary",
    basePosition: [-4.2, -3.4, -1.6],
    baseRotation: [0.85, -0.35, 0.2],
    scale: 0.92,
    orbitRadius: [0.25, 0.22, 0.14],
    rotationAmplitude: [0.16, 0.2, 0.18],
    fullTurns: [0, 0, -1],
    phase: 3.15,
  },
  {
    id: "bl-sphere-small",
    kind: "sphere",
    tone: "accent",
    basePosition: [-5.15, -2.05, 0.85],
    baseRotation: [0, 0, 0],
    scale: 0.44,
    orbitRadius: [0.28, 0.26, 0.22],
    rotationAmplitude: [0, 0, 0],
    fullTurns: [0, 0, 0],
    phase: 4.1,
  },

  // Top & bottom subtle perimeter anchors
  {
    id: "top-pill-depth",
    kind: "pill",
    tone: "neutral",
    basePosition: [-0.85, 3.65, -2.8],
    baseRotation: [0.22, 0.35, 1.32],
    scale: 0.96,
    orbitRadius: [0.3, 0.16, 0.12],
    rotationAmplitude: [0.14, 0.16, 0.12],
    fullTurns: [0, 0, 0],
    phase: 2.3,
  },
  {
    id: "bottom-pill",
    kind: "pill",
    tone: "primary",
    basePosition: [1.35, -3.55, -2.35],
    baseRotation: [-0.25, 0.48, 1.18],
    scale: 1.02,
    orbitRadius: [0.28, 0.18, 0.14],
    rotationAmplitude: [0.15, 0.18, 0.12],
    fullTurns: [0, 0, 0],
    phase: 4.85,
  },

  // Top-right cluster
  {
    id: "tr-ring",
    kind: "ring",
    tone: "primary",
    basePosition: [5.4, 3.05, -0.9],
    baseRotation: [0.55, -0.5, 0.22],
    scale: 1.1,
    orbitRadius: [0.24, 0.26, 0.16],
    rotationAmplitude: [0.18, 0.2, 0.14],
    fullTurns: [0, -1, 0],
    phase: 0.55,
  },
  {
    id: "tr-sphere",
    kind: "sphere",
    tone: "accent",
    basePosition: [6.75, 2.35, 0.5],
    baseRotation: [0, 0, 0],
    scale: 0.62,
    orbitRadius: [0.2, 0.3, 0.18],
    rotationAmplitude: [0, 0, 0],
    fullTurns: [0, 0, 0],
    phase: 2.1,
  },
  {
    id: "tr-slab-depth",
    kind: "slab",
    tone: "neutral",
    basePosition: [4.35, 3.6, -3.4],
    baseRotation: [0.3, -0.7, 0.4],
    scale: 0.95,
    orbitRadius: [0.22, 0.2, 0.14],
    rotationAmplitude: [0.16, 0.18, 0.16],
    fullTurns: [1, 0, 0],
    phase: 3.6,
  },

  // Right & bottom-right architectural centerpiece framing
  {
    id: "right-arch",
    kind: "arch",
    tone: "secondary",
    basePosition: [6.35, -0.35, -0.8],
    baseRotation: [0.22, -0.58, 0.52],
    scale: 1.24,
    orbitRadius: [0.2, 0.32, 0.18],
    rotationAmplitude: [0.16, 0.18, 0.14],
    fullTurns: [0, 0, 0],
    phase: 1.45,
  },
  {
    id: "br-pill",
    kind: "pill",
    tone: "neutral",
    basePosition: [5.95, -2.55, 0.45],
    baseRotation: [-0.35, -0.45, -0.58],
    scale: 0.98,
    orbitRadius: [0.24, 0.26, 0.16],
    rotationAmplitude: [0.18, 0.2, 0.14],
    fullTurns: [0, -1, 0],
    phase: 5.1,
  },
  {
    id: "br-sphere-large",
    kind: "sphere",
    tone: "primary",
    basePosition: [4.65, -3.15, -1.9],
    baseRotation: [0, 0, 0],
    scale: 0.9,
    orbitRadius: [0.22, 0.24, 0.16],
    rotationAmplitude: [0, 0, 0],
    fullTurns: [0, 0, 0],
    phase: 2.9,
  },
  {
    id: "right-sphere-far",
    kind: "sphere",
    tone: "accent",
    basePosition: [7.25, 0.85, -3.8],
    baseRotation: [0, 0, 0],
    scale: 0.86,
    orbitRadius: [0.18, 0.26, 0.15],
    rotationAmplitude: [0, 0, 0],
    fullTurns: [0, 0, 0],
    phase: 4.35,
  },
];

const CANVAS_GL = { antialias: true, alpha: true } as const;
const CAMERA_CONFIG = {
  position: [0, 0, 12] as [number, number, number],
  fov: 40,
  near: 0.1,
  far: 100,
};

const CameraZoomRig: React.FC<{ zoom: number }> = ({ zoom }) => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
  }, [camera, zoom]);

  return null;
};

interface SharedGeometries {
  archTube: TorusGeometry;
  archCap: SphereGeometry;
  ring: TorusGeometry;
  pill: CapsuleGeometry;
  sphere: SphereGeometry;
  slab: RoundedBoxGeometry;
}

interface ArchPrimitiveMeshProps {
  spec: ArchitecturalPrimitiveSpec;
  loopAngle: number;
  geometries: SharedGeometries;
  material: MeshStandardMaterial;
}

const ArchPrimitiveMesh: React.FC<ArchPrimitiveMeshProps> = ({
  spec,
  loopAngle,
  geometries,
  material,
}) => {
  const phaseAngle = loopAngle + spec.phase;
  const posX = spec.basePosition[0] + Math.cos(phaseAngle) * spec.orbitRadius[0];
  const posY = spec.basePosition[1] + Math.sin(phaseAngle) * spec.orbitRadius[1];
  const posZ =
    spec.basePosition[2] + Math.sin(phaseAngle + 0.7) * spec.orbitRadius[2];

  const rotX =
    spec.baseRotation[0] +
    loopAngle * spec.fullTurns[0] +
    Math.sin(phaseAngle) * spec.rotationAmplitude[0];
  const rotY =
    spec.baseRotation[1] +
    loopAngle * spec.fullTurns[1] +
    Math.cos(phaseAngle) * spec.rotationAmplitude[1];
  const rotZ =
    spec.baseRotation[2] +
    loopAngle * spec.fullTurns[2] +
    Math.sin(phaseAngle * 2) * spec.rotationAmplitude[2];

  const breathing = 1 + Math.sin(phaseAngle) * 0.035;
  const finalScale = spec.scale * breathing;

  if (spec.kind === "arch") {
    return (
      <group
        position={[posX, posY, posZ]}
        rotation={[rotX, rotY, rotZ]}
        scale={[finalScale, finalScale, finalScale]}
      >
        <mesh
          geometry={geometries.archTube}
          material={material}
          castShadow
          receiveShadow
        />
        <mesh
          geometry={geometries.archCap}
          material={material}
          position={[-0.95, 0, 0]}
          castShadow
          receiveShadow
        />
        <mesh
          geometry={geometries.archCap}
          material={material}
          position={[0.95, 0, 0]}
          castShadow
          receiveShadow
        />
      </group>
    );
  }

  const geometryMap: Record<Exclude<ArchPrimitiveKind, "arch">, TorusGeometry | CapsuleGeometry | SphereGeometry | RoundedBoxGeometry> = {
    ring: geometries.ring,
    pill: geometries.pill,
    sphere: geometries.sphere,
    slab: geometries.slab,
  };

  return (
    <mesh
      position={[posX, posY, posZ]}
      rotation={[rotX, rotY, rotZ]}
      scale={[finalScale, finalScale, finalScale]}
      geometry={geometryMap[spec.kind]}
      material={material}
      castShadow
      receiveShadow
    />
  );
};

interface CommercialArchSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  speedMultiplier: number;
  cameraZoom: number;
}

const CommercialArchScene: React.FC<CommercialArchSceneProps> = ({
  frame,
  durationInFrames,
  palette,
  speedMultiplier,
  cameraZoom,
}) => {
  const progress = (frame % durationInFrames) / durationInFrames;
  const loopAngle = progress * Math.PI * 2 * speedMultiplier;

  const geometries = useMemo<SharedGeometries>(
    () => ({
      archTube: new TorusGeometry(0.95, 0.2, 28, 64, Math.PI),
      archCap: new SphereGeometry(0.2, 24, 24),
      ring: new TorusGeometry(0.78, 0.17, 28, 72),
      pill: new CapsuleGeometry(0.26, 0.95, 16, 32),
      sphere: new SphereGeometry(0.55, 36, 36),
      slab: new RoundedBoxGeometry(1.15, 1.15, 0.38, 4, 0.1),
    }),
    [],
  );

  const materials = useMemo<Record<MaterialTone, MeshStandardMaterial>>(
    () => ({
      primary: new MeshStandardMaterial({
        color: palette.primary,
        roughness: 0.45,
        metalness: 0.05,
      }),
      secondary: new MeshStandardMaterial({
        color: palette.secondary,
        roughness: 0.45,
        metalness: 0.05,
      }),
      accent: new MeshStandardMaterial({
        color: palette.accent,
        roughness: 0.45,
        metalness: 0.05,
      }),
      neutral: new MeshStandardMaterial({
        color: palette.neutral,
        roughness: 0.45,
        metalness: 0.05,
      }),
    }),
    [palette.primary, palette.secondary, palette.accent, palette.neutral],
  );

  useEffect(() => {
    return () => {
      geometries.archTube.dispose();
      geometries.archCap.dispose();
      geometries.ring.dispose();
      geometries.pill.dispose();
      geometries.sphere.dispose();
      geometries.slab.dispose();
    };
  }, [geometries]);

  useEffect(() => {
    return () => {
      materials.primary.dispose();
      materials.secondary.dispose();
      materials.accent.dispose();
      materials.neutral.dispose();
    };
  }, [materials]);

  // Subtle camera-rig micro-parallax across the loop
  const rigRotX = Math.sin(loopAngle) * 0.014;
  const rigRotY = Math.cos(loopAngle) * 0.02;

  return (
    <>
      <fog attach="fog" args={[palette.fogColor, 11, 24]} />
      <CameraZoomRig zoom={cameraZoom} />

      {/* Three-point studio lighting + ambient hemisphere bounce */}
      <ambientLight intensity={palette.ambientIntensity} color="#FFFFFF" />
      <hemisphereLight
        args={[palette.hemiSky, palette.hemiGround, palette.hemiIntensity]}
      />
      <directionalLight
        position={[9, 11, 10]}
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

      <group rotation={[rigRotX, rigRotY, 0]}>
        {ARCHITECTURAL_PRIMITIVES.map((spec) => (
          <ArchPrimitiveMesh
            key={spec.id}
            spec={spec}
            loopAngle={loopAngle}
            geometries={geometries}
            material={materials[spec.tone]}
          />
        ))}
      </group>
    </>
  );
};

export const CommercialArchGeometry4K: React.FC<
  CommercialArchGeometry4KProps
> = (props) => {
  const {
    themePreset = "clean-corporate",
    backgroundColor = "#F8FAFC",
    primaryColor = "#1E293B",
    secondaryColor = "#3B82F6",
    accentColor = "#0EA5E9",
    speedMultiplier = 1,
    cameraZoom = 1,
  } = props;

  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const palette = useMemo(
    () =>
      resolveThemePalette({
        themePreset,
        backgroundColor,
        primaryColor,
        secondaryColor,
        accentColor,
        speedMultiplier,
        cameraZoom,
      }),
    [
      themePreset,
      backgroundColor,
      primaryColor,
      secondaryColor,
      accentColor,
      speedMultiplier,
      cameraZoom,
    ],
  );

  return (
    <AbsoluteFill style={{ backgroundColor: palette.bgTop, overflow: "hidden" }}>
      {/* Soft gradient backdrop + anti-banding grain */}
      <svg
        width={width}
        height={height}
        viewBox="0 0 3840 2160"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <defs>
          <linearGradient id="arch-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.bgTop} />
            <stop offset="100%" stopColor={palette.bgBottom} />
          </linearGradient>
          <radialGradient id="arch-bg-glow-tr" cx="85%" cy="18%" r="52%">
            <stop
              offset="0%"
              stopColor={palette.bgGlow}
              stopOpacity={palette.bgGlowOpacity}
            />
            <stop offset="100%" stopColor={palette.bgBottom} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="arch-bg-glow-bl" cx="14%" cy="84%" r="48%">
            <stop
              offset="0%"
              stopColor={palette.bgGlow}
              stopOpacity={palette.bgGlowOpacity * 0.85}
            />
            <stop offset="100%" stopColor={palette.bgBottom} stopOpacity="0" />
          </radialGradient>
          <filter id="arch-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed="11"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width="3840" height="2160" fill="url(#arch-bg-grad)" />
        <rect width="3840" height="2160" fill="url(#arch-bg-glow-tr)" />
        <rect width="3840" height="2160" fill="url(#arch-bg-glow-bl)" />
        <rect
          width="3840"
          height="2160"
          filter="url(#arch-grain)"
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
        <CommercialArchScene
          frame={frame}
          durationInFrames={durationInFrames}
          palette={palette}
          speedMultiplier={speedMultiplier}
          cameraZoom={cameraZoom}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

