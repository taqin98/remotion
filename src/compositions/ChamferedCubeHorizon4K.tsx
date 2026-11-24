import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import {
  AbsoluteFill,
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

export const chamferedCubeHorizon4KSchema = z.object({
  themePreset: themePresetSchema.default("clean-corporate"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#F8FAFC"),
  primaryColor: z.string().default("#E2E8F0"),
  secondaryColor: z.string().default("#CBD5E1"),
  accentColor: z.string().default("#3B82F6"),
  waveAmplitude: z.number().min(0.1).max(2).default(0.85),
  speedMultiplier: z.number().int().positive().default(1),
});

export type ChamferedCubeHorizon4KProps = z.infer<
  typeof chamferedCubeHorizon4KSchema
>;

export const defaultChamferedCubeHorizon4KProps: ChamferedCubeHorizon4KProps = {
  themePreset: "clean-corporate",
  aspectRatio: "16:9",
  backgroundColor: "#F8FAFC",
  primaryColor: "#E2E8F0",
  secondaryColor: "#CBD5E1",
  accentColor: "#3B82F6",
  waveAmplitude: 0.85,
  speedMultiplier: 1,
};

export const chamferedCubeHorizon4KVariations: Record<
  ThemePreset,
  ChamferedCubeHorizon4KProps
> = {
  "clean-corporate": defaultChamferedCubeHorizon4KProps,
  "dark-tech": {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "#070D1D",
    primaryColor: "#1E293B",
    secondaryColor: "#162033",
    accentColor: "#38BDF8",
    waveAmplitude: 0.85,
    speedMultiplier: 1,
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "#FAF7F2",
    primaryColor: "#EFE5D7",
    secondaryColor: "#DFD0BC",
    accentColor: "#E07A5F",
    waveAmplitude: 0.85,
    speedMultiplier: 1,
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "#0F0F12",
    primaryColor: "#202026",
    secondaryColor: "#16161B",
    accentColor: "#D4AF37",
    waveAmplitude: 0.85,
    speedMultiplier: 1,
  },
};

interface ThemePalette {
  bgTop: string;
  bgBottom: string;
  bgGlow: string;
  bgGlowOpacity: number;
  fogColor: string;
  clayLight: string;
  clayMid: string;
  clayAccent: string;
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
    bgGlowOpacity: 0.08,
    fogColor: "#EDF3F9",
    clayLight: "#F1F5F9",
    clayMid: "#CBD5E1",
    clayAccent: "#3B82F6",
    ambientIntensity: 0.9,
    hemiSky: "#FFFFFF",
    hemiGround: "#CBD5E1",
    hemiIntensity: 0.72,
    keyColor: "#FFFDF9",
    keyIntensity: 1.38,
    fillColor: "#DCEAFE",
    fillIntensity: 0.7,
    rimColor: "#FFFFFF",
    rimIntensity: 0.92,
  },
  "dark-tech": {
    bgTop: "#0B1328",
    bgBottom: "#040814",
    bgGlow: "#38BDF8",
    bgGlowOpacity: 0.13,
    fogColor: "#060D1E",
    clayLight: "#1E293B",
    clayMid: "#131C30",
    clayAccent: "#38BDF8",
    ambientIntensity: 0.55,
    hemiSky: "#38BDF8",
    hemiGround: "#020617",
    hemiIntensity: 0.6,
    keyColor: "#E0F2FE",
    keyIntensity: 1.5,
    fillColor: "#6366F1",
    fillIntensity: 0.85,
    rimColor: "#22D3EE",
    rimIntensity: 1.25,
  },
  "warm-minimalist": {
    bgTop: "#FDFBF7",
    bgBottom: "#EFE4D6",
    bgGlow: "#E07A5F",
    bgGlowOpacity: 0.09,
    fogColor: "#F5EEE3",
    clayLight: "#F5EEE4",
    clayMid: "#E3D5C3",
    clayAccent: "#E07A5F",
    ambientIntensity: 0.94,
    hemiSky: "#FFFDF8",
    hemiGround: "#D6C5B0",
    hemiIntensity: 0.76,
    keyColor: "#FFF6E8",
    keyIntensity: 1.35,
    fillColor: "#F5E1C8",
    fillIntensity: 0.68,
    rimColor: "#FFFFFF",
    rimIntensity: 0.86,
  },
  "monochrome-luxury": {
    bgTop: "#17171B",
    bgBottom: "#09090B",
    bgGlow: "#D4AF37",
    bgGlowOpacity: 0.1,
    fogColor: "#0D0D10",
    clayLight: "#25252C",
    clayMid: "#17171C",
    clayAccent: "#D4AF37",
    ambientIntensity: 0.45,
    hemiSky: "#FDE68A",
    hemiGround: "#09090B",
    hemiIntensity: 0.52,
    keyColor: "#FFF6DB",
    keyIntensity: 1.48,
    fillColor: "#52525B",
    fillIntensity: 0.65,
    rimColor: "#D4AF37",
    rimIntensity: 1.3,
  },
};

const resolveThemePalette = (
  props: ChamferedCubeHorizon4KProps,
): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  const hasCustomBg =
    props.backgroundColor !==
    defaultChamferedCubeHorizon4KProps.backgroundColor;
  const hasCustomPrimary =
    props.primaryColor !== defaultChamferedCubeHorizon4KProps.primaryColor;
  const hasCustomSecondary =
    props.secondaryColor !== defaultChamferedCubeHorizon4KProps.secondaryColor;
  const hasCustomAccent =
    props.accentColor !== defaultChamferedCubeHorizon4KProps.accentColor;

  return {
    ...base,
    bgTop: hasCustomBg ? props.backgroundColor : base.bgTop,
    fogColor: hasCustomBg ? props.backgroundColor : base.fogColor,
    clayLight: hasCustomPrimary ? props.primaryColor : base.clayLight,
    clayMid: hasCustomSecondary ? props.secondaryColor : base.clayMid,
    clayAccent: hasCustomAccent ? props.accentColor : base.clayAccent,
  };
};

