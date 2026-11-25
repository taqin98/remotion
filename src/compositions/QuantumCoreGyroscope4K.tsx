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

export const quantumCoreGyroscope4KSchema = z.object({
  themePreset: themePresetSchema.default("dark-tech"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#050B1A"),
  primaryColor: z.string().default("#334155"),
  secondaryColor: z.string().default("#38BDF8"),
  accentColor: z.string().default("#22D3EE"),
  horizontalOffset: z.number().min(-4).max(4).default(2.85),
  speedMultiplier: z.number().int().positive().default(1),
  strokeWidth: z.number().min(0.5).max(3).default(1),
});

export type QuantumCoreGyroscope4KProps = z.infer<
  typeof quantumCoreGyroscope4KSchema
>;

export const defaultQuantumCoreGyroscope4KProps: QuantumCoreGyroscope4KProps = {
  themePreset: "dark-tech",
  aspectRatio: "16:9",
  backgroundColor: "#050B1A",
  primaryColor: "#334155",
  secondaryColor: "#38BDF8",
  accentColor: "#22D3EE",
  horizontalOffset: 2.85,
  speedMultiplier: 1,
  strokeWidth: 1,
};

export const quantumCoreGyroscope4KVariations: Record<
  ThemePreset,
  QuantumCoreGyroscope4KProps
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "#F1F5F9",
    primaryColor: "#475569",
    secondaryColor: "#2563EB",
    accentColor: "#0EA5E9",
    horizontalOffset: 2.85,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "dark-tech": defaultQuantumCoreGyroscope4KProps,
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "#FAF6F0",
    primaryColor: "#8D7B68",
    secondaryColor: "#E07A5F",
    accentColor: "#D4A373",
    horizontalOffset: 2.85,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "#0B0B0E",
    primaryColor: "#52525B",
    secondaryColor: "#D4AF37",
    accentColor: "#FDE68A",
    horizontalOffset: 2.85,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
};

interface ThemePalette {
  bgTop: string;
  bgBottom: string;
  bgGlow: string;
  bgGlowOpacity: number;
  metal: string;
  emissive: string;
  halo: string;
  coreSurface: string;
  ambientIntensity: number;
}

const THEME_PALETTES: Record<ThemePreset, ThemePalette> = {
  "clean-corporate": {
    bgTop: "#F8FAFC",
    bgBottom: "#E2E8F0",
    bgGlow: "#3B82F6",
    bgGlowOpacity: 0.12,
    metal: "#64748B",
    emissive: "#2563EB",
    halo: "#60A5FA",
    coreSurface: "#1E40AF",
    ambientIntensity: 0.9,
  },
  "dark-tech": {
    bgTop: "#071026",
    bgBottom: "#030714",
    bgGlow: "#22D3EE",
    bgGlowOpacity: 0.18,
    metal: "#475569",
    emissive: "#38BDF8",
    halo: "#22D3EE",
    coreSurface: "#0F172A",
    ambientIntensity: 0.65,
  },
  "warm-minimalist": {
    bgTop: "#FDFBF7",
    bgBottom: "#EFE4D6",
    bgGlow: "#E07A5F",
    bgGlowOpacity: 0.12,
    metal: "#A4907C",
    emissive: "#E07A5F",
    halo: "#F2CC8F",
    coreSurface: "#9C4221",
    ambientIntensity: 0.92,
  },
  "monochrome-luxury": {
    bgTop: "#121216",
    bgBottom: "#060608",
    bgGlow: "#D4AF37",
    bgGlowOpacity: 0.15,
    metal: "#52525B",
    emissive: "#D4AF37",
    halo: "#FDE68A",
    coreSurface: "#18181B",
    ambientIntensity: 0.55,
  },
};

const resolveThemePalette = (
  props: QuantumCoreGyroscope4KProps,
): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  const hasCustomBg =
    props.backgroundColor !==
    defaultQuantumCoreGyroscope4KProps.backgroundColor;
  const hasCustomPrimary =
    props.primaryColor !== defaultQuantumCoreGyroscope4KProps.primaryColor;
  const hasCustomSecondary =
    props.secondaryColor !== defaultQuantumCoreGyroscope4KProps.secondaryColor;
  const hasCustomAccent =
    props.accentColor !== defaultQuantumCoreGyroscope4KProps.accentColor;

  return {
    ...base,
    bgTop: hasCustomBg ? props.backgroundColor : base.bgTop,
    metal: hasCustomPrimary ? props.primaryColor : base.metal,
    emissive: hasCustomSecondary ? props.secondaryColor : base.emissive,
    halo: hasCustomAccent ? props.accentColor : base.halo,
  };
};

interface GyroRingSpec {
  id: string;
  radius: number;
  tube: number;
  isEmissive: boolean;
  baseRot: [number, number, number];
  axisMultipliers: [number, number, number];
  hasCalipers: boolean;
}

