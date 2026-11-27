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

export const wireframeGlobeHologram3DThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type WireframeGlobeHologram3DThemePreset =
  (typeof wireframeGlobeHologram3DThemePresets)[number];

export const wireframeGlobeHologram3D4KSchema = z.object({
  themePreset: z.enum(wireframeGlobeHologram3DThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type WireframeGlobeHologram3D4KProps = z.infer<
  typeof wireframeGlobeHologram3D4KSchema
>;

export const defaultWireframeGlobeHologram3D4KProps: WireframeGlobeHologram3D4KProps =
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

export const wireframeGlobeHologram3D4KVariations: Record<
  WireframeGlobeHologram3DThemePreset,
  Omit<
    WireframeGlobeHologram3D4KProps,
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

function resolveThemeColors(props: WireframeGlobeHologram3D4KProps) {
  const preset = wireframeGlobeHologram3D4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultWireframeGlobeHologram3D4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultWireframeGlobeHologram3D4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultWireframeGlobeHologram3D4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

const ORBIT_RINGS: Array<{ rot: [number, number, number]; speed: number }> = [
  { rot: [1.1, 0.4, 0], speed: 1 },
  { rot: [-0.9, -0.5, 0.3], speed: -2 },
  { rot: [0.3, 1.2, -0.6], speed: 1 },
];

const WireframeGlobeScene: React.FC<{
  props: WireframeGlobeHologram3D4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const uiScale = isVertical ? 0.78 : 1;

  const globeRadius = 2.05;
  const orbitRadius = 2.75;

  const globeGeo = useMemo(
    () => new THREE.SphereGeometry(globeRadius, 24, 16),
    [globeRadius],
  );
  const coreGeo = useMemo(
    () => new THREE.SphereGeometry(globeRadius * 0.96, 24, 16),
    [globeRadius],
  );
  const dotGeo = useMemo(() => new THREE.SphereGeometry(0.055, 10, 10), []);
  const orbitRingGeo = useMemo(
    () => new THREE.TorusGeometry(orbitRadius, 0.022 * props.strokeWidth, 14, 72),
    [orbitRadius, props.strokeWidth],
  );
  const satBodyGeo = useMemo(() => new THREE.SphereGeometry(0.11, 16, 16), []);
  const satWingGeo = useMemo(
    () => new RoundedBoxGeometry(0.36, 0.08, 0.04, 2, 0.01),
    [],
  );

  const materials = useMemo(() => {
    return [
      new THREE.MeshBasicMaterial({
        color: accentHex,
        wireframe: true,
        transparent: true,
        opacity: 0.42,
      }),
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.3,
        roughness: 0.45,
        transparent: true,
        opacity: 0.25,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.7,
        roughness: 0.18,
        emissive: accentHex,
        emissiveIntensity: 0.38,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.45,
        roughness: 0.3,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      globeGeo.dispose();
      coreGeo.dispose();
      dotGeo.dispose();
      orbitRingGeo.dispose();
      satBodyGeo.dispose();
      satWingGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [
    globeGeo,
    coreGeo,
    dotGeo,
    orbitRingGeo,
    satBodyGeo,
    satWingGeo,
    materials,
  ]);

  const surfaceDots = useMemo(() => {
    const pts: Array<[number, number, number]> = [];
    const latSteps = 8;
    for (let lat = 1; lat < latSteps; lat++) {
      const phi = (lat / latSteps) * Math.PI;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      const lonCount = Math.max(6, Math.round(sinPhi * 18));
      for (let lon = 0; lon < lonCount; lon++) {
        const theta = (lon / lonCount) * Math.PI * 2;
        pts.push([
          globeRadius * sinPhi * Math.cos(theta),
          globeRadius * cosPhi,
          globeRadius * sinPhi * Math.sin(theta),
        ]);
      }
    }
    return pts;
  }, [globeRadius]);

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 12]} intensity={1.3} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.5} color={accentHex} />

      <group scale={[uiScale, uiScale, uiScale]}>
        <group rotation={[0.22, angle, 0.1]}>
          <mesh geometry={coreGeo} material={materials[1]} />
          <mesh geometry={globeGeo} material={materials[0]} />
          {surfaceDots.map(([dx, dy, dz], idx) => (
            <mesh
              key={idx}
              geometry={dotGeo}
              material={idx % 3 === 0 ? materials[2] : materials[3]}
              position={[dx, dy, dz]}
            />
          ))}
        </group>

        {ORBIT_RINGS.map((ring, idx) => {
          const satAngle = angle * ring.speed + idx * 2.1;
          const sx = Math.cos(satAngle) * orbitRadius;
          const sy = Math.sin(satAngle) * orbitRadius;
          return (
            <group key={idx} rotation={ring.rot}>
              <mesh geometry={orbitRingGeo} material={materials[2]} />
              <group position={[sx, sy, 0]} rotation={[0, 0, satAngle]}>
                <mesh geometry={satBodyGeo} material={materials[2]} />
                <mesh geometry={satWingGeo} material={materials[3]} />
              </group>
            </group>
          );
        })}
      </group>
    </>
  );
};

export const WireframeGlobeHologram3D4K: React.FC<
  WireframeGlobeHologram3D4KProps
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
        <WireframeGlobeScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
