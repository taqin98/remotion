import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  BoxGeometry,
  DirectionalLight,
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

export const ribbonWaveSculpture4KSchema = z.object({
  themePreset: themePresetSchema.default("clean-corporate"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#F8FAFC"),
  primaryColor: z.string().default("#E2E8F0"),
  secondaryColor: z.string().default("#CBD5E1"),
  accentColor: z.string().default("#3B82F6"),
  waveAmplitude: z.number().min(0.2).max(2).default(1),
  speedMultiplier: z.number().int().positive().default(1),
  strokeWidth: z.number().min(0.5).max(3).default(1),
});

export type RibbonWaveSculpture4KProps = z.infer<
  typeof ribbonWaveSculpture4KSchema
>;

export const defaultRibbonWaveSculpture4KProps: RibbonWaveSculpture4KProps = {
  themePreset: "clean-corporate",
  aspectRatio: "16:9",
  backgroundColor: "#F8FAFC",
  primaryColor: "#E2E8F0",
  secondaryColor: "#CBD5E1",
  accentColor: "#3B82F6",
  waveAmplitude: 1,
  speedMultiplier: 1,
  strokeWidth: 1,
};

export const ribbonWaveSculpture4KVariations: Record<
  ThemePreset,
  RibbonWaveSculpture4KProps
> = {
  "clean-corporate": defaultRibbonWaveSculpture4KProps,
  "dark-tech": {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "#070D1D",
    primaryColor: "#162033",
    secondaryColor: "#1E293B",
    accentColor: "#38BDF8",
    waveAmplitude: 1,
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
    waveAmplitude: 1,
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
    waveAmplitude: 1,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
};

interface ThemePalette {
  bgTop: string;
  bgBottom: string;
  bgGlow: string;
  bgGlowOpacity: number;
  ribbonPrimary: string;
  ribbonSecondary: string;
  ribbonAccent: string;
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
    bgBottom: "#E7EFF7",
    bgGlow: "#3B82F6",
    bgGlowOpacity: 0.07,
    ribbonPrimary: "#F8FAFC",
    ribbonSecondary: "#D9E2EC",
    ribbonAccent: "#3B82F6",
    ambientIntensity: 0.85,
    hemiSky: "#FFFFFF",
    hemiGround: "#CBD5E1",
    hemiIntensity: 0.65,
    keyColor: "#FFFDF9",
    keyIntensity: 1.45,
    fillColor: "#DCEAFE",
    fillIntensity: 0.65,
    rimColor: "#FFFFFF",
    rimIntensity: 0.95,
  },
  "dark-tech": {
    bgTop: "#0B1328",
    bgBottom: "#040814",
    bgGlow: "#38BDF8",
    bgGlowOpacity: 0.14,
    ribbonPrimary: "#162033",
    ribbonSecondary: "#1E293B",
    ribbonAccent: "#38BDF8",
    ambientIntensity: 0.5,
    hemiSky: "#38BDF8",
    hemiGround: "#020617",
    hemiIntensity: 0.55,
    keyColor: "#E0F2FE",
    keyIntensity: 1.55,
    fillColor: "#6366F1",
    fillIntensity: 0.78,
    rimColor: "#22D3EE",
    rimIntensity: 1.3,
  },
  "warm-minimalist": {
    bgTop: "#FDFBF7",
    bgBottom: "#EFE4D6",
    bgGlow: "#E07A5F",
    bgGlowOpacity: 0.08,
    ribbonPrimary: "#FAF6EF",
    ribbonSecondary: "#E4D6C3",
    ribbonAccent: "#E07A5F",
    ambientIntensity: 0.9,
    hemiSky: "#FFFDF8",
    hemiGround: "#D6C5B0",
    hemiIntensity: 0.7,
    keyColor: "#FFF7EB",
    keyIntensity: 1.38,
    fillColor: "#F5E1C8",
    fillIntensity: 0.62,
    rimColor: "#FFFFFF",
    rimIntensity: 0.88,
  },
  "monochrome-luxury": {
    bgTop: "#17171B",
    bgBottom: "#09090B",
    bgGlow: "#D4AF37",
    bgGlowOpacity: 0.1,
    ribbonPrimary: "#1F1F25",
    ribbonSecondary: "#2A2A32",
    ribbonAccent: "#D4AF37",
    ambientIntensity: 0.45,
    hemiSky: "#FDE68A",
    hemiGround: "#09090B",
    hemiIntensity: 0.48,
    keyColor: "#FFF6DB",
    keyIntensity: 1.52,
    fillColor: "#52525B",
    fillIntensity: 0.6,
    rimColor: "#D4AF37",
    rimIntensity: 1.35,
  },
};

const resolveThemePalette = (
  props: RibbonWaveSculpture4KProps,
): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  const hasCustomBg =
    props.backgroundColor !== defaultRibbonWaveSculpture4KProps.backgroundColor;
  const hasCustomPrimary =
    props.primaryColor !== defaultRibbonWaveSculpture4KProps.primaryColor;
  const hasCustomSecondary =
    props.secondaryColor !== defaultRibbonWaveSculpture4KProps.secondaryColor;
  const hasCustomAccent =
    props.accentColor !== defaultRibbonWaveSculpture4KProps.accentColor;

  return {
    ...base,
    bgTop: hasCustomBg ? props.backgroundColor : base.bgTop,
    ribbonPrimary: hasCustomPrimary ? props.primaryColor : base.ribbonPrimary,
    ribbonSecondary: hasCustomSecondary
      ? props.secondaryColor
      : base.ribbonSecondary,
    ribbonAccent: hasCustomAccent ? props.accentColor : base.ribbonAccent,
  };
};

