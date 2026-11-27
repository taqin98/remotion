import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";

if ("setConsoleFunction" in THREE && typeof THREE.setConsoleFunction === "function") {
  THREE.setConsoleFunction((type, message) => {
    if (type === "warn" && typeof message === "string" && message.startsWith("THREE.Clock:")) {
      return;
    }
    if (type === "error") {
      console.error(message);
    } else if (type === "warn") {
      console.warn(message);
    }
  });
}

export const flowingRibbonDataStreamThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type FlowingRibbonDataStreamThemePreset =
  (typeof flowingRibbonDataStreamThemePresets)[number];

export const flowingRibbonDataStream4KSchema = z.object({
  themePreset: z.enum(flowingRibbonDataStreamThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type FlowingRibbonDataStream4KProps = z.infer<
  typeof flowingRibbonDataStream4KSchema
>;

export const defaultFlowingRibbonDataStream4KProps: FlowingRibbonDataStream4KProps =
  {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#0F172A",
    secondaryColor: "#1E293B",
    accentColor: "#38BDF8",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const flowingRibbonDataStream4KVariations: Record<
  FlowingRibbonDataStreamThemePreset,
  Omit<
    FlowingRibbonDataStream4KProps,
    "aspectRatio" | "speedMultiplier" | "strokeWidth"
  >
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    backgroundColor: "transparent",
    primaryColor: "#1E293B",
    secondaryColor: "#64748B",
    accentColor: "#2563EB",
  },
  "dark-tech": {
    themePreset: "dark-tech",
    backgroundColor: "transparent",
    primaryColor: "#0F172A",
    secondaryColor: "#1E293B",
    accentColor: "#38BDF8",
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    backgroundColor: "transparent",
    primaryColor: "#F5F0E6",
    secondaryColor: "#E5DAC8",
    accentColor: "#D97706",
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    backgroundColor: "transparent",
    primaryColor: "#18181B",
    secondaryColor: "#3F3F46",
    accentColor: "#D4AF37",
  },
};

const CAMERA_CONFIG = {
  position: [0, 0, 12] as [number, number, number],
  zoom: 240,
  near: 0.1,
  far: 50,
};

const GL_CONFIG = {
  antialias: true,
  alpha: true,
};

const OrthographicCameraRig: React.FC<{ zoom: number }> = ({ zoom }) => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    camera.position.set(0, 0, 12);
    camera.zoom = zoom;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, zoom]);

  return null;
};

