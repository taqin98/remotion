import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { setConsoleFunction } from "three";
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

export const corporateGeometry3DSchema = z.object({
  primaryColor: z.string().default("#1E293B"),
  accentColor: z.string().default("#3B82F6"),
  backgroundColor: z.string().default("#F8FAFC"),
  speed: z.number().int().positive().default(1),
  cameraZoom: z.number().min(0.5).max(2.5).default(1),
});

export type CorporateGeometry3DProps = z.infer<
  typeof corporateGeometry3DSchema
>;

export const defaultCorporateGeometry3DProps: CorporateGeometry3DProps = {
  primaryColor: "#1E293B",
  accentColor: "#3B82F6",
  backgroundColor: "#F8FAFC",
  speed: 1,
  cameraZoom: 1,
};

export const corporateGeometry3DVariations: Record<
  string,
  CorporateGeometry3DProps
> = {
  corporateNavyBlue: defaultCorporateGeometry3DProps,
  emeraldSlate: {
    primaryColor: "#0F172A",
    accentColor: "#10B981",
    backgroundColor: "#F8FAFC",
    speed: 1,
    cameraZoom: 1,
  },
  indigoMinimal: {
    primaryColor: "#1E1B4B",
    accentColor: "#6366F1",
    backgroundColor: "#F1F5F9",
    speed: 1,
    cameraZoom: 1,
  },
  warmStoneAmber: {
    primaryColor: "#292524",
    accentColor: "#D97706",
    backgroundColor: "#FAF8F5",
    speed: 1,
    cameraZoom: 1,
  },
};

type PrimitiveKind = "icosahedron" | "torus" | "roundedCube" | "cylinder";
type ColorRole = "primary" | "accent" | "neutral";

const CANVAS_DPR: [number, number] = [1, 2];
const CANVAS_GL = { antialias: true, alpha: false } as const;
const CAMERA_CONFIG = {
  position: [0, 0, 12] as [number, number, number],
  fov: 42,
  near: 0.1,
  far: 100,
};

interface PrimitiveSpec {
  id: string;
  kind: PrimitiveKind;
  colorRole: ColorRole;
  basePosition: [number, number, number];
  baseRotation: [number, number, number];
  scale: number | [number, number, number];
  floatAmplitude: [number, number, number];
  rotationAmplitude: [number, number, number];
  fullTurns: [number, number, number];
  phase: number;
  roughness: number;
  metalness: number;
}