type RibbonTone = "primary" | "secondary";

interface RibbonSpec {
  id: string;
  tone: RibbonTone;
  length: number;
  width: number;
  thickness: number;
  baseY: number;
  baseZ: number;
  baseRotX: number;
  baseRotZ: number;
  freq1: number;
  freq2: number;
  amp1: number;
  amp2: number;
  zSwayAmp: number;
  twistAmp: number;
  phase: number;
  trimSide: 1 | -1;
}

const RIBBON_SEG_X = 112;
const RIBBON_SEG_Y = 2;
const RIBBON_SEG_Z = 18;

const RIBBON_SPECS: readonly RibbonSpec[] = [
  {
    id: "ribbon-lower-primary",
    tone: "primary",
    length: 25,
    width: 2.3,
    thickness: 0.22,
    baseY: -2.4,
    baseZ: 0.55,
    baseRotX: 0.42,
    baseRotZ: -0.04,
    freq1: 0.34,
    freq2: 0.58,
    amp1: 0.26,
    amp2: 0.11,
    zSwayAmp: 0.16,
    twistAmp: 0.16,
    phase: 0.0,
    trimSide: 1,
  },
  {
    id: "ribbon-lower-secondary",
    tone: "secondary",
    length: 26,
    width: 2.55,
    thickness: 0.22,
    baseY: -3.35,
    baseZ: -2.35,
    baseRotX: 0.48,
    baseRotZ: 0.045,
    freq1: 0.28,
    freq2: 0.52,
    amp1: 0.28,
    amp2: 0.12,
    zSwayAmp: 0.18,
    twistAmp: 0.15,
    phase: 2.05,
    trimSide: 1,
  },
  {
    id: "ribbon-upper-canopy",
    tone: "primary",
    length: 25,
    width: 2.25,
    thickness: 0.22,
    baseY: 2.85,
    baseZ: -0.25,
    baseRotX: -0.46,
    baseRotZ: -0.03,
    freq1: 0.31,
    freq2: 0.55,
    amp1: 0.25,
    amp2: 0.1,
    zSwayAmp: 0.15,
    twistAmp: 0.15,
    phase: 4.15,
    trimSide: -1,
  },
];

const CANVAS_GL = { antialias: true, alpha: true } as const;

