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

export const orbitingSatelliteConstellationThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type OrbitingSatelliteConstellationThemePreset =
  (typeof orbitingSatelliteConstellationThemePresets)[number];

export const orbitingSatelliteConstellation4KSchema = z.object({
  themePreset: z.enum(orbitingSatelliteConstellationThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type OrbitingSatelliteConstellation4KProps = z.infer<
  typeof orbitingSatelliteConstellation4KSchema
>;

export const defaultOrbitingSatelliteConstellation4KProps: OrbitingSatelliteConstellation4KProps =
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

export const orbitingSatelliteConstellation4KVariations: Record<
  OrbitingSatelliteConstellationThemePreset,
  Omit<
    OrbitingSatelliteConstellation4KProps,
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

function resolveThemeColors(props: OrbitingSatelliteConstellation4KProps) {
  const preset = orbitingSatelliteConstellation4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultOrbitingSatelliteConstellation4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultOrbitingSatelliteConstellation4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultOrbitingSatelliteConstellation4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

const ORBIT_CONFIGS: Array<{
  rot: [number, number, number];
  speed: number;
  phase: number;
}> = [
  { rot: [0.65, 0.2, 0.1], speed: 1, phase: 0 },
  { rot: [-0.55, 0.4, 1.05], speed: -1, phase: 1.05 },
  { rot: [0.4, -0.6, 2.1], speed: 2, phase: 2.1 },
  { rot: [1.05, 0.35, -0.5], speed: -2, phase: 3.15 },
  { rot: [-0.85, -0.45, 0.7], speed: 1, phase: 4.2 },
  { rot: [0.25, 0.95, 1.4], speed: -1, phase: 5.25 },
];

const OrbitingSatelliteScene: React.FC<{
  props: OrbitingSatelliteConstellation4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const uiScale = isVertical ? 0.72 : 1;

  const orbitR = 2.55;
  const scaleX = 1.25;
  const scaleY = 0.82;

  const pathGeo = useMemo(
    () => new THREE.TorusGeometry(orbitR, 0.018 * props.strokeWidth, 12, 72),
    [orbitR, props.strokeWidth],
  );
  const bodyGeo = useMemo(() => new THREE.IcosahedronGeometry(0.16, 0), []);
  const wingGeo = useMemo(
    () => new RoundedBoxGeometry(0.56, 0.12, 0.03, 2, 0.01),
    [],
  );
  const signalRingGeo = useMemo(
    () => new THREE.TorusGeometry(0.28, 0.016 * props.strokeWidth, 12, 32),
    [props.strokeWidth],
  );

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.45,
        roughness: 0.3,
        transparent: true,
        opacity: 0.65,
      }),
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.38,
        roughness: 0.34,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.72,
        roughness: 0.18,
        emissive: accentHex,
        emissiveIntensity: 0.38,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      pathGeo.dispose();
      bodyGeo.dispose();
      wingGeo.dispose();
      signalRingGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [pathGeo, bodyGeo, wingGeo, signalRingGeo, materials]);

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 12]} intensity={1.3} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.5} color={accentHex} />

      <group scale={[uiScale, uiScale, uiScale]}>
        {ORBIT_CONFIGS.map((cfg, i) => {
          const theta = angle * cfg.speed + cfg.phase;
          const sx = scaleX * orbitR * Math.cos(theta);
          const sy = scaleY * orbitR * Math.sin(theta);
          const pulse = 0.75 + 0.35 * Math.sin(angle * 2 + cfg.phase);

          return (
            <group key={i} rotation={cfg.rot}>
              <mesh
                geometry={pathGeo}
                material={i % 2 === 0 ? materials[0] : materials[2]}
                scale={[scaleX, scaleY, 1]}
              />
              <group position={[sx, sy, 0]} rotation={[0, 0, theta]}>
                <mesh geometry={bodyGeo} material={materials[2]} />
                <mesh geometry={wingGeo} material={materials[1]} />
                <mesh
                  geometry={signalRingGeo}
                  material={materials[2]}
                  scale={[pulse, pulse, 1]}
                />
              </group>
            </group>
          );
        })}
      </group>
    </>
  );
};

export const OrbitingSatelliteConstellation4K: React.FC<
  OrbitingSatelliteConstellation4KProps
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

  const { accentHex } = resolveThemeColors(props);
  const cx = width * 0.5;
  const cy = height * 0.5;
  const d = 18;

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
      {/* Subtle central invisible-core crosshair reticle */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <g stroke={accentHex} strokeOpacity={0.4} strokeWidth={2}>
          <line x1={cx - d} y1={cy} x2={cx + d} y2={cy} />
          <line x1={cx} y1={cy - d} x2={cx} y2={cy + d} />
          <circle cx={cx} cy={cy} r={d * 1.4} fill="none" />
        </g>
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
        <OrbitingSatelliteScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