// 14 perimeter primitives keeping center [-4.5..4.5, -2.2..2.2] clean for slide content
const PERIMETER_PRIMITIVES: readonly PrimitiveSpec[] = [
  // Top-left cluster
  {
    id: "tl-icosa",
    kind: "icosahedron",
    colorRole: "accent",
    basePosition: [-6.45, 3.15, -0.6],
    baseRotation: [0.35, 0.4, 0.1],
    scale: 0.92,
    floatAmplitude: [0.16, 0.24, 0.12],
    rotationAmplitude: [0.18, 0.22, 0.14],
    fullTurns: [0, 1, 0],
    phase: 0.15,
    roughness: 0.45,
    metalness: 0.12,
  },
  {
    id: "tl-torus",
    kind: "torus",
    colorRole: "primary",
    basePosition: [-5.1, 3.65, -1.8],
    baseRotation: [0.75, 0.45, 0.2],
    scale: 0.85,
    floatAmplitude: [0.12, 0.18, 0.1],
    rotationAmplitude: [0.22, 0.16, 0.18],
    fullTurns: [0, 0, -1],
    phase: 1.1,
    roughness: 0.5,
    metalness: 0.14,
  },
  {
    id: "left-cube",
    kind: "roundedCube",
    colorRole: "neutral",
    basePosition: [-6.95, 0.65, -1.2],
    baseRotation: [0.55, 0.8, 0.25],
    scale: 1.05,
    floatAmplitude: [0.14, 0.26, 0.1],
    rotationAmplitude: [0.2, 0.24, 0.15],
    fullTurns: [1, 0, 0],
    phase: 2.0,
    roughness: 0.56,
    metalness: 0.08,
  },
  {
    id: "left-rod",
    kind: "cylinder",
    colorRole: "accent",
    basePosition: [-5.85, -1.1, -0.35],
    baseRotation: [0.2, 0.3, 0.95],
    scale: [0.11, 1.85, 0.11],
    floatAmplitude: [0.15, 0.2, 0.08],
    rotationAmplitude: [0.14, 0.16, 0.22],
    fullTurns: [0, 0, 0],
    phase: 2.8,
    roughness: 0.42,
    metalness: 0.15,
  },

  // Bottom-left cluster
  {
    id: "bl-cube",
    kind: "roundedCube",
    colorRole: "primary",
    basePosition: [-6.25, -3.05, -0.45],
    baseRotation: [0.4, 0.65, -0.3],
    scale: 1.12,
    floatAmplitude: [0.18, 0.22, 0.12],
    rotationAmplitude: [0.22, 0.2, 0.18],
    fullTurns: [0, 1, 0],
    phase: 0.75,
    roughness: 0.48,
    metalness: 0.12,
  },
  {
    id: "bl-icosa",
    kind: "icosahedron",
    colorRole: "neutral",
    basePosition: [-4.35, -3.65, -1.9],
    baseRotation: [0.15, 0.9, 0.4],
    scale: 0.68,
    floatAmplitude: [0.14, 0.18, 0.12],
    rotationAmplitude: [0.25, 0.2, 0.15],
    fullTurns: [-1, 0, 0],
    phase: 1.9,
    roughness: 0.55,
    metalness: 0.08,
  },

  // Top & bottom subtle perimeter anchors
  {
    id: "top-rod",
    kind: "cylinder",
    colorRole: "neutral",
    basePosition: [-0.9, 3.85, -2.4],
    baseRotation: [0.18, 0.25, 1.38],
    scale: [0.09, 1.9, 0.09],
    floatAmplitude: [0.22, 0.12, 0.08],
    rotationAmplitude: [0.1, 0.14, 0.12],
    fullTurns: [0, 0, 0],
    phase: 3.4,
    roughness: 0.58,
    metalness: 0.08,
  },
  {
    id: "bottom-torus",
    kind: "torus",
    colorRole: "accent",
    basePosition: [1.4, -3.8, -2.1],
    baseRotation: [1.1, -0.35, 0.25],
    scale: 0.78,
    floatAmplitude: [0.2, 0.14, 0.1],
    rotationAmplitude: [0.18, 0.22, 0.14],
    fullTurns: [0, 1, 0],
    phase: 4.1,
    roughness: 0.44,
    metalness: 0.14,
  },

  // Top-right cluster
  {
    id: "tr-cube",
    kind: "roundedCube",
    colorRole: "accent",
    basePosition: [5.55, 3.35, -0.8],
    baseRotation: [0.6, -0.45, 0.2],
    scale: 0.96,
    floatAmplitude: [0.18, 0.2, 0.1],
    rotationAmplitude: [0.2, 0.24, 0.16],
    fullTurns: [0, -1, 0],
    phase: 0.55,
    roughness: 0.45,
    metalness: 0.12,
  },
  {
    id: "tr-rod",
    kind: "cylinder",
    colorRole: "primary",
    basePosition: [6.85, 2.55, -0.3],
    baseRotation: [0.35, -0.2, -0.72],
    scale: [0.12, 2.0, 0.12],
    floatAmplitude: [0.14, 0.22, 0.08],
    rotationAmplitude: [0.12, 0.16, 0.18],
    fullTurns: [0, 0, 0],
    phase: 2.35,
    roughness: 0.46,
    metalness: 0.14,
  },

  // Right edge & bottom-right cluster
  {
    id: "right-torus",
    kind: "torus",
    colorRole: "primary",
    basePosition: [6.75, 0.1, -0.9],
    baseRotation: [0.5, -0.75, 0.15],
    scale: 1.02,
    floatAmplitude: [0.16, 0.26, 0.12],
    rotationAmplitude: [0.22, 0.18, 0.2],
    fullTurns: [1, 0, 0],
    phase: 1.55,
    roughness: 0.48,
    metalness: 0.15,
  },
  {
    id: "right-icosa",
    kind: "icosahedron",
    colorRole: "neutral",
    basePosition: [5.95, -1.65, -1.65],
    baseRotation: [-0.25, 0.55, 0.3],
    scale: 0.72,
    floatAmplitude: [0.14, 0.22, 0.1],
    rotationAmplitude: [0.24, 0.22, 0.18],
    fullTurns: [0, 1, 0],
    phase: 3.0,
    roughness: 0.56,
    metalness: 0.08,
  },
  {
    id: "br-icosa",
    kind: "icosahedron",
    colorRole: "accent",
    basePosition: [6.3, -3.1, -0.4],
    baseRotation: [0.45, -0.6, 0.2],
    scale: 0.95,
    floatAmplitude: [0.18, 0.24, 0.12],
    rotationAmplitude: [0.2, 0.24, 0.16],
    fullTurns: [0, -1, 0],
    phase: 4.6,
    roughness: 0.42,
    metalness: 0.14,
  },
  {
    id: "br-cube",
    kind: "roundedCube",
    colorRole: "primary",
    basePosition: [4.6, -3.55, -1.5],
    baseRotation: [-0.35, 0.75, 0.15],
    scale: 0.76,
    floatAmplitude: [0.15, 0.18, 0.1],
    rotationAmplitude: [0.18, 0.22, 0.16],
    fullTurns: [0, 0, 1],
    phase: 5.2,
    roughness: 0.52,
    metalness: 0.1,
  },
];

