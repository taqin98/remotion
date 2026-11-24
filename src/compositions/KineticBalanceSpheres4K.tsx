import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
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

export const kineticBalanceSpheres4KSchema = z.object({
  themePreset: themePresetSchema.default("warm-minimalist"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#FAF6F0"),
  primaryColor: z.string().default("#E07A5F"),
  secondaryColor: z.string().default("#D4A373"),
  accentColor: z.string().default("#F2CC8F"),
  speedMultiplier: z.number().int().positive().default(1),
});

export type KineticBalanceSpheres4KProps = z.infer<
  typeof kineticBalanceSpheres4KSchema
>;

export const defaultKineticBalanceSpheres4KProps: KineticBalanceSpheres4KProps =
  {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "#FAF6F0",
    primaryColor: "#E07A5F",
    secondaryColor: "#D4A373",
    accentColor: "#F2CC8F",
    speedMultiplier: 1,
  };

export const kineticBalanceSpheres4KVariations: Record<
  ThemePreset,
  KineticBalanceSpheres4KProps
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "#F8FAFC",
    primaryColor: "#1E293B",
    secondaryColor: "#3B82F6",
    accentColor: "#0EA5E9",
    speedMultiplier: 1,
  },
  "dark-tech": {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "#070D1D",
    primaryColor: "#1E293B",
    secondaryColor: "#06B6D4",
    accentColor: "#6366F1",
    speedMultiplier: 1,
  },
  "warm-minimalist": defaultKineticBalanceSpheres4KProps,
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "#0F0F12",
    primaryColor: "#18181B",
    secondaryColor: "#D4AF37",
    accentColor: "#F3D37A",
    speedMultiplier: 1,
  },
};

interface ThemePalette {
  bgTop: string;
  bgBottom: string;
  bgGlow: string;
  bgGlowOpacity: number;
  fogColor: string;
  spherePrimary: string;
  sphereSecondary: string;
  sphereStripe: string;
  trackColor: string;
  spineColor: string;
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
    bgBottom: "#E9F0F7",
    bgGlow: "#3B82F6",
    bgGlowOpacity: 0.08,
    fogColor: "#F2F6FB",
    spherePrimary: "#1E293B",
    sphereSecondary: "#3B82F6",
    sphereStripe: "#F8FAFC",
    trackColor: "#CBD5E1",
    spineColor: "#94A3B8",
    ambientIntensity: 0.88,
    hemiSky: "#FFFFFF",
    hemiGround: "#CBD5E1",
    hemiIntensity: 0.72,
    keyColor: "#FFF9F0",
    keyIntensity: 1.42,
    fillColor: "#DCEAFE",
    fillIntensity: 0.68,
    rimColor: "#FFFFFF",
    rimIntensity: 0.95,
  },
  "dark-tech": {
    bgTop: "#0B1328",
    bgBottom: "#040814",
    bgGlow: "#06B6D4",
    bgGlowOpacity: 0.14,
    fogColor: "#060D1E",
    spherePrimary: "#06B6D4",
    sphereSecondary: "#6366F1",
    sphereStripe: "#E0F2FE",
    trackColor: "#1E293B",
    spineColor: "#334155",
    ambientIntensity: 0.55,
    hemiSky: "#38BDF8",
    hemiGround: "#020617",
    hemiIntensity: 0.6,
    keyColor: "#FFF5E4",
    keyIntensity: 1.5,
    fillColor: "#6366F1",
    fillIntensity: 0.82,
    rimColor: "#22D3EE",
    rimIntensity: 1.25,
  },
  "warm-minimalist": {
    bgTop: "#FDFBF7",
    bgBottom: "#EFE4D4",
    bgGlow: "#E07A5F",
    bgGlowOpacity: 0.09,
    fogColor: "#F5EEE3",
    spherePrimary: "#E07A5F",
    sphereSecondary: "#D4A373",
    sphereStripe: "#FAF8F5",
    trackColor: "#E5D8C6",
    spineColor: "#CBB89E",
    ambientIntensity: 0.9,
    hemiSky: "#FFFDF8",
    hemiGround: "#D6C5B0",
    hemiIntensity: 0.78,
    keyColor: "#FFF4E0",
    keyIntensity: 1.4,
    fillColor: "#F5E1C8",
    fillIntensity: 0.66,
    rimColor: "#FFFFFF",
    rimIntensity: 0.88,
  },
  "monochrome-luxury": {
    bgTop: "#17171B",
    bgBottom: "#09090B",
    bgGlow: "#D4AF37",
    bgGlowOpacity: 0.11,
    fogColor: "#0D0D10",
    spherePrimary: "#D4AF37",
    sphereSecondary: "#F3D37A",
    sphereStripe: "#18181B",
    trackColor: "#27272C",
    spineColor: "#18181B",
    ambientIntensity: 0.44,
    hemiSky: "#FDE68A",
    hemiGround: "#09090B",
    hemiIntensity: 0.52,
    keyColor: "#FFF5D6",
    keyIntensity: 1.5,
    fillColor: "#52525B",
    fillIntensity: 0.65,
    rimColor: "#D4AF37",
    rimIntensity: 1.32,
  },
};

