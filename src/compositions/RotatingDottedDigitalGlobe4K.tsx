import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  IcosahedronGeometry,
  MeshBasicMaterial,
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

export const rotatingDottedDigitalGlobe4KSchema = z.object({
  themePreset: themePresetSchema.default("dark-tech"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#050B1A"),
  primaryColor: z.string().default("#38BDF8"),
  secondaryColor: z.string().default("#6366F1"),
  accentColor: z.string().default("#22D3EE"),
  globeOffset: z.number().min(-4).max(4).default(2.95),
  speedMultiplier: z.number().int().positive().default(1),
  strokeWidth: z.number().min(0.5).max(3).default(1),
});

export type RotatingDottedDigitalGlobe4KProps = z.infer<
  typeof rotatingDottedDigitalGlobe4KSchema
>;

export const defaultRotatingDottedDigitalGlobe4KProps: RotatingDottedDigitalGlobe4KProps =
  {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "#050B1A",
    primaryColor: "#38BDF8",
    secondaryColor: "#6366F1",
    accentColor: "#22D3EE",
    globeOffset: 2.95,
    speedMultiplier: 1,
    strokeWidth: 1,
  };

export const rotatingDottedDigitalGlobe4KVariations: Record<
  ThemePreset,
  RotatingDottedDigitalGlobe4KProps
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "#F1F5F9",
    primaryColor: "#2563EB",
    secondaryColor: "#0EA5E9",
    accentColor: "#1D4ED8",
    globeOffset: 2.95,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "dark-tech": defaultRotatingDottedDigitalGlobe4KProps,
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "#FAF6F0",
    primaryColor: "#E07A5F",
    secondaryColor: "#D4A373",
    accentColor: "#C85A3F",
    globeOffset: 2.95,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "#0B0B0E",
    primaryColor: "#D4AF37",
    secondaryColor: "#94A3B8",
    accentColor: "#FDE68A",
    globeOffset: 2.95,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
};

interface ThemePalette {
  bgTop: string;
  bgBottom: string;
  bgGlow: string;
  bgGlowOpacity: number;
  dotCore: string;
  dotHalo: string;
  wireframe: string;
  ringPrimary: string;
  ringSecondary: string;
  svgStroke: string;
}

const THEME_PALETTES: Record<ThemePreset, ThemePalette> = {
  "clean-corporate": {
    bgTop: "#F8FAFC",
    bgBottom: "#E2E8F0",
    bgGlow: "#3B82F6",
    bgGlowOpacity: 0.12,
    dotCore: "#1D4ED8",
    dotHalo: "#60A5FA",
    wireframe: "#93C5FD",
    ringPrimary: "#2563EB",
    ringSecondary: "#64748B",
    svgStroke: "#3B82F6",
  },
  "dark-tech": {
    bgTop: "#071026",
    bgBottom: "#030714",
    bgGlow: "#38BDF8",
    bgGlowOpacity: 0.18,
    dotCore: "#E0F2FE",
    dotHalo: "#22D3EE",
    wireframe: "#1E3A8A",
    ringPrimary: "#38BDF8",
    ringSecondary: "#6366F1",
    svgStroke: "#22D3EE",
  },
  "warm-minimalist": {
    bgTop: "#FDFBF7",
    bgBottom: "#EFE4D6",
    bgGlow: "#E07A5F",
    bgGlowOpacity: 0.12,
    dotCore: "#9C4221",
    dotHalo: "#F2CC8F",
    wireframe: "#DFD0BC",
    ringPrimary: "#E07A5F",
    ringSecondary: "#A4907C",
    svgStroke: "#E07A5F",
  },
  "monochrome-luxury": {
    bgTop: "#121216",
    bgBottom: "#060608",
    bgGlow: "#D4AF37",
    bgGlowOpacity: 0.15,
    dotCore: "#FEF3C7",
    dotHalo: "#D4AF37",
    wireframe: "#3F3F46",
    ringPrimary: "#D4AF37",
    ringSecondary: "#71717A",
    svgStroke: "#D4AF37",
  },
};

const resolveThemePalette = (
  props: RotatingDottedDigitalGlobe4KProps,
): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  const hasCustomBg =
    props.backgroundColor !==
    defaultRotatingDottedDigitalGlobe4KProps.backgroundColor;
  const hasCustomPrimary =
    props.primaryColor !==
    defaultRotatingDottedDigitalGlobe4KProps.primaryColor;
  const hasCustomSecondary =
    props.secondaryColor !==
    defaultRotatingDottedDigitalGlobe4KProps.secondaryColor;
  const hasCustomAccent =
    props.accentColor !== defaultRotatingDottedDigitalGlobe4KProps.accentColor;

  return {
    ...base,
    bgTop: hasCustomBg ? props.backgroundColor : base.bgTop,
    ringPrimary: hasCustomPrimary ? props.primaryColor : base.ringPrimary,
    ringSecondary: hasCustomSecondary
      ? props.secondaryColor
      : base.ringSecondary,
    dotHalo: hasCustomAccent ? props.accentColor : base.dotHalo,
    svgStroke: hasCustomAccent ? props.accentColor : base.svgStroke,
  };
};

