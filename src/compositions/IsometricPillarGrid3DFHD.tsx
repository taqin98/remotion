import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import {
  AbsoluteFill,
  interpolate,
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

export const isometricPillarGrid3DSchema = z.object({
  backgroundColor: z.string().default("#0F172A"),
  primaryColor: z.string().default("#1E293B"),
  secondaryColor: z.string().default("#334155"),
  accentColor: z.string().default("#38BDF8"),
  speedMultiplier: z.number().int().positive().default(1),
  waveAmplitude: z.number().positive().default(0.65),
  cameraZoom: z.number().positive().default(115),
});

export type IsometricPillarGrid3DProps = z.infer<
  typeof isometricPillarGrid3DSchema
>;

export const defaultIsometricPillarGrid3DProps: IsometricPillarGrid3DProps = {
  backgroundColor: "#0F172A",
  primaryColor: "#1E293B",
  secondaryColor: "#334155",
  accentColor: "#38BDF8",
  speedMultiplier: 1,
  waveAmplitude: 0.65,
  cameraZoom: 115,
};

export const isometricPillarGrid3DVariations: Record<
  string,
  IsometricPillarGrid3DProps
> = {
  midnightCyan: defaultIsometricPillarGrid3DProps,
  obsidianEmerald: {
    backgroundColor: "#090D16",
    primaryColor: "#181E29",
    secondaryColor: "#27303F",
    accentColor: "#34D399",
    speedMultiplier: 1,
    waveAmplitude: 0.65,
    cameraZoom: 115,
  },
  graphiteIndigo: {
    backgroundColor: "#0B0F19",
    primaryColor: "#1A202C",
    secondaryColor: "#2D3748",
    accentColor: "#818CF8",
    speedMultiplier: 1,
    waveAmplitude: 0.65,
    cameraZoom: 115,
  },
  monochromeSlate: {
    backgroundColor: "#0A0A0B",
    primaryColor: "#18181B",
    secondaryColor: "#27272A",
    accentColor: "#E4E4E7",
    speedMultiplier: 1,
    waveAmplitude: 0.65,
    cameraZoom: 115,
  },
};

const GRID_SIZE = 10;
const GRID_SPACING = 1.06;
const PILLAR_WIDTH = 0.9;
const PILLAR_HEIGHT = 2.2;
const CANVAS_DPR: [number, number] = [1, 2];
const CANVAS_GL = { antialias: true, alpha: false } as const;

interface PillarCoordinate {
  id: string;
  x: number;
  z: number;
  distance: number;
}

const IsometricCameraRig: React.FC<{ zoom: number }> = ({ zoom }) => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    camera.position.set(10, 10, 10);
    camera.zoom = zoom;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, zoom]);

  return null;
};

interface PillarCellProps {
  pillar: PillarCoordinate;
  loopPhase: number;
  waveAmplitude: number;
  pillarGeometry: RoundedBoxGeometry;
  capGeometry: RoundedBoxGeometry;
  pillarMaterial: MeshStandardMaterial;
  capMaterial: MeshStandardMaterial;
}

