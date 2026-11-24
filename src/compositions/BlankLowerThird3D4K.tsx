import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  IcosahedronGeometry,
  MeshBasicMaterial,
  MeshStandardMaterial,
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

export const blankLowerThird3D4KSchema = z.object({
  primaryColor: z.string().default("#0F172A"),
  accentColor: z.string().default("#38BDF8"),
  secondaryColor: z.string().default("#1E293B"),
  backgroundColor: z.string().default("transparent"),
  barOpacity: z.number().min(0.1).max(1).default(0.92),
  mirrorPosition: z.boolean().default(false),
  speedMultiplier: z.number().int().positive().default(1),
});

export type BlankLowerThird3D4KProps = z.infer<
  typeof blankLowerThird3D4KSchema
>;

export const defaultBlankLowerThird3D4KProps: BlankLowerThird3D4KProps = {
  primaryColor: "#0F172A",
  accentColor: "#38BDF8",
  secondaryColor: "#1E293B",
  backgroundColor: "transparent",
  barOpacity: 0.92,
  mirrorPosition: false,
  speedMultiplier: 1,
};

export const blankLowerThird3D4KVariations: Record<
  string,
  BlankLowerThird3D4KProps
> = {
  corporateNavyCyan: defaultBlankLowerThird3D4KProps,
  mirroredCorporate: {
    ...defaultBlankLowerThird3D4KProps,
    mirrorPosition: true,
  },
  emeraldDark: {
    primaryColor: "#0B1612",
    accentColor: "#34D399",
    secondaryColor: "#132A22",
    backgroundColor: "transparent",
    barOpacity: 0.92,
    mirrorPosition: false,
    speedMultiplier: 1,
  },
  luxuryCharcoalGold: {
    primaryColor: "#141417",
    accentColor: "#D4AF37",
    secondaryColor: "#27272C",
    backgroundColor: "transparent",
    barOpacity: 0.94,
    mirrorPosition: false,
    speedMultiplier: 1,
  },
};

const CAMERA_ZOOM = 240;
const CANVAS_GL = { antialias: true, alpha: true } as const;
const CAMERA_CONFIG = {
  position: [0, 0, 10] as [number, number, number],
  zoom: CAMERA_ZOOM,
  near: 0.1,
  far: 100,
};

const WIPE_IN_EASING = Easing.bezier(0.16, 1, 0.3, 1);
const WIPE_OUT_EASING = Easing.bezier(0.65, 0, 0.84, 0);

const PRIMARY_BAR_WIDTH = 5.2;
const PRIMARY_BAR_HEIGHT = 0.68;
const ACCENT_BAR_WIDTH = 3.45;
const ACCENT_BAR_HEIGHT = 0.34;

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

interface LowerThirdSceneProps {
  frame: number;
  fps: number;
  durationInFrames: number;
  primaryColor: string;
  accentColor: string;
  secondaryColor: string;
  barOpacity: number;
  mirrorPosition: boolean;
  speedMultiplier: number;
}