const resolveThemePalette = (
  props: KineticBalanceSpheres4KProps,
): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  const hasCustomBg =
    props.backgroundColor !==
    defaultKineticBalanceSpheres4KProps.backgroundColor;
  const hasCustomPrimary =
    props.primaryColor !== defaultKineticBalanceSpheres4KProps.primaryColor;
  const hasCustomSecondary =
    props.secondaryColor !==
    defaultKineticBalanceSpheres4KProps.secondaryColor;
  const hasCustomAccent =
    props.accentColor !== defaultKineticBalanceSpheres4KProps.accentColor;

  return {
    ...base,
    bgTop: hasCustomBg ? props.backgroundColor : base.bgTop,
    fogColor: hasCustomBg ? props.backgroundColor : base.fogColor,
    spherePrimary: hasCustomPrimary ? props.primaryColor : base.spherePrimary,
    sphereSecondary: hasCustomSecondary
      ? props.secondaryColor
      : base.sphereSecondary,
    sphereStripe: hasCustomAccent ? props.accentColor : base.sphereStripe,
  };
};

const TRACK_RADIUS = 2.1;
const RAIL_TUBE = 0.075;
const GROOVE_HALF_GAP = 0.21;
const SPHERE_RADIUS = 0.36;

// Exact geometric seating inside the twin-rail groove
const CONTACT_DIST = SPHERE_RADIUS + RAIL_TUBE;
const RADIAL_SEAT_OFFSET = Math.sqrt(
  CONTACT_DIST * CONTACT_DIST - GROOVE_HALF_GAP * GROOVE_HALF_GAP,
);
const SPHERE_PATH_RADIUS = TRACK_RADIUS - RADIAL_SEAT_OFFSET;

interface BalanceCradleSpec {
  id: string;
  arcCenter: [number, number, number];
  baseRotY: number;
  baseRotZ: number;
  scale: number;
  trackArc: number;
  maxSweepAngle: number;
  cycles: number;
  phase: number;
  useSecondarySphere: boolean;
}

// 5 kinetic balance cradles positioned around perimeter keeping center-left open
const CRADLE_SPECS: readonly BalanceCradleSpec[] = [
  {
    id: "cradle-lower-right-hero",
    arcCenter: [4.35, -0.45, 0.4],
    baseRotY: -0.34,
    baseRotZ: -0.04,
    scale: 1.15,
    trackArc: 1.65,
    maxSweepAngle: 0.58,
    cycles: 1,
    phase: 0.0,
    useSecondarySphere: false,
  },
  {
    id: "cradle-upper-right",
    arcCenter: [5.15, 3.35, -0.9],
    baseRotY: -0.42,
    baseRotZ: 0.06,
    scale: 0.92,
    trackArc: 1.55,
    maxSweepAngle: 0.54,
    cycles: 2,
    phase: 1.25,
    useSecondarySphere: true,
  },
  {
    id: "cradle-lower-left",
    arcCenter: [-5.1, -0.85, -0.6],
    baseRotY: 0.38,
    baseRotZ: 0.05,
    scale: 0.98,
    trackArc: 1.6,
    maxSweepAngle: 0.56,
    cycles: 1,
    phase: 2.35,
    useSecondarySphere: true,
  },
  {
    id: "cradle-upper-left-depth",
    arcCenter: [-5.45, 3.55, -2.2],
    baseRotY: 0.32,
    baseRotZ: -0.05,
    scale: 0.86,
    trackArc: 1.5,
    maxSweepAngle: 0.5,
    cycles: 2,
    phase: 3.65,
    useSecondarySphere: false,
  },
  {
    id: "cradle-top-horizon",
    arcCenter: [0.65, 3.85, -3.2],
    baseRotY: -0.14,
    baseRotZ: 0.02,
    scale: 1.05,
    trackArc: 1.7,
    maxSweepAngle: 0.6,
    cycles: 1,
    phase: 4.9,
    useSecondarySphere: false,
  },
];

const CANVAS_GL = { antialias: true, alpha: true } as const;
const CAMERA_CONFIG = {
  position: [0, 0, 12] as [number, number, number],
  fov: 40,
  near: 0.1,
  far: 100,
};