const GRID_COLS = 18;
const GRID_ROWS = 11;
const CUBE_SPACING = 1.04;

type CubeTone = "light" | "mid" | "accent";

interface HorizonCubeSpec {
  id: string;
  gx: number;
  gz: number;
  tone: CubeTone;
}

const CANVAS_GL = { antialias: true, alpha: true } as const;

const HorizonCameraRig: React.FC<{ aspectRatio: AspectRatio }> = ({
  aspectRatio,
}) => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    if (aspectRatio === "9:16") {
      camera.position.set(0, 4.6, 13.5);
      camera.lookAt(0, -0.5, -3.5);
    } else {
      camera.position.set(0, 4.1, 11.2);
      camera.lookAt(0, -0.45, -3.5);
    }
    camera.updateProjectionMatrix();
  }, [camera, aspectRatio]);

  return null;
};

interface HorizonCubeMeshProps {
  spec: HorizonCubeSpec;
  loopAngle: number;
  waveAmplitude: number;
  geometry: RoundedBoxGeometry;
  material: MeshStandardMaterial;
}

const HorizonCubeMesh: React.FC<HorizonCubeMeshProps> = ({
  spec,
  loopAngle,
  waveAmplitude,
  geometry,
  material,
}) => {
  const phase1 = loopAngle - spec.gx * 0.34 - spec.gz * 0.28;
  const phase2 = loopAngle + spec.gx * 0.22 - spec.gz * 0.38;

  const height =
    (Math.sin(phase1) * 0.54 + Math.cos(phase2) * 0.28) * waveAmplitude;

  const slopeX =
    (-0.34 * Math.cos(phase1) * 0.54 - 0.22 * Math.sin(phase2) * 0.28) *
    waveAmplitude;
  const slopeZ =
    (-0.28 * Math.cos(phase1) * 0.54 + 0.38 * Math.sin(phase2) * 0.28) *
    waveAmplitude;

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[spec.gx, height - 1.55, spec.gz]}
      rotation={[slopeZ * 0.42, 0, -slopeX * 0.42]}
      castShadow
      receiveShadow
    />
  );
};

interface HorizonSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  waveAmplitude: number;
  speedMultiplier: number;
  aspectRatio: AspectRatio;
}