const GYRO_RINGS: readonly GyroRingSpec[] = [
  {
    id: "gyro-1",
    radius: 1.72,
    tube: 0.048,
    isEmissive: true,
    baseRot: [0.45, 0.25, 0.1],
    axisMultipliers: [1, 2, 0],
    hasCalipers: true,
  },
  {
    id: "gyro-2",
    radius: 2.15,
    tube: 0.072,
    isEmissive: false,
    baseRot: [-0.35, 0.65, 0.4],
    axisMultipliers: [-1, 1, 1],
    hasCalipers: true,
  },
  {
    id: "gyro-3",
    radius: 2.58,
    tube: 0.038,
    isEmissive: true,
    baseRot: [0.85, -0.4, 0.2],
    axisMultipliers: [0, -2, 1],
    hasCalipers: false,
  },
  {
    id: "gyro-4",
    radius: 3.04,
    tube: 0.082,
    isEmissive: false,
    baseRot: [0.22, 0.5, -0.55],
    axisMultipliers: [1, 0, -1],
    hasCalipers: true,
  },
  {
    id: "gyro-5",
    radius: 3.48,
    tube: 0.032,
    isEmissive: true,
    baseRot: [-0.6, -0.25, 0.35],
    axisMultipliers: [-1, 1, 0],
    hasCalipers: false,
  },
];

const CANVAS_GL = { antialias: true, alpha: true } as const;

const GyroCameraRig: React.FC<{ aspectRatio: AspectRatio }> = ({
  aspectRatio,
}) => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    if (aspectRatio === "9:16") {
      camera.position.set(0, 0, 14.2);
    } else {
      camera.position.set(0, 0, 11.4);
    }
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, aspectRatio]);

  return null;
};

interface GyroSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  centerX: number;
  speedMultiplier: number;
  strokeWidth: number;
  aspectRatio: AspectRatio;
}

const GyroScene: React.FC<GyroSceneProps> = ({
  frame,
  durationInFrames,
  palette,
  centerX,
  speedMultiplier,
  strokeWidth,
  aspectRatio,
}) => {
  const progress = (frame % durationInFrames) / durationInFrames;
  const loopAngle = progress * Math.PI * 2 * speedMultiplier;

  const ringGeometries = useMemo(
    () =>
      GYRO_RINGS.map((ring) => ({
        main: new TorusGeometry(ring.radius, ring.tube * strokeWidth, 24, 96),
        halo: new TorusGeometry(
          ring.radius,
          ring.tube * 2.15 * strokeWidth,
          16,
          72,
        ),
      })),
    [strokeWidth],
  );

  const coreGeometries = useMemo(
    () => ({
      core: new IcosahedronGeometry(1.0, 1),
      cage: new IcosahedronGeometry(1.2, 1),
      bloomInner: new SphereGeometry(1.26, 24, 24),
      bloomOuter: new SphereGeometry(1.65, 24, 24),
      caliper: new RoundedBoxGeometry(0.18, 0.12, 0.16, 2, 0.025),
    }),
    [],
  );

  const materials = useMemo(
    () => ({
      metal: new MeshStandardMaterial({
        color: palette.metal,
        roughness: 0.28,
        metalness: 0.82,
      }),
      emissive: new MeshStandardMaterial({
        color: palette.emissive,
        emissive: palette.emissive,
        emissiveIntensity: 1.45,
        roughness: 0.2,
        metalness: 0.35,
      }),
      halo: new MeshBasicMaterial({
        color: palette.halo,
        transparent: true,
        opacity: 0.2,
      }),
      core: new MeshStandardMaterial({
        color: palette.coreSurface,
        emissive: palette.emissive,
        emissiveIntensity: 0.9,
        flatShading: true,
        roughness: 0.3,
        metalness: 0.45,
      }),
      cage: new MeshBasicMaterial({
        color: palette.halo,
        wireframe: true,
        transparent: true,
        opacity: 0.65,
      }),
      bloomInner: new MeshBasicMaterial({
        color: palette.halo,
        transparent: true,
        opacity: 0.2,
      }),
      bloomOuter: new MeshBasicMaterial({
        color: palette.emissive,
        transparent: true,
        opacity: 0.08,
      }),
    }),
    [palette],
  );

  useEffect(() => {
    return () => {
      ringGeometries.forEach((g) => {
        g.main.dispose();
        g.halo.dispose();
      });
    };
  }, [ringGeometries]);

  useEffect(() => {
    return () => {
      coreGeometries.core.dispose();
      coreGeometries.cage.dispose();
      coreGeometries.bloomInner.dispose();
      coreGeometries.bloomOuter.dispose();
      coreGeometries.caliper.dispose();
    };
  }, [coreGeometries]);

  useEffect(() => {
    return () => {
      materials.metal.dispose();
      materials.emissive.dispose();
      materials.halo.dispose();
      materials.core.dispose();
      materials.cage.dispose();
      materials.bloomInner.dispose();
      materials.bloomOuter.dispose();
    };
  }, [materials]);

  const corePulse = 1 + Math.sin(loopAngle * 2) * 0.08;
  const bloomPulse = 1 + Math.sin(loopAngle * 2 + 0.6) * 0.14;

  return (
    <>
      <GyroCameraRig aspectRatio={aspectRatio} />

      <ambientLight intensity={palette.ambientIntensity} color="#FFFFFF" />
      <hemisphereLight args={[palette.halo, palette.bgBottom, 0.5]} />
      <directionalLight
        position={[9, 10, 10]}
        intensity={1.4}
        color="#FFFFFF"
      />
      <directionalLight
        position={[-9, -6, 8]}
        intensity={0.95}
        color={palette.emissive}
      />
      <directionalLight
        position={[0, 8, -10]}
        intensity={1.25}
        color={palette.halo}
      />

      <group position={[centerX, 0, 0]}>
        {/* Pulsing icosahedron quantum core + wireframe cage + bloom aura */}
        <group
          rotation={[loopAngle * 0.5 + 0.4, loopAngle, loopAngle * 0.25]}
          scale={[corePulse, corePulse, corePulse]}
        >
          <mesh geometry={coreGeometries.core} material={materials.core} />
          <mesh geometry={coreGeometries.cage} material={materials.cage} />
        </group>

        <mesh
          geometry={coreGeometries.bloomInner}
          material={materials.bloomInner}
          scale={[bloomPulse, bloomPulse, bloomPulse]}
        />
        <mesh
          geometry={coreGeometries.bloomOuter}
          material={materials.bloomOuter}
          scale={[bloomPulse * 1.08, bloomPulse * 1.08, bloomPulse * 1.08]}
        />

        {/* 5 nested gyroscope rings */}
        {GYRO_RINGS.map((ring, idx) => {
          const rx = ring.baseRot[0] + loopAngle * ring.axisMultipliers[0];
          const ry = ring.baseRot[1] + loopAngle * ring.axisMultipliers[1];
          const rz = ring.baseRot[2] + loopAngle * ring.axisMultipliers[2];
          const geos = ringGeometries[idx];

          return (
            <group key={ring.id} rotation={[rx, ry, rz]}>
              <mesh
                geometry={geos.main}
                material={
                  ring.isEmissive ? materials.emissive : materials.metal
                }
              />
              {ring.isEmissive ? (
                <mesh geometry={geos.halo} material={materials.halo} />
              ) : null}
              {ring.hasCalipers ? (
                <>
                  <mesh
                    geometry={coreGeometries.caliper}
                    material={materials.emissive}
                    position={[ring.radius, 0, 0]}
                  />
                  <mesh
                    geometry={coreGeometries.caliper}
                    material={materials.emissive}
                    position={[-ring.radius, 0, 0]}
                  />
                </>
              ) : null}
            </group>
          );
        })}
      </group>
    </>
  );
};