const RibbonCameraRig: React.FC<{ aspectRatio: AspectRatio }> = ({
  aspectRatio,
}) => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    if (aspectRatio === "9:16") {
      camera.position.set(0, 0, 14.2);
    } else {
      camera.position.set(0, 0, 12.0);
    }
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, aspectRatio]);

  return null;
};

const KeyShadowLight: React.FC<{ color: string; intensity: number }> = ({
  color,
  intensity,
}) => {
  const lightRef = React.useRef<DirectionalLight>(null);

  useLayoutEffect(() => {
    const light = lightRef.current;
    if (!light) {
      return;
    }
    light.shadow.mapSize.set(2048, 2048);
    light.shadow.bias = -0.0004;
    light.shadow.radius = 4;
    light.shadow.camera.left = -12;
    light.shadow.camera.right = 12;
    light.shadow.camera.top = 7;
    light.shadow.camera.bottom = -7;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 32;
    light.shadow.camera.updateProjectionMatrix();
  }, []);

  return (
    <directionalLight
      ref={lightRef}
      position={[6, 9, 11]}
      intensity={intensity}
      color={color}
      castShadow
    />
  );
};

const createBeveledRibbonGeometry = (
  length: number,
  thickness: number,
  width: number,
): { geometry: BoxGeometry; initialPositions: Float32Array } => {
  const geometry = new BoxGeometry(
    length,
    thickness,
    width,
    RIBBON_SEG_X,
    RIBBON_SEG_Y,
    RIBBON_SEG_Z,
  );
  const pos = geometry.attributes.position;
  const halfWidth = width * 0.5;
  const bevelStart = 0.76;

  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const normZ = Math.min(1, Math.abs(z) / halfWidth);

    if (normZ > bevelStart) {
      const edgeT = (normZ - bevelStart) / (1 - bevelStart);
      const profileScale = Math.sqrt(Math.max(0.08, 1 - edgeT * edgeT * 0.88));
      pos.setXYZ(i, x, y * profileScale, z);
    }
  }

  geometry.computeVertexNormals();
  const initialPositions = new Float32Array(pos.array);
  return { geometry, initialPositions };
};

const createAccentTrimGeometry = (
  length: number,
  strokeWidth: number,
): { geometry: BoxGeometry; initialPositions: Float32Array } => {
  const trimHeight = 0.075 * strokeWidth;
  const trimDepth = 0.11 * strokeWidth;
  const geometry = new BoxGeometry(
    length,
    trimHeight,
    trimDepth,
    RIBBON_SEG_X,
    1,
    4,
  );
  const pos = geometry.attributes.position;
  const halfDepth = trimDepth * 0.5;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const normZ = Math.min(1, Math.abs(z) / halfDepth);
    if (normZ > 0.65) {
      const edgeT = (normZ - 0.65) / 0.35;
      const scaleY = Math.sqrt(Math.max(0.15, 1 - edgeT * edgeT * 0.8));
      pos.setXYZ(i, x, y * scaleY, z);
    }
  }
  geometry.computeVertexNormals();
  const initialPositions = new Float32Array(pos.array);
  return { geometry, initialPositions };
};

