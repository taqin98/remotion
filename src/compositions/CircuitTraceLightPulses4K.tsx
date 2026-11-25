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
  MeshBasicMaterial,
  MeshStandardMaterial,
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

export const circuitTraceLightPulses4KSchema = z.object({
  themePreset: themePresetSchema.default("dark-tech"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#050B1A"),
  primaryColor: z.string().default("#162033"),
  secondaryColor: z.string().default("#38BDF8"),
  accentColor: z.string().default("#22D3EE"),
  boardTilt: z.number().min(0).max(0.45).default(0.16),
  speedMultiplier: z.number().int().positive().default(1),
  strokeWidth: z.number().min(0.5).max(3).default(1),
});

export type CircuitTraceLightPulses4KProps = z.infer<
  typeof circuitTraceLightPulses4KSchema
>;

export const defaultCircuitTraceLightPulses4KProps: CircuitTraceLightPulses4KProps =
  {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "#050B1A",
    primaryColor: "#162033",
    secondaryColor: "#38BDF8",
    accentColor: "#22D3EE",
    boardTilt: 0.16,
    speedMultiplier: 1,
    strokeWidth: 1,
  };

export const circuitTraceLightPulses4KVariations: Record<
  ThemePreset,
  CircuitTraceLightPulses4KProps
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "#F1F5F9",
    primaryColor: "#E2E8F0",
    secondaryColor: "#3B82F6",
    accentColor: "#1D4ED8",
    boardTilt: 0.16,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "dark-tech": defaultCircuitTraceLightPulses4KProps,
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "#FAF6F0",
    primaryColor: "#EFE5D7",
    secondaryColor: "#E07A5F",
    accentColor: "#D4A373",
    boardTilt: 0.16,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "#0B0B0E",
    primaryColor: "#19191F",
    secondaryColor: "#D4AF37",
    accentColor: "#FDE68A",
    boardTilt: 0.16,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
};

interface ThemePalette {
  bgTop: string;
  bgBottom: string;
  bgGlow: string;
  bgGlowOpacity: number;
  traceMatte: string;
  padColor: string;
  viaRim: string;
  pulseCore: string;
  pulseHalo: string;
  ambientIntensity: number;
}

const THEME_PALETTES: Record<ThemePreset, ThemePalette> = {
  "clean-corporate": {
    bgTop: "#F8FAFC",
    bgBottom: "#E2E8F0",
    bgGlow: "#3B82F6",
    bgGlowOpacity: 0.1,
    traceMatte: "#CBD5E1",
    padColor: "#E2E8F0",
    viaRim: "#3B82F6",
    pulseCore: "#1D4ED8",
    pulseHalo: "#60A5FA",
    ambientIntensity: 0.9,
  },
  "dark-tech": {
    bgTop: "#071026",
    bgBottom: "#030714",
    bgGlow: "#22D3EE",
    bgGlowOpacity: 0.16,
    traceMatte: "#16223A",
    padColor: "#1E2D4A",
    viaRim: "#38BDF8",
    pulseCore: "#E0F2FE",
    pulseHalo: "#22D3EE",
    ambientIntensity: 0.65,
  },
  "warm-minimalist": {
    bgTop: "#FDFBF7",
    bgBottom: "#EFE4D6",
    bgGlow: "#E07A5F",
    bgGlowOpacity: 0.1,
    traceMatte: "#DFD0BC",
    padColor: "#EFE5D7",
    viaRim: "#E07A5F",
    pulseCore: "#E07A5F",
    pulseHalo: "#F2CC8F",
    ambientIntensity: 0.92,
  },
  "monochrome-luxury": {
    bgTop: "#121216",
    bgBottom: "#060608",
    bgGlow: "#D4AF37",
    bgGlowOpacity: 0.14,
    traceMatte: "#1E1E26",
    padColor: "#272730",
    viaRim: "#D4AF37",
    pulseCore: "#FEF3C7",
    pulseHalo: "#D4AF37",
    ambientIntensity: 0.55,
  },
};

const resolveThemePalette = (
  props: CircuitTraceLightPulses4KProps,
): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  const hasCustomBg =
    props.backgroundColor !==
    defaultCircuitTraceLightPulses4KProps.backgroundColor;
  const hasCustomPrimary =
    props.primaryColor !== defaultCircuitTraceLightPulses4KProps.primaryColor;
  const hasCustomSecondary =
    props.secondaryColor !==
    defaultCircuitTraceLightPulses4KProps.secondaryColor;
  const hasCustomAccent =
    props.accentColor !== defaultCircuitTraceLightPulses4KProps.accentColor;

  return {
    ...base,
    bgTop: hasCustomBg ? props.backgroundColor : base.bgTop,
    traceMatte: hasCustomPrimary ? props.primaryColor : base.traceMatte,
    viaRim: hasCustomSecondary ? props.secondaryColor : base.viaRim,
    pulseHalo: hasCustomAccent ? props.accentColor : base.pulseHalo,
  };
};

