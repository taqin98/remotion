import React, { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { ThreeCanvas } from "@remotion/three";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  DirectionalLight,
  MeshStandardMaterial,
  PlaneGeometry,
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

export const aspectRatioSchema = z.enum(["16:9", "9:16"]);

export type ThemePreset = z.infer<typeof themePresetSchema>;
export type AspectRatio = z.infer<typeof aspectRatioSchema>;

export const slidingArchitecturalPanels4KSchema = z.object({
  themePreset: themePresetSchema.default("clean-corporate"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#F8FAFC"),
  primaryColor: z.string().default("#E2E8F0"),
  secondaryColor: z.string().default("#CBD5E1"),
  accentColor: z.string().default("#3B82F6"),
  slideAmplitude: z.number().min(0.2).max(2).default(1),
  speedMultiplier: z.number().int().positive().default(1),
});

export type SlidingArchitecturalPanels4KProps = z.infer<
  typeof slidingArchitecturalPanels4KSchema
>;

export const defaultSlidingArchitecturalPanels4KProps: SlidingArchitecturalPanels4KProps =
  {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "#F8FAFC",
    primaryColor: "#E2E8F0",
    secondaryColor: "#CBD5E1",
    accentColor: "#3B82F6",
    slideAmplitude: 1,
    speedMultiplier: 1,
  };

export const slidingArchitecturalPanels4KVariations: Record<
  ThemePreset,
  SlidingArchitecturalPanels4KProps
> = {
  "clean-corporate": defaultSlidingArchitecturalPanels4KProps,
  "dark-tech": {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "#070D1D",
    primaryColor: "#162033",
    secondaryColor: "#1E293B",
    accentColor: "#38BDF8",
    slideAmplitude: 1,
    speedMultiplier: 1,
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "#FAF7F2",
    primaryColor: "#EFE5D7",
    secondaryColor: "#E0D1BD",
    accentColor: "#E07A5F",
    slideAmplitude: 1,
    speedMultiplier: 1,
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "#0F0F12",
    primaryColor: "#1A1A20",
    secondaryColor: "#26262E",
    accentColor: "#D4AF37",
    slideAmplitude: 1,
    speedMultiplier: 1,
  },
};

interface ThemePalette {
  wallColor: string;
  slabLight: string;
  slabMid: string;
  slabAccent: string;
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
    wallColor: "#F4F7FB",
    slabLight: "#FFFFFF",
    slabMid: "#DCE4EF",
    slabAccent: "#3B82F6",
    ambientIntensity: 0.9,
    hemiSky: "#FFFFFF",
    hemiGround: "#CBD5E1",
    hemiIntensity: 0.55,
    keyColor: "#FFFDF9",
    keyIntensity: 1.35,
    fillColor: "#E0ECFF",
    fillIntensity: 0.45,
    rimColor: "#FFFFFF",
    rimIntensity: 0.5,
  },
  "dark-tech": {
    wallColor: "#080F22",
    slabLight: "#162033",
    slabMid: "#1E293B",
    slabAccent: "#38BDF8",
    ambientIntensity: 0.52,
    hemiSky: "#38BDF8",
    hemiGround: "#020617",
    hemiIntensity: 0.45,
    keyColor: "#E0F2FE",
    keyIntensity: 1.5,
    fillColor: "#6366F1",
    fillIntensity: 0.55,
    rimColor: "#22D3EE",
    rimIntensity: 0.75,
  },
  "warm-minimalist": {
    wallColor: "#F7F2EA",
    slabLight: "#FDFBF7",
    slabMid: "#E6D8C5",
    slabAccent: "#E07A5F",
    ambientIntensity: 0.92,
    hemiSky: "#FFFDF8",
    hemiGround: "#D6C5B0",
    hemiIntensity: 0.58,
    keyColor: "#FFF7EB",
    keyIntensity: 1.32,
    fillColor: "#F5E1C8",
    fillIntensity: 0.45,
    rimColor: "#FFFFFF",
    rimIntensity: 0.48,
  },
  "monochrome-luxury": {
    wallColor: "#0E0E11",
    slabLight: "#1D1D23",
    slabMid: "#2A2A32",
    slabAccent: "#D4AF37",
    ambientIntensity: 0.44,
    hemiSky: "#FDE68A",
    hemiGround: "#09090B",
    hemiIntensity: 0.4,
    keyColor: "#FFF6DB",
    keyIntensity: 1.48,
    fillColor: "#52525B",
    fillIntensity: 0.48,
    rimColor: "#D4AF37",
    rimIntensity: 0.85,
  },
};

const resolveThemePalette = (
  props: SlidingArchitecturalPanels4KProps,
): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  const hasCustomBg =
    props.backgroundColor !==
    defaultSlidingArchitecturalPanels4KProps.backgroundColor;
  const hasCustomPrimary =
    props.primaryColor !==
    defaultSlidingArchitecturalPanels4KProps.primaryColor;
  const hasCustomSecondary =
    props.secondaryColor !==
    defaultSlidingArchitecturalPanels4KProps.secondaryColor;
  const hasCustomAccent =
    props.accentColor !== defaultSlidingArchitecturalPanels4KProps.accentColor;

  return {
    ...base,
    wallColor: hasCustomBg ? props.backgroundColor : base.wallColor,
    slabLight: hasCustomPrimary ? props.primaryColor : base.slabLight,
    slabMid: hasCustomSecondary ? props.secondaryColor : base.slabMid,
    slabAccent: hasCustomAccent ? props.accentColor : base.slabAccent,
  };
};

