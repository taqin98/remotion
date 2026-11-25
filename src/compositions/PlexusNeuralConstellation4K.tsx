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
  SphereGeometry,
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

export const plexusNeuralConstellation4KSchema = z.object({
  themePreset: themePresetSchema.default("dark-tech"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#050B1A"),
  primaryColor: z.string().default("#38BDF8"),
  secondaryColor: z.string().default("#6366F1"),
  accentColor: z.string().default("#22D3EE"),
  driftAmplitude: z.number().min(0.2).max(2).default(1),
  speedMultiplier: z.number().int().positive().default(1),
  strokeWidth: z.number().min(0.5).max(3).default(1),
});

export type PlexusNeuralConstellation4KProps = z.infer<
  typeof plexusNeuralConstellation4KSchema
>;

export const defaultPlexusNeuralConstellation4KProps: PlexusNeuralConstellation4KProps =
  {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "#050B1A",
    primaryColor: "#38BDF8",
    secondaryColor: "#6366F1",
    accentColor: "#22D3EE",
    driftAmplitude: 1,
    speedMultiplier: 1,
    strokeWidth: 1,
  };

export const plexusNeuralConstellation4KVariations: Record<
  ThemePreset,
  PlexusNeuralConstellation4KProps
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "#F1F5F9",
    primaryColor: "#2563EB",
    secondaryColor: "#0EA5E9",
    accentColor: "#1D4ED8",
    driftAmplitude: 1,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "dark-tech": defaultPlexusNeuralConstellation4KProps,
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "#FAF6F0",
    primaryColor: "#E07A5F",
    secondaryColor: "#D4A373",
    accentColor: "#C85A3F",
    driftAmplitude: 1,
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "#0A0A0D",
    primaryColor: "#D4AF37",
    secondaryColor: "#94A3B8",
    accentColor: "#FDE68A",
    driftAmplitude: 1,
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
  nodeCore: string;
  nodeHub: string;
  bloomColor: string;
  linePrimary: string;
  lineSecondary: string;
  pulseColor: string;
  lineOpacity: number;
  sheathOpacity: number;
  ambientIntensity: number;
}

const THEME_PALETTES: Record<ThemePreset, ThemePalette> = {
  "clean-corporate": {
    bgTop: "#F8FAFC",
    bgBottom: "#E2E8F0",
    bgGlow: "#3B82F6",
    bgGlowOpacity: 0.12,
    fogColor: "#EAF0F7",
    nodeCore: "#1E40AF",
    nodeHub: "#2563EB",
    bloomColor: "#60A5FA",
    linePrimary: "#3B82F6",
    lineSecondary: "#94A3B8",
    pulseColor: "#0EA5E9",
    lineOpacity: 0.42,
    sheathOpacity: 0.14,
    ambientIntensity: 0.95,
  },
  "dark-tech": {
    bgTop: "#071026",
    bgBottom: "#030714",
    bgGlow: "#38BDF8",
    bgGlowOpacity: 0.18,
    fogColor: "#050B1C",
    nodeCore: "#E0F2FE",
    nodeHub: "#38BDF8",
    bloomColor: "#22D3EE",
    linePrimary: "#38BDF8",
    lineSecondary: "#6366F1",
    pulseColor: "#A5F3FC",
    lineOpacity: 0.52,
    sheathOpacity: 0.18,
    ambientIntensity: 0.65,
  },
  "warm-minimalist": {
    bgTop: "#FDFBF7",
    bgBottom: "#EFE4D6",
    bgGlow: "#E07A5F",
    bgGlowOpacity: 0.11,
    fogColor: "#F5EEE3",
    nodeCore: "#9C4221",
    nodeHub: "#E07A5F",
    bloomColor: "#F2CC8F",
    linePrimary: "#D4A373",
    lineSecondary: "#CB997E",
    pulseColor: "#E07A5F",
    lineOpacity: 0.44,
    sheathOpacity: 0.14,
    ambientIntensity: 0.95,
  },
  "monochrome-luxury": {
    bgTop: "#121216",
    bgBottom: "#060608",
    bgGlow: "#D4AF37",
    bgGlowOpacity: 0.15,
    fogColor: "#09090C",
    nodeCore: "#FEF3C7",
    nodeHub: "#D4AF37",
    bloomColor: "#FDE68A",
    linePrimary: "#D4AF37",
    lineSecondary: "#71717A",
    pulseColor: "#FFFBEB",
    lineOpacity: 0.48,
    sheathOpacity: 0.16,
    ambientIntensity: 0.6,
  },
};

