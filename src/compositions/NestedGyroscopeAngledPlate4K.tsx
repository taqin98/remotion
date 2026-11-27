import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
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

export const nestedGyroscopeAngledPlateThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type NestedGyroscopeAngledPlateThemePreset =
  (typeof nestedGyroscopeAngledPlateThemePresets)[number];

export const nestedGyroscopeAngledPlate4KSchema = z.object({
  themePreset: z.enum(nestedGyroscopeAngledPlateThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type NestedGyroscopeAngledPlate4KProps = z.infer<
  typeof nestedGyroscopeAngledPlate4KSchema
>;

export const defaultNestedGyroscopeAngledPlate4KProps: NestedGyroscopeAngledPlate4KProps =
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

export const nestedGyroscopeAngledPlate4KVariations: Record<
  NestedGyroscopeAngledPlateThemePreset,
  Omit<
    NestedGyroscopeAngledPlate4KProps,
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

function resolveThemeColors(props: NestedGyroscopeAngledPlate4KProps) {
  const preset = nestedGyroscopeAngledPlate4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultNestedGyroscopeAngledPlate4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultNestedGyroscopeAngledPlate4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultNestedGyroscopeAngledPlate4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

const NestedGyroscopeScene: React.FC<{
  props: NestedGyroscopeAngledPlate4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);

  const isVertical = props.aspectRatio === "9:16";
  const anchorX = isVertical ? -3.15 : -5.95;
  const anchorY = isVertical ? -4.55 : -2.55;
  const uiScale = isVertical ? 0.88 : 1;

  const ringThick = 0.025 * props.strokeWidth;

  const outerRingGeometry = useMemo(() => {
    return new THREE.TorusGeometry(0.56, ringThick, 16, 48);
  }, [ringThick]);

  const middleRingGeometry = useMemo(() => {
    return new THREE.TorusGeometry(0.42, ringThick * 0.9, 16, 44);
  }, [ringThick]);

  const innerRingGeometry = useMemo(() => {
    return new THREE.TorusGeometry(0.28, ringThick * 0.8, 16, 36);
  }, [ringThick]);

  const coreCrystalGeometry = useMemo(() => {
    return new THREE.IcosahedronGeometry(0.14, 0);
  }, []);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.28,
        roughness: 0.4,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.34,
        roughness: 0.32,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.72,
        roughness: 0.18,
        emissive: accentHex,
        emissiveIntensity: 0.24,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      outerRingGeometry.dispose();
      middleRingGeometry.dispose();
      innerRingGeometry.dispose();
      coreCrystalGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [
    outerRingGeometry,
    middleRingGeometry,
    innerRingGeometry,
    coreCrystalGeometry,
    materials,
  ]);

  const gyroScale =
    progress <= 0.17
      ? interpolate(progress, [0, 0.1], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.9, 1], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const spin = progress * Math.PI * 2;
  const visible = gyroScale > 0.002;

  return (
    <>
      <ambientLight intensity={0.82} />
      <directionalLight position={[6, 8, 12]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.48} color={accentHex} />

      <group
        position={[anchorX, anchorY, 0.25]}
        scale={
          visible
            ? [gyroScale * uiScale, gyroScale * uiScale, gyroScale * uiScale]
            : [0.0001, 0.0001, 0.0001]
        }
        visible={visible}
      >
        <mesh
          geometry={outerRingGeometry}
          material={materials[1]}
          rotation={[spin, 0.4, 0]}
        />
        <mesh
          geometry={middleRingGeometry}
          material={materials[2]}
          rotation={[0.5, spin * 1.25, 0.2]}
        />
        <mesh
          geometry={innerRingGeometry}
          material={materials[0]}
          rotation={[-spin, 0.3, spin]}
        />
        <mesh
          geometry={coreCrystalGeometry}
          material={materials[2]}
          rotation={[spin * 0.5, -spin, 0]}
        />
      </group>
    </>
  );
};

export const NestedGyroscopeAngledPlate4K: React.FC<
  NestedGyroscopeAngledPlate4KProps
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

  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const anchorX = isVertical ? -3.15 : -5.95;
  const anchorY = isVertical ? -4.55 : -2.55;
  const uiScale = isVertical ? 0.88 : 1;

  const primaryWipe =
    cycleProgress <= 0.17
      ? interpolate(cycleProgress, [0.04, 0.14], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : cycleProgress >= 0.83
        ? interpolate(cycleProgress, [0.85, 0.96], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const secondaryWipe =
    cycleProgress <= 0.17
      ? interpolate(cycleProgress, [0.07, 0.17], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : cycleProgress >= 0.83
        ? interpolate(cycleProgress, [0.83, 0.93], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const barLeft = width * 0.5 + (anchorX + 0.74 * uiScale) * zoom;
  const pCenterY = height * 0.5 - (anchorY + 0.16 * uiScale) * zoom;
  const pW = 5.3 * uiScale * zoom;
  const pH = 0.68 * uiScale * zoom;
  const pTop = pCenterY - pH * 0.5;
  const pBot = pCenterY + pH * 0.5;

  const sCenterY = height * 0.5 - (anchorY - 0.4 * uiScale) * zoom;
  const sW = 3.9 * uiScale * zoom;
  const sH = 0.36 * uiScale * zoom;
  const sTop = sCenterY - sH * 0.5;
  const sBot = sCenterY + sH * 0.5;

  const strokePx = Math.max(1.5, props.strokeWidth * 1.5 * uiScale);

  const primaryPoints = [
    `${barLeft},${pTop}`,
    `${barLeft + pW},${pTop}`,
    `${barLeft + pW - pH},${pBot}`,
    `${barLeft},${pBot}`,
  ].join(" ");

  const stripeW = 0.16 * uiScale * zoom;
  const stripeOffset = 0.12 * uiScale * zoom;
  const stripePoints = [
    `${barLeft + pW + stripeOffset},${pTop}`,
    `${barLeft + pW + stripeOffset + stripeW},${pTop}`,
    `${barLeft + pW + stripeOffset + stripeW - pH},${pBot}`,
    `${barLeft + pW + stripeOffset - pH},${pBot}`,
  ].join(" ");

  const secondaryPoints = [
    `${barLeft},${sTop}`,
    `${barLeft + sW},${sTop}`,
    `${barLeft + sW - sH},${sBot}`,
    `${barLeft},${sBot}`,
  ].join(" ");

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        backgroundColor: "transparent",
        overflow: "hidden",
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
      >
        <defs>
          <clipPath id="gyroPrimaryClip">
            <rect
              x={barLeft - 10}
              y={pTop - 20}
              width={(pW + stripeOffset + stripeW + 30) * primaryWipe}
              height={pH + 40}
            />
          </clipPath>
          <clipPath id="gyroSecondaryClip">
            <rect
              x={barLeft - 10}
              y={sTop - 20}
              width={(sW + 20) * secondaryWipe}
              height={sH + 40}
            />
          </clipPath>
        </defs>

        {primaryWipe > 0.002 && (
          <g clipPath="url(#gyroPrimaryClip)">
            <polygon
              points={primaryPoints}
              fill={primaryHex}
              fillOpacity={0.94}
              stroke={accentHex}
              strokeWidth={strokePx}
            />
            <line
              x1={barLeft}
              y1={pTop}
              x2={barLeft + pW}
              y2={pTop}
              stroke={accentHex}
              strokeWidth={strokePx * 2}
            />
            <polygon points={stripePoints} fill={accentHex} />
          </g>
        )}

        {secondaryWipe > 0.002 && (
          <g clipPath="url(#gyroSecondaryClip)">
            <polygon
              points={secondaryPoints}
              fill={secondaryHex}
              fillOpacity={0.92}
            />
          </g>
        )}
      </svg>

      <ThreeCanvas
        width={width}
        height={height}
        orthographic
        dpr={1}
        camera={CAMERA_CONFIG}
        gl={GL_CONFIG}
        style={{ position: "absolute", inset: 0 }}
      >
        <OrthographicCameraRig zoom={zoom} />
        <NestedGyroscopeScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};