const HorizonScene: React.FC<HorizonSceneProps> = ({
  frame,
  durationInFrames,
  palette,
  waveAmplitude,
  speedMultiplier,
  aspectRatio,
}) => {
  const progress = (frame % durationInFrames) / durationInFrames;
  const loopAngle = progress * Math.PI * 2 * speedMultiplier;

  const cubes = useMemo<HorizonCubeSpec[]>(() => {
    const items: HorizonCubeSpec[] = [];
    const halfCols = (GRID_COLS - 1) / 2;
    const halfRows = (GRID_ROWS - 1) / 2;

    for (let row = 0; row < GRID_ROWS; row += 1) {
      for (let col = 0; col < GRID_COLS; col += 1) {
        const gx = (col - halfCols) * CUBE_SPACING;
        const gz = (row - halfRows) * CUBE_SPACING - 2.6;
        let tone: CubeTone = "mid";
        if ((col + row * 2) % 7 === 0) {
          tone = "accent";
        } else if ((col + row) % 2 === 0) {
          tone = "light";
        }
        items.push({
          id: `cube-${row}-${col}`,
          gx,
          gz,
          tone,
        });
      }
    }
    return items;
  }, []);

  const cubeGeometry = useMemo(
    () => new RoundedBoxGeometry(0.88, 0.88, 0.88, 3, 0.11),
    [],
  );

  const materials = useMemo<Record<CubeTone, MeshStandardMaterial>>(
    () => ({
      light: new MeshStandardMaterial({
        color: palette.clayLight,
        roughness: 0.62,
        metalness: 0.04,
      }),
      mid: new MeshStandardMaterial({
        color: palette.clayMid,
        roughness: 0.64,
        metalness: 0.04,
      }),
      accent: new MeshStandardMaterial({
        color: palette.clayAccent,
        roughness: 0.56,
        metalness: 0.08,
      }),
    }),
    [palette.clayLight, palette.clayMid, palette.clayAccent],
  );

  useEffect(() => {
    return () => {
      cubeGeometry.dispose();
    };
  }, [cubeGeometry]);

  useEffect(() => {
    return () => {
      materials.light.dispose();
      materials.mid.dispose();
      materials.accent.dispose();
    };
  }, [materials]);

  return (
    <>
      <fog attach="fog" args={[palette.fogColor, 10.5, 25.5]} />
      <HorizonCameraRig aspectRatio={aspectRatio} />

      {/* Soft studio lighting for calm clay facets */}
      <ambientLight intensity={palette.ambientIntensity} color="#FFFFFF" />
      <hemisphereLight
        args={[palette.hemiSky, palette.hemiGround, palette.hemiIntensity]}
      />
      <directionalLight
        position={[9, 14, 8]}
        intensity={palette.keyIntensity}
        color={palette.keyColor}
        castShadow
      />
      <directionalLight
        position={[-10, 6, 10]}
        intensity={palette.fillIntensity}
        color={palette.fillColor}
      />
      <directionalLight
        position={[0, 8, -12]}
        intensity={palette.rimIntensity}
        color={palette.rimColor}
      />

      <group rotation={[0, 0.34, 0]}>
        {cubes.map((spec) => (
          <HorizonCubeMesh
            key={spec.id}
            spec={spec}
            loopAngle={loopAngle}
            waveAmplitude={waveAmplitude}
            geometry={cubeGeometry}
            material={materials[spec.tone]}
          />
        ))}
      </group>
    </>
  );
};

export const ChamferedCubeHorizon4K: React.FC<ChamferedCubeHorizon4KProps> = (
  props,
) => {
  const {
    themePreset = "clean-corporate",
    aspectRatio = "16:9",
    backgroundColor = "#F8FAFC",
    primaryColor = "#E2E8F0",
    secondaryColor = "#CBD5E1",
    accentColor = "#3B82F6",
    waveAmplitude = 0.85,
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
        waveAmplitude,
        speedMultiplier,
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
    ],
  );

  const cameraConfig = useMemo(
    () => ({
      position: (aspectRatio === "9:16"
        ? [0, 4.6, 13.5]
        : [0, 4.1, 11.2]) as [number, number, number],
      fov: 38,
      near: 0.1,
      far: 100,
    }),
    [aspectRatio],
  );

  return (
    <AbsoluteFill style={{ backgroundColor: palette.bgTop, overflow: "hidden" }}>
      {/* Soft sky-to-horizon studio gradient backdrop + anti-banding grain */}
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
            id="horizon-bg-grad"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={palette.bgTop} />
            <stop offset="65%" stopColor={palette.fogColor} />
            <stop offset="100%" stopColor={palette.bgBottom} />
          </linearGradient>
          <radialGradient id="horizon-bg-glow" cx="50%" cy="60%" r="55%">
            <stop
              offset="0%"
              stopColor={palette.bgGlow}
              stopOpacity={palette.bgGlowOpacity}
            />
            <stop offset="100%" stopColor={palette.bgBottom} stopOpacity="0" />
          </radialGradient>
          <filter
            id="horizon-grain"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed="41"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width={width} height={height} fill="url(#horizon-bg-grad)" />
        <rect width={width} height={height} fill="url(#horizon-bg-glow)" />
        <rect
          width={width}
          height={height}
          filter="url(#horizon-grain)"
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
        <HorizonScene
          frame={frame}
          durationInFrames={durationInFrames}
          palette={palette}
          waveAmplitude={waveAmplitude}
          speedMultiplier={speedMultiplier}
          aspectRatio={aspectRatio}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