const LowerThirdScene: React.FC<LowerThirdSceneProps> = ({
  frame,
  fps,
  durationInFrames,
  primaryColor,
  accentColor,
  secondaryColor,
  barOpacity,
  mirrorPosition,
  speedMultiplier,
}) => {
  // Phase 1 (In: 0-30), Phase 2 (Hold: 30-150), Phase 3 (Out: 150-180)
  const emblemEnter = spring({
    frame,
    fps,
    durationInFrames: 26,
    config: { damping: 12, stiffness: 170, mass: 0.7 },
  });

  const emblemExit = interpolate(frame, [158, 179], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: WIPE_OUT_EASING,
  });

  const emblemScale = emblemEnter * emblemExit;

  const primaryEnter = interpolate(frame, [7, 27], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: WIPE_IN_EASING,
  });

  const primaryExit = interpolate(frame, [153, 172], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: WIPE_OUT_EASING,
  });

  const primaryBarScaleX = primaryEnter * primaryExit;

  const accentEnter = interpolate(frame, [11, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: WIPE_IN_EASING,
  });

  const accentExit = interpolate(frame, [150, 167], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: WIPE_OUT_EASING,
  });

  const accentBarScaleX = accentEnter * accentExit;

  const loopAngle = (frame / durationInFrames) * Math.PI * 4 * speedMultiplier;

  const geometries = useMemo(
    () => ({
      crystal: new IcosahedronGeometry(0.46, 0),
      crystalCage: new IcosahedronGeometry(0.55, 0),
      gimbalRing: new TorusGeometry(0.64, 0.032, 16, 48),
      primaryBar: new RoundedBoxGeometry(
        PRIMARY_BAR_WIDTH,
        PRIMARY_BAR_HEIGHT,
        0.18,
        3,
        0.055,
      ),
      primaryTrim: new RoundedBoxGeometry(
        PRIMARY_BAR_WIDTH,
        0.08,
        0.2,
        2,
        0.025,
      ),
      accentBar: new RoundedBoxGeometry(
        ACCENT_BAR_WIDTH,
        ACCENT_BAR_HEIGHT,
        0.16,
        3,
        0.045,
      ),
    }),
    [],
  );

  const materials = useMemo(
    () => ({
      crystal: new MeshStandardMaterial({
        color: accentColor,
        flatShading: true,
        roughness: 0.35,
        metalness: 0.25,
        transparent: true,
        opacity: Math.min(1, barOpacity + 0.06),
      }),
      cage: new MeshBasicMaterial({
        color: "#FFFFFF",
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      }),
      ring: new MeshStandardMaterial({
        color: secondaryColor,
        roughness: 0.4,
        metalness: 0.35,
        transparent: true,
        opacity: barOpacity,
      }),
      primaryBar: new MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.48,
        metalness: 0.14,
        transparent: true,
        opacity: barOpacity,
      }),
      accentBar: new MeshStandardMaterial({
        color: accentColor,
        roughness: 0.42,
        metalness: 0.18,
        transparent: true,
        opacity: barOpacity,
      }),
    }),
    [primaryColor, accentColor, secondaryColor, barOpacity],
  );

  useEffect(() => {
    return () => {
      geometries.crystal.dispose();
      geometries.crystalCage.dispose();
      geometries.gimbalRing.dispose();
      geometries.primaryBar.dispose();
      geometries.primaryTrim.dispose();
      geometries.accentBar.dispose();
    };
  }, [geometries]);

  useEffect(() => {
    return () => {
      materials.crystal.dispose();
      materials.cage.dispose();
      materials.ring.dispose();
      materials.primaryBar.dispose();
      materials.accentBar.dispose();
    };
  }, [materials]);

  // Compute mirrored X coordinates positively so face winding stays intact
  const direction = mirrorPosition ? -1 : 1;
  const emblemPosX = direction * -6.15;
  const barPivotX = direction * -5.3;
  const basePosY = -2.65;

  return (
    <>
      <OrthographicCameraRig />

      {/* Clean studio lighting for crisp facet and bevel readability over any video */}
      <ambientLight intensity={1.15} color="#FFFFFF" />
      <hemisphereLight args={["#FFFFFF", primaryColor, 0.6]} />
      <directionalLight position={[6, 8, 12]} intensity={1.35} color="#FFFFFF" />
      <directionalLight
        position={[-8, -4, 8]}
        intensity={0.75}
        color={accentColor}
      />
      <directionalLight position={[0, -6, 6]} intensity={0.4} color="#E2E8F0" />

      {/* 3D Faceted Geometric Emblem */}
      <group
        position={[emblemPosX, basePosY - 0.08, 0.25]}
        scale={[emblemScale, emblemScale, emblemScale]}
        visible={emblemScale > 0.0001}
      >
        <mesh
          geometry={geometries.crystal}
          material={materials.crystal}
          rotation={[
            0.35 + Math.sin(loopAngle) * 0.25,
            loopAngle,
            Math.cos(loopAngle) * 0.18,
          ]}
        />
        <mesh
          geometry={geometries.crystalCage}
          material={materials.cage}
          rotation={[
            -0.25 + Math.cos(loopAngle) * 0.2,
            -loopAngle * 0.5,
            Math.sin(loopAngle) * 0.22,
          ]}
        />
        <mesh
          geometry={geometries.gimbalRing}
          material={materials.ring}
          rotation={[
            Math.PI / 3 + Math.sin(loopAngle) * 0.32,
            Math.cos(loopAngle) * 0.35,
            loopAngle * 0.5,
          ]}
        />
      </group>

      {/* Primary Blank Backing Bar (anchored at emblem inner edge) */}
      <group
        position={[barPivotX, basePosY + 0.16, 0]}
        scale={[primaryBarScaleX, 1, 1]}
        visible={primaryBarScaleX > 0.0001}
      >
        <mesh
          geometry={geometries.primaryBar}
          material={materials.primaryBar}
          position={[direction * (PRIMARY_BAR_WIDTH / 2), 0, 0]}
        />
        <mesh
          geometry={geometries.primaryTrim}
          material={materials.accentBar}
          position={[
            direction * (PRIMARY_BAR_WIDTH / 2),
            -PRIMARY_BAR_HEIGHT / 2 + 0.04,
            0.02,
          ]}
        />
      </group>

      {/* Secondary Accent Backing Bar */}
      <group
        position={[barPivotX, basePosY - 0.44, 0.05]}
        scale={[accentBarScaleX, 1, 1]}
        visible={accentBarScaleX > 0.0001}
      >
        <mesh
          geometry={geometries.accentBar}
          material={materials.accentBar}
          position={[direction * (ACCENT_BAR_WIDTH / 2), 0, 0]}
        />
      </group>
    </>
  );
};

export const BlankLowerThird3D4K: React.FC<BlankLowerThird3D4KProps> = ({
  primaryColor = "#0F172A",
  accentColor = "#38BDF8",
  secondaryColor = "#1E293B",
  barOpacity = 0.92,
  mirrorPosition = false,
  speedMultiplier = 1,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "transparent" }}>
      <ThreeCanvas
        width={width}
        height={height}
        orthographic
        dpr={1}
        camera={CAMERA_CONFIG}
        gl={CANVAS_GL}
      >
        <LowerThirdScene
          frame={frame}
          fps={fps}
          durationInFrames={durationInFrames}
          primaryColor={primaryColor}
          accentColor={accentColor}
          secondaryColor={secondaryColor}
          barOpacity={barOpacity}
          mirrorPosition={mirrorPosition}
          speedMultiplier={speedMultiplier}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

