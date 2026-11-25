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
  MeshBasicMaterial,
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

export const infiniteWireframeDataTunnel4KSchema = z.object({
  themePreset: themePresetSchema.default("dark-tech"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#040917"),
  primaryColor: z.string().default("#38BDF8"),
  secondaryColor: z.string().default("#6366F1"),
  accentColor: z.string().default("#22D3EE"),
  tunnelTwist: z.number().min(0).max(2).default(1),
  speedMultiplier: z.number().int().positive().default(1),
  strokeWidth: z.number().min(0.5).max(3).default(1),
});

export type InfiniteWireframeDataTunnel4KProps = z.infer<
  typeof infiniteWireframeDataTunnel4KSchema
>;

export const defaultInfiniteWireframeDataTunnel4KProps: InfiniteWireframeDataTunnel4KProps =
  {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "#040917",
    primaryColor: "#38BDF8",
    secondaryColor: "#6366F1",
    accentColor: "#22D3EE",
    tunnelTwist: 1,
    speedMultiplier: 1,
    strokeWidth: 1,
  };

export const infiniteWireframeDataTunnel4KVariations: Record<
  ThemePreset,
  InfiniteWireframeDataTunnel4KProps
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "#F1F5F9",
    primaryColor: "#2563EB",
    secondaryColor: "#64748B",
    accentColor: "#0EA5E9",
    tunnelTwist: 1,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "dark-tech": defaultInfiniteWireframeDataTunnel4KProps,
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "#FAF6F0",
    primaryColor: "#E07A5F",
    secondaryColor: "#8D7B68",
    accentColor: "#D4A373",
    tunnelTwist: 1,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "#09090C",
    primaryColor: "#D4AF37",
    secondaryColor: "#52525B",
    accentColor: "#FDE68A",
    tunnelTwist: 1,
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
  frameMetal: string;
  edgePrimary: string;
  edgeSecondary: string;
  haloColor: string;
  ambientIntensity: number;
}

const THEME_PALETTES: Record<ThemePreset, ThemePalette> = {
  "clean-corporate": {
    bgTop: "#F8FAFC",
    bgBottom: "#E2E8F0",
    bgGlow: "#3B82F6",
    bgGlowOpacity: 0.1,
    fogColor: "#EAF0F7",
    frameMetal: "#CBD5E1",
    edgePrimary: "#2563EB",
    edgeSecondary: "#64748B",
    haloColor: "#60A5FA",
    ambientIntensity: 0.9,
  },
  "dark-tech": {
    bgTop: "#061026",
    bgBottom: "#020510",
    bgGlow: "#22D3EE",
    bgGlowOpacity: 0.16,
    fogColor: "#040917",
    frameMetal: "#18243E",
    edgePrimary: "#38BDF8",
    edgeSecondary: "#6366F1",
    haloColor: "#22D3EE",
    ambientIntensity: 0.6,
  },
  "warm-minimalist": {
    bgTop: "#FDFBF7",
    bgBottom: "#EFE4D6",
    bgGlow: "#E07A5F",
    bgGlowOpacity: 0.1,
    fogColor: "#F5EEE3",
    frameMetal: "#DFD0BC",
    edgePrimary: "#E07A5F",
    edgeSecondary: "#A4907C",
    haloColor: "#F2CC8F",
    ambientIntensity: 0.9,
  },
  "monochrome-luxury": {
    bgTop: "#111116",
    bgBottom: "#050507",
    bgGlow: "#D4AF37",
    bgGlowOpacity: 0.14,
    fogColor: "#08080B",
    frameMetal: "#222229",
    edgePrimary: "#D4AF37",
    edgeSecondary: "#71717A",
    haloColor: "#FDE68A",
    ambientIntensity: 0.55,
  },
};

const resolveThemePalette = (
  props: InfiniteWireframeDataTunnel4KProps,
): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  const hasCustomBg =
    props.backgroundColor !==
    defaultInfiniteWireframeDataTunnel4KProps.backgroundColor;
  const hasCustomPrimary =
    props.primaryColor !==
    defaultInfiniteWireframeDataTunnel4KProps.primaryColor;
  const hasCustomSecondary =
    props.secondaryColor !==
    defaultInfiniteWireframeDataTunnel4KProps.secondaryColor;
  const hasCustomAccent =
    props.accentColor !== defaultInfiniteWireframeDataTunnel4KProps.accentColor;

  return {
    ...base,
    bgTop: hasCustomBg ? props.backgroundColor : base.bgTop,
    fogColor: hasCustomBg ? props.backgroundColor : base.fogColor,
    edgePrimary: hasCustomPrimary ? props.primaryColor : base.edgePrimary,
    edgeSecondary: hasCustomSecondary
      ? props.secondaryColor
      : base.edgeSecondary,
    haloColor: hasCustomAccent ? props.accentColor : base.haloColor,
  };
};