type Point2D = [number, number];

interface CircuitRouteSpec {
  id: string;
  points: readonly Point2D[];
  pulsePhase: number;
  pulseCycles: 1 | 2;
}

// 10 orthogonal multi-segment circuit routes around a calm center reserve
const CIRCUIT_ROUTES: readonly CircuitRouteSpec[] = [
  {
    id: "route-tl-1",
    points: [
      [-7.6, 3.2],
      [-4.2, 3.2],
      [-4.2, 1.8],
      [-2.1, 1.8],
    ],
    pulsePhase: 0.05,
    pulseCycles: 1,
  },
  {
    id: "route-tl-2",
    points: [
      [-7.6, 2.2],
      [-5.4, 2.2],
      [-5.4, 0.7],
      [-3.4, 0.7],
    ],
    pulsePhase: 0.35,
    pulseCycles: 2,
  },
  {
    id: "route-tr-1",
    points: [
      [7.6, 3.1],
      [4.5, 3.1],
      [4.5, 1.9],
      [2.2, 1.9],
    ],
    pulsePhase: 0.22,
    pulseCycles: 1,
  },
  {
    id: "route-tr-2",
    points: [
      [7.6, 2.0],
      [5.8, 2.0],
      [5.8, 0.8],
      [3.5, 0.8],
    ],
    pulsePhase: 0.65,
    pulseCycles: 2,
  },
  {
    id: "route-bl-1",
    points: [
      [-7.6, -3.1],
      [-4.4, -3.1],
      [-4.4, -1.7],
      [-2.2, -1.7],
    ],
    pulsePhase: 0.18,
    pulseCycles: 1,
  },
  {
    id: "route-bl-2",
    points: [
      [-7.6, -2.0],
      [-5.6, -2.0],
      [-5.6, -0.6],
      [-3.5, -0.6],
    ],
    pulsePhase: 0.52,
    pulseCycles: 2,
  },
  {
    id: "route-br-1",
    points: [
      [7.6, -3.2],
      [4.3, -3.2],
      [4.3, -1.8],
      [2.1, -1.8],
    ],
    pulsePhase: 0.44,
    pulseCycles: 1,
  },
  {
    id: "route-br-2",
    points: [
      [7.6, -2.1],
      [5.5, -2.1],
      [5.5, -0.7],
      [3.4, -0.7],
    ],
    pulsePhase: 0.8,
    pulseCycles: 2,
  },
  {
    id: "route-top-bridge",
    points: [
      [-3.2, 4.4],
      [-3.2, 2.8],
      [3.2, 2.8],
      [3.2, 4.4],
    ],
    pulsePhase: 0.12,
    pulseCycles: 1,
  },
  {
    id: "route-bot-bridge",
    points: [
      [3.1, -4.4],
      [3.1, -2.8],
      [-3.1, -2.8],
      [-3.1, -4.4],
    ],
    pulsePhase: 0.6,
    pulseCycles: 1,
  },
];

interface TraceSegment {
  id: string;
  midX: number;
  midY: number;
  length: number;
  horizontal: boolean;
}

interface ChipPadSpec {
  id: string;
  position: Point2D;
  size: [number, number];
}

const CHIP_PADS: readonly ChipPadSpec[] = [
  { id: "pad-tl", position: [-4.2, 1.8], size: [0.65, 0.65] },
  { id: "pad-tr", position: [4.5, 1.9], size: [0.65, 0.65] },
  { id: "pad-bl", position: [-4.4, -1.7], size: [0.65, 0.65] },
  { id: "pad-br", position: [4.3, -1.8], size: [0.65, 0.65] },
];