const resolveColor = (
  role: ColorRole,
  primaryColor: string,
  accentColor: string,
): string => {
  if (role === "primary") {
    return primaryColor;
  }
  if (role === "accent") {
    return accentColor;
  }
  return "#CBD5E1";
};

const CameraZoomRig: React.FC<{ zoom: number }> = ({ zoom }) => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
  }, [camera, zoom]);

  return null;
};

interface GeometricPrimitiveMeshProps {
  spec: PrimitiveSpec;
  color: string;
  loopAngle: number;
  roundedBoxGeometry: RoundedBoxGeometry;
}

const GeometricPrimitiveMesh: React.FC<GeometricPrimitiveMeshProps> = ({
  spec,
  color,
  loopAngle,
  roundedBoxGeometry,
}) => {
  const phaseAngle = loopAngle + spec.phase;
  const sinVal = Math.sin(phaseAngle);
  const cosVal = Math.cos(phaseAngle);

  const posX =
    spec.basePosition[0] +
    interpolate(
      sinVal,
      [-1, 1],
      [-spec.floatAmplitude[0], spec.floatAmplitude[0]],
    );
  const posY =
    spec.basePosition[1] +
    interpolate(
      cosVal,
      [-1, 1],
      [-spec.floatAmplitude[1], spec.floatAmplitude[1]],
    );
  const posZ =
    spec.basePosition[2] +
    interpolate(
      Math.sin(phaseAngle + 0.8),
      [-1, 1],
      [-spec.floatAmplitude[2], spec.floatAmplitude[2]],
    );

  const rotX =
    spec.baseRotation[0] +
    loopAngle * spec.fullTurns[0] +
    interpolate(
      sinVal,
      [-1, 1],
      [-spec.rotationAmplitude[0], spec.rotationAmplitude[0]],
    );
  const rotY =
    spec.baseRotation[1] +
    loopAngle * spec.fullTurns[1] +
    interpolate(
      cosVal,
      [-1, 1],
      [-spec.rotationAmplitude[1], spec.rotationAmplitude[1]],
    );
  const rotZ =
    spec.baseRotation[2] +
    loopAngle * spec.fullTurns[2] +
    interpolate(
      Math.sin(phaseAngle * 2),
      [-1, 1],
      [-spec.rotationAmplitude[2], spec.rotationAmplitude[2]],
    );

  const breathingScale = interpolate(sinVal, [-1, 1], [0.97, 1.03]);
  const meshScale: [number, number, number] = Array.isArray(spec.scale)
    ? [
        spec.scale[0] * breathingScale,
        spec.scale[1] * breathingScale,
        spec.scale[2] * breathingScale,
      ]
    : [
        spec.scale * breathingScale,
        spec.scale * breathingScale,
        spec.scale * breathingScale,
      ];

  return (
    <mesh
      position={[posX, posY, posZ]}
      rotation={[rotX, rotY, rotZ]}
      scale={meshScale}
      geometry={spec.kind === "roundedCube" ? roundedBoxGeometry : undefined}
      castShadow
      receiveShadow
    >
      {spec.kind === "icosahedron" && <icosahedronGeometry args={[0.72, 0]} />}
      {spec.kind === "torus" && <torusGeometry args={[0.68, 0.16, 16, 48]} />}
      {spec.kind === "cylinder" && (
        <cylinderGeometry args={[0.5, 0.5, 1, 20]} />
      )}
      <meshStandardMaterial
        color={color}
        roughness={spec.roughness}
        metalness={spec.metalness}
        flatShading={spec.kind === "icosahedron"}
      />
    </mesh>
  );
};