const RING_COUNT = 24;
const RING_SPACING = 1.35;
const CYCLE_RINGS = 4;
const CYCLE_SPAN = RING_SPACING * CYCLE_RINGS;
const OCTAGON_SIDES = 8;
const OCTAGON_RADIUS = 3.35;
const CANVAS_GL = { antialias: true, alpha: true } as const;

const TunnelCameraRig: React.FC<{ aspectRatio: AspectRatio }> = ({
  aspectRatio,
}) => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    if (aspectRatio === "9:16") {
      camera.position.set(0, 0, 5.6);
    } else {
      camera.position.set(0, 0, 4.5);
    }
    camera.lookAt(0, 0, -12);
    camera.updateProjectionMatrix();
  }, [camera, aspectRatio]);

  return null;
};

interface TunnelSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  tunnelTwist: number;
  speedMultiplier: number;
  strokeWidth: number;
  aspectRatio: AspectRatio;
}

const TunnelScene: React.FC<TunnelSceneProps> = ({
  frame,
  durationInFrames,
  palette,
  tunnelTwist,
  speedMultiplier,
  strokeWidth,
  aspectRatio,
}) => {
  const progress = (frame % durationInFrames) / durationInFrames;
  const loopAngle = progress * Math.PI * 2 * speedMultiplier;
  // Advance by integer multiple of CYCLE_SPAN (4 rings) so pattern repeats seamlessly
  const zOffset = ((progress * speedMultiplier * 3) % 1) * CYCLE_SPAN;

  const ringIndices = useMemo(
    () => Array.from({ length: RING_COUNT }, (_, i) => i),
    [],
  );

  const railAngles = useMemo(
    () =>
      Array.from(
        { length: OCTAGON_SIDES },
        (_, i) => (i * Math.PI * 2) / OCTAGON_SIDES + Math.PI / 8,
      ),
    [],
  );

  const geometries = useMemo(
    () => ({
      outerOctagon: new TorusGeometry(
        OCTAGON_RADIUS,
        0.06 * strokeWidth,
        8,
        OCTAGON_SIDES,
      ),
      innerOctagon: new TorusGeometry(
        OCTAGON_RADIUS - 0.17,
        0.024 * strokeWidth,
        6,
        OCTAGON_SIDES,
      ),
      haloOctagon: new TorusGeometry(
        OCTAGON_RADIUS - 0.17,
        0.072 * strokeWidth,
        6,
        OCTAGON_SIDES,
      ),
      rail: new BoxGeometry(0.026 * strokeWidth, 0.026 * strokeWidth, 34),
    }),
    [strokeWidth],
  );

  const materials = useMemo(
    () => ({
      metal: new MeshStandardMaterial({
        color: palette.frameMetal,
        roughness: 0.35,
        metalness: 0.65,
      }),
      edgePrimary: new MeshBasicMaterial({
        color: palette.edgePrimary,
        transparent: true,
        opacity: 0.92,
      }),
      edgeSecondary: new MeshBasicMaterial({
        color: palette.edgeSecondary,
        transparent: true,
        opacity: 0.72,
      }),
      halo: new MeshBasicMaterial({
        color: palette.haloColor,
        transparent: true,
        opacity: 0.2,
      }),
      rail: new MeshBasicMaterial({
        color: palette.edgeSecondary,
        transparent: true,
        opacity: 0.42,
      }),
    }),
    [palette],
  );

  useEffect(() => {
    return () => {
      geometries.outerOctagon.dispose();
      geometries.innerOctagon.dispose();
      geometries.haloOctagon.dispose();
      geometries.rail.dispose();
    };
  }, [geometries]);

  useEffect(() => {
    return () => {
      materials.metal.dispose();
      materials.edgePrimary.dispose();
      materials.edgeSecondary.dispose();
      materials.halo.dispose();
      materials.rail.dispose();
    };
  }, [materials]);

  const cameraRoll = Math.sin(loopAngle) * 0.08 * tunnelTwist;

  return (
    <>
      <fog attach="fog" args={[palette.fogColor, 6.5, 27.5]} />
      <TunnelCameraRig aspectRatio={aspectRatio} />

      <ambientLight intensity={palette.ambientIntensity} color="#FFFFFF" />
      <directionalLight
        position={[4, 6, 8]}
        intensity={1.15}
        color={palette.edgePrimary}
      />
      <directionalLight
        position={[-4, -6, 6]}
        intensity={0.85}
        color={palette.edgeSecondary}
      />

      <group rotation={[0, 0, cameraRoll]}>
        {/* Longitudinal octagonal tunnel rails */}
        {railAngles.map((angle, idx) => {
          const rx = Math.cos(angle) * (OCTAGON_RADIUS - 0.14);
          const ry = Math.sin(angle) * (OCTAGON_RADIUS - 0.14);
          return (
            <mesh
              key={`rail-${idx}`}
              geometry={geometries.rail}
              material={materials.rail}
              position={[rx, ry, -12]}
            />
          );
        })}

        {/* Infinite repeating octagonal wireframe frames */}
        {ringIndices.map((idx) => {
          const z = 4.2 - idx * RING_SPACING + zOffset;
          const isAccentRing = idx % CYCLE_RINGS === 0;
          const rotZ =
            Math.PI / 8 + Math.sin(loopAngle - idx * 0.25) * 0.04 * tunnelTwist;

          return (
            <group key={`ring-${idx}`} position={[0, 0, z]} rotation={[0, 0, rotZ]}>
              <mesh
                geometry={geometries.outerOctagon}
                material={materials.metal}
              />
              <mesh
                geometry={geometries.innerOctagon}
                material={
                  isAccentRing ? materials.edgePrimary : materials.edgeSecondary
                }
              />
              {isAccentRing ? (
                <mesh
                  geometry={geometries.haloOctagon}
                  material={materials.halo}
                />
              ) : null}
            </group>
          );
        })}
      </group>
    </>
  );
};

