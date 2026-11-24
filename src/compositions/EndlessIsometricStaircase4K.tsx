import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { MeshStandardMaterial, setConsoleFunction } from "three";
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

export const endlessIsometricStaircase4KSchema = z.object({
  themePreset: themePresetSchema.default("clean-corporate"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#F8FAFC"),
  primaryColor: z.string().default("#F1F5F9"),
  secondaryColor: z.string().default("#64748B"),
  accentColor: z.string().default("#3B82F6"),
  speedMultiplier: z.number().int().positive().default(1),
  cameraZoom: z.number().min(100).max(360).default(215),
});

export type EndlessIsometricStaircase4KProps = z.infer<
  typeof endlessIsometricStaircase4KSchema
>;

export const defaultEndlessIsometricStaircase4KProps: EndlessIsometricStaircase4KProps =
  {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "#F8FAFC",
    primaryColor: "#F1F5F9",
    secondaryColor: "#64748B",
    accentColor: "#3B82F6",
    speedMultiplier: 1,
    cameraZoom: 215,
  };

export const endlessIsometricStaircase4KVariations: Record<
  ThemePreset,
  EndlessIsometricStaircase4KProps
> = {
  "clean-corporate": defaultEndlessIsometricStaircase4KProps,
  "dark-tech": {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "#070D1D",
    primaryColor: "#1E293B",
    secondaryColor: "#334155",
    accentColor: "#38BDF8",
    speedMultiplier: 1,
    cameraZoom: 215,
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "#FAF7F2",
    primaryColor: "#F3ECE1",
    secondaryColor: "#D4A373",
    accentColor: "#E07A5F",
    speedMultiplier: 1,
    cameraZoom: 215,
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "#0F0F12",
    primaryColor: "#1C1C21",
    secondaryColor: "#2E2E36",
    accentColor: "#D4AF37",
    speedMultiplier: 1,
    cameraZoom: 215,
  },
};

interface ThemePalette {
  bgTop: string;
  bgBottom: string;
  bgGlow: string;
  bgGlowOpacity: number;
  fogColor: string;
  stepEven: string;
  stepOdd: string;
  treadColor: string;
  trimColor: string;
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
    bgBottom: "#E7EEF6",
    bgGlow: "#64748B",
    bgGlowOpacity: 0.08,
    fogColor: "#F0F4F9",
    stepEven: "#F8FAFC",
    stepOdd: "#E2E8F0",
    treadColor: "#64748B",
    trimColor: "#3B82F6",
    ambientIntensity: 0.92,
    hemiSky: "#FFFFFF",
    hemiGround: "#CBD5E1",
    hemiIntensity: 0.72,
    keyColor: "#FFFFFF",
    keyIntensity: 1.35,
    fillColor: "#DCEAFE",
    fillIntensity: 0.7,
    rimColor: "#FFFFFF",
    rimIntensity: 0.9,
  },
  "dark-tech": {
    bgTop: "#0B1328",
    bgBottom: "#040814",
    bgGlow: "#38BDF8",
    bgGlowOpacity: 0.13,
    fogColor: "#060D1E",
    stepEven: "#1E293B",
    stepOdd: "#162033",
    treadColor: "#334155",
    trimColor: "#38BDF8",
    ambientIntensity: 0.55,
    hemiSky: "#38BDF8",
    hemiGround: "#020617",
    hemiIntensity: 0.58,
    keyColor: "#E0F2FE",
    keyIntensity: 1.48,
    fillColor: "#6366F1",
    fillIntensity: 0.85,
    rimColor: "#38BDF8",
    rimIntensity: 1.25,
  },
  "warm-minimalist": {
    bgTop: "#FDFBF7",
    bgBottom: "#EEE4D6",
    bgGlow: "#E07A5F",
    bgGlowOpacity: 0.08,
    fogColor: "#F5EEE4",
    stepEven: "#FAF6F0",
    stepOdd: "#EDE2D3",
    treadColor: "#D4A373",
    trimColor: "#E07A5F",
    ambientIntensity: 0.95,
    hemiSky: "#FFFDF9",
    hemiGround: "#D6C5B0",
    hemiIntensity: 0.75,
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
    bgGlowOpacity: 0.1,
    fogColor: "#0D0D10",
    stepEven: "#202026",
    stepOdd: "#16161B",
    treadColor: "#2E2E36",
    trimColor: "#D4AF37",
    ambientIntensity: 0.45,
    hemiSky: "#FDE68A",
    hemiGround: "#09090B",
    hemiIntensity: 0.5,
    keyColor: "#FFF6DB",
    keyIntensity: 1.45,
    fillColor: "#52525B",
    fillIntensity: 0.65,
    rimColor: "#D4AF37",
    rimIntensity: 1.3,
  },
};

