import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
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

export const circularRadarBadgeCalloutThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type CircularRadarBadgeCalloutThemePreset =
  (typeof circularRadarBadgeCalloutThemePresets)[number];

export const circularRadarBadgeCallout4KSchema = z.object({
  themePreset: z.enum(circularRadarBadgeCalloutThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type CircularRadarBadgeCallout4KProps = z.infer<
  typeof circularRadarBadgeCallout4KSchema
>;

export const defaultCircularRadarBadgeCallout4KProps: CircularRadarBadgeCallout4KProps =
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

export const circularRadarBadgeCallout4KVariations: Record<
  CircularRadarBadgeCalloutThemePreset,
  Omit<
    CircularRadarBadgeCallout4KProps,
    "aspectRatio" | "speedMultiplier" | "strokeWidth"
  >
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    backgroundColor: "transparent",
    primaryColor: "#FFFFFF",
    secondaryColor: "#E2E8F0",
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
    secondaryColor: "#27272A",
    accentColor: "#E4E4E7",
  },
};

const CAMERA_CONFIG = {
  position: [0, 0, 10] as [number, number, number],
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

  React.useLayoutEffect(() => {
    camera.position.set(0, 0, 10);
    camera.zoom = zoom;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, zoom]);

  return null;
};

const CircularRadarBadgeCalloutScene: React.FC<{
  props: CircularRadarBadgeCallout4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset = circularRadarBadgeCallout4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultCircularRadarBadgeCallout4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultCircularRadarBadgeCallout4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultCircularRadarBadgeCallout4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const anchorX = isVertical ? -3.15 : -5.95;
  const anchorY = isVertical ? -4.55 : -2.55;
  const uiScale = isVertical ? 0.88 : 1;

  const armW = 5.1;
  const neckW = 0.45;

  const outerArcGeometry = useMemo(() => {
    return new THREE.TorusGeometry(
      0.58,
      0.03 * props.strokeWidth,
      16,
      32,
      Math.PI * 0.48,
    );
  }, [props.strokeWidth]);

  const innerArcGeometry = useMemo(() => {
    return new THREE.TorusGeometry(
      0.42,
      0.022 * props.strokeWidth,
      16,
      24,
      Math.PI * 0.6,
    );
  }, [props.strokeWidth]);

  const coreDiscGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(0.18, 0.18, 0.1, 24);
  }, []);

  const needleGeometry = useMemo(() => {
    return new RoundedBoxGeometry(0.32, 0.036, 0.12, 2, 0.01);
  }, []);

  const neckGeometry = useMemo(() => {
    return new RoundedBoxGeometry(
      neckW,
      0.04 * props.strokeWidth,
      0.1,
      2,
      0.015,
    );
  }, [neckW, props.strokeWidth]);

  const mainArmGeometry = useMemo(() => {
    return new RoundedBoxGeometry(armW, 0.66, 0.14, 3, 0.05);
  }, [armW]);

  const rulerAccentGeometry = useMemo(() => {
    return new RoundedBoxGeometry(
      armW,
      0.036 * props.strokeWidth,
      0.18,
      2,
      0.015,
    );
  }, [armW, props.strokeWidth]);

  const subArmGeometry = useMemo(() => {
    return new RoundedBoxGeometry(3.5, 0.34, 0.12, 3, 0.04);
  }, []);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.26,
        roughness: 0.4,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.32,
        roughness: 0.34,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.7,
        roughness: 0.2,
        emissive: accentHex,
        emissiveIntensity: 0.24,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      outerArcGeometry.dispose();
      innerArcGeometry.dispose();
      coreDiscGeometry.dispose();
      needleGeometry.dispose();
      neckGeometry.dispose();
      mainArmGeometry.dispose();
      rulerAccentGeometry.dispose();
      subArmGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [
    outerArcGeometry,
    innerArcGeometry,
    coreDiscGeometry,
    needleGeometry,
    neckGeometry,
    mainArmGeometry,
    rulerAccentGeometry,
    subArmGeometry,
    materials,
  ]);

  const radarScale =
    progress <= 0.17
      ? interpolate(progress, [0, 0.09], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.91, 1], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const neckWipe =
    progress <= 0.17
      ? interpolate(progress, [0.04, 0.1], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.89, 0.95], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const armWipe =
    progress <= 0.17
      ? interpolate(progress, [0.06, 0.16], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.83, 0.93], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const sweep = -progress * Math.PI * 2;
  const visible = radarScale > 0.002 || armWipe > 0.002;

  return (
    <>
      <ambientLight intensity={0.82} />
      <directionalLight position={[6, 8, 12]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.48} color={accentHex} />

      <group
        position={[anchorX, anchorY, 0]}
        scale={[uiScale, uiScale, uiScale]}
        visible={visible}
      >
        {/* Radar badge */}
        <group
          position={[0, 0.05, 0.2]}
          scale={
            radarScale > 0.002
              ? [radarScale, radarScale, radarScale]
              : [0.0001, 0.0001, 0.0001]
          }
          visible={radarScale > 0.002}
        >
          {/* 3 Outer segmented arcs */}
          <group rotation={[0, 0, sweep]}>
            {[0, 1, 2].map((i) => (
              <mesh
                key={i}
                geometry={outerArcGeometry}
                material={materials[2]}
                rotation={[0, 0, (i * Math.PI * 2) / 3]}
              />
            ))}
          </group>
          {/* 2 Inner counter-rotating arcs */}
          <group rotation={[0, 0, -sweep * 1.5]}>
            {[0, 1].map((i) => (
              <mesh
                key={i}
                geometry={innerArcGeometry}
                material={materials[1]}
                rotation={[0, 0, i * Math.PI]}
              />
            ))}
          </group>
          {/* Core disc */}
          <mesh
            geometry={coreDiscGeometry}
            material={materials[0]}
            rotation={[Math.PI * 0.5, 0, 0]}
          />
          {/* Radar sweep needle */}
          <group rotation={[0, 0, sweep * 2]}>
            <mesh
              geometry={needleGeometry}
              material={materials[2]}
              position={[0.18, 0, 0.04]}
            />
          </group>
        </group>

        {/* Connector neck */}
        <group
          position={[0.62, 0.05, 0.04]}
          scale={neckWipe > 0.002 ? [neckWipe, 1, 1] : [0.0001, 1, 1]}
          visible={neckWipe > 0.002}
        >
          <mesh
            geometry={neckGeometry}
            material={materials[2]}
            position={[neckW * 0.5, 0, 0]}
          />
        </group>

        {/* Horizontal blank label arm */}
        <group
          position={[0.62 + neckW, 0.16, 0]}
          scale={armWipe > 0.002 ? [armWipe, 1, 1] : [0.0001, 1, 1]}
          visible={armWipe > 0.002}
        >
          <mesh
            geometry={mainArmGeometry}
            material={materials[0]}
            position={[armW * 0.5, 0, 0]}
          />
          <mesh
            geometry={rulerAccentGeometry}
            material={materials[2]}
            position={[armW * 0.5, 0.33, 0.03]}
          />
          <mesh
            geometry={subArmGeometry}
            material={materials[1]}
            position={[1.75, -0.54, -0.04]}
          />
        </group>
      </group>
    </>
  );
};

export const CircularRadarBadgeCallout4K: React.FC<
  CircularRadarBadgeCallout4KProps
> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const lastFrame = Math.max(1, durationInFrames - 1);
  const rawProgress = (frame / lastFrame) * props.speedMultiplier;
  const cycleProgress =
    props.speedMultiplier === 1
      ? Math.min(1, Math.max(0, rawProgress))
      : rawProgress >= props.speedMultiplier
        ? 1
        : rawProgress % 1;

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
        <CircularRadarBadgeCalloutScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};