const applyRibbonWave = (
  geometry: BoxGeometry,
  initialPositions: Float32Array,
  spec: RibbonSpec,
  loopAngle: number,
  waveAmplitude: number,
  zOffsetInRibbonSpace = 0,
): void => {
  const pos = geometry.attributes.position;

  for (let i = 0; i < pos.count; i += 1) {
    const offset = i * 3;
    const bx = initialPositions[offset];
    const by = initialPositions[offset + 1];
    const bz = initialPositions[offset + 2] + zOffsetInRibbonSpace;

    const p1 = loopAngle + bx * spec.freq1 + spec.phase;
    const p2 = -loopAngle + bx * spec.freq2 + spec.phase * 1.3;
    const pZ = loopAngle + bx * 0.25 + spec.phase * 0.7;

    const yWave =
      (Math.sin(p1) * spec.amp1 + Math.cos(p2) * spec.amp2) * waveAmplitude;
    const dyDx =
      (spec.freq1 * Math.cos(p1) * spec.amp1 -
        spec.freq2 * Math.sin(p2) * spec.amp2) *
      waveAmplitude;
    const zWave = Math.sin(pZ) * spec.zSwayAmp * waveAmplitude;
    const twist =
      Math.cos(loopAngle + bx * 0.22 + spec.phase) *
      spec.twistAmp *
      waveAmplitude;

    const cosT = Math.cos(twist);
    const sinT = Math.sin(twist);
    const twistedY = by * cosT - bz * sinT;
    const twistedZ = by * sinT + bz * cosT;

    const slopeAngle = Math.atan(dyDx);
    const cosS = Math.cos(slopeAngle);
    const sinS = Math.sin(slopeAngle);

    const tiltedX = bx - twistedY * sinS;
    const tiltedY = yWave + twistedY * cosS;

    pos.setXYZ(i, tiltedX, tiltedY, zWave + twistedZ);
  }

  pos.needsUpdate = true;
  geometry.computeVertexNormals();
};

interface AnimatedRibbonMeshProps {
  spec: RibbonSpec;
  loopAngle: number;
  waveAmplitude: number;
  strokeWidth: number;
  aspectRatio: AspectRatio;
  ribbonMaterial: MeshStandardMaterial;
  accentMaterial: MeshStandardMaterial;
}

const AnimatedRibbonMesh: React.FC<AnimatedRibbonMeshProps> = ({
  spec,
  loopAngle,
  waveAmplitude,
  strokeWidth,
  aspectRatio,
  ribbonMaterial,
  accentMaterial,
}) => {
  const ribbonData = useMemo(
    () => createBeveledRibbonGeometry(spec.length, spec.thickness, spec.width),
    [spec.length, spec.thickness, spec.width],
  );

  const trimData = useMemo(
    () => createAccentTrimGeometry(spec.length, strokeWidth),
    [spec.length, strokeWidth],
  );

  const trimZOffset = spec.trimSide * (spec.width * 0.5 + 0.045 * strokeWidth);

  useLayoutEffect(() => {
    applyRibbonWave(
      ribbonData.geometry,
      ribbonData.initialPositions,
      spec,
      loopAngle,
      waveAmplitude,
      0,
    );
    applyRibbonWave(
      trimData.geometry,
      trimData.initialPositions,
      spec,
      loopAngle,
      waveAmplitude,
      trimZOffset,
    );
  }, [
    ribbonData,
    trimData,
    spec,
    loopAngle,
    waveAmplitude,
    trimZOffset,
  ]);

  useEffect(() => {
    return () => {
      ribbonData.geometry.dispose();
    };
  }, [ribbonData]);

  useEffect(() => {
    return () => {
      trimData.geometry.dispose();
    };
  }, [trimData]);

  const yScale = aspectRatio === "9:16" ? 1.24 : 1;

  return (
    <group
      position={[0, spec.baseY * yScale, spec.baseZ]}
      rotation={[spec.baseRotX, 0, spec.baseRotZ]}
    >
      <mesh
        geometry={ribbonData.geometry}
        material={ribbonMaterial}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={trimData.geometry}
        material={accentMaterial}
        castShadow
        receiveShadow
      />
    </group>
  );
};

interface RibbonSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  waveAmplitude: number;
  speedMultiplier: number;
  strokeWidth: number;
  aspectRatio: AspectRatio;
}