const PillarCell: React.FC<PillarCellProps> = ({
  pillar,
  loopPhase,
  waveAmplitude,
  pillarGeometry,
  capGeometry,
  pillarMaterial,
  capMaterial,
}) => {
  const wave = Math.sin(loopPhase - pillar.distance * 0.5);
  const posY = wave * waveAmplitude - 0.5;
  const scaleY = interpolate(wave, [-1, 1], [0.75, 1.35]);
  const capOffsetY = (PILLAR_HEIGHT * scaleY) / 2 - 0.01;

  return (
    <group position={[pillar.x, posY, pillar.z]}>
      <mesh
        geometry={pillarGeometry}
        material={pillarMaterial}
        scale={[1, scaleY, 1]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={capGeometry}
        material={capMaterial}
        position={[0, capOffsetY, 0]}
      />
    </group>
  );
};

interface IsometricGridSceneProps {
  frame: number;
  durationInFrames: number;
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  speedMultiplier: number;
  waveAmplitude: number;
  cameraZoom: number;
}

const IsometricGridScene: React.FC<IsometricGridSceneProps> = ({
  frame,
  durationInFrames,
  backgroundColor,
  primaryColor,
  secondaryColor,
  accentColor,
  speedMultiplier,
  waveAmplitude,
  cameraZoom,
}) => {
  const loopPhase =
    ((frame % durationInFrames) / durationInFrames) *
    Math.PI *
    2 *
    speedMultiplier;

  const pillars = useMemo<PillarCoordinate[]>(() => {
    const items: PillarCoordinate[] = [];
    const halfOffset = (GRID_SIZE - 1) / 2;
    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let col = 0; col < GRID_SIZE; col += 1) {
        const x = (col - halfOffset) * GRID_SPACING;
        const z = (row - halfOffset) * GRID_SPACING;
        items.push({
          id: `pillar-${row}-${col}`,
          x,
          z,
          distance: Math.hypot(x, z),
        });
      }
    }
    return items;
  }, []);

  const pillarGeometry = useMemo(
    () =>
      new RoundedBoxGeometry(
        PILLAR_WIDTH,
        PILLAR_HEIGHT,
        PILLAR_WIDTH,
        2,
        0.075,
      ),
    [],
  );

  const capGeometry = useMemo(
    () => new RoundedBoxGeometry(0.91, 0.06, 0.91, 1, 0.03),
    [],
  );

  const pillarMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.48,
        metalness: 0.22,
      }),
    [primaryColor],
  );

  const capMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: secondaryColor,
        emissive: accentColor,
        emissiveIntensity: 0.35,
        roughness: 0.35,
        metalness: 0.35,
      }),
    [secondaryColor, accentColor],
  );

  useEffect(() => {
    return () => {
      pillarGeometry.dispose();
      capGeometry.dispose();
    };
  }, [pillarGeometry, capGeometry]);

  useEffect(() => {
    return () => {
      pillarMaterial.dispose();
    };
  }, [pillarMaterial]);

  useEffect(() => {
    return () => {
      capMaterial.dispose();
    };
  }, [capMaterial]);

  return (
    <>
      <color attach="background" args={[backgroundColor]} />
      <fog attach="fog" args={[backgroundColor, 13.5, 26.5]} />
      <IsometricCameraRig zoom={cameraZoom} />

      {/* Architectural studio lighting with cyan rim highlights */}
      <ambientLight intensity={0.75} />
      <hemisphereLight args={["#94A3B8", backgroundColor, 0.55]} />
      <directionalLight
        position={[12, 18, 8]}
        intensity={1.35}
        color="#E2E8F0"
      />
      <directionalLight
        position={[-10, 8, -12]}
        intensity={1.15}
        color={accentColor}
      />
      <directionalLight
        position={[-12, 4, 10]}
        intensity={0.75}
        color={accentColor}
      />

      <group>
        {pillars.map((pillar) => (
          <PillarCell
            key={pillar.id}
            pillar={pillar}
            loopPhase={loopPhase}
            waveAmplitude={waveAmplitude}
            pillarGeometry={pillarGeometry}
            capGeometry={capGeometry}
            pillarMaterial={pillarMaterial}
            capMaterial={capMaterial}
          />
        ))}
      </group>
    </>
  );
};

export const IsometricPillarGrid3DFHD: React.FC<
  IsometricPillarGrid3DProps
> = ({
  backgroundColor = "#0F172A",
  primaryColor = "#1E293B",
  secondaryColor = "#334155",
  accentColor = "#38BDF8",
  speedMultiplier = 1,
  waveAmplitude = 0.65,
  cameraZoom = 115,
}) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const cameraConfig = useMemo(
    () => ({
      position: [10, 10, 10] as [number, number, number],
      zoom: cameraZoom,
      near: -50,
      far: 100,
    }),
    [cameraZoom],
  );

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <ThreeCanvas
        width={width}
        height={height}
        orthographic
        dpr={CANVAS_DPR}
        camera={cameraConfig}
        gl={CANVAS_GL}
      >
        <IsometricGridScene
          frame={frame}
          durationInFrames={durationInFrames}
          backgroundColor={backgroundColor}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          accentColor={accentColor}
          speedMultiplier={speedMultiplier}
          waveAmplitude={waveAmplitude}
          cameraZoom={cameraZoom}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
