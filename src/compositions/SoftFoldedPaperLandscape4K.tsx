import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { noise4D } from "@remotion/noise";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
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

export const softFoldedPaperLandscape4KSchema = z.object({
  themePreset: themePresetSchema.default("clean-corporate"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#F8FAFC"),
  primaryColor: z.string().default("#E2E8F0"),
  secondaryColor: z.string().default("#CBD5E1"),
  accentColor: z.string().default("#3B82F6"),
  foldAmplitude: z.number().min(0.2).max(2).default(1),
  speedMultiplier: z.number().int().positive().default(1),
  strokeWidth: z.number().min(0.5).max(3).default(1),
});

export type SoftFoldedPaperLandscape4KProps = z.infer<
  typeof softFoldedPaperLandscape4KSchema
>;

export const defaultSoftFoldedPaperLandscape4KProps: SoftFoldedPaperLandscape4KProps =
  {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "#F8FAFC",
    primaryColor: "#E2E8F0",
    secondaryColor: "#CBD5E1",
    accentColor: "#3B82F6",
    foldAmplitude: 1,
    speedMultiplier: 1,
    strokeWidth: 1,
  };

export const softFoldedPaperLandscape4KVariations: Record<
  ThemePreset,
  SoftFoldedPaperLandscape4KProps
> = {
  "clean-corporate": defaultSoftFoldedPaperLandscape4KProps,
  "dark-tech": {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "#070D1D",
    primaryColor: "#162033",
    secondaryColor: "#1E293B",
    accentColor: "#38BDF8",
    foldAmplitude: 1,
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
    foldAmplitude: 1,
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
    foldAmplitude: 1,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
};

interface ThemePalette {
  baseBg: string;
  paperMain: string;
  paperRidge: string;
  creaseColor: string;
  creaseBaseOpacity: number;
  ambientIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  warmPanelColor: string;
  warmPanelIntensity: number;
  coolPanelColor: string;
  coolPanelIntensity: number;
  rimPanelColor: string;
  rimPanelIntensity: number;
}

const THEME_PALETTES: Record<ThemePreset, ThemePalette> = {
  "clean-corporate": {
    baseBg: "#F4F7FB",
    paperMain: "#F8FAFC",
    paperRidge: "#EDF2F7",
    creaseColor: "#94A3B8",
    creaseBaseOpacity: 0.14,
    ambientIntensity: 0.72,
    hemiSky: "#FFFDF9",
    hemiGround: "#CBD5E1",
    hemiIntensity: 0.58,
    warmPanelColor: "#FFE8CC",
    warmPanelIntensity: 1.35,
    coolPanelColor: "#BFDBFE",
    coolPanelIntensity: 1.25,
    rimPanelColor: "#FFFFFF",
    rimPanelIntensity: 0.7,
  },
  "dark-tech": {
    baseBg: "#070D1D",
    paperMain: "#162033",
    paperRidge: "#1E293B",
    creaseColor: "#38BDF8",
    creaseBaseOpacity: 0.18,
    ambientIntensity: 0.42,
    hemiSky: "#38BDF8",
    hemiGround: "#020617",
    hemiIntensity: 0.45,
    warmPanelColor: "#F59E0B",
    warmPanelIntensity: 0.88,
    coolPanelColor: "#38BDF8",
    coolPanelIntensity: 1.45,
    rimPanelColor: "#818CF8",
    rimPanelIntensity: 0.9,
  },
  "warm-minimalist": {
    baseBg: "#FAF6EF",
    paperMain: "#FAF6EF",
    paperRidge: "#EFE5D7",
    creaseColor: "#C4A484",
    creaseBaseOpacity: 0.15,
    ambientIntensity: 0.78,
    hemiSky: "#FFFDF8",
    hemiGround: "#D6C5B0",
    hemiIntensity: 0.62,
    warmPanelColor: "#FFD7BA",
    warmPanelIntensity: 1.32,
    coolPanelColor: "#CFE1E8",
    coolPanelIntensity: 1.05,
    rimPanelColor: "#FFF9F0",
    rimPanelIntensity: 0.68,
  },
  "monochrome-luxury": {
    baseBg: "#0D0D10",
    paperMain: "#1D1D23",
    paperRidge: "#26262E",
    creaseColor: "#D4AF37",
    creaseBaseOpacity: 0.16,
    ambientIntensity: 0.38,
    hemiSky: "#FDE68A",
    hemiGround: "#09090B",
    hemiIntensity: 0.4,
    warmPanelColor: "#FDE68A",
    warmPanelIntensity: 1.35,
    coolPanelColor: "#94A3B8",
    coolPanelIntensity: 1.05,
    rimPanelColor: "#D4AF37",
    rimPanelIntensity: 0.95,
  },
};

const resolveThemePalette = (
  props: SoftFoldedPaperLandscape4KProps,
): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  const hasCustomBg =
    props.backgroundColor !==
    defaultSoftFoldedPaperLandscape4KProps.backgroundColor;
  const hasCustomPrimary =
    props.primaryColor !== defaultSoftFoldedPaperLandscape4KProps.primaryColor;
  const hasCustomSecondary =
    props.secondaryColor !==
    defaultSoftFoldedPaperLandscape4KProps.secondaryColor;
  const hasCustomAccent =
    props.accentColor !== defaultSoftFoldedPaperLandscape4KProps.accentColor;

  return {
    ...base,
    baseBg: hasCustomBg ? props.backgroundColor : base.baseBg,
    paperMain: hasCustomPrimary ? props.primaryColor : base.paperMain,
    paperRidge: hasCustomSecondary ? props.secondaryColor : base.paperRidge,
    creaseColor: hasCustomAccent ? props.accentColor : base.creaseColor,
  };
};

const createOrigamiPlane = (
  width: number,
  height: number,
  segX: number,
  segY: number,
  jitterScale: number,
  seedOffset: number,
): { geometry: PlaneGeometry; initialPositions: Float32Array } => {
  const geometry = new PlaneGeometry(width, height, segX, segY);
  const pos = geometry.attributes.position;

  for (let i = 0; i < pos.count; i += 1) {
    const bx = pos.getX(i);
    const by = pos.getY(i);
    const bz = pos.getZ(i);

    const isOuterEdge =
      Math.abs(bx) > width * 0.47 || Math.abs(by) > height * 0.47;
    if (!isOuterEdge) {
      const jx = Math.sin((i + seedOffset) * 1.73) * 0.28 * jitterScale;
      const jy = Math.cos((i + seedOffset) * 2.17) * 0.24 * jitterScale;
      pos.setXYZ(i, bx + jx, by + jy, bz);
    }
  }

  const initialPositions = new Float32Array(pos.array);
  return { geometry, initialPositions };
};

const applySimplexPaperWave = (
  geometry: PlaneGeometry,
  initialPositions: Float32Array,
  seed1: string,
  seed2: string,
  loopAngle: number,
  foldAmplitude: number,
  calmCenter: boolean,
): void => {
  const pos = geometry.attributes.position;
  const c4 = Math.cos(loopAngle) * 0.95;
  const s4 = Math.sin(loopAngle) * 0.95;

  for (let i = 0; i < pos.count; i += 1) {
    const offset = i * 3;
    const bx = initialPositions[offset];
    const by = initialPositions[offset + 1];
    const bz = initialPositions[offset + 2];

    const oct1 = noise4D(seed1, bx * 0.14, by * 0.16, c4, s4);
    const oct2 = noise4D(
      seed2,
      bx * 0.27 + 2.1,
      by * 0.29 - 1.4,
      c4 * 1.3,
      s4 * 1.3,
    );

    const envelope = calmCenter
      ? 0.55 + 0.45 * Math.min(1, Math.hypot(bx * 0.12, by * 0.22))
      : 1;

    const displacement = (oct1 * 1.05 + oct2 * 0.42) * envelope * foldAmplitude;
    pos.setXYZ(i, bx, by, bz + displacement);
  }

  pos.needsUpdate = true;
  geometry.computeVertexNormals();
};

const CANVAS_GL = { antialias: true, alpha: false } as const;

const PaperCameraRig: React.FC<{ aspectRatio: AspectRatio }> = ({
  aspectRatio,
}) => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    if (aspectRatio === "9:16") {
      camera.position.set(0, 0, 12.8);
    } else {
      camera.position.set(0, 0, 11.2);
    }
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, aspectRatio]);

  return null;
};