const RibbonScene: React.FC<RibbonSceneProps> = ({
  frame,
  durationInFrames,
  palette,
  waveAmplitude,
  speedMultiplier,
  strokeWidth,
  aspectRatio,
}) => {
  const progress = (frame % durationInFrames) / durationInFrames;
  const loopAngle = progress * Math.PI * 2 * speedMultiplier;

  const materials = useMemo(
    () => ({
      primary: new MeshStandardMaterial({
        color: palette.ribbonPrimary,
        roughness: 0.36,
        metalness: 0.1,
      }),
      secondary: new MeshStandardMaterial({
        color: palette.ribbonSecondary,
        roughness: 0.42,
        metalness: 0.08,
      }),
      accent: new MeshStandardMaterial({
        color: palette.ribbonAccent,
        roughness: 0.28,
        metalness: 0.45,
      }),
    }),
    [palette.ribbonPrimary, palette.ribbonSecondary, palette.ribbonAccent],
  );

  useEffect(() => {
    return () => {
      materials.primary.dispose();
      materials.secondary.dispose();
      materials.accent.dispose();
    };
  }, [materials]);

  return (
    <>
      <RibbonCameraRig aspectRatio={aspectRatio} />

      <ambientLight intensity={palette.ambientIntensity} color="#FFFFFF" />
      <hemisphereLight
        args={[palette.hemiSky, palette.hemiGround, palette.hemiIntensity]}
      />
      <KeyShadowLight
        color={palette.keyColor}
        intensity={palette.keyIntensity}
      />
      <directionalLight
        position={[-9, -3, 9]}
        intensity={palette.fillIntensity}
        color={palette.fillColor}
      />
      <directionalLight
        position={[0, 7, -10]}
        intensity={palette.rimIntensity}
        color={palette.rimColor}
      />

      {RIBBON_SPECS.map((spec) => (
        <AnimatedRibbonMesh
          key={spec.id}
          spec={spec}
          loopAngle={loopAngle}
          waveAmplitude={waveAmplitude}
          strokeWidth={strokeWidth}
          aspectRatio={aspectRatio}
          ribbonMaterial={
            spec.tone === "primary" ? materials.primary : materials.secondary
          }
          accentMaterial={materials.accent}
        />
      ))}
    </>
  );
};

export const RibbonWaveSculpture4K: React.FC<RibbonWaveSculpture4KProps> = (
  props,
) => {
  const {
    themePreset = "clean-corporate",
    aspectRatio = "16:9",
    backgroundColor = "#F8FAFC",
    primaryColor = "#E2E8F0",
    secondaryColor = "#CBD5E1",
    accentColor = "#3B82F6",
    waveAmplitude = 1,
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
        waveAmplitude,
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
      waveAmplitude,
      speedMultiplier,
      strokeWidth,
    ],
  );

  const cameraConfig = useMemo(
    () => ({
      position: (aspectRatio === "9:16" ? [0, 0, 14.2] : [0, 0, 12.0]) as [
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
      {/* Soft studio gradient backdrop with anti-banding grain */}
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
            id="ribbon-bg-grad"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={palette.bgTop} />
            <stop offset="52%" stopColor={palette.bgTop} />
            <stop offset="100%" stopColor={palette.bgBottom} />
          </linearGradient>
          <radialGradient id="ribbon-bg-glow" cx="50%" cy="50%" r="60%">
            <stop
              offset="0%"
              stopColor={palette.bgGlow}
              stopOpacity={palette.bgGlowOpacity}
            />
            <stop offset="100%" stopColor={palette.bgBottom} stopOpacity="0" />
          </radialGradient>
          <filter
            id="ribbon-grain"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed="47"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width={width} height={height} fill="url(#ribbon-bg-grad)" />
        <rect width={width} height={height} fill="url(#ribbon-bg-glow)" />
        <rect
          width={width}
          height={height}
          filter="url(#ribbon-grain)"
          opacity="0.012"
        />
      </svg>

      <ThreeCanvas
        width={width}
        height={height}
        shadows="soft"
        dpr={1}
        camera={cameraConfig}
        gl={CANVAS_GL}
        style={{ position: "absolute", inset: 0 }}
      >
        <RibbonScene
          frame={frame}
          durationInFrames={durationInFrames}
          palette={palette}
          waveAmplitude={waveAmplitude}
          speedMultiplier={speedMultiplier}
          strokeWidth={strokeWidth}
          aspectRatio={aspectRatio}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