export const InfiniteWireframeDataTunnel4K: React.FC<
  InfiniteWireframeDataTunnel4KProps
> = (props) => {
  const {
    themePreset = "dark-tech",
    aspectRatio = "16:9",
    backgroundColor = "#040917",
    primaryColor = "#38BDF8",
    secondaryColor = "#6366F1",
    accentColor = "#22D3EE",
    tunnelTwist = 1,
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
        tunnelTwist,
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
      tunnelTwist,
      speedMultiplier,
      strokeWidth,
    ],
  );

  const cameraConfig = useMemo(
    () => ({
      position: (aspectRatio === "9:16" ? [0, 0, 5.6] : [0, 0, 4.5]) as [
        number,
        number,
        number,
      ],
      fov: 46,
      near: 0.1,
      far: 100,
    }),
    [aspectRatio],
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
            id="tunnel-bg-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={palette.bgTop} />
            <stop offset="100%" stopColor={palette.bgBottom} />
          </linearGradient>
          <radialGradient id="tunnel-bg-glow" cx="50%" cy="50%" r="55%">
            <stop
              offset="0%"
              stopColor={palette.bgGlow}
              stopOpacity={palette.bgGlowOpacity}
            />
            <stop offset="100%" stopColor={palette.bgBottom} stopOpacity="0" />
          </radialGradient>
          <filter id="tunnel-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed="63"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <pattern
            id="tunnel-grain-pattern"
            width="256"
            height="256"
            patternUnits="userSpaceOnUse"
          >
            <rect
              width="256"
              height="256"
              filter="url(#tunnel-grain)"
              opacity="0.012"
            />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#tunnel-bg-grad)" />
        <rect width={width} height={height} fill="url(#tunnel-bg-glow)" />
        <rect
          width={width}
          height={height}
          fill="url(#tunnel-grain-pattern)"
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
        <TunnelScene
          frame={frame}
          durationInFrames={durationInFrames}
          palette={palette}
          tunnelTwist={tunnelTwist}
          speedMultiplier={speedMultiplier}
          strokeWidth={strokeWidth}
          aspectRatio={aspectRatio}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