type SlabShape =
  | "tallVertical"
  | "wideHorizontal"
  | "mediumVertical"
  | "compactHorizontal"
  | "slenderVertical"
  | "slenderHorizontal";
type SlabTone = "light" | "mid" | "accent";
type SlideAxis = "x" | "y";

interface SlabSpec {
  id: string;
  shape: SlabShape;
  tone: SlabTone;
  basePosition: [number, number, number];
  axis: SlideAxis;
  travel: number;
  phase: number;
}

// 12 overlapping vertical and horizontal slabs across 4 parallel Z-planes (-1.35, -0.7, -0.05, +0.6)
const SLAB_SPECS: readonly SlabSpec[] = [
  // Plane 1 (z = -1.35, nearest gallery wall)
  {
    id: "slab-p1-tr-horiz",
    shape: "wideHorizontal",
    tone: "mid",
    basePosition: [4.2, 2.75, -1.35],
    axis: "x",
    travel: 1.45,
    phase: 0.1,
  },
  {
    id: "slab-p1-bl-vert",
    shape: "tallVertical",
    tone: "mid",
    basePosition: [-5.5, -1.35, -1.35],
    axis: "y",
    travel: 1.15,
    phase: 1.4,
  },
  {
    id: "slab-p1-br-beam",
    shape: "compactHorizontal",
    tone: "light",
    basePosition: [4.8, -2.9, -1.35],
    axis: "x",
    travel: -1.3,
    phase: 2.8,
  },

  // Plane 2 (z = -0.7)
  {
    id: "slab-p2-right-monolith",
    shape: "tallVertical",
    tone: "light",
    basePosition: [5.45, 0.25, -0.7],
    axis: "y",
    travel: 1.35,
    phase: 0.75,
  },
  {
    id: "slab-p2-bl-lintel",
    shape: "wideHorizontal",
    tone: "light",
    basePosition: [-3.95, -3.15, -0.7],
    axis: "x",
    travel: 1.55,
    phase: 2.1,
  },
  {
    id: "slab-p2-tl-fin",
    shape: "mediumVertical",
    tone: "mid",
    basePosition: [-6.15, 2.3, -0.7],
    axis: "y",
    travel: -1.05,
    phase: 3.9,
  },

  // Plane 3 (z = -0.05)
  {
    id: "slab-p3-right-beam",
    shape: "compactHorizontal",
    tone: "mid",
    basePosition: [4.9, 1.35, -0.05],
    axis: "x",
    travel: -1.4,
    phase: 1.25,
  },
  {
    id: "slab-p3-right-fin",
    shape: "mediumVertical",
    tone: "light",
    basePosition: [3.95, -1.55, -0.05],
    axis: "y",
    travel: -1.2,
    phase: 3.1,
  },
  {
    id: "slab-p3-left-accent",
    shape: "slenderVertical",
    tone: "accent",
    basePosition: [-4.65, -0.95, -0.05],
    axis: "y",
    travel: 1.3,
    phase: 4.5,
  },

  // Plane 4 (z = +0.6, foreground plane)
  {
    id: "slab-p4-tr-accent",
    shape: "slenderHorizontal",
    tone: "accent",
    basePosition: [4.6, 2.25, 0.6],
    axis: "x",
    travel: 1.65,
    phase: 0.45,
  },
  {
    id: "slab-p4-br-accent",
    shape: "slenderVertical",
    tone: "accent",
    basePosition: [6.25, -0.9, 0.6],
    axis: "y",
    travel: 1.1,
    phase: 2.45,
  },
  {
    id: "slab-p4-bl-beam",
    shape: "compactHorizontal",
    tone: "light",
    basePosition: [-5.1, -2.35, 0.6],
    axis: "x",
    travel: -1.25,
    phase: 5.1,
  },
];