const resolveThemePalette = (
  props: PlexusNeuralConstellation4KProps,
): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  const hasCustomBg =
    props.backgroundColor !==
    defaultPlexusNeuralConstellation4KProps.backgroundColor;
  const hasCustomPrimary =
    props.primaryColor !== defaultPlexusNeuralConstellation4KProps.primaryColor;
  const hasCustomSecondary =
    props.secondaryColor !==
    defaultPlexusNeuralConstellation4KProps.secondaryColor;
  const hasCustomAccent =
    props.accentColor !== defaultPlexusNeuralConstellation4KProps.accentColor;

  return {
    ...base,
    bgTop: hasCustomBg ? props.backgroundColor : base.bgTop,
    fogColor: hasCustomBg ? props.backgroundColor : base.fogColor,
    nodeHub: hasCustomPrimary ? props.primaryColor : base.nodeHub,
    linePrimary: hasCustomPrimary ? props.primaryColor : base.linePrimary,
    lineSecondary: hasCustomSecondary
      ? props.secondaryColor
      : base.lineSecondary,
    bloomColor: hasCustomAccent ? props.accentColor : base.bloomColor,
    pulseColor: hasCustomAccent ? props.accentColor : base.pulseColor,
  };
};

const NODE_COUNT = 80;
const TARGET_CONNECTION_COUNT = 135;
const PULSE_COUNT = 24;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

interface NeuralNodeSpec {
  id: number;
  isHub: boolean;
  basePosition: [number, number, number];
  orbitRadius: [number, number, number];
  phase: number;
  pulseCycles: number;
  baseScale: number;
}

interface NeuralConnectionSpec {
  id: string;
  a: number;
  b: number;
  isPrimary: boolean;
}

interface SynapsePulseSpec {
  id: string;
  connectionIndex: number;
  cycles: number;
  phase: number;
}

const buildNeuralNodes = (): NeuralNodeSpec[] => {
  const nodes: NeuralNodeSpec[] = [];
  for (let i = 0; i < NODE_COUNT; i += 1) {
    const t = (i + 0.5) / NODE_COUNT;
    const yNorm = 1 - 2 * t;
    const radiusAtY = Math.sqrt(Math.max(0, 1 - yNorm * yNorm));
    const theta = i * GOLDEN_ANGLE;
    const shell = 0.52 + 0.48 * Math.abs(Math.sin(i * 1.37 + 0.4));

    const bx = Math.cos(theta) * radiusAtY * 6.7 * shell;
    const by = yNorm * 3.55 * shell + Math.sin(i * 0.91) * 0.28;
    const bz = Math.sin(theta) * radiusAtY * 3.1 * shell - 0.45;

    const isHub = i % 5 === 0;
    nodes.push({
      id: i,
      isHub,
      basePosition: [bx, by, bz],
      orbitRadius: [
        0.18 + (i % 4) * 0.06,
        0.16 + ((i + 1) % 3) * 0.06,
        0.14 + ((i + 2) % 3) * 0.05,
      ],
      phase: (i * 0.73) % (Math.PI * 2),
      pulseCycles: isHub ? 2 : 1,
      baseScale: isHub ? 1.35 : 0.85 + (i % 3) * 0.12,
    });
  }
  return nodes;
};