interface PaperSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  foldAmplitude: number;
  speedMultiplier: number;
  strokeWidth: number;
  aspectRatio: AspectRatio;
}

const PaperScene: React.FC<PaperSceneProps> = ({
  frame,
  durationInFrames,
  palette,
  foldAmplitude,
  speedMultiplier,
  strokeWidth,
  aspectRatio,
}) => {
  const progress = (frame % durationInFrames) / durationInFrames;
  const loopAngle = progress * Math.PI * 2 * speedMultiplier;

  const mainPlane = useMemo(
    () => createOrigamiPlane(30, 19, 26, 16, 1, 0),
    [],
  );
  const lowerRidge = useMemo(
    () => createOrigamiPlane(32, 4.2, 24, 4, 0.85, 113),
    [],
  );
  const upperRidge = useMemo(
    () => createOrigamiPlane(32, 4.2, 24, 4, 0.85, 271),
    [],
  );

  const materials = useMemo(
    () => ({
      main: new MeshStandardMaterial({
        color: palette.paperMain,
        flatShading: true,
        roughness: 0.64,
        metalness: 0.06,
      }),
      ridge: new MeshStandardMaterial({
        color: palette.paperRidge,
        flatShading: true,
        roughness: 0.68,
        metalness: 0.05,
      }),
      crease: new MeshBasicMaterial({
        color: palette.creaseColor,
        wireframe: true,
        transparent: true,
        opacity: Math.min(0.45, palette.creaseBaseOpacity * strokeWidth),
      }),
    }),
    [
      palette.paperMain,
      palette.paperRidge,
      palette.creaseColor,
      palette.creaseBaseOpacity,
      strokeWidth,
    ],
  );

  useLayoutEffect(() => {
    applySimplexPaperWave(
      mainPlane.geometry,
      mainPlane.initialPositions,
      "paper-main-1",
      "paper-main-2",
      loopAngle,
      foldAmplitude,
      true,
    );
    applySimplexPaperWave(
      lowerRidge.geometry,
      lowerRidge.initialPositions,
      "paper-lower-1",
      "paper-lower-2",
      loopAngle,
      foldAmplitude * 0.9,
      false,
    );
    applySimplexPaperWave(
      upperRidge.geometry,
      upperRidge.initialPositions,
      "paper-upper-1",
      "paper-upper-2",
      loopAngle,
      foldAmplitude * 0.9,
      false,
    );
  }, [mainPlane, lowerRidge, upperRidge, loopAngle, foldAmplitude]);

  useEffect(() => {
    return () => {
      mainPlane.geometry.dispose();
      lowerRidge.geometry.dispose();
      upperRidge.geometry.dispose();
    };
  }, [mainPlane, lowerRidge, upperRidge]);

  useEffect(() => {
    return () => {
      materials.main.dispose();
      materials.ridge.dispose();
      materials.crease.dispose();
    };
  }, [materials]);

  const ridgeYScale = aspectRatio === "9:16" ? 1.55 : 1;

  return (
    <>
      <color attach="background" args={[palette.baseBg]} />
      <PaperCameraRig aspectRatio={aspectRatio} />

      {/* Opposing warm & cool studio panel lighting rig */}
      <ambientLight intensity={palette.ambientIntensity} color="#FFFFFF" />
      <hemisphereLight
        args={[palette.hemiSky, palette.hemiGround, palette.hemiIntensity]}
      />
      {/* Warm upper-right studio panel */}
      <directionalLight
        position={[11, 8, 6.5]}
        intensity={palette.warmPanelIntensity}
        color={palette.warmPanelColor}
      />
      <pointLight
        position={[7, 5, 5]}
        intensity={palette.warmPanelIntensity * 0.65}
        color={palette.warmPanelColor}
      />
      {/* Cool lower-left studio panel */}
      <directionalLight
        position={[-11, -7, 6]}
        intensity={palette.coolPanelIntensity}
        color={palette.coolPanelColor}
      />
      <pointLight
        position={[-7, -5, 5]}
        intensity={palette.coolPanelIntensity * 0.65}
        color={palette.coolPanelColor}
      />
      {/* Grazing top rim light */}
      <directionalLight
        position={[0, 8, 4.5]}
        intensity={palette.rimPanelIntensity}
        color={palette.rimPanelColor}
      />

      {/* Main folded-paper wave plane + crisp crease overlay */}
      <group rotation={[-0.08, 0.04, 0]}>
        <mesh geometry={mainPlane.geometry} material={materials.main} />
        <mesh
          geometry={mainPlane.geometry}
          material={materials.crease}
          position={[0, 0, 0.008]}
        />
      </group>

      {/* Framing foreground & background folded-paper ridges */}
      <mesh
        geometry={lowerRidge.geometry}
        material={materials.ridge}
        position={[0, -4.65 * ridgeYScale, 0.95]}
        rotation={[-0.18, 0.02, 0]}
      />
      <mesh
        geometry={upperRidge.geometry}
        material={materials.ridge}
        position={[0, 4.85 * ridgeYScale, -0.75]}
        rotation={[0.16, -0.02, 0]}
      />
    </>
  );
};

