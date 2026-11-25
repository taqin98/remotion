import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  CylinderGeometry,
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

export const floatingSteppingStones4KSchema = z.object({
  themePreset: themePresetSchema.default("clean-corporate"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#F8FAFC"),
  primaryColor: z.string().default("#E2E8F0"),
  secondaryColor: z.string().default("#CBD5E1"),
  accentColor: z.string().default("#3B82F6"),
  bobAmplitude: z.number().min(0.2).max(2).default(1),
  speedMultiplier: z.number().int().positive().default(1),
  strokeWidth: z.number().min(0.5).max(3).default(1),
});

export type FloatingSteppingStones4KProps = z.infer<
  typeof floatingSteppingStones4KSchema
>;

export const defaultFloatingSteppingStones4KProps: FloatingSteppingStones4KProps =
  {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "#F8FAFC",
    primaryColor: "#E2E8F0",
    secondaryColor: "#CBD5E1",
    accentColor: "#3B82F6",
    bobAmplitude: 1,
    speedMultiplier: 1,
    strokeWidth: 1,
  };

export const floatingSteppingStones4KVariations: Record<
  ThemePreset,
  FloatingSteppingStones4KProps
> = {
  "clean-corporate": defaultFloatingSteppingStones4KProps,
  "dark-tech": {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "#070D1D",
    primaryColor: "#162033",
    secondaryColor: "#1E293B",
    accentColor: "#38BDF8",
    bobAmplitude: 1,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "#FAF7F2",
    primaryColor: "#EFE5D7",
    secondaryColor: "#E0D1BD",
    accentColor: "#E07A5F",
    bobAmplitude: 1,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "#0F0F12",
    primaryColor: "#1D1D23",
    secondaryColor: "#2A2A32",
    accentColor: "#D4AF37",
    bobAmplitude: 1,
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
  primary: string;
  secondary: string;
  accent: string;
  rimCollar: string;
  ambientIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  keyColor: string;
  keyIntensity: number;
  fillColor: string;
  fillIntensity: number;
  rimTopColor: string;
  rimTopIntensity: number;
  rimBottomColor: string;
  rimBottomIntensity: number;
}

const THEME_PALETTES: Record<ThemePreset, ThemePalette> = {
  "clean-corporate": {
    bgTop: "#FFFFFF",
    bgBottom: "#E7EFF7",
    bgGlow: "#3B82F6",
    bgGlowOpacity: 0.08,
    fogColor: "#EDF3F9",
    primary: "#F8FAFC",
    secondary: "#D8E1EC",
    accent: "#3B82F6",
    rimCollar: "#3B82F6",
    ambientIntensity: 0.85,
    hemiSky: "#FFFFFF",
    hemiGround: "#CBD5E1",
    hemiIntensity: 0.68,
    keyColor: "#FFFDF9",
    keyIntensity: 1.42,
    fillColor: "#DCEAFE",
    fillIntensity: 0.66,
    rimTopColor: "#FFFFFF",
    rimTopIntensity: 1.25,
    rimBottomColor: "#93C5FD",
    rimBottomIntensity: 0.55,
  },
  "dark-tech": {
    bgTop: "#0B1328",
    bgBottom: "#040814",
    bgGlow: "#38BDF8",
    bgGlowOpacity: 0.14,
    fogColor: "#060D1E",
    primary: "#162033",
    secondary: "#1E293B",
    accent: "#38BDF8",
    rimCollar: "#38BDF8",
    ambientIntensity: 0.5,
    hemiSky: "#38BDF8",
    hemiGround: "#020617",
    hemiIntensity: 0.55,
    keyColor: "#E0F2FE",
    keyIntensity: 1.5,
    fillColor: "#6366F1",
    fillIntensity: 0.78,
    rimTopColor: "#22D3EE",
    rimTopIntensity: 1.45,
    rimBottomColor: "#38BDF8",
    rimBottomIntensity: 0.75,
  },
  "warm-minimalist": {
    bgTop: "#FDFBF7",
    bgBottom: "#EFE4D6",
    bgGlow: "#E07A5F",
    bgGlowOpacity: 0.09,
    fogColor: "#F5EEE3",
    primary: "#FAF6EF",
    secondary: "#E4D6C3",
    accent: "#E07A5F",
    rimCollar: "#E07A5F",
    ambientIntensity: 0.9,
    hemiSky: "#FFFDF8",
    hemiGround: "#D6C5B0",
    hemiIntensity: 0.72,
    keyColor: "#FFF7EB",
    keyIntensity: 1.36,
    fillColor: "#F5E1C8",
    fillIntensity: 0.64,
    rimTopColor: "#FFFFFF",
    rimTopIntensity: 1.15,
    rimBottomColor: "#F2CC8F",
    rimBottomIntensity: 0.52,
  },
  "monochrome-luxury": {
    bgTop: "#17171B",
    bgBottom: "#09090B",
    bgGlow: "#D4AF37",
    bgGlowOpacity: 0.11,
    fogColor: "#0D0D10",
    primary: "#1E1E24",
    secondary: "#2A2A32",
    accent: "#D4AF37",
    rimCollar: "#D4AF37",
    ambientIntensity: 0.45,
    hemiSky: "#FDE68A",
    hemiGround: "#09090B",
    hemiIntensity: 0.48,
    keyColor: "#FFF6DB",
    keyIntensity: 1.5,
    fillColor: "#52525B",
    fillIntensity: 0.62,
    rimTopColor: "#D4AF37",
    rimTopIntensity: 1.45,
    rimBottomColor: "#FDE68A",
    rimBottomIntensity: 0.68,
  },
};

const resolveThemePalette = (
  props: FloatingSteppingStones4KProps,
): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  const hasCustomBg =
    props.backgroundColor !==
    defaultFloatingSteppingStones4KProps.backgroundColor;
  const hasCustomPrimary =
    props.primaryColor !== defaultFloatingSteppingStones4KProps.primaryColor;
  const hasCustomSecondary =
    props.secondaryColor !==
    defaultFloatingSteppingStones4KProps.secondaryColor;
  const hasCustomAccent =
    props.accentColor !== defaultFloatingSteppingStones4KProps.accentColor;

  return {
    ...base,
    bgTop: hasCustomBg ? props.backgroundColor : base.bgTop,
    fogColor: hasCustomBg ? props.backgroundColor : base.fogColor,
    primary: hasCustomPrimary ? props.primaryColor : base.primary,
    secondary: hasCustomSecondary ? props.secondaryColor : base.secondary,
    accent: hasCustomAccent ? props.accentColor : base.accent,
    rimCollar: hasCustomAccent ? props.accentColor : base.rimCollar,
  };
};

type PedestalSilhouette = "wideDisc" | "mediumPedestal" | "tallPlinth";
type PedestalTone = "primary" | "secondary" | "accent";

interface SilhouetteDimensions {
  radius: number;
  height: number;
  bevel: number;
}

const SILHOUETTE_DIMENSIONS: Record<PedestalSilhouette, SilhouetteDimensions> = {
  wideDisc: { radius: 1.05, height: 0.42, bevel: 0.08 },
  mediumPedestal: { radius: 0.78, height: 0.56, bevel: 0.075 },
  tallPlinth: { radius: 0.56, height: 0.88, bevel: 0.07 },
};

interface SteppingStoneSpec {
  id: string;
  silhouette: PedestalSilhouette;
  tone: PedestalTone;
  basePosition: [number, number, number];
  baseRotation: [number, number, number];
  scale: number;
  bobY: number;
  driftX: number;
  tiltAmp: [number, number];
  cycles: number;
  axialTurns: number;
  phase: number;
}

// 12 beveled cylindrical pedestals at staggered depths (-4.8 to +0.9),
// framing perimeter while preserving open center copy space [-3.2..3.2, -1.2..1.5]
const STEPPING_STONE_SPECS: readonly SteppingStoneSpec[] = [
  {
    id: "stone-bottom-left-hero",
    silhouette: "wideDisc",
    tone: "primary",
    basePosition: [-4.6, -2.25, 0.6],
    baseRotation: [0.22, 0.2, 0.08],
    scale: 1.08,
    bobY: 0.24,
    driftX: 0.14,
    tiltAmp: [0.09, 0.08],
    cycles: 1,
    axialTurns: 1,
    phase: 0.0,
  },
  {
    id: "stone-bottom-center-left",
    silhouette: "mediumPedestal",
    tone: "secondary",
    basePosition: [-1.75, -2.95, -1.6],
    baseRotation: [0.26, -0.35, -0.06],
    scale: 1.0,
    bobY: 0.22,
    driftX: 0.12,
    tiltAmp: [0.08, 0.09],
    cycles: 2,
    axialTurns: -1,
    phase: 1.15,
  },
  {
    id: "stone-bottom-center-right",
    silhouette: "tallPlinth",
    tone: "primary",
    basePosition: [1.85, -2.85, -2.5],
    baseRotation: [0.24, 0.4, 0.05],
    scale: 1.05,
    bobY: 0.26,
    driftX: 0.14,
    tiltAmp: [0.07, 0.08],
    cycles: 1,
    axialTurns: 1,
    phase: 2.3,
  },
  {
    id: "stone-bottom-right-hero",
    silhouette: "wideDisc",
    tone: "secondary",
    basePosition: [4.85, -2.15, 0.9],
    baseRotation: [0.2, -0.25, -0.09],
    scale: 1.06,
    bobY: 0.22,
    driftX: 0.16,
    tiltAmp: [0.1, 0.07],
    cycles: 1,
    axialTurns: -1,
    phase: 3.1,
  },
  {
    id: "stone-left-mid",
    silhouette: "mediumPedestal",
    tone: "accent",
    basePosition: [-5.75, 0.15, -0.7],
    baseRotation: [0.16, 0.55, 0.14],
    scale: 0.96,
    bobY: 0.25,
    driftX: 0.11,
    tiltAmp: [0.09, 0.1],
    cycles: 2,
    axialTurns: 1,
    phase: 0.75,
  },
  {
    id: "stone-left-upper",
    silhouette: "tallPlinth",
    tone: "secondary",
    basePosition: [-5.05, 2.55, -2.8],
    baseRotation: [-0.18, -0.42, 0.1],
    scale: 1.0,
    bobY: 0.21,
    driftX: 0.15,
    tiltAmp: [0.08, 0.09],
    cycles: 1,
    axialTurns: -1,
    phase: 4.05,
  },
  {
    id: "stone-right-mid",
    silhouette: "mediumPedestal",
    tone: "primary",
    basePosition: [5.7, 0.35, -0.4],
    baseRotation: [0.15, -0.5, -0.13],
    scale: 0.98,
    bobY: 0.24,
    driftX: 0.12,
    tiltAmp: [0.09, 0.08],
    cycles: 2,
    axialTurns: -1,
    phase: 1.85,
  },
  {
    id: "stone-right-upper",
    silhouette: "tallPlinth",
    tone: "accent",
    basePosition: [5.15, 2.65, -2.3],
    baseRotation: [-0.16, 0.38, -0.1],
    scale: 1.02,
    bobY: 0.23,
    driftX: 0.13,
    tiltAmp: [0.08, 0.09],
    cycles: 1,
    axialTurns: 1,
    phase: 5.1,
  },
  {
    id: "stone-top-left-far",
    silhouette: "wideDisc",
    tone: "secondary",
    basePosition: [-3.35, 3.25, -4.4],
    baseRotation: [-0.22, 0.3, 0.06],
    scale: 0.95,
    bobY: 0.18,
    driftX: 0.16,
    tiltAmp: [0.07, 0.06],
    cycles: 1,
    axialTurns: 1,
    phase: 2.7,
  },
  {
    id: "stone-top-center-far",
    silhouette: "mediumPedestal",
    tone: "primary",
    basePosition: [0.1, 3.55, -4.8],
    baseRotation: [-0.24, -0.2, 0.04],
    scale: 0.92,
    bobY: 0.2,
    driftX: 0.18,
    tiltAmp: [0.06, 0.07],
    cycles: 2,
    axialTurns: -1,
    phase: 3.6,
  },
  {
    id: "stone-top-right-far",
    silhouette: "wideDisc",
    tone: "primary",
    basePosition: [3.25, 3.1, -3.9],
    baseRotation: [-0.2, -0.35, -0.07],
    scale: 0.96,
    bobY: 0.19,
    driftX: 0.15,
    tiltAmp: [0.07, 0.07],
    cycles: 1,
    axialTurns: -1,
    phase: 4.8,
  },
  {
    id: "stone-lower-far-accent",
    silhouette: "mediumPedestal",
    tone: "accent",
    basePosition: [3.75, -3.35, -3.4],
    baseRotation: [0.25, 0.45, -0.05],
    scale: 0.94,
    bobY: 0.2,
    driftX: 0.14,
    tiltAmp: [0.08, 0.07],
    cycles: 2,
    axialTurns: 1,
    phase: 5.7,
  },
];

const CANVAS_GL = { antialias: true, alpha: true } as const;

const StonesCameraRig: React.FC<{ aspectRatio: AspectRatio }> = ({
  aspectRatio,
}) => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    if (aspectRatio === "9:16") {
      camera.position.set(0, 0.35, 14.4);
    } else {
      camera.position.set(0, 0.35, 12.2);
    }
    camera.lookAt(0, 0, -1.2);
    camera.updateProjectionMatrix();
  }, [camera, aspectRatio]);

  return null;
};

