import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  IcosahedronGeometry,
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

export const geometricConstellationMesh3DSchema = z.object({
  baseColor: z.string().default("#0F172A"),
  wireframeColor: z.string().default("#38BDF8"),
  wireframeOpacity: z.number().min(0).max(1).default(0.42),
  displacementIntensity: z.number().min(0).max(3).default(0.85),
  backgroundColor: z.string().default("#060B14"),
  accentColor: z.string().default("#6366F1"),
  speedMultiplier: z.number().int().positive().default(1),
});

export type GeometricConstellationMesh3DProps = z.infer<
  typeof geometricConstellationMesh3DSchema
>;

export const defaultGeometricConstellationMesh3DProps: GeometricConstellationMesh3DProps =
  {
    baseColor: "#0F172A",
    wireframeColor: "#38BDF8",
    wireframeOpacity: 0.42,
    displacementIntensity: 0.85,
    backgroundColor: "#060B14",
    accentColor: "#6366F1",
    speedMultiplier: 1,
  };

export const geometricConstellationMesh3DVariations: Record<
  string,
  GeometricConstellationMesh3DProps
> = {
  cyberCyan: defaultGeometricConstellationMesh3DProps,
  emeraldMatrix: {
    baseColor: "#0B1915",
    wireframeColor: "#34D399",
    wireframeOpacity: 0.4,
    displacementIntensity: 0.85,
    backgroundColor: "#040B09",
    accentColor: "#14B8A6",
    speedMultiplier: 1,
  },
  royalViolet: {
    baseColor: "#131126",
    wireframeColor: "#A78BFA",
    wireframeOpacity: 0.44,
    displacementIntensity: 0.85,
    backgroundColor: "#070612",
    accentColor: "#EC4899",
    speedMultiplier: 1,
  },
  monochromeTitanium: {
    baseColor: "#141417",
    wireframeColor: "#E4E4E7",
    wireframeOpacity: 0.34,
    displacementIntensity: 0.8,
    backgroundColor: "#08080A",
    accentColor: "#94A3B8",
    speedMultiplier: 1,
  },
};

const CANVAS_DPR: [number, number] = [1, 2];
const CANVAS_GL = { antialias: true, alpha: false } as const;
const CAMERA_CONFIG = {
  position: [-0.8, 0.35, 9.2] as [number, number, number],
  fov: 40,
  near: 0.1,
  far: 100,
};

const applyPlaneDisplacement = (
  geometry: PlaneGeometry,
  initialPositions: Float32Array,
  loopAngle: number,
  displacementIntensity: number,
): void => {
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const offset = i * 3;
    const baseX = initialPositions[offset];
    const baseY = initialPositions[offset + 1];
    const baseZ = initialPositions[offset + 2];

    const primaryWave = Math.sin(loopAngle + baseX * 0.45 + baseY * 0.35) * 0.55;
    const crossWave = Math.cos(loopAngle - baseX * 0.3 + baseY * 0.5) * 0.35;
    const nextZ = baseZ + (primaryWave + crossWave) * displacementIntensity;
    const nextX =
      baseX + Math.sin(loopAngle + baseY * 0.4) * 0.08 * displacementIntensity;
    const nextY =
      baseY + Math.cos(loopAngle + baseX * 0.4) * 0.08 * displacementIntensity;

    position.setXYZ(i, nextX, nextY, nextZ);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
};

const applyIcosaDisplacement = (
  geometry: IcosahedronGeometry,
  initialPositions: Float32Array,
  loopAngle: number,
  displacementIntensity: number,
): void => {
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const offset = i * 3;
    const baseX = initialPositions[offset];
    const baseY = initialPositions[offset + 1];
    const baseZ = initialPositions[offset + 2];
    const length = Math.hypot(baseX, baseY, baseZ) || 1;
    const nx = baseX / length;
    const ny = baseY / length;
    const nz = baseZ / length;

    const radialPulse =
      1 +
      Math.sin(loopAngle + nx * 2.2 + ny * 2.2 + nz * 2.2) *
        0.08 *
        displacementIntensity;

    position.setXYZ(
      i,
      baseX * radialPulse,
      baseY * radialPulse,
      baseZ * radialPulse,
    );
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
};

interface ConstellationSceneProps {
  frame: number;
  durationInFrames: number;
  baseColor: string;
  wireframeColor: string;
  wireframeOpacity: number;
  displacementIntensity: number;
  backgroundColor: string;
  accentColor: string;
  speedMultiplier: number;
}

