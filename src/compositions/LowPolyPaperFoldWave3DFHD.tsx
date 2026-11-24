import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
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

export const lowPolyPaperFoldWave3DSchema = z.object({
  backgroundColor: z.string().default("#FAF8F5"),
  primaryColor: z.string().default("#E07A5F"),
  secondaryColor: z.string().default("#81B29A"),
  accentColor: z.string().default("#F2CC8F"),
  foldAmplitude: z.number().min(0.1).max(2.5).default(0.65),
  speedMultiplier: z.number().int().positive().default(1),
});

export type LowPolyPaperFoldWave3DProps = z.infer<
  typeof lowPolyPaperFoldWave3DSchema
>;

export const defaultLowPolyPaperFoldWave3DProps: LowPolyPaperFoldWave3DProps = {
  backgroundColor: "#FAF8F5",
  primaryColor: "#E07A5F",
  secondaryColor: "#81B29A",
  accentColor: "#F2CC8F",
  foldAmplitude: 0.65,
  speedMultiplier: 1,
};

export const lowPolyPaperFoldWave3DVariations: Record<
  string,
  LowPolyPaperFoldWave3DProps
> = {
  editorialTerracottaSage: defaultLowPolyPaperFoldWave3DProps,
  linenLavender: {
    backgroundColor: "#F9F7FC",
    primaryColor: "#C49BBB",
    secondaryColor: "#8FA8C8",
    accentColor: "#F3D9B1",
    foldAmplitude: 0.65,
    speedMultiplier: 1,
  },
  sandstoneEucalyptus: {
    backgroundColor: "#FBF8F3",
    primaryColor: "#D4A373",
    secondaryColor: "#84A98C",
    accentColor: "#FAEDCD",
    foldAmplitude: 0.6,
    speedMultiplier: 1,
  },
  alabasterMist: {
    backgroundColor: "#F8FAFC",
    primaryColor: "#CBD5E1",
    secondaryColor: "#93C5FD",
    accentColor: "#E2E8F0",
    foldAmplitude: 0.55,
    speedMultiplier: 1,
  },
};

const CANVAS_DPR: [number, number] = [1, 2];
const CANVAS_GL = { antialias: true, alpha: false } as const;
const CAMERA_CONFIG = {
  position: [0, -0.25, 10.5] as [number, number, number],
  fov: 40,
  near: 0.1,
  far: 100,
};

const applyPaperFoldDisplacement = (
  geometry: PlaneGeometry,
  initialPositions: Float32Array,
  loopAngle: number,
  foldAmplitude: number,
): void => {
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const offset = i * 3;
    const baseX = initialPositions[offset];
    const baseY = initialPositions[offset + 1];
    const baseZ = initialPositions[offset + 2];

    const wave1 = Math.sin(loopAngle + baseX * 0.36 + baseY * 0.28) * 0.42;
    const wave2 = Math.cos(loopAngle - baseX * 0.24 + baseY * 0.42) * 0.28;
    const wave3 = Math.sin(loopAngle + (baseX - baseY) * 0.48) * 0.16;
    const nextZ = baseZ + (wave1 + wave2 + wave3) * foldAmplitude;

    position.setXYZ(i, baseX, baseY, nextZ);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
};

interface PaperFoldSceneProps {
  frame: number;
  durationInFrames: number;
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  foldAmplitude: number;
  speedMultiplier: number;
}

const PaperFoldScene: React.FC<PaperFoldSceneProps> = ({
  frame,
  durationInFrames,
  backgroundColor,
  primaryColor,
  secondaryColor,
  accentColor,
  foldAmplitude,
  speedMultiplier,
}) => {
  const loopAngle =
    ((frame % durationInFrames) / durationInFrames) *
    Math.PI *
    2 *
    speedMultiplier;

  const { planeGeometry, initialPositions } = useMemo(() => {
    const geometry = new PlaneGeometry(26, 16, 20, 12);
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const bx = pos.getX(i);
      const by = pos.getY(i);
      const bz = pos.getZ(i);
      // Deterministic triangular paper-crease jitter for authentic origami facets
      pos.setXYZ(
        i,
        bx + Math.sin(i * 1.73) * 0.24,
        by + Math.cos(i * 2.17) * 0.22,
        bz,
      );
    }
    const snapshot = new Float32Array(pos.array);
    return {
      planeGeometry: geometry,
      initialPositions: snapshot,
    };
  }, []);

  const paperMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: backgroundColor,
        flatShading: true,
        roughness: 0.72,
        metalness: 0.04,
      }),
    [backgroundColor],
  );

  useLayoutEffect(() => {
    applyPaperFoldDisplacement(
      planeGeometry,
      initialPositions,
      loopAngle,
      foldAmplitude,
    );
  }, [planeGeometry, initialPositions, loopAngle, foldAmplitude]);

  useEffect(() => {
    return () => {
      planeGeometry.dispose();
    };
  }, [planeGeometry]);

  useEffect(() => {
    return () => {
      paperMaterial.dispose();
    };
  }, [paperMaterial]);

  return (
    <>
      <color attach="background" args={[backgroundColor]} />

      {/* Soft high-key studio lighting rig with warm key and cool fill */}
      <ambientLight intensity={1.15} color="#FFFFFF" />
      <hemisphereLight args={["#FFFFFF", backgroundColor, 0.65]} />
      <directionalLight
        position={[10, 7, 5.5]}
        intensity={0.95}
        color={primaryColor}
      />
      <directionalLight
        position={[-10, -6, 5]}
        intensity={0.85}
        color={secondaryColor}
      />
      <directionalLight
        position={[0, 6, 8]}
        intensity={0.45}
        color={accentColor}
      />

      <mesh
        geometry={planeGeometry}
        material={paperMaterial}
        rotation={[-0.08, 0.04, 0]}
      />
    </>
  );
};

export const LowPolyPaperFoldWave3DFHD: React.FC<
  LowPolyPaperFoldWave3DProps
> = ({
  backgroundColor = "#FAF8F5",
  primaryColor = "#E07A5F",
  secondaryColor = "#81B29A",
  accentColor = "#F2CC8F",
  foldAmplitude = 0.65,
  speedMultiplier = 1,
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
        <PaperFoldScene
          frame={frame}
          durationInFrames={durationInFrames}
          backgroundColor={backgroundColor}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          accentColor={accentColor}
          foldAmplitude={foldAmplitude}
          speedMultiplier={speedMultiplier}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