interface SharedSphereGeometries {
  sphere: SphereGeometry;
  stripe: TorusGeometry;
  endTie: CapsuleGeometry;
}

interface KineticCradleProps {
  spec: BalanceCradleSpec;
  loopAngle: number;
  aspectXScale: number;
  sharedGeometries: SharedSphereGeometries;
  sphereMaterial: MeshStandardMaterial;
  stripeMaterial: MeshStandardMaterial;
  trackMaterial: MeshStandardMaterial;
  spineMaterial: MeshStandardMaterial;
}

const KineticCradle: React.FC<KineticCradleProps> = ({
  spec,
  loopAngle,
  aspectXScale,
  sharedGeometries,
  sphereMaterial,
  stripeMaterial,
  trackMaterial,
  spineMaterial,
}) => {
  const trackGeometries = useMemo(
    () => ({
      rail: new TorusGeometry(TRACK_RADIUS, RAIL_TUBE, 28, 96, spec.trackArc),
      spine: new TorusGeometry(
        TRACK_RADIUS + RAIL_TUBE * 0.65,
        RAIL_TUBE * 0.72,
        24,
        84,
        spec.trackArc,
      ),
    }),
    [spec.trackArc],
  );

  useEffect(() => {
    return () => {
      trackGeometries.rail.dispose();
      trackGeometries.spine.dispose();
    };
  }, [trackGeometries]);

  const phaseAngle = loopAngle * spec.cycles + spec.phase;
  const alpha = Math.sin(phaseAngle) * spec.maxSweepAngle;
  const sphereX = Math.sin(alpha) * SPHERE_PATH_RADIUS;
  const sphereY = -Math.cos(alpha) * SPHERE_PATH_RADIUS;
  // Exact no-slip roll angle matching traveled arc distance along the groove
  const rollZ = -alpha * (SPHERE_PATH_RADIUS / SPHERE_RADIUS);
  const cradleTiltZ = spec.baseRotZ - Math.sin(phaseAngle) * 0.04;

  const torusRotZ = -Math.PI / 2 - spec.trackArc / 2;
  const endX = TRACK_RADIUS * Math.sin(spec.trackArc / 2);
  const endY = -TRACK_RADIUS * Math.cos(spec.trackArc / 2);

  return (
    <group
      position={[
        spec.arcCenter[0] * aspectXScale,
        spec.arcCenter[1],
        spec.arcCenter[2],
      ]}
      rotation={[0.14, spec.baseRotY, cradleTiltZ]}
      scale={[spec.scale, spec.scale, spec.scale]}
    >
      {/* Front & back twin curved rails */}
      <mesh
        geometry={trackGeometries.rail}
        material={trackMaterial}
        position={[0, 0, GROOVE_HALF_GAP]}
        rotation={[0, 0, torusRotZ]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={trackGeometries.rail}
        material={trackMaterial}
        position={[0, 0, -GROOVE_HALF_GAP]}
        rotation={[0, 0, torusRotZ]}
        castShadow
        receiveShadow
      />

      {/* Recessed center spine channel */}
      <mesh
        geometry={trackGeometries.spine}
        material={spineMaterial}
        position={[0, 0, 0]}
        rotation={[0, 0, torusRotZ]}
        receiveShadow
      />

      {/* Left & right rail bridge end-caps */}
      <mesh
        geometry={sharedGeometries.endTie}
        material={spineMaterial}
        position={[-endX, endY, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={sharedGeometries.endTie}
        material={spineMaterial}
        position={[endX, endY, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      />

      {/* Rolling sphere seated in the twin-rail groove */}
      <group position={[sphereX, sphereY, 0]} rotation={[0, 0, rollZ]}>
        <mesh
          geometry={sharedGeometries.sphere}
          material={sphereMaterial}
          castShadow
          receiveShadow
        />
        <mesh
          geometry={sharedGeometries.stripe}
          material={stripeMaterial}
          rotation={[0, Math.PI / 2, 0]}
        />
      </group>
    </group>
  );
};

interface KineticSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  speedMultiplier: number;
  aspectRatio: AspectRatio;
}

const KineticScene: React.FC<KineticSceneProps> = ({
  frame,
  durationInFrames,
  palette,
  speedMultiplier,
  aspectRatio,
}) => {
  const progress = (frame % durationInFrames) / durationInFrames;
  const loopAngle = progress * Math.PI * 2 * speedMultiplier;

  const sharedGeometries = useMemo<SharedSphereGeometries>(
    () => ({
      sphere: new SphereGeometry(SPHERE_RADIUS, 40, 40),
      stripe: new TorusGeometry(SPHERE_RADIUS + 0.004, 0.015, 16, 48),
      endTie: new CapsuleGeometry(RAIL_TUBE, GROOVE_HALF_GAP * 2, 16, 24),
    }),
    [],
  );

  const materials = useMemo(
    () => ({
      spherePrimary: new MeshStandardMaterial({
        color: palette.spherePrimary,
        roughness: 0.32,
        metalness: 0.14,
      }),
      sphereSecondary: new MeshStandardMaterial({
        color: palette.sphereSecondary,
        roughness: 0.34,
        metalness: 0.12,
      }),
      stripe: new MeshStandardMaterial({
        color: palette.sphereStripe,
        roughness: 0.28,
        metalness: 0.25,
      }),
      track: new MeshStandardMaterial({
        color: palette.trackColor,
        roughness: 0.48,
        metalness: 0.08,
      }),
      spine: new MeshStandardMaterial({
        color: palette.spineColor,
        roughness: 0.54,
        metalness: 0.1,
      }),
    }),
    [
      palette.spherePrimary,
      palette.sphereSecondary,
      palette.sphereStripe,
      palette.trackColor,
      palette.spineColor,
    ],
  );

  useEffect(() => {
    return () => {
      sharedGeometries.sphere.dispose();
      sharedGeometries.stripe.dispose();
      sharedGeometries.endTie.dispose();
    };
  }, [sharedGeometries]);

  useEffect(() => {
    return () => {
      materials.spherePrimary.dispose();
      materials.sphereSecondary.dispose();
      materials.stripe.dispose();
      materials.track.dispose();
      materials.spine.dispose();
    };
  }, [materials]);

  const aspectXScale = aspectRatio === "9:16" ? 0.44 : 1;

  return (
    <>
      <fog attach="fog" args={[palette.fogColor, 11, 24]} />

      {/* Warm directional studio lighting + soft ambient & rim fill */}
      <ambientLight intensity={palette.ambientIntensity} color="#FFFFFF" />
      <hemisphereLight
        args={[palette.hemiSky, palette.hemiGround, palette.hemiIntensity]}
      />
      <directionalLight
        position={[9, 13, 10]}
        intensity={palette.keyIntensity}
        color={palette.keyColor}
        castShadow
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

      {CRADLE_SPECS.map((spec) => (
        <KineticCradle
          key={spec.id}
          spec={spec}
          loopAngle={loopAngle}
          aspectXScale={aspectXScale}
          sharedGeometries={sharedGeometries}
          sphereMaterial={
            spec.useSecondarySphere
              ? materials.sphereSecondary
              : materials.spherePrimary
          }
          stripeMaterial={materials.stripe}
          trackMaterial={materials.track}
          spineMaterial={materials.spine}
        />
      ))}
    </>
  );
};

export const KineticBalanceSpheres4K: React.FC<
  KineticBalanceSpheres4KProps
> = (props) => {
  const {
    themePreset = "warm-minimalist",
    aspectRatio = "16:9",
    backgroundColor = "#FAF6F0",
    primaryColor = "#E07A5F",
    secondaryColor = "#D4A373",
    accentColor = "#F2CC8F",
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
        speedMultiplier,
      }),
    [
      themePreset,
      aspectRatio,
      backgroundColor,
      primaryColor,
      secondaryColor,
      accentColor,
      speedMultiplier,
    ],
  );

  return (
    <AbsoluteFill style={{ backgroundColor: palette.bgTop, overflow: "hidden" }}>
      {/* Warm editorial gradient backdrop + subtle anti-banding grain */}
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
            id="kinetic-bg-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={palette.bgTop} />
            <stop offset="100%" stopColor={palette.bgBottom} />
          </linearGradient>
          <radialGradient id="kinetic-bg-glow" cx="72%" cy="62%" r="54%">
            <stop
              offset="0%"
              stopColor={palette.bgGlow}
              stopOpacity={palette.bgGlowOpacity}
            />
            <stop offset="100%" stopColor={palette.bgBottom} stopOpacity="0" />
          </radialGradient>
          <filter
            id="kinetic-grain"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed="37"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width={width} height={height} fill="url(#kinetic-bg-grad)" />
        <rect width={width} height={height} fill="url(#kinetic-bg-glow)" />
        <rect
          width={width}
          height={height}
          filter="url(#kinetic-grain)"
          opacity="0.012"
        />
      </svg>

      <ThreeCanvas
        width={width}
        height={height}
        shadows="soft"
        dpr={1}
        camera={CAMERA_CONFIG}
        gl={CANVAS_GL}
        style={{ position: "absolute", inset: 0 }}
      >
        <KineticScene
          frame={frame}
          durationInFrames={durationInFrames}
          palette={palette}
          speedMultiplier={speedMultiplier}
          aspectRatio={aspectRatio}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