const CANVAS_GL = { antialias: true, alpha: false } as const;
const CAMERA_CONFIG = {
  position: [0, 0, 11.5] as [number, number, number],
  fov: 40,
  near: 0.1,
  far: 100,
};

const KeyShadowLight: React.FC<{ color: string; intensity: number }> = ({
  color,
  intensity,
}) => {
  const lightRef = useRef<DirectionalLight>(null);

  useLayoutEffect(() => {
    const light = lightRef.current;
    if (!light) {
      return;
    }
    light.shadow.mapSize.set(2048, 2048);
    light.shadow.bias = -0.0005;
    light.shadow.radius = 4;
    light.shadow.camera.left = -11;
    light.shadow.camera.right = 11;
    light.shadow.camera.top = 7;
    light.shadow.camera.bottom = -7;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 30;
    light.shadow.camera.updateProjectionMatrix();
  }, []);

  return (
    <directionalLight
      ref={lightRef}
      position={[7, 10, 11]}
      intensity={intensity}
      color={color}
      castShadow
    />
  );
};

interface SlabGeometries {
  tallVertical: RoundedBoxGeometry;
  wideHorizontal: RoundedBoxGeometry;
  mediumVertical: RoundedBoxGeometry;
  compactHorizontal: RoundedBoxGeometry;
  slenderVertical: RoundedBoxGeometry;
  slenderHorizontal: RoundedBoxGeometry;
  wall: PlaneGeometry;
}

interface SlidingSlabMeshProps {
  spec: SlabSpec;
  loopAngle: number;
  slideAmplitude: number;
  aspectXScale: number;
  geometry: RoundedBoxGeometry;
  material: MeshStandardMaterial;
}

const SlidingSlabMesh: React.FC<SlidingSlabMeshProps> = ({
  spec,
  loopAngle,
  slideAmplitude,
  aspectXScale,
  geometry,
  material,
}) => {
  const delta = Math.sin(loopAngle + spec.phase) * spec.travel * slideAmplitude;
  const posX =
    spec.basePosition[0] * aspectXScale + (spec.axis === "x" ? delta : 0);
  const posY = spec.basePosition[1] + (spec.axis === "y" ? delta : 0);
  const posZ = spec.basePosition[2];

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[posX, posY, posZ]}
      castShadow
      receiveShadow
    />
  );
};

interface PanelsSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  slideAmplitude: number;
  speedMultiplier: number;
  aspectRatio: AspectRatio;
}

