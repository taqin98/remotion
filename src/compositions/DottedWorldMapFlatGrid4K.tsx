import React, { useEffect, useMemo } from "react";
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

export const dottedWorldMapFlatGridThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type DottedWorldMapFlatGridThemePreset =
  (typeof dottedWorldMapFlatGridThemePresets)[number];

export const dottedWorldMapFlatGrid4KSchema = z.object({
  themePreset: z.enum(dottedWorldMapFlatGridThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type DottedWorldMapFlatGrid4KProps = z.infer<
  typeof dottedWorldMapFlatGrid4KSchema
>;

export const defaultDottedWorldMapFlatGrid4KProps: DottedWorldMapFlatGrid4KProps =
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

export const dottedWorldMapFlatGrid4KVariations: Record<
  DottedWorldMapFlatGridThemePreset,
  Omit<
    DottedWorldMapFlatGrid4KProps,
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

function resolveThemeColors(props: DottedWorldMapFlatGrid4KProps) {
  const preset = dottedWorldMapFlatGrid4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor === defaultDottedWorldMapFlatGrid4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultDottedWorldMapFlatGrid4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultDottedWorldMapFlatGrid4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

function isLandMask(u: number, v: number): boolean {
  const regions: Array<[number, number, number, number]> = [
    [0.2, 0.72, 0.13, 0.16], // North America
    [0.26, 0.56, 0.06, 0.08], // Central America
    [0.31, 0.32, 0.08, 0.19], // South America
    [0.49, 0.76, 0.09, 0.11], // Europe
    [0.52, 0.45, 0.09, 0.21], // Africa
    [0.69, 0.7, 0.18, 0.18], // Asia
    [0.78, 0.48, 0.07, 0.09], // SE Asia / India
    [0.82, 0.27, 0.08, 0.1], // Australia
    [0.36, 0.87, 0.05, 0.05], // Greenland
  ];
  return regions.some(([cx, cy, rx, ry]) => {
    const dx = (u - cx) / rx;
    const dy = (v - cy) / ry;
    return dx * dx + dy * dy <= 1.0;
  });
}

const BEACONS: Array<{ wx: number; wy: number; phase: number }> = [
  { wx: -3.2, wy: 1.1, phase: 0 },
  { wx: -0.1, wy: 1.4, phase: 1.3 },
  { wx: 0.4, wy: -0.4, phase: 2.5 },
  { wx: 2.9, wy: 1.0, phase: 3.8 },
  { wx: 3.7, wy: -1.3, phase: 5.0 },
];

const DottedWorldMapScene: React.FC<{
  props: DottedWorldMapFlatGrid4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const uiScale = isVertical ? 0.65 : 1;

  const dotGeo = useMemo(
    () => new THREE.CylinderGeometry(0.068, 0.068, 0.08, 12),
    [],
  );
  const beaconRingGeo = useMemo(
    () => new THREE.TorusGeometry(0.28, 0.02 * props.strokeWidth, 12, 36),
    [props.strokeWidth],
  );
  const beaconPinGeo = useMemo(
    () => new THREE.CylinderGeometry(0.025, 0.025, 0.65, 10),
    [],
  );
  const beaconHeadGeo = useMemo(() => new THREE.SphereGeometry(0.085, 14, 14), []);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.35,
        roughness: 0.4,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.42,
        roughness: 0.32,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.72,
        roughness: 0.18,
        emissive: accentHex,
        emissiveIntensity: 0.4,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      dotGeo.dispose();
      beaconRingGeo.dispose();
      beaconPinGeo.dispose();
      beaconHeadGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [dotGeo, beaconRingGeo, beaconPinGeo, beaconHeadGeo, materials]);

  const mapDots = useMemo(() => {
    const dots: Array<{ wx: number; wy: number; idx: number }> = [];
    const cols = 38;
    const rows = 18;
    const mapW = 11.4;
    const mapH = 5.4;
    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const u = c / (cols - 1);
        const v = r / (rows - 1);
        if (isLandMask(u, v)) {
          dots.push({
            wx: (u - 0.5) * mapW,
            wy: (v - 0.5) * mapH,
            idx: idx++,
          });
        }
      }
    }
    return dots;
  }, []);

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 12]} intensity={1.3} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.5} color={accentHex} />

      <group
        rotation={[-0.38, Math.sin(angle) * 0.08, 0]}
        scale={[uiScale, uiScale, uiScale]}
      >
        {mapDots.map((d) => {
          const zLift = Math.sin(d.wx * 0.65 - angle * 2 + d.wy * 0.45) * 0.2;
          return (
            <mesh
              key={d.idx}
              geometry={dotGeo}
              material={d.idx % 7 === 0 ? materials[2] : materials[1]}
              position={[d.wx, d.wy, zLift]}
              rotation={[Math.PI * 0.5, 0, 0]}
            />
          );
        })}

        {BEACONS.map((b, i) => {
          const zBase = Math.sin(b.wx * 0.65 - angle * 2 + b.wy * 0.45) * 0.2;
          const ringPulse = 0.65 + 0.6 * (0.5 + 0.5 * Math.sin(angle * 2 + b.phase));
          return (
            <group key={i} position={[b.wx, b.wy, zBase + 0.05]}>
              <mesh
                geometry={beaconRingGeo}
                material={materials[2]}
                scale={[ringPulse, ringPulse, 1]}
              />
              <mesh
                geometry={beaconPinGeo}
                material={materials[2]}
                position={[0, 0, 0.325]}
                rotation={[Math.PI * 0.5, 0, 0]}
              />
              <mesh
                geometry={beaconHeadGeo}
                material={materials[2]}
                position={[0, 0, 0.66]}
              />
            </group>
          );
        })}
      </group>
    </>
  );
};

export const DottedWorldMapFlatGrid4K: React.FC<
  DottedWorldMapFlatGrid4KProps
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
        <DottedWorldMapScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