interface CorporateSceneProps {
  frame: number;
  durationInFrames: number;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  speed: number;
  cameraZoom: number;
}

const CorporateScene: React.FC<CorporateSceneProps> = ({
  frame,
  durationInFrames,
  primaryColor,
  accentColor,
  backgroundColor,
  speed,
  cameraZoom,
}) => {
  const normalizedProgress = (frame % durationInFrames) / durationInFrames;
  const loopAngle = normalizedProgress * Math.PI * 2 * speed;

  const roundedBoxGeometry = useMemo(
    () => new RoundedBoxGeometry(1, 1, 1, 3, 0.16),
    [],
  );

  useEffect(() => {
    return () => {
      roundedBoxGeometry.dispose();
    };
  }, [roundedBoxGeometry]);

  // Subtle ambient drift on the entire perimeter rig while maintaining exact loop closure
  const rigTiltX = interpolate(Math.sin(loopAngle), [-1, 1], [-0.018, 0.018]);
  const rigTiltY = interpolate(Math.cos(loopAngle), [-1, 1], [-0.024, 0.024]);

  return (
    <>
      <color attach="background" args={[backgroundColor]} />
      <fog attach="fog" args={[backgroundColor, 14, 24]} />
      <CameraZoomRig zoom={cameraZoom} />

      {/* Soft corporate studio lighting */}
      <ambientLight intensity={1.25} />
      <hemisphereLight args={["#FFFFFF", "#E2E8F0", 0.65]} />
      <directionalLight position={[8, 10, 10]} intensity={1.35} color="#FFFFFF" />
      <directionalLight
        position={[-9, -6, 6]}
        intensity={0.55}
        color={accentColor}
      />
      <directionalLight
        position={[0, 8, -8]}
        intensity={0.45}
        color="#FFFFFF"
      />

      <group rotation={[rigTiltX, rigTiltY, 0]}>
        {PERIMETER_PRIMITIVES.map((spec) => (
          <GeometricPrimitiveMesh
            key={spec.id}
            spec={spec}
            color={resolveColor(spec.colorRole, primaryColor, accentColor)}
            loopAngle={loopAngle}
            roundedBoxGeometry={roundedBoxGeometry}
          />
        ))}
      </group>
    </>
  );
};

export const CorporateGeometry3DBgFHD: React.FC<CorporateGeometry3DProps> = ({
  primaryColor = "#1E293B",
  accentColor = "#3B82F6",
  backgroundColor = "#F8FAFC",
  speed = 1,
  cameraZoom = 1,
}) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <ThreeCanvas
        width={width}
        height={height}
        dpr={CANVAS_DPR}
        camera={CAMERA_CONFIG}
        gl={CANVAS_GL}
      >
        <CorporateScene
          frame={frame}
          durationInFrames={durationInFrames}
          primaryColor={primaryColor}
          accentColor={accentColor}
          backgroundColor={backgroundColor}
          speed={speed}
          cameraZoom={cameraZoom}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
