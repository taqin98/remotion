import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import {
  AbsoluteFill,
  Easing,
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

export const waveDirectionSchema = z.enum([
  "bottomLeftToTopRight",
  "topLeftToBottomRight",
  "leftToRight",
  "centerOut",
]);

export type WaveDirection = z.infer<typeof waveDirectionSchema>;

export const geometricTileWipeTransition3DSchema = z.object({
  primaryColor: z.string().default("#1E293B"),
  accentColor: z.string().default("#3B82F6"),
  surfaceColor: z.string().default("#F8FAFC"),
  waveDirection: waveDirectionSchema.default("bottomLeftToTopRight"),
});

export type GeometricTileWipeTransition3DProps = z.infer<
  typeof geometricTileWipeTransition3DSchema
>;

export const defaultGeometricTileWipeTransition3DProps: GeometricTileWipeTransition3DProps =
  {
    primaryColor: "#1E293B",
    accentColor: "#3B82F6",
    surfaceColor: "#F8FAFC",
    waveDirection: "bottomLeftToTopRight",
  };

export const geometricTileWipeTransition3DVariations: Record<
  string,
  GeometricTileWipeTransition3DProps
> = {
  corporateNavyBlue: defaultGeometricTileWipeTransition3DProps,
  diagonalReverse: {
    primaryColor: "#1E293B",
    accentColor: "#3B82F6",
    surfaceColor: "#F8FAFC",
    waveDirection: "topLeftToBottomRight",
  },
  emeraldSlate: {
    primaryColor: "#0F172A",
    accentColor: "#10B981",
    surfaceColor: "#F8FAFC",
    waveDirection: "leftToRight",
  },
  indigoRadial: {
    primaryColor: "#1E1B4B",
    accentColor: "#6366F1",
    surfaceColor: "#F1F5F9",
    waveDirection: "centerOut",
  },
};

const COLS = 12;
const ROWS = 7;
const VIEWPORT_WIDTH_UNITS = 16;
const VIEWPORT_HEIGHT_UNITS = 9;
const STEP_X = VIEWPORT_WIDTH_UNITS / COLS;
const STEP_Y = VIEWPORT_HEIGHT_UNITS / ROWS;
const CAMERA_ZOOM = 120;
const MAX_STAGGER_FRAMES = 8;

const CANVAS_DPR: [number, number] = [1, 2];
const CANVAS_GL = { antialias: true, alpha: true } as const;
const CAMERA_CONFIG = {
  position: [0, 0, 10] as [number, number, number],
  zoom: CAMERA_ZOOM,
  near: 0.1,
  far: 100,
};

const ENTER_EASING = Easing.bezier(0.22, 1, 0.36, 1);
const EXIT_EASING = Easing.bezier(0.55, 0, 0.78, 0);

type MaterialVariant = "primary" | "accent" | "surface";

interface TileSpec {
  id: string;
  col: number;
  row: number;
  x: number;
  y: number;
  bodyVariant: MaterialVariant;
  plateVariant: MaterialVariant;
}

const resolveTileVariants = (
  col: number,
  row: number,
): { bodyVariant: MaterialVariant; plateVariant: MaterialVariant } => {
  const index = (col + row * 2) % 6;
  if (index === 0 || index === 3) {
    return { bodyVariant: "primary", plateVariant: "accent" };
  }
  if (index === 1 || index === 4) {
    return { bodyVariant: "surface", plateVariant: "primary" };
  }
  return { bodyVariant: "accent", plateVariant: "surface" };
};

const computeNormalizedDelay = (
  col: number,
  row: number,
  waveDirection: WaveDirection,
): number => {
  const normX = col / (COLS - 1);
  const normY = row / (ROWS - 1);

  if (waveDirection === "topLeftToBottomRight") {
    return (normX + (1 - normY)) / 2;
  }
  if (waveDirection === "leftToRight") {
    return normX;
  }
  if (waveDirection === "centerOut") {
    const dx = normX - 0.5;
    const dy = normY - 0.5;
    return Math.min(1, Math.hypot(dx, dy) / Math.SQRT1_2);
  }
  return (normX + normY) / 2;
};

const OrthographicCameraRig: React.FC = () => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    camera.position.set(0, 0, 10);
    camera.zoom = CAMERA_ZOOM;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
};

interface TileMeshProps {
  tile: TileSpec;
  frame: number;
  waveDirection: WaveDirection;
  tileGeometry: RoundedBoxGeometry;
  plateGeometry: RoundedBoxGeometry;
  materials: Record<MaterialVariant, MeshStandardMaterial>;
}