interface PedestalGeometrySet {
  outerCylinder: CylinderGeometry;
  innerCore: CylinderGeometry;
  bevelRing: TorusGeometry;
  rimCollar: TorusGeometry;
  bevelOffsetY: number;
  collarOffsetY: number;
}

const createPedestalGeometrySet = (
  dims: SilhouetteDimensions,
  strokeWidth: number,
): PedestalGeometrySet => {
  const { radius, height, bevel } = dims;
  const collarRadius = 0.018 * strokeWidth;
  return {
    outerCylinder: new CylinderGeometry(radius, radius, height - 2 * bevel, 48, 1),
    innerCore: new CylinderGeometry(radius - bevel, radius - bevel, height, 48, 1),
    bevelRing: new TorusGeometry(radius - bevel, bevel, 20, 48),
    rimCollar: new TorusGeometry(radius - bevel * 0.25, collarRadius, 16, 48),
    bevelOffsetY: height / 2 - bevel,
    collarOffsetY: height / 2 - bevel * 0.15,
  };
};

const disposePedestalGeometrySet = (set: PedestalGeometrySet): void => {
  set.outerCylinder.dispose();
  set.innerCore.dispose();
  set.bevelRing.dispose();
  set.rimCollar.dispose();
};

interface FloatingPedestalProps {
  spec: SteppingStoneSpec;
  loopAngle: number;
  bobAmplitude: number;
  aspectXScale: number;
  geometrySet: PedestalGeometrySet;
  bodyMaterial: MeshStandardMaterial;
  collarMaterial: MeshStandardMaterial;
}

