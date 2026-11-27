import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
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

export const biometricHexagonScannerThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type BiometricHexagonScannerThemePreset =
  (typeof biometricHexagonScannerThemePresets)[number];

export const biometricHexagonScanner4KSchema = z.object({
  themePreset: z.enum(biometricHexagonScannerThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type BiometricHexagonScanner4KProps = z.infer<
  typeof biometricHexagonScanner4KSchema
>;

export const defaultBiometricHexagonScanner4KProps: BiometricHexagonScanner4KProps =
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

export const biometricHexagonScanner4KVariations: Record<
  BiometricHexagonScannerThemePreset,
  Omit<
    BiometricHexagonScanner4KProps,
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

  React.useLayoutEffect(() => {
    camera.position.set(0, 0, 12);
    camera.zoom = zoom;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, zoom]);

  return null;
};

function resolveThemeColors(props: BiometricHexagonScanner4KProps) {
  const preset = biometricHexagonScanner4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor === defaultBiometricHexagonScanner4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultBiometricHexagonScanner4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultBiometricHexagonScanner4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

const BiometricHexagonScene: React.FC<{
  props: BiometricHexagonScanner4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const uiScale = isVertical ? 0.78 : 1;

  const tubeScale = Math.max(0.6, props.strokeWidth * 0.55);

  const outerHexFrameGeo = useMemo(
    () => new THREE.TorusGeometry(2.6, 0.065 * tubeScale, 16, 6),
    [tubeScale],
  );
  const innerHexFrameGeo = useMemo(
    () => new THREE.TorusGeometry(1.95, 0.04 * tubeScale, 14, 6),
    [tubeScale],
  );
  const hexTileGeo = useMemo(
    () => new THREE.CylinderGeometry(0.31, 0.31, 0.12, 6),
    [],
  );
  const laserPlaneGeo = useMemo(
    () => new RoundedBoxGeometry(4.6, 0.055 * props.strokeWidth, 0.45, 2, 0.02),
    [props.strokeWidth],
  );

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.36,
        roughness: 0.38,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.44,
        roughness: 0.3,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.72,
        roughness: 0.18,
        emissive: accentHex,
        emissiveIntensity: 0.42,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.6,
        roughness: 0.2,
        emissive: accentHex,
        emissiveIntensity: 0.55,
        transparent: true,
        opacity: 0.75,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      outerHexFrameGeo.dispose();
      innerHexFrameGeo.dispose();
      hexTileGeo.dispose();
      laserPlaneGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [
    outerHexFrameGeo,
    innerHexFrameGeo,
    hexTileGeo,
    laserPlaneGeo,
    materials,
  ]);

  const hexCells = useMemo(() => {
    const cells: Array<{ x: number; y: number }> = [];
    const hexStep = 0.72;
    for (let q = -2; q <= 2; q++) {
      for (let r = -2; r <= 2; r++) {
        if (Math.abs(q + r) <= 2) {
          cells.push({
            x: hexStep * (q + r * 0.5),
            y: hexStep * (Math.sqrt(3) * 0.5 * r),
          });
        }
      }
    }
    return cells;
  }, []);

  const scanY1 = Math.sin(angle * 2) * 2.0;
  const scanY2 = -Math.sin(angle * 2) * 2.0;

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 12]} intensity={1.3} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.5} color={accentHex} />

      <group scale={[uiScale, uiScale, uiScale]}>
        <mesh
          geometry={outerHexFrameGeo}
          material={materials[0]}
          rotation={[0, 0, Math.PI / 6]}
        />
        <mesh
          geometry={innerHexFrameGeo}
          material={materials[1]}
          rotation={[0, 0, Math.PI / 6]}
          position={[0, 0, 0.08]}
        />

        {hexCells.map((cell, i) => {
          const d = Math.min(Math.abs(cell.y - scanY1), Math.abs(cell.y - scanY2));
          const lit = Math.max(0, 1 - d / 0.55);
          const sc = 0.92 + lit * 0.2;
          return (
            <mesh
              key={i}
              geometry={hexTileGeo}
              material={lit > 0.45 ? materials[2] : materials[1]}
              position={[cell.x, cell.y, lit * 0.16]}
              rotation={[Math.PI * 0.5, 0, 0]}
              scale={[sc, 1, sc]}
            />
          );
        })}

        {/* Dual vertical scanning laser planes */}
        <mesh
          geometry={laserPlaneGeo}
          material={materials[3]}
          position={[0, scanY1, 0.28]}
        />
        <mesh
          geometry={laserPlaneGeo}
          material={materials[3]}
          position={[0, scanY2, 0.28]}
        />
      </group>
    </>
  );
};

export const BiometricHexagonScanner4K: React.FC<
  BiometricHexagonScanner4KProps
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

  const { secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const uiScale = isVertical ? 0.78 : 1;

  const cx = width * 0.5;
  const cy = height * 0.5;
  const hexR = 2.95 * uiScale * zoom;
  const strokePx = Math.max(1.4, props.strokeWidth * 1.4 * uiScale);

  const hexPts = Array.from({ length: 6 })
    .map((_, i) => {
      const a = (i * Math.PI) / 3 - Math.PI / 2;
      return `${(cx + Math.cos(a) * hexR).toFixed(1)},${(cy + Math.sin(a) * hexR).toFixed(1)}`;
    })
    .join(" ");

  const barXOffset = 3.1 * uiScale * zoom;
  const barH = 3.2 * uiScale * zoom;

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
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <polygon
          points={hexPts}
          fill="none"
          stroke={accentHex}
          strokeOpacity={0.55}
          strokeWidth={strokePx}
        />

        {/* Side vertical biometric scale ticks */}
        {[-1, 1].map((side) => (
          <g key={side}>
            <line
              x1={cx + side * barXOffset}
              y1={cy - barH * 0.5}
              x2={cx + side * barXOffset}
              y2={cy + barH * 0.5}
              stroke={secondaryHex}
              strokeOpacity={0.6}
              strokeWidth={strokePx}
            />
            {Array.from({ length: 13 }).map((_, t) => {
              const ty = cy - barH * 0.5 + (t / 12) * barH;
              const tickLen = (t % 3 === 0 ? 0.16 : 0.08) * uiScale * zoom;
              return (
                <line
                  key={t}
                  x1={cx + side * barXOffset}
                  y1={ty}
                  x2={cx + side * (barXOffset + tickLen)}
                  y2={ty}
                  stroke={t % 3 === 0 ? accentHex : secondaryHex}
                  strokeOpacity={0.75}
                  strokeWidth={strokePx * 0.9}
                />
              );
            })}
          </g>
        ))}
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
        <BiometricHexagonScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