const ConstellationScene: React.FC<ConstellationSceneProps> = ({
  frame,
  durationInFrames,
  baseColor,
  wireframeColor,
  wireframeOpacity,
  displacementIntensity,
  backgroundColor,
  accentColor,
  speedMultiplier,
}) => {
  const loopAngle =
    ((frame % durationInFrames) / durationInFrames) *
    Math.PI *
    2 *
    speedMultiplier;

  const { planeGeometry, planeInitialPositions } = useMemo(() => {
    const geometry = new PlaneGeometry(22, 14, 16, 16);
    const snapshot = new Float32Array(geometry.attributes.position.array);
    return {
      planeGeometry: geometry,
      planeInitialPositions: snapshot,
    };
  }, []);

  const { icosaGeometry, icosaInitialPositions } = useMemo(() => {
    const geometry = new IcosahedronGeometry(2.35, 2);
    const snapshot = new Float32Array(geometry.attributes.position.array);
    return {
      icosaGeometry: geometry,
      icosaInitialPositions: snapshot,
    };
  }, []);

  const baseMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: baseColor,
        flatShading: true,
        roughness: 0.62,
        metalness: 0.18,
      }),
    [baseColor],
  );

  const wireframeMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: wireframeColor,
        wireframe: true,
        transparent: true,
        opacity: wireframeOpacity,
      }),
    [wireframeColor, wireframeOpacity],
  );

  const icosaWireframeMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: wireframeColor,
        wireframe: true,
        transparent: true,
        opacity: Math.min(1, wireframeOpacity * 1.25),
      }),
    [wireframeColor, wireframeOpacity],
  );

  useLayoutEffect(() => {
    applyPlaneDisplacement(
      planeGeometry,
      planeInitialPositions,
      loopAngle,
      displacementIntensity,
    );
    applyIcosaDisplacement(
      icosaGeometry,
      icosaInitialPositions,
      loopAngle,
      displacementIntensity,
    );
  }, [
    planeGeometry,
    planeInitialPositions,
    icosaGeometry,
    icosaInitialPositions,
    loopAngle,
    displacementIntensity,
  ]);

  useEffect(() => {
    return () => {
      planeGeometry.dispose();
      icosaGeometry.dispose();
    };
  }, [planeGeometry, icosaGeometry]);

  useEffect(() => {
    return () => {
      baseMaterial.dispose();
    };
  }, [baseMaterial]);

  useEffect(() => {
    return () => {
      wireframeMaterial.dispose();
    };
  }, [wireframeMaterial]);

  useEffect(() => {
    return () => {
      icosaWireframeMaterial.dispose();
    };
  }, [icosaWireframeMaterial]);

  const icosaRotX = 0.28 + Math.sin(loopAngle) * 0.14;
  const icosaRotY = 0.35 + loopAngle;
  const icosaRotZ = Math.cos(loopAngle) * 0.1;

  return (
    <>
      <color attach="background" args={[backgroundColor]} />
      <fog attach="fog" args={[backgroundColor, 8.5, 21]} />

      {/* Technical dark-mode lighting highlighting low-poly facet planes */}
      <ambientLight intensity={0.45} />
      <hemisphereLight args={[wireframeColor, backgroundColor, 0.45]} />
      <directionalLight
        position={[7, 6, 8]}
        intensity={1.55}
        color={wireframeColor}
      />
      <directionalLight
        position={[-6, -4, 4]}
        intensity={0.9}
        color={accentColor}
      />
      <directionalLight position={[2, 8, -5]} intensity={0.7} color="#E2E8F0" />

      {/* Off-center wide undulating triangular terrain plane (dual layer) */}
      <group position={[2.8, -2.1, -1.6]} rotation={[-0.82, -0.26, -0.15]}>
        <mesh geometry={planeGeometry} material={baseMaterial} />
        <mesh
          geometry={planeGeometry}
          material={wireframeMaterial}
          position={[0, 0, 0.035]}
        />
      </group>

      {/* Bottom-right slowly rotating faceted icosahedron (dual layer) */}
      <group
        position={[4.8, -1.25, 1.4]}
        rotation={[icosaRotX, icosaRotY, icosaRotZ]}
      >
        <mesh geometry={icosaGeometry} material={baseMaterial} />
        <mesh
          geometry={icosaGeometry}
          material={icosaWireframeMaterial}
          scale={1.018}
        />
      </group>
    </>
  );
};

export const GeometricConstellationMesh3DFHD: React.FC<
  GeometricConstellationMesh3DProps
> = ({
  baseColor = "#0F172A",
  wireframeColor = "#38BDF8",
  wireframeOpacity = 0.42,
  displacementIntensity = 0.85,
  backgroundColor = "#060B14",
  accentColor = "#6366F1",
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
        <ConstellationScene
          frame={frame}
          durationInFrames={durationInFrames}
          baseColor={baseColor}
          wireframeColor={wireframeColor}
          wireframeOpacity={wireframeOpacity}
          displacementIntensity={displacementIntensity}
          backgroundColor={backgroundColor}
          accentColor={accentColor}
          speedMultiplier={speedMultiplier}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