const TileMesh: React.FC<TileMeshProps> = ({
  tile,
  frame,
  waveDirection,
  tileGeometry,
  plateGeometry,
  materials,
}) => {
  const delay =
    computeNormalizedDelay(tile.col, tile.row, waveDirection) *
    MAX_STAGGER_FRAMES;

  const enterProgress = interpolate(frame, [delay, delay + 11], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ENTER_EASING,
  });

  const exitProgress = interpolate(
    frame,
    [25 + delay, 36 + delay],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EXIT_EASING,
    },
  );

  const tileScale = enterProgress * (1 - exitProgress);
  const rotationY =
    interpolate(enterProgress, [0, 1], [-Math.PI, 0]) +
    interpolate(exitProgress, [0, 1], [0, Math.PI]);

  return (
    <group
      position={[tile.x, tile.y, 0]}
      rotation={[0, rotationY, 0]}
      scale={[tileScale, tileScale, tileScale]}
      visible={tileScale > 0.0001}
    >
      <mesh
        geometry={tileGeometry}
        material={materials[tile.bodyVariant]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={plateGeometry}
        material={materials[tile.plateVariant]}
        castShadow
        receiveShadow
      />
    </group>
  );
};

interface TileWipeSceneProps {
  frame: number;
  primaryColor: string;
  accentColor: string;
  surfaceColor: string;
  waveDirection: WaveDirection;
}

const TileWipeScene: React.FC<TileWipeSceneProps> = ({
  frame,
  primaryColor,
  accentColor,
  surfaceColor,
  waveDirection,
}) => {
  const tiles = useMemo<TileSpec[]>(() => {
    const items: TileSpec[] = [];
    const halfCols = (COLS - 1) / 2;
    const halfRows = (ROWS - 1) / 2;
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const { bodyVariant, plateVariant } = resolveTileVariants(col, row);
        items.push({
          id: `tile-${row}-${col}`,
          col,
          row,
          x: (col - halfCols) * STEP_X,
          y: (row - halfRows) * STEP_Y,
          bodyVariant,
          plateVariant,
        });
      }
    }
    return items;
  }, []);

  const tileGeometry = useMemo(
    () =>
      new RoundedBoxGeometry(STEP_X * 1.025, STEP_Y * 1.025, 0.26, 2, 0.045),
    [],
  );

  const plateGeometry = useMemo(
    () =>
      new RoundedBoxGeometry(STEP_X * 0.72, STEP_Y * 0.72, 0.3, 2, 0.03),
    [],
  );

  const materials = useMemo<Record<MaterialVariant, MeshStandardMaterial>>(
    () => ({
      primary: new MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.5,
        metalness: 0.12,
      }),
      accent: new MeshStandardMaterial({
        color: accentColor,
        roughness: 0.5,
        metalness: 0.12,
      }),
      surface: new MeshStandardMaterial({
        color: surfaceColor,
        roughness: 0.5,
        metalness: 0.08,
      }),
    }),
    [primaryColor, accentColor, surfaceColor],
  );

  useEffect(() => {
    return () => {
      tileGeometry.dispose();
      plateGeometry.dispose();
    };
  }, [tileGeometry, plateGeometry]);

  useEffect(() => {
    return () => {
      materials.primary.dispose();
      materials.accent.dispose();
      materials.surface.dispose();
    };
  }, [materials]);

  return (
    <>
      <OrthographicCameraRig />

      {/* Soft corporate directional lighting for chamfered edge definition */}
      <ambientLight intensity={1.15} color="#FFFFFF" />
      <hemisphereLight args={["#FFFFFF", primaryColor, 0.55]} />
      <directionalLight position={[6, 8, 12]} intensity={1.1} color="#FFFFFF" />
      <directionalLight
        position={[-7, -5, 10]}
        intensity={0.55}
        color={accentColor}
      />

      <group>
        {tiles.map((tile) => (
          <TileMesh
            key={tile.id}
            tile={tile}
            frame={frame}
            waveDirection={waveDirection}
            tileGeometry={tileGeometry}
            plateGeometry={plateGeometry}
            materials={materials}
          />
        ))}
      </group>
    </>
  );
};

export const GeometricTileWipeTransition3DFHD: React.FC<
  GeometricTileWipeTransition3DProps
> = ({
  primaryColor = "#1E293B",
  accentColor = "#3B82F6",
  surfaceColor = "#F8FAFC",
  waveDirection = "bottomLeftToTopRight",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "transparent" }}>
      <ThreeCanvas
        width={width}
        height={height}
        orthographic
        dpr={CANVAS_DPR}
        camera={CAMERA_CONFIG}
        gl={CANVAS_GL}
      >
        <TileWipeScene
          frame={frame}
          primaryColor={primaryColor}
          accentColor={accentColor}
          surfaceColor={surfaceColor}
          waveDirection={waveDirection}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