const PanelsScene: React.FC<PanelsSceneProps> = ({
  frame,
  durationInFrames,
  palette,
  slideAmplitude,
  speedMultiplier,
  aspectRatio,
}) => {
  const progress = (frame % durationInFrames) / durationInFrames;
  const loopAngle = progress * Math.PI * 2 * speedMultiplier;

  const geometries = useMemo<SlabGeometries>(
    () => ({
      tallVertical: new RoundedBoxGeometry(1.55, 6.2, 0.22, 3, 0.06),
      wideHorizontal: new RoundedBoxGeometry(6.4, 1.35, 0.22, 3, 0.06),
      mediumVertical: new RoundedBoxGeometry(1.15, 4.4, 0.22, 3, 0.055),
      compactHorizontal: new RoundedBoxGeometry(4.2, 1.05, 0.22, 3, 0.055),
      slenderVertical: new RoundedBoxGeometry(0.42, 4.8, 0.16, 2, 0.04),
      slenderHorizontal: new RoundedBoxGeometry(4.8, 0.36, 0.16, 2, 0.04),
      wall: new PlaneGeometry(26, 16, 1, 1),
    }),
    [],
  );

  const materials = useMemo(
    () => ({
      wall: new MeshStandardMaterial({
        color: palette.wallColor,
        roughness: 0.78,
        metalness: 0.02,
      }),
      light: new MeshStandardMaterial({
        color: palette.slabLight,
        roughness: 0.65,
        metalness: 0.04,
      }),
      mid: new MeshStandardMaterial({
        color: palette.slabMid,
        roughness: 0.66,
        metalness: 0.04,
      }),
      accent: new MeshStandardMaterial({
        color: palette.slabAccent,
        roughness: 0.5,
        metalness: 0.1,
      }),
    }),
    [palette.wallColor, palette.slabLight, palette.slabMid, palette.slabAccent],
  );

  useEffect(() => {
    return () => {
      geometries.tallVertical.dispose();
      geometries.wideHorizontal.dispose();
      geometries.mediumVertical.dispose();
      geometries.compactHorizontal.dispose();
      geometries.slenderVertical.dispose();
      geometries.slenderHorizontal.dispose();
      geometries.wall.dispose();
    };
  }, [geometries]);

  useEffect(() => {
    return () => {
      materials.wall.dispose();
      materials.light.dispose();
      materials.mid.dispose();
      materials.accent.dispose();
    };
  }, [materials]);

  const aspectXScale = aspectRatio === "9:16" ? 0.46 : 1;

  return (
    <>
      <color attach="background" args={[palette.wallColor]} />

      {/* Architectural gallery lighting with unclipped soft cast shadows */}
      <ambientLight intensity={palette.ambientIntensity} color="#FFFFFF" />
      <hemisphereLight
        args={[palette.hemiSky, palette.hemiGround, palette.hemiIntensity]}
      />
      <KeyShadowLight
        color={palette.keyColor}
        intensity={palette.keyIntensity}
      />
      <directionalLight
        position={[-9, -4, 9]}
        intensity={palette.fillIntensity}
        color={palette.fillColor}
      />
      <directionalLight
        position={[0, 8, -8]}
        intensity={palette.rimIntensity}
        color={palette.rimColor}
      />

      {/* Shadow-receiving architectural gallery wall */}
      <mesh
        geometry={geometries.wall}
        material={materials.wall}
        position={[0, 0, -2.1]}
        receiveShadow
      />

      {/* 12 sliding panels across 4 parallel Z-planes */}
      {SLAB_SPECS.map((spec) => (
        <SlidingSlabMesh
          key={spec.id}
          spec={spec}
          loopAngle={loopAngle}
          slideAmplitude={slideAmplitude}
          aspectXScale={aspectXScale}
          geometry={geometries[spec.shape]}
          material={materials[spec.tone]}
        />
      ))}
    </>
  );
};

export const SlidingArchitecturalPanels4K: React.FC<
  SlidingArchitecturalPanels4KProps
> = (props) => {
  const {
    themePreset = "clean-corporate",
    aspectRatio = "16:9",
    backgroundColor = "#F8FAFC",
    primaryColor = "#E2E8F0",
    secondaryColor = "#CBD5E1",
    accentColor = "#3B82F6",
    slideAmplitude = 1,
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
        slideAmplitude,
        speedMultiplier,
      }),
    [
      themePreset,
      aspectRatio,
      backgroundColor,
      primaryColor,
      secondaryColor,
      accentColor,
      slideAmplitude,
      speedMultiplier,
    ],
  );

  return (
    <AbsoluteFill style={{ backgroundColor: palette.wallColor, overflow: "hidden" }}>
      <ThreeCanvas
        width={width}
        height={height}
        shadows="soft"
        dpr={1}
        camera={CAMERA_CONFIG}
        gl={CANVAS_GL}
        style={{ position: "absolute", inset: 0 }}
      >
        <PanelsScene
          frame={frame}
          durationInFrames={durationInFrames}
          palette={palette}
          slideAmplitude={slideAmplitude}
          speedMultiplier={speedMultiplier}
          aspectRatio={aspectRatio}
        />
      </ThreeCanvas>

      {/* Subtle anti-banding grain overlay */}
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
          <filter
            id="panels-grain"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed="43"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect
          width={width}
          height={height}
          filter="url(#panels-grain)"
          opacity="0.012"
        />
      </svg>
    </AbsoluteFill>
  );
};