const buildNeuralConnections = (
  nodes: readonly NeuralNodeSpec[],
): NeuralConnectionSpec[] => {
  interface CandidateEdge {
    a: number;
    b: number;
    dist: number;
    isPrimary: boolean;
  }

  const edgeMap = new Map<string, CandidateEdge>();

  for (let i = 0; i < nodes.length; i += 1) {
    const na = nodes[i];
    const neighbors: Array<{ idx: number; dist: number }> = [];

    for (let j = 0; j < nodes.length; j += 1) {
      if (i === j) {
        continue;
      }
      const nb = nodes[j];
      const dx = na.basePosition[0] - nb.basePosition[0];
      const dy = na.basePosition[1] - nb.basePosition[1];
      const dz = na.basePosition[2] - nb.basePosition[2];
      neighbors.push({ idx: j, dist: Math.hypot(dx, dy, dz) });
    }

    neighbors.sort((u, v) => u.dist - v.dist);
    const linksPerNode = na.isHub ? 4 : 3;

    for (let k = 0; k < linksPerNode; k += 1) {
      const target = neighbors[k];
      if (!target) {
        break;
      }
      const a = Math.min(i, target.idx);
      const b = Math.max(i, target.idx);
      const key = `${a}-${b}`;
      if (!edgeMap.has(key)) {
        edgeMap.set(key, {
          a,
          b,
          dist: target.dist,
          isPrimary: nodes[a].isHub || nodes[b].isHub,
        });
      }
    }
  }

  return Array.from(edgeMap.values())
    .sort((u, v) => {
      if (u.isPrimary !== v.isPrimary) {
        return u.isPrimary ? -1 : 1;
      }
      return u.dist - v.dist;
    })
    .slice(0, TARGET_CONNECTION_COUNT)
    .map((edge) => ({
      id: `link-${edge.a}-${edge.b}`,
      a: edge.a,
      b: edge.b,
      isPrimary: edge.isPrimary,
    }));
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const CANVAS_GL = { antialias: true, alpha: true } as const;

const PlexusCameraRig: React.FC<{ aspectRatio: AspectRatio }> = ({
  aspectRatio,
}) => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    if (aspectRatio === "9:16") {
      camera.position.set(0, 0, 14.5);
    } else {
      camera.position.set(0, 0, 11.4);
    }
    camera.lookAt(0, 0, -0.4);
    camera.updateProjectionMatrix();
  }, [camera, aspectRatio]);

  return null;
};

interface PlexusSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  driftAmplitude: number;
  speedMultiplier: number;
  strokeWidth: number;
  aspectRatio: AspectRatio;
}