const resolveThemePalette = (
  props: EndlessIsometricStaircase4KProps,
): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  const hasCustomBg =
    props.backgroundColor !==
    defaultEndlessIsometricStaircase4KProps.backgroundColor;
  const hasCustomPrimary =
    props.primaryColor !==
    defaultEndlessIsometricStaircase4KProps.primaryColor;
  const hasCustomSecondary =
    props.secondaryColor !==
    defaultEndlessIsometricStaircase4KProps.secondaryColor;
  const hasCustomAccent =
    props.accentColor !== defaultEndlessIsometricStaircase4KProps.accentColor;

  return {
    ...base,
    bgTop: hasCustomBg ? props.backgroundColor : base.bgTop,
    fogColor: hasCustomBg ? props.backgroundColor : base.fogColor,
    stepEven: hasCustomPrimary ? props.primaryColor : base.stepEven,
    treadColor: hasCustomSecondary ? props.secondaryColor : base.treadColor,
    trimColor: hasCustomAccent ? props.accentColor : base.trimColor,
  };
};

const STEP_COUNT = 18;
const STEPS_PER_LOOP = 4;
const STEP_RUN_X = 0.68;
const STEP_RISE_Y = 0.58;
const CENTER_INDEX = 9;
const FLIGHT_EASING = Easing.inOut(Easing.cubic);

const CANVAS_GL = { antialias: true, alpha: true } as const;

interface FlightSpec {
  id: string;
  anchor: [number, number, number];
  direction: 1 | -1;
  phaseOffset: number;
}

const FLIGHT_SPECS: readonly FlightSpec[] = [
  {
    id: "lower-right-flight",
    anchor: [3.8, -1.6, -2.4],
    direction: 1,
    phaseOffset: 0,
  },
  {
    id: "upper-left-flight",
    anchor: [-3.8, 1.9, 2.4],
    direction: -1,
    phaseOffset: Math.PI * 0.6,
  },
];

const IsometricCameraRig: React.FC<{ zoom: number }> = ({ zoom }) => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    camera.position.set(10, 10, 10);
    camera.zoom = zoom;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, zoom]);

  return null;
};

interface StairGeometries {
  stepBody: RoundedBoxGeometry;
  topTread: RoundedBoxGeometry;
  sideTrim: RoundedBoxGeometry;
  rail: RoundedBoxGeometry;
}

interface StairMaterials {
  stepEven: MeshStandardMaterial;
  stepOdd: MeshStandardMaterial;
  tread: MeshStandardMaterial;
  trim: MeshStandardMaterial;
}

interface StairStepProps {
  index: number;
  flight: FlightSpec;
  stepOffset: number;
  loopAngle: number;
  aspectXScale: number;
  geometries: StairGeometries;
  materials: StairMaterials;
}