const samplePolyline = (
  points: readonly Point2D[],
  t: number,
): { x: number; y: number; horizontal: boolean } => {
  const segLengths: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    const len = Math.hypot(
      points[i + 1][0] - points[i][0],
      points[i + 1][1] - points[i][1],
    );
    segLengths.push(len);
    total += len;
  }

  let target = t * total;
  for (let i = 0; i < segLengths.length; i += 1) {
    const segLen = segLengths[i];
    if (target <= segLen || i === segLengths.length - 1) {
      const localT = segLen > 0 ? target / segLen : 0;
      const p0 = points[i];
      const p1 = points[i + 1];
      return {
        x: p0[0] + (p1[0] - p0[0]) * localT,
        y: p0[1] + (p1[1] - p0[1]) * localT,
        horizontal: Math.abs(p1[0] - p0[0]) >= Math.abs(p1[1] - p0[1]),
      };
    }
    target -= segLen;
  }
  return { x: points[0][0], y: points[0][1], horizontal: true };
};

const CANVAS_GL = { antialias: true, alpha: true } as const;

const CircuitCameraRig: React.FC<{ aspectRatio: AspectRatio }> = ({
  aspectRatio,
}) => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    if (aspectRatio === "9:16") {
      camera.position.set(0, 0, 15.2);
    } else {
      camera.position.set(0, 0, 11.8);
    }
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, aspectRatio]);

  return null;
};

interface CircuitSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  boardTilt: number;
  speedMultiplier: number;
  strokeWidth: number;
  aspectRatio: AspectRatio;
}

const CircuitScene: React.FC<CircuitSceneProps> = ({
  frame,
  durationInFrames,
  palette,
  boardTilt,
  speedMultiplier,
  strokeWidth,
  aspectRatio,
}) => {
  const progress = (frame % durationInFrames) / durationInFrames;

  const { segments, viaPoints } = useMemo(() => {
    const segs: TraceSegment[] = [];
    const vias: Array<{ id: string; x: number; y: number }> = [];

    CIRCUIT_ROUTES.forEach((route) => {
      for (let i = 0; i < route.points.length - 1; i += 1) {
        const p0 = route.points[i];
        const p1 = route.points[i + 1];
        const dx = p1[0] - p0[0];
        const dy = p1[1] - p0[1];
        segs.push({
          id: `${route.id}-seg-${i}`,
          midX: (p0[0] + p1[0]) * 0.5,
          midY: (p0[1] + p1[1]) * 0.5,
          length: Math.hypot(dx, dy) + 0.08 * strokeWidth,
          horizontal: Math.abs(dx) >= Math.abs(dy),
        });
      }
      const endPt = route.points[route.points.length - 1];
      vias.push({ id: `${route.id}-via`, x: endPt[0], y: endPt[1] });
    });
    return { segments: segs, viaPoints: vias };
  }, [strokeWidth]);

  const geometries = useMemo(
    () => ({
      traceUnit: new RoundedBoxGeometry(1, 1, 0.14, 2, 0.03),
      chipPad: new RoundedBoxGeometry(0.65, 0.65, 0.2, 2, 0.06),
      viaCylinder: new CylinderGeometry(0.14, 0.14, 0.18, 20, 1),
      pulseCore: new RoundedBoxGeometry(
        0.52,
        0.09 * strokeWidth,
        0.16,
        2,
        0.03,
      ),
      pulseHalo: new RoundedBoxGeometry(
        0.72,
        0.2 * strokeWidth,
        0.22,
        2,
        0.05,
      ),
    }),
    [strokeWidth],
  );

  const materials = useMemo(
    () => ({
      trace: new MeshStandardMaterial({
        color: palette.traceMatte,
        roughness: 0.58,
        metalness: 0.3,
      }),
      pad: new MeshStandardMaterial({
        color: palette.padColor,
        roughness: 0.45,
        metalness: 0.42,
      }),
      via: new MeshStandardMaterial({
        color: palette.viaRim,
        emissive: palette.viaRim,
        emissiveIntensity: 0.8,
        roughness: 0.3,
        metalness: 0.5,
      }),
      pulseCore: new MeshStandardMaterial({
        color: palette.pulseCore,
        emissive: palette.pulseHalo,
        emissiveIntensity: 1.7,
        roughness: 0.15,
        metalness: 0.2,
      }),
      pulseHalo: new MeshBasicMaterial({
        color: palette.pulseHalo,
        transparent: true,
        opacity: 0.28,
      }),
    }),
    [palette],
  );

  useEffect(() => {
    return () => {
      geometries.traceUnit.dispose();
      geometries.chipPad.dispose();
      geometries.viaCylinder.dispose();
      geometries.pulseCore.dispose();
      geometries.pulseHalo.dispose();
    };
  }, [geometries]);

  useEffect(() => {
    return () => {
      materials.trace.dispose();
      materials.pad.dispose();
      materials.via.dispose();
      materials.pulseCore.dispose();
      materials.pulseHalo.dispose();
    };
  }, [materials]);

  const traceWidth = 0.13 * strokeWidth;

  return (
    <>
      <CircuitCameraRig aspectRatio={aspectRatio} />

      <ambientLight intensity={palette.ambientIntensity} color="#FFFFFF" />
      <directionalLight
        position={[8, 10, 12]}
        intensity={1.3}
        color="#FFFFFF"
      />
      <directionalLight
        position={[-8, -6, 9]}
        intensity={0.75}
        color={palette.viaRim}
      />

      <group rotation={[-boardTilt, 0, 0]}>
        {/* Raised matte orthogonal circuit trace segments */}
        {segments.map((seg) => (
          <mesh
            key={seg.id}
            geometry={geometries.traceUnit}
            material={materials.trace}
            position={[seg.midX, seg.midY, 0]}
            scale={
              seg.horizontal
                ? [seg.length, traceWidth, 1]
                : [traceWidth, seg.length, 1]
            }
          />
        ))}

        {/* Microprocessor pads & cylindrical vias */}
        {CHIP_PADS.map((pad) => (
          <mesh
            key={pad.id}
            geometry={geometries.chipPad}
            material={materials.pad}
            position={[pad.position[0], pad.position[1], 0.03]}
          />
        ))}
        {viaPoints.map((via) => (
          <mesh
            key={via.id}
            geometry={geometries.viaCylinder}
            material={materials.via}
            position={[via.x, via.y, 0.02]}
            rotation={[Math.PI / 2, 0, 0]}
          />
        ))}

        {/* 20 emissive light pulse slugs (2 staggered pulses per route) */}
        {CIRCUIT_ROUTES.flatMap((route) =>
          [0, 0.5].map((offsetT, slot) => {
            const t =
              (progress * speedMultiplier * route.pulseCycles +
                route.pulsePhase +
                offsetT) %
              1;
            const sample = samplePolyline(route.points, t);
            const fadeScale = 0.35 + 0.65 * Math.sin(t * Math.PI);

            return (
              <group
                key={`${route.id}-pulse-${slot}`}
                position={[sample.x, sample.y, 0.08]}
                rotation={[0, 0, sample.horizontal ? 0 : Math.PI / 2]}
                scale={[fadeScale, 1, 1]}
              >
                <mesh
                  geometry={geometries.pulseCore}
                  material={materials.pulseCore}
                />
                <mesh
                  geometry={geometries.pulseHalo}
                  material={materials.pulseHalo}
                />
              </group>
            );
          }),
        )}
      </group>
    </>
  );
};