export const QuantumCoreGyroscope4K: React.FC<QuantumCoreGyroscope4KProps> = (
  props,
) => {
  const {
    themePreset = "dark-tech",
    aspectRatio = "16:9",
    backgroundColor = "#050B1A",
    primaryColor = "#334155",
    secondaryColor = "#38BDF8",
    accentColor = "#22D3EE",
    horizontalOffset = 2.85,
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
        horizontalOffset,
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
      horizontalOffset,
      speedMultiplier,
      strokeWidth,
    ],
  );

  const centerX = aspectRatio === "9:16" ? 0 : horizontalOffset;

  const cameraConfig = useMemo(
    () => ({
      position: (aspectRatio === "9:16" ? [0, 0, 14.2] : [0, 0, 11.4]) as [
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
          <linearGradient id="gyro-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.bgTop} />
            <stop offset="100%" stopColor={palette.bgBottom} />
          </linearGradient>
          <radialGradient
            id="gyro-bg-glow"
            cx={aspectRatio === "9:16" ? "50%" : "68%"}
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
          <filter id="gyro-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed="68"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <pattern
            id="gyro-grain-pattern"
            width="256"
            height="256"
            patternUnits="userSpaceOnUse"
          >
            <rect
              width="256"
              height="256"
              filter="url(#gyro-grain)"
              opacity="0.012"
            />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#gyro-bg-grad)" />
        <rect width={width} height={height} fill="url(#gyro-bg-glow)" />
        <rect width={width} height={height} fill="url(#gyro-grain-pattern)" />
      </svg>

      <ThreeCanvas
        width={width}
        height={height}
        dpr={1}
        camera={cameraConfig}
        gl={CANVAS_GL}
        style={{ position: "absolute", inset: 0 }}
      >
        <GyroScene
          frame={frame}
          durationInFrames={durationInFrames}
          palette={palette}
          centerX={centerX}
          speedMultiplier={speedMultiplier}
          strokeWidth={strokeWidth}
          aspectRatio={aspectRatio}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