const StairStep: React.FC<StairStepProps> = ({
  index,
  flight,
  stepOffset,
  loopAngle,
  aspectXScale,
  geometries,
  materials,
}) => {
  const u = index + stepOffset;
  if (u <= 2 || u >= 16) {
    return null;
  }

  const enterEnvelope = interpolate(u, [2, 4.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: FLIGHT_EASING,
  });
  const exitEnvelope = interpolate(u, [13.5, 16], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: FLIGHT_EASING,
  });
  const envelope = enterEnvelope * exitEnvelope;

  const t = u - CENTER_INDEX;
  const waveLift =
    Math.sin(loopAngle + flight.phaseOffset - (u / STEP_COUNT) * Math.PI * 2) *
    0.16 *
    envelope;

  const posX =
    flight.anchor[0] * aspectXScale + t * STEP_RUN_X * flight.direction;
  const posY =
    flight.anchor[1] + t * STEP_RISE_Y * flight.direction + waveLift;
  const posZ = flight.anchor[2];

  const bodyMaterial = index % 2 === 0 ? materials.stepEven : materials.stepOdd;

  return (
    <group
      position={[posX, posY, posZ]}
      scale={[envelope, envelope, envelope]}
    >
      <mesh
        geometry={geometries.stepBody}
        material={bodyMaterial}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={geometries.topTread}
        material={materials.tread}
        position={[0, 0.21, 0]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={geometries.sideTrim}
        material={materials.trim}
        position={[0, 0, 1.06]}
      />
    </group>
  );
};

interface StaircaseSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  speedMultiplier: number;
  cameraZoom: number;
  aspectRatio: AspectRatio;
}

const StaircaseScene: React.FC<StaircaseSceneProps> = ({
  frame,
  durationInFrames,
  palette,
  speedMultiplier,
  cameraZoom,
  aspectRatio,
}) => {
  const progress = (frame % durationInFrames) / durationInFrames;
  const loopAngle = progress * Math.PI * 2 * speedMultiplier;
  // Wraps every 2 steps to preserve alternating step parity cleanly at frame 360
  const stepOffset = (progress * STEPS_PER_LOOP * speedMultiplier) % 2;

  const stepIndices = useMemo(
    () => Array.from({ length: STEP_COUNT }, (_, idx) => idx),
    [],
  );

  const geometries = useMemo<StairGeometries>(
    () => ({
      stepBody: new RoundedBoxGeometry(0.92, 0.42, 2.08, 2, 0.055),
      topTread: new RoundedBoxGeometry(0.86, 0.07, 1.98, 2, 0.025),
      sideTrim: new RoundedBoxGeometry(0.68, 0.08, 0.06, 1, 0.02),
      rail: new RoundedBoxGeometry(9.6, 0.14, 0.14, 2, 0.04),
    }),
    [],
  );

  const materials = useMemo<StairMaterials>(
    () => ({
      stepEven: new MeshStandardMaterial({
        color: palette.stepEven,
        roughness: 0.52,
        metalness: 0.06,
      }),
      stepOdd: new MeshStandardMaterial({
        color: palette.stepOdd,
        roughness: 0.54,
        metalness: 0.06,
      }),
      tread: new MeshStandardMaterial({
        color: palette.treadColor,
        roughness: 0.48,
        metalness: 0.12,
      }),
      trim: new MeshStandardMaterial({
        color: palette.trimColor,
        roughness: 0.36,
        metalness: 0.2,
      }),
    }),
    [palette.stepEven, palette.stepOdd, palette.treadColor, palette.trimColor],
  );

  useEffect(() => {
    return () => {
      geometries.stepBody.dispose();
      geometries.topTread.dispose();
      geometries.sideTrim.dispose();
      geometries.rail.dispose();
    };
  }, [geometries]);

  useEffect(() => {
    return () => {
      materials.stepEven.dispose();
      materials.stepOdd.dispose();
      materials.tread.dispose();
      materials.trim.dispose();
    };
  }, [materials]);

  const effectiveZoom = aspectRatio === "9:16" ? cameraZoom * 0.72 : cameraZoom;
  const aspectXScale = aspectRatio === "9:16" ? 0.55 : 1;
  const inclineAngle = Math.atan2(STEP_RISE_Y, STEP_RUN_X);

  return (
    <>
      <fog attach="fog" args={[palette.fogColor, 13, 28]} />
      <IsometricCameraRig zoom={effectiveZoom} />

      {/* Three-point architectural studio lighting */}
      <ambientLight intensity={palette.ambientIntensity} color="#FFFFFF" />
      <hemisphereLight
        args={[palette.hemiSky, palette.hemiGround, palette.hemiIntensity]}
      />
      <directionalLight
        position={[14, 20, 10]}
        intensity={palette.keyIntensity}
        color={palette.keyColor}
      />
      <directionalLight
        position={[-12, 6, 12]}
        intensity={palette.fillIntensity}
        color={palette.fillColor}
      />
      <directionalLight
        position={[-8, 12, -14]}
        intensity={palette.rimIntensity}
        color={palette.rimColor}
      />

      {FLIGHT_SPECS.map((flight) => (
        <group key={flight.id}>
          {stepIndices.map((idx) => (
            <StairStep
              key={`${flight.id}-${idx}`}
              index={idx}
              flight={flight}
              stepOffset={stepOffset}
              loopAngle={loopAngle}
              aspectXScale={aspectXScale}
              geometries={geometries}
              materials={materials}
            />
          ))}
          {/* Minimalist architectural stringer rail along the staircase edge */}
          <mesh
            geometry={geometries.rail}
            material={materials.tread}
            position={[
              flight.anchor[0] * aspectXScale,
              flight.anchor[1] + 0.52,
              flight.anchor[2] + 1.18,
            ]}
            rotation={[0, 0, inclineAngle]}
          />
        </group>
      ))}
    </>
  );
};