const DOT_COUNT = 220;
const GLOBE_RADIUS = 3.1;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const CANVAS_GL = { antialias: true, alpha: true } as const;

interface GlobeDotSpec {
  id: number;
  position: [number, number, number];
  isHighlight: boolean;
  phase: number;
}

const buildFibonacciDots = (): GlobeDotSpec[] => {
  const dots: GlobeDotSpec[] = [];
  for (let i = 0; i < DOT_COUNT; i += 1) {
    const t = (i + 0.5) / DOT_COUNT;
    const y = 1 - 2 * t;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * GOLDEN_ANGLE;

    dots.push({
      id: i,
      position: [
        Math.cos(theta) * r * GLOBE_RADIUS,
        y * GLOBE_RADIUS,
        Math.sin(theta) * r * GLOBE_RADIUS,
      ],
      isHighlight: i % 6 === 0,
      phase: (i * 0.41) % (Math.PI * 2),
    });
  }
  return dots;
};

const GlobeCameraRig: React.FC<{ aspectRatio: AspectRatio }> = ({
  aspectRatio,
}) => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    if (aspectRatio === "9:16") {
      camera.position.set(0, 0, 14.5);
    } else {
      camera.position.set(0, 0, 11.5);
    }
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, aspectRatio]);

  return null;
};

interface GlobeSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  globeX: number;
  speedMultiplier: number;
  strokeWidth: number;
  aspectRatio: AspectRatio;
}

const GlobeScene: React.FC<GlobeSceneProps> = ({
  frame,
  durationInFrames,
  palette,
  globeX,
  speedMultiplier,
  strokeWidth,
  aspectRatio,
}) => {
  const progress = (frame % durationInFrames) / durationInFrames;
  const loopAngle = progress * Math.PI * 2 * speedMultiplier;

  const dots = useMemo(() => buildFibonacciDots(), []);

  const geometries = useMemo(
    () => ({
      dotCore: new SphereGeometry(0.044, 10, 10),
      dotHalo: new SphereGeometry(0.1, 10, 10),
      geodesic: new IcosahedronGeometry(GLOBE_RADIUS - 0.08, 3),
      orbit1: new TorusGeometry(3.65, 0.018 * strokeWidth, 12, 96),
      orbit2: new TorusGeometry(4.05, 0.015 * strokeWidth, 12, 96),
      orbit3: new TorusGeometry(4.45, 0.012 * strokeWidth, 12, 96),
    }),
    [strokeWidth],
  );

  const materials = useMemo(
    () => ({
      core: new MeshBasicMaterial({ color: palette.dotCore }),
      halo: new MeshBasicMaterial({
        color: palette.dotHalo,
        transparent: true,
        opacity: 0.34,
      }),
      wireframe: new MeshBasicMaterial({
        color: palette.wireframe,
        wireframe: true,
        transparent: true,
        opacity: 0.32,
      }),
      ringPrimary: new MeshStandardMaterial({
        color: palette.ringPrimary,
        emissive: palette.ringPrimary,
        emissiveIntensity: 0.85,
        roughness: 0.25,
        metalness: 0.5,
      }),
      ringSecondary: new MeshStandardMaterial({
        color: palette.ringSecondary,
        emissive: palette.ringSecondary,
        emissiveIntensity: 0.65,
        roughness: 0.3,
        metalness: 0.45,
      }),
    }),
    [palette],
  );

  useEffect(() => {
    return () => {
      geometries.dotCore.dispose();
      geometries.dotHalo.dispose();
      geometries.geodesic.dispose();
      geometries.orbit1.dispose();
      geometries.orbit2.dispose();
      geometries.orbit3.dispose();
    };
  }, [geometries]);

  useEffect(() => {
    return () => {
      materials.core.dispose();
      materials.halo.dispose();
      materials.wireframe.dispose();
      materials.ringPrimary.dispose();
      materials.ringSecondary.dispose();
    };
  }, [materials]);

  return (
    <>
      <GlobeCameraRig aspectRatio={aspectRatio} />
      <ambientLight intensity={0.85} color="#FFFFFF" />
      <directionalLight
        position={[8, 10, 10]}
        intensity={1.2}
        color={palette.ringPrimary}
      />

      <group position={[globeX, 0, 0]}>
        {/* Rotating Fibonacci dotted globe + wireframe geodesic core */}
        <group rotation={[0.22, loopAngle, 0.08]}>
          <mesh
            geometry={geometries.geodesic}
            material={materials.wireframe}
          />
          {dots.map((dot) => {
            const pulse =
              1 + Math.sin(loopAngle * 2 + dot.phase) * (dot.isHighlight ? 0.35 : 0.15);
            return (
              <group key={dot.id} position={dot.position}>
                <mesh
                  geometry={geometries.dotCore}
                  material={materials.core}
                  scale={dot.isHighlight ? [1.35, 1.35, 1.35] : [1, 1, 1]}
                />
                {dot.isHighlight ? (
                  <mesh
                    geometry={geometries.dotHalo}
                    material={materials.halo}
                    scale={[pulse, pulse, pulse]}
                  />
                ) : null}
              </group>
            );
          })}
        </group>

        {/* 3 tilted 3D orbital rings */}
        <mesh
          geometry={geometries.orbit1}
          material={materials.ringPrimary}
          rotation={[1.15, 0.35, loopAngle]}
        />
        <mesh
          geometry={geometries.orbit2}
          material={materials.ringSecondary}
          rotation={[-0.92, -0.45, -loopAngle]}
        />
        <mesh
          geometry={geometries.orbit3}
          material={materials.ringPrimary}
          rotation={[0.45, 1.1, loopAngle * 2]}
        />
      </group>
    </>
  );
};