const PlexusScene: React.FC<PlexusSceneProps> = ({
  frame,
  durationInFrames,
  palette,
  driftAmplitude,
  speedMultiplier,
  strokeWidth,
  aspectRatio,
}) => {
  const progress = (frame % durationInFrames) / durationInFrames;
  const loopAngle = progress * Math.PI * 2 * speedMultiplier;

  const { nodes, connections, pulses } = useMemo(() => {
    const builtNodes = buildNeuralNodes();
    const builtConnections = buildNeuralConnections(builtNodes);
    const primaryIndices = builtConnections
      .map((c, idx) => (c.isPrimary ? idx : -1))
      .filter((idx) => idx >= 0);

    const builtPulses: SynapsePulseSpec[] = [];
    for (let i = 0; i < PULSE_COUNT; i += 1) {
      const connIdx =
        primaryIndices.length > 0
          ? primaryIndices[(i * 3) % primaryIndices.length]
          : i % builtConnections.length;
      builtPulses.push({
        id: `pulse-${i}`,
        connectionIndex: connIdx,
        cycles: i % 2 === 0 ? 1 : 2,
        phase: (i * 0.52) % (Math.PI * 2),
      });
    }

    return {
      nodes: builtNodes,
      connections: builtConnections,
      pulses: builtPulses,
    };
  }, []);

  const geometries = useMemo(
    () => ({
      coreSphere: new SphereGeometry(0.068, 14, 14),
      innerHalo: new SphereGeometry(0.145, 14, 14),
      outerAura: new SphereGeometry(0.28, 12, 12),
      linkUnit: new BoxGeometry(1, 1, 1),
      pulseSphere: new SphereGeometry(0.044, 12, 12),
    }),
    [],
  );

  const materials = useMemo(
    () => ({
      core: new MeshStandardMaterial({
        color: palette.nodeCore,
        emissive: palette.nodeCore,
        emissiveIntensity: 1.4,
        roughness: 0.2,
        metalness: 0.1,
      }),
      hubCore: new MeshStandardMaterial({
        color: palette.nodeCore,
        emissive: palette.nodeHub,
        emissiveIntensity: 1.85,
        roughness: 0.18,
        metalness: 0.1,
      }),
      innerHalo: new MeshBasicMaterial({
        color: palette.bloomColor,
        transparent: true,
        opacity: 0.36,
      }),
      outerAura: new MeshBasicMaterial({
        color: palette.nodeHub,
        transparent: true,
        opacity: 0.11,
      }),
      linePrimary: new MeshBasicMaterial({
        color: palette.linePrimary,
        transparent: true,
        opacity: palette.lineOpacity,
      }),
      lineSecondary: new MeshBasicMaterial({
        color: palette.lineSecondary,
        transparent: true,
        opacity: palette.lineOpacity * 0.65,
      }),
      lineSheath: new MeshBasicMaterial({
        color: palette.bloomColor,
        transparent: true,
        opacity: palette.sheathOpacity,
      }),
      pulse: new MeshBasicMaterial({
        color: palette.pulseColor,
        transparent: true,
        opacity: 0.92,
      }),
    }),
    [palette],
  );

  useEffect(() => {
    return () => {
      geometries.coreSphere.dispose();
      geometries.innerHalo.dispose();
      geometries.outerAura.dispose();
      geometries.linkUnit.dispose();
      geometries.pulseSphere.dispose();
    };
  }, [geometries]);

  useEffect(() => {
    return () => {
      materials.core.dispose();
      materials.hubCore.dispose();
      materials.innerHalo.dispose();
      materials.outerAura.dispose();
      materials.linePrimary.dispose();
      materials.lineSecondary.dispose();
      materials.lineSheath.dispose();
      materials.pulse.dispose();
    };
  }, [materials]);

  const aspectXScale = aspectRatio === "9:16" ? 0.56 : 1;
  const aspectYScale = aspectRatio === "9:16" ? 1.45 : 1;

  const liveNodePositions = nodes.map((node): [number, number, number] => {
    const p = loopAngle + node.phase;
    const x =
      node.basePosition[0] * aspectXScale +
      Math.cos(p) * node.orbitRadius[0] * driftAmplitude;
    const y =
      node.basePosition[1] * aspectYScale +
      Math.sin(p) * node.orbitRadius[1] * driftAmplitude;
    const z =
      node.basePosition[2] +
      Math.sin(p + 0.9) * node.orbitRadius[2] * driftAmplitude;
    return [x, y, z];
  });

  const lineThickness = 0.016 * strokeWidth;
  const sheathThickness = 0.046 * strokeWidth;

  const cloudRotY = Math.sin(loopAngle) * 0.28;
  const cloudRotX = Math.cos(loopAngle) * 0.12;
  const cloudRotZ = Math.sin(loopAngle * 2) * 0.035;

  return (
    <>
      <fog attach="fog" args={[palette.fogColor, 11, 24]} />
      <PlexusCameraRig aspectRatio={aspectRatio} />

      <ambientLight intensity={palette.ambientIntensity} color="#FFFFFF" />
      <directionalLight position={[6, 8, 10]} intensity={0.85} color={palette.nodeHub} />
      <directionalLight position={[-8, -6, 8]} intensity={0.55} color={palette.lineSecondary} />

      <group rotation={[cloudRotX, cloudRotY, cloudRotZ]}>
        {/* Dynamic connecting neural lines */}
        {connections.map((conn) => {
          const posA = liveNodePositions[conn.a];
          const posB = liveNodePositions[conn.b];
          const dx = posB[0] - posA[0];
          const dy = posB[1] - posA[1];
          const dz = posB[2] - posA[2];
          const dist = Math.hypot(dx, dy, dz) || 0.001;
          const midX = (posA[0] + posB[0]) * 0.5;
          const midY = (posA[1] + posB[1]) * 0.5;
          const midZ = (posA[2] + posB[2]) * 0.5;
          const ry = Math.atan2(-dz, dx);
          const rz = Math.asin(clamp(dy / dist, -1, 1));
          const thickness = conn.isPrimary
            ? lineThickness
            : lineThickness * 0.72;

          return (
            <group
              key={conn.id}
              position={[midX, midY, midZ]}
              rotation={[0, ry, rz]}
            >
              <mesh
                geometry={geometries.linkUnit}
                material={
                  conn.isPrimary ? materials.linePrimary : materials.lineSecondary
                }
                scale={[dist, thickness, thickness]}
              />
              {conn.isPrimary ? (
                <mesh
                  geometry={geometries.linkUnit}
                  material={materials.lineSheath}
                  scale={[dist, sheathThickness, sheathThickness]}
                />
              ) : null}
            </group>
          );
        })}

        {/* 80 glowing neural nodes with multi-layer mipmap bloom halos */}
        {nodes.map((node, index) => {
          const pos = liveNodePositions[index];
          const glowPulse =
            1 + Math.sin(loopAngle * node.pulseCycles + node.phase) * 0.22;
          const coreScale = node.baseScale;
          const haloScale = node.baseScale * glowPulse;
          const auraScale = node.baseScale * (0.9 + glowPulse * 0.22);

          return (
            <group key={node.id} position={pos}>
              <mesh
                geometry={geometries.coreSphere}
                material={node.isHub ? materials.hubCore : materials.core}
                scale={[coreScale, coreScale, coreScale]}
              />
              <mesh
                geometry={geometries.innerHalo}
                material={materials.innerHalo}
                scale={[haloScale, haloScale, haloScale]}
              />
              {node.isHub ? (
                <mesh
                  geometry={geometries.outerAura}
                  material={materials.outerAura}
                  scale={[auraScale, auraScale, auraScale]}
                />
              ) : null}
            </group>
          );
        })}

        {/* Traveling synapse light pulses */}
        {pulses.map((pulse) => {
          const conn = connections[pulse.connectionIndex];
          if (!conn) {
            return null;
          }
          const posA = liveNodePositions[conn.a];
          const posB = liveNodePositions[conn.b];
          const t =
            0.5 + 0.5 * Math.sin(loopAngle * pulse.cycles + pulse.phase);
          const px = posA[0] + (posB[0] - posA[0]) * t;
          const py = posA[1] + (posB[1] - posA[1]) * t;
          const pz = posA[2] + (posB[2] - posA[2]) * t;

          return (
            <mesh
              key={pulse.id}
              geometry={geometries.pulseSphere}
              material={materials.pulse}
              position={[px, py, pz]}
            />
          );
        })}
      </group>
    </>
  );
};