export const EndlessIsometricStaircase4K: React.FC<
  EndlessIsometricStaircase4KProps
> = (props) => {
  const {
    themePreset = "clean-corporate",
    aspectRatio = "16:9",
    backgroundColor = "#F8FAFC",
    primaryColor = "#F1F5F9",
    secondaryColor = "#64748B",
    accentColor = "#3B82F6",
    speedMultiplier = 1,
    cameraZoom = 215,
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
        cameraZoom,
      }),
    [
      themePreset,
      aspectRatio,
      backgroundColor,
      primaryColor,
      secondaryColor,
      accentColor,
      speedMultiplier,
      cameraZoom,
    ],
  );

  const cameraConfig = useMemo(
    () => ({
      position: [10, 10, 10] as [number, number, number],
      zoom: aspectRatio === "9:16" ? cameraZoom * 0.72 : cameraZoom,
      near: -60,
      far: 120,
    }),
    [cameraZoom, aspectRatio],
  );

  return (
    <AbsoluteFill style={{ backgroundColor: palette.bgTop, overflow: "hidden" }}>
      {/* Soft gradient backdrop + anti-banding grain */}
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
            id="stair-bg-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={palette.bgTop} />
            <stop offset="100%" stopColor={palette.bgBottom} />
          </linearGradient>
          <radialGradient id="stair-bg-glow" cx="50%" cy="50%" r="55%">
            <stop
              offset="0%"
              stopColor={palette.bgGlow}
              stopOpacity={palette.bgGlowOpacity}
            />
            <stop offset="100%" stopColor={palette.bgBottom} stopOpacity="0" />
          </radialGradient>
          <filter id="stair-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed="23"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width={width} height={height} fill="url(#stair-bg-grad)" />
        <rect width={width} height={height} fill="url(#stair-bg-glow)" />
        <rect
          width={width}
          height={height}
          filter="url(#stair-grain)"
          opacity="0.012"
        />
      </svg>

      <ThreeCanvas
        width={width}
        height={height}
        orthographic
        dpr={1}
        camera={cameraConfig}
        gl={CANVAS_GL}
        style={{ position: "absolute", inset: 0 }}
      >
        <StaircaseScene
          frame={frame}
          durationInFrames={durationInFrames}
          palette={palette}
          speedMultiplier={speedMultiplier}
          cameraZoom={cameraZoom}
          aspectRatio={aspectRatio}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