export const SoftFoldedPaperLandscape4K: React.FC<
  SoftFoldedPaperLandscape4KProps
> = (props) => {
  const {
    themePreset = "clean-corporate",
    aspectRatio = "16:9",
    backgroundColor = "#F8FAFC",
    primaryColor = "#E2E8F0",
    secondaryColor = "#CBD5E1",
    accentColor = "#3B82F6",
    foldAmplitude = 1,
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
        foldAmplitude,
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
      foldAmplitude,
      speedMultiplier,
      strokeWidth,
    ],
  );

  const cameraConfig = useMemo(
    () => ({
      position: (aspectRatio === "9:16" ? [0, 0, 12.8] : [0, 0, 11.2]) as [
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
    <AbsoluteFill style={{ backgroundColor: palette.baseBg, overflow: "hidden" }}>
      <ThreeCanvas
        width={width}
        height={height}
        dpr={1}
        camera={cameraConfig}
        gl={CANVAS_GL}
        style={{ position: "absolute", inset: 0 }}
      >
        <PaperScene
          frame={frame}
          durationInFrames={durationInFrames}
          palette={palette}
          foldAmplitude={foldAmplitude}
          speedMultiplier={speedMultiplier}
          strokeWidth={strokeWidth}
          aspectRatio={aspectRatio}
        />
      </ThreeCanvas>

      {/* Tiled anti-banding grain overlay */}
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
            id="paper-grain"
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
          <pattern
            id="paper-grain-pattern"
            width="256"
            height="256"
            patternUnits="userSpaceOnUse"
          >
            <rect
              width="256"
              height="256"
              filter="url(#paper-grain)"
              opacity="0.012"
            />
          </pattern>
        </defs>
        <rect
          width={width}
          height={height}
          fill="url(#paper-grain-pattern)"
        />
      </svg>
    </AbsoluteFill>
  );
};