const FloatingPedestal: React.FC<FloatingPedestalProps> = ({
  spec,
  loopAngle,
  bobAmplitude,
  aspectXScale,
  geometrySet,
  bodyMaterial,
  collarMaterial,
}) => {
  const bobPhase = loopAngle * spec.cycles + spec.phase;
  const driftPhase = loopAngle + spec.phase;

  const posX =
    spec.basePosition[0] * aspectXScale +
    Math.cos(driftPhase) * spec.driftX * bobAmplitude;
  const posY =
    spec.basePosition[1] + Math.sin(bobPhase) * spec.bobY * bobAmplitude;
  const posZ =
    spec.basePosition[2] +
    Math.sin(driftPhase + 0.8) * spec.driftX * 0.75 * bobAmplitude;

  const rotX =
    spec.baseRotation[0] +
    Math.sin(driftPhase) * spec.tiltAmp[0] * bobAmplitude;
  const rotY = spec.baseRotation[1] + loopAngle * spec.axialTurns;
  const rotZ =
    spec.baseRotation[2] +
    Math.cos(bobPhase) * spec.tiltAmp[1] * bobAmplitude;

  return (
    <group
      position={[posX, posY, posZ]}
      rotation={[rotX, rotY, rotZ]}
      scale={[spec.scale, spec.scale, spec.scale]}
    >
      <mesh geometry={geometrySet.outerCylinder} material={bodyMaterial} />
      <mesh geometry={geometrySet.innerCore} material={bodyMaterial} />
      <mesh
        geometry={geometrySet.bevelRing}
        material={bodyMaterial}
        position={[0, geometrySet.bevelOffsetY, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <mesh
        geometry={geometrySet.bevelRing}
        material={bodyMaterial}
        position={[0, -geometrySet.bevelOffsetY, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <mesh
        geometry={geometrySet.rimCollar}
        material={collarMaterial}
        position={[0, geometrySet.collarOffsetY, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </group>
  );
};

interface StonesSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  bobAmplitude: number;
  speedMultiplier: number;
  strokeWidth: number;
  aspectRatio: AspectRatio;
}

const StonesScene: React.FC<StonesSceneProps> = ({
  frame,
  durationInFrames,
  palette,
  bobAmplitude,
  speedMultiplier,
  strokeWidth,
  aspectRatio,
}) => {
  const progress = (frame % durationInFrames) / durationInFrames;
  const loopAngle = progress * Math.PI * 2 * speedMultiplier;

  const geometrySets = useMemo<Record<PedestalSilhouette, PedestalGeometrySet>>(
    () => ({
      wideDisc: createPedestalGeometrySet(
        SILHOUETTE_DIMENSIONS.wideDisc,
        strokeWidth,
      ),
      mediumPedestal: createPedestalGeometrySet(
        SILHOUETTE_DIMENSIONS.mediumPedestal,
        strokeWidth,
      ),
      tallPlinth: createPedestalGeometrySet(
        SILHOUETTE_DIMENSIONS.tallPlinth,
        strokeWidth,
      ),
    }),
    [strokeWidth],
  );

  const materials = useMemo(
    () => ({
      primary: new MeshStandardMaterial({
        color: palette.primary,
        roughness: 0.34,
        metalness: 0.12,
      }),
      secondary: new MeshStandardMaterial({
        color: palette.secondary,
        roughness: 0.4,
        metalness: 0.1,
      }),
      accent: new MeshStandardMaterial({
        color: palette.accent,
        roughness: 0.3,
        metalness: 0.24,
      }),
      farPrimary: new MeshStandardMaterial({
        color: palette.primary,
        roughness: 0.62,
        metalness: 0.04,
      }),
      farSecondary: new MeshStandardMaterial({
        color: palette.secondary,
        roughness: 0.66,
        metalness: 0.04,
      }),
      farAccent: new MeshStandardMaterial({
        color: palette.accent,
        roughness: 0.56,
        metalness: 0.1,
      }),
      collar: new MeshStandardMaterial({
        color: palette.rimCollar,
        roughness: 0.24,
        metalness: 0.55,
      }),
    }),
    [palette.primary, palette.secondary, palette.accent, palette.rimCollar],
  );

  useEffect(() => {
    return () => {
      disposePedestalGeometrySet(geometrySets.wideDisc);
      disposePedestalGeometrySet(geometrySets.mediumPedestal);
      disposePedestalGeometrySet(geometrySets.tallPlinth);
    };
  }, [geometrySets]);

  useEffect(() => {
    return () => {
      materials.primary.dispose();
      materials.secondary.dispose();
      materials.accent.dispose();
      materials.farPrimary.dispose();
      materials.farSecondary.dispose();
      materials.farAccent.dispose();
      materials.collar.dispose();
    };
  }, [materials]);

  const aspectXScale = aspectRatio === "9:16" ? 0.46 : 1;
  const rigRotX = Math.sin(loopAngle) * 0.014;
  const rigRotY = Math.cos(loopAngle) * 0.018;

  const getBodyMaterial = (
    tone: PedestalTone,
    baseZ: number,
  ): MeshStandardMaterial => {
    const isFar = baseZ < -2.2;
    if (tone === "primary") {
      return isFar ? materials.farPrimary : materials.primary;
    }
    if (tone === "secondary") {
      return isFar ? materials.farSecondary : materials.secondary;
    }
    return isFar ? materials.farAccent : materials.accent;
  };

  return (
    <>
      <fog attach="fog" args={[palette.fogColor, 10.5, 23.5]} />
      <StonesCameraRig aspectRatio={aspectRatio} />

      {/* Three-point + dual rim studio lighting rig */}
      <ambientLight intensity={palette.ambientIntensity} color="#FFFFFF" />
      <hemisphereLight
        args={[palette.hemiSky, palette.hemiGround, palette.hemiIntensity]}
      />
      <directionalLight
        position={[8, 11, 10]}
        intensity={palette.keyIntensity}
        color={palette.keyColor}
      />
      <directionalLight
        position={[-9, -3, 8]}
        intensity={palette.fillIntensity}
        color={palette.fillColor}
      />
      <directionalLight
        position={[0, 8, -10]}
        intensity={palette.rimTopIntensity}
        color={palette.rimTopColor}
      />
      <directionalLight
        position={[0, -8, -9]}
        intensity={palette.rimBottomIntensity}
        color={palette.rimBottomColor}
      />

      <group rotation={[rigRotX, rigRotY, 0]}>
        {STEPPING_STONE_SPECS.map((spec) => (
          <FloatingPedestal
            key={spec.id}
            spec={spec}
            loopAngle={loopAngle}
            bobAmplitude={bobAmplitude}
            aspectXScale={aspectXScale}
            geometrySet={geometrySets[spec.silhouette]}
            bodyMaterial={getBodyMaterial(spec.tone, spec.basePosition[2])}
            collarMaterial={materials.collar}
          />
        ))}
      </group>
    </>
  );
};

export const FloatingSteppingStones4K: React.FC<
  FloatingSteppingStones4KProps
> = (props) => {
  const {
    themePreset = "clean-corporate",
    aspectRatio = "16:9",
    backgroundColor = "#F8FAFC",
    primaryColor = "#E2E8F0",
    secondaryColor = "#CBD5E1",
    accentColor = "#3B82F6",
    bobAmplitude = 1,
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
        bobAmplitude,
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
      bobAmplitude,
      speedMultiplier,
      strokeWidth,
    ],
  );

  const cameraConfig = useMemo(
    () => ({
      position: (aspectRatio === "9:16"
        ? [0, 0.35, 14.4]
        : [0, 0.35, 12.2]) as [number, number, number],
      fov: 40,
      near: 0.1,
      far: 100,
    }),
    [aspectRatio],
  );

  return (
    <AbsoluteFill style={{ backgroundColor: palette.bgTop, overflow: "hidden" }}>
      {/* Soft studio gradient backdrop + tiled anti-banding grain */}
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
            id="stones-bg-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={palette.bgTop} />
            <stop offset="100%" stopColor={palette.bgBottom} />
          </linearGradient>
          <radialGradient id="stones-bg-glow" cx="50%" cy="50%" r="58%">
            <stop
              offset="0%"
              stopColor={palette.bgGlow}
              stopOpacity={palette.bgGlowOpacity}
            />
            <stop offset="100%" stopColor={palette.bgBottom} stopOpacity="0" />
          </radialGradient>
          <filter
            id="stones-grain"
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
          <pattern
            id="stones-grain-pattern"
            width="256"
            height="256"
            patternUnits="userSpaceOnUse"
          >
            <rect
              width="256"
              height="256"
              filter="url(#stones-grain)"
              opacity="0.012"
            />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#stones-bg-grad)" />
        <rect width={width} height={height} fill="url(#stones-bg-glow)" />
        <rect
          width={width}
          height={height}
          fill="url(#stones-grain-pattern)"
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
        <StonesScene
          frame={frame}
          durationInFrames={durationInFrames}
          palette={palette}
          bobAmplitude={bobAmplitude}
          speedMultiplier={speedMultiplier}
          strokeWidth={strokeWidth}
          aspectRatio={aspectRatio}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