export const RotatingDottedDigitalGlobe4K: React.FC<
  RotatingDottedDigitalGlobe4KProps
> = (props) => {
  const {
    themePreset = "dark-tech",
    aspectRatio = "16:9",
    backgroundColor = "#050B1A",
    primaryColor = "#38BDF8",
    secondaryColor = "#6366F1",
    accentColor = "#22D3EE",
    globeOffset = 2.95,
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
        globeOffset,
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
      globeOffset,
      speedMultiplier,
      strokeWidth,
    ],
  );

  const progress = (frame % durationInFrames) / durationInFrames;
  const loopDeg = progress * 360 * speedMultiplier;
  const globeX = aspectRatio === "9:16" ? 0 : globeOffset;

  // Map 3D globe center X to SVG coordinate space
  const svgCenterX =
    aspectRatio === "9:16"
      ? width * 0.5
      : width * (0.5 + (globeX / 7.441) * 0.5);
  const svgCenterY = height * 0.5;
  const hudRadiusOuter = Math.min(width, height) * 0.44;
  const hudRadiusInner = Math.min(width, height) * 0.38;

  const cameraConfig = useMemo(
    () => ({
      position: (aspectRatio === "9:16" ? [0, 0, 14.5] : [0, 0, 11.5]) as [
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
      {/* Backdrop + SVG orbital HUD rings aligned to globe center */}
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
            id="globe-bg-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={palette.bgTop} />
            <stop offset="100%" stopColor={palette.bgBottom} />
          </linearGradient>
          <radialGradient
            id="globe-bg-glow"
            cx={aspectRatio === "9:16" ? "50%" : "70%"}
            cy="50%"
            r="52%"
          >
            <stop
              offset="0%"
              stopColor={palette.bgGlow}
              stopOpacity={palette.bgGlowOpacity}
            />
            <stop offset="100%" stopColor={palette.bgBottom} stopOpacity="0" />
          </radialGradient>
          <filter id="globe-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed="65"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <pattern
            id="globe-grain-pattern"
            width="256"
            height="256"
            patternUnits="userSpaceOnUse"
          >
            <rect
              width="256"
              height="256"
              filter="url(#globe-grain)"
              opacity="0.012"
            />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#globe-bg-grad)" />
        <rect width={width} height={height} fill="url(#globe-bg-glow)" />

        <g transform={`rotate(${loopDeg} ${svgCenterX} ${svgCenterY})`}>
          <circle
            cx={svgCenterX}
            cy={svgCenterY}
            r={hudRadiusOuter}
            fill="none"
            stroke={palette.svgStroke}
            strokeWidth={2 * strokeWidth}
            strokeDasharray="18 28 6 28"
            opacity="0.28"
          />
        </g>
        <g transform={`rotate(${-loopDeg} ${svgCenterX} ${svgCenterY})`}>
          <circle
            cx={svgCenterX}
            cy={svgCenterY}
            r={hudRadiusInner}
            fill="none"
            stroke={palette.ringSecondary}
            strokeWidth={1.5 * strokeWidth}
            strokeDasharray="48 24"
            opacity="0.24"
          />
        </g>

        <rect
          width={width}
          height={height}
          fill="url(#globe-grain-pattern)"
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
        <GlobeScene
          frame={frame}
          durationInFrames={durationInFrames}
          palette={palette}
          globeX={globeX}
          speedMultiplier={speedMultiplier}
          strokeWidth={strokeWidth}
          aspectRatio={aspectRatio}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