function resolveThemeColors(props: FlowingRibbonDataStream4KProps) {
  const preset = flowingRibbonDataStream4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultFlowingRibbonDataStream4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultFlowingRibbonDataStream4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultFlowingRibbonDataStream4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

const SPLINE_COUNT = 5;
const BEADS_PER_SPLINE = 6;
const STREAM_WIDTH = 14.4;
const STREAM_SEGS = 120;

function evalSplineY(s: number, x: number, angle: number): number {
  const baseY = (s - (SPLINE_COUNT - 1) * 0.5) * 1.15;
  return baseY + Math.sin(x * 0.55 - angle + s * 0.8) * 0.65;
}

function evalSplineSlope(s: number, x: number, angle: number): number {
  return 0.55 * Math.cos(x * 0.55 - angle + s * 0.8) * 0.65;
}

const FlowingRibbonScene: React.FC<{
  props: FlowingRibbonDataStream4KProps;
  cycleProgress: number;
  angle: number;
}> = ({ props, cycleProgress, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const uiScale = isVertical ? 0.58 : 1;

  const trackThick = 0.055 * props.strokeWidth;

  const splineGeometries = useMemo(() => {
    return Array.from({ length: SPLINE_COUNT }).map(
      () => new THREE.PlaneGeometry(STREAM_WIDTH, trackThick, STREAM_SEGS, 1),
    );
  }, [trackThick]);

  const beadSphereGeo = useMemo(() => new THREE.SphereGeometry(0.12, 20, 20), []);
  const trailCapsuleGeo = useMemo(
    () => new THREE.CapsuleGeometry(0.055, 0.32, 8, 12),
    [],
  );

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.4,
        roughness: 0.32,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      }),
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.35,
        roughness: 0.38,
        side: THREE.DoubleSide,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.72,
        roughness: 0.16,
        emissive: accentHex,
        emissiveIntensity: 0.45,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useLayoutEffect(() => {
    splineGeometries.forEach((geo, s) => {
      const pos = geo.attributes.position;
      const cols = STREAM_SEGS + 1;
      for (let i = 0; i < pos.count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const u = col / STREAM_SEGS;
        const x = (u - 0.5) * STREAM_WIDTH;
        const rowOffset = (row - 0.5) * trackThick;
        const y = evalSplineY(s, x, angle) + rowOffset;
        const z = Math.cos(x * 0.35 + angle + s) * 0.22;
        pos.setXYZ(i, x, y, z);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    });
  }, [splineGeometries, trackThick, angle]);

  useEffect(() => {
    return () => {
      splineGeometries.forEach((g) => g.dispose());
      beadSphereGeo.dispose();
      trailCapsuleGeo.dispose();
      materials.forEach((m) => m.dispose());
    };
  }, [splineGeometries, beadSphereGeo, trailCapsuleGeo, materials]);

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 12]} intensity={1.3} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.5} color={accentHex} />

      <group scale={[uiScale, uiScale, uiScale]}>
        {splineGeometries.map((geo, s) => {
          const zLayer = (s - 2) * 0.25;
          return (
            <group key={s} position={[0, 0, zLayer]}>
              <mesh
                geometry={geo}
                material={s % 2 === 0 ? materials[0] : materials[1]}
              />

              {Array.from({ length: BEADS_PER_SPLINE }).map((_, b) => {
                const u = (b / BEADS_PER_SPLINE + cycleProgress + s * 0.13) % 1;
                const x = -STREAM_WIDTH * 0.5 + u * STREAM_WIDTH;
                const y = evalSplineY(s, x, angle);
                const z = Math.cos(x * 0.35 + angle + s) * 0.22 + 0.06;
                const slope = evalSplineSlope(s, x, angle);
                const tangentAngle = Math.atan2(slope, 1);
                const edgeFade = Math.min(1, Math.sin(u * Math.PI) * 3.2);

                return (
                  <group
                    key={b}
                    position={[x, y, z]}
                    rotation={[0, 0, tangentAngle]}
                    scale={[edgeFade, edgeFade, edgeFade]}
                  >
                    <mesh
                      geometry={beadSphereGeo}
                      material={materials[2]}
                      position={[0.14, 0, 0]}
                    />
                    <mesh
                      geometry={trailCapsuleGeo}
                      material={materials[2]}
                      position={[-0.1, 0, 0]}
                      rotation={[0, 0, Math.PI * 0.5]}
                    />
                  </group>
                );
              })}
            </group>
          );
        })}
      </group>
    </>
  );
};

export const FlowingRibbonDataStream4K: React.FC<
  FlowingRibbonDataStream4KProps
> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const progress =
    ((frame % durationInFrames) / durationInFrames) * props.speedMultiplier;
  const cycleProgress = progress % 1;
  const angle = cycleProgress * Math.PI * 2;

  const targetWorldW = props.aspectRatio === "9:16" ? 9 : 16;
  const targetWorldH = props.aspectRatio === "9:16" ? 16 : 9;
  const zoom = Math.min(width / targetWorldW, height / targetWorldH);

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: "transparent",
        overflow: "hidden",
      }}
    >
      <ThreeCanvas
        width={width}
        height={height}
        orthographic
        dpr={1}
        camera={CAMERA_CONFIG}
        gl={GL_CONFIG}
      >
        <OrthographicCameraRig zoom={zoom} />
        <FlowingRibbonScene
          props={props}
          cycleProgress={cycleProgress}
          angle={angle}
        />
      </ThreeCanvas>
    </div>
  );
};