export const CircuitTraceLightPulses4K: React.FC<
  CircuitTraceLightPulses4KProps
> = (props) => {
  const {
    themePreset = "dark-tech",
    aspectRatio = "16:9",
    backgroundColor = "#050B1A",
    primaryColor = "#162033",
    secondaryColor = "#38BDF8",
    accentColor = "#22D3EE",
    boardTilt = 0.16,
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
        boardTilt,
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
      boardTilt,
      speedMultiplier,
      strokeWidth,
    ],
  );

  const cameraConfig = useMemo(
    () => ({
      position: (aspectRatio === "9:16" ? [0, 0, 15.2] : [0, 0, 11.8]) as [
        number,
        number,
        number,
      ],
      fov: 38,
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
            id="circuit-bg-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={palette.bgTop} />
            <stop offset="100%" stopColor={palette.bgBottom} />
          </linearGradient>
          <radialGradient id="circuit-bg-glow" cx="50%" cy="50%" r="58%">
            <stop
              offset="0%"
              stopColor={palette.bgGlow}
              stopOpacity={palette.bgGlowOpacity}
            />
            <stop offset="100%" stopColor={palette.bgBottom} stopOpacity="0" />
          </radialGradient>
          <filter id="circuit-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed="69"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <pattern
            id="circuit-grain-pattern"
            width="256"
            height="256"
            patternUnits="userSpaceOnUse"
          >
            <rect
              width="256"
              height="256"
              filter="url(#circuit-grain)"
              opacity="0.012"
            />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#circuit-bg-grad)" />
        <rect width={width} height={height} fill="url(#circuit-bg-glow)" />
        <rect
          width={width}
          height={height}
          fill="url(#circuit-grain-pattern)"
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
        <CircuitScene
          frame={frame}
          durationInFrames={durationInFrames}
          palette={palette}
          boardTilt={boardTilt}
          speedMultiplier={speedMultiplier}
          strokeWidth={strokeWidth}
          aspectRatio={aspectRatio}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