export const PlexusNeuralConstellation4K: React.FC<
  PlexusNeuralConstellation4KProps
> = (props) => {
  const {
    themePreset = "dark-tech",
    aspectRatio = "16:9",
    backgroundColor = "#050B1A",
    primaryColor = "#38BDF8",
    secondaryColor = "#6366F1",
    accentColor = "#22D3EE",
    driftAmplitude = 1,
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
        driftAmplitude,
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
      driftAmplitude,
      speedMultiplier,
      strokeWidth,
    ],
  );

  const cameraConfig = useMemo(
    () => ({
      position: (aspectRatio === "9:16" ? [0, 0, 14.5] : [0, 0, 11.4]) as [
        number,
        number,
        number,
      ],
      fov: 42,
      near: 0.1,
      far: 100,
    }),
    [aspectRatio],
  );

  return (
    <AbsoluteFill style={{ backgroundColor: palette.bgTop, overflow: "hidden" }}>
      {/* Deep navy gradient backdrop with soft neural glow & tiled grain */}
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
            id="plexus-bg-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={palette.bgTop} />
            <stop offset="100%" stopColor={palette.bgBottom} />
          </linearGradient>
          <radialGradient id="plexus-bg-glow" cx="50%" cy="50%" r="58%">
            <stop
              offset="0%"
              stopColor={palette.bgGlow}
              stopOpacity={palette.bgGlowOpacity}
            />
            <stop offset="100%" stopColor={palette.bgBottom} stopOpacity="0" />
          </radialGradient>
          <filter
            id="plexus-grain"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed="61"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <pattern
            id="plexus-grain-pattern"
            width="256"
            height="256"
            patternUnits="userSpaceOnUse"
          >
            <rect
              width="256"
              height="256"
              filter="url(#plexus-grain)"
              opacity="0.012"
            />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#plexus-bg-grad)" />
        <rect width={width} height={height} fill="url(#plexus-bg-glow)" />
        <rect
          width={width}
          height={height}
          fill="url(#plexus-grain-pattern)"
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
        <PlexusScene
          frame={frame}
          durationInFrames={durationInFrames}
          palette={palette}
          driftAmplitude={driftAmplitude}
          speedMultiplier={speedMultiplier}
          strokeWidth={strokeWidth}
          aspectRatio={aspectRatio}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
