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

export const gyroscopeCompassSphere3DThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type GyroscopeCompassSphere3DThemePreset =
  (typeof gyroscopeCompassSphere3DThemePresets)[number];

export const gyroscopeCompassSphere3D4KSchema = z.object({
  themePreset: z.enum(gyroscopeCompassSphere3DThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type GyroscopeCompassSphere3D4KProps = z.infer<
  typeof gyroscopeCompassSphere3D4KSchema
>;

export const defaultGyroscopeCompassSphere3D4KProps: GyroscopeCompassSphere3D4KProps =
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

export const gyroscopeCompassSphere3D4KVariations: Record<
  GyroscopeCompassSphere3DThemePreset,
  Omit<
    GyroscopeCompassSphere3D4KProps,
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

function resolveThemeColors(props: GyroscopeCompassSphere3D4KProps) {
  const preset = gyroscopeCompassSphere3D4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultGyroscopeCompassSphere3D4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultGyroscopeCompassSphere3D4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultGyroscopeCompassSphere3D4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

const GIMBAL_RADII = [2.85, 2.3, 1.75, 1.2];

const GyroscopeCompassScene: React.FC<{
  props: GyroscopeCompassSphere3D4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const uiScale = isVertical ? 0.78 : 1;

  const tube = 0.055 * Math.max(0.6, props.strokeWidth * 0.55);

  const ringGeos = useMemo(
    () => GIMBAL_RADII.map((r) => new THREE.TorusGeometry(r, tube, 18, 64)),
    [tube],
  );
  const notchGeo = useMemo(
    () => new RoundedBoxGeometry(0.11, 0.22, 0.16, 2, 0.02),
    [],
  );
  const coreGeo = useMemo(() => new THREE.IcosahedronGeometry(0.42, 0), []);
  const pointerGeo = useMemo(() => new THREE.ConeGeometry(0.14, 0.48, 12), []);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.52,
        roughness: 0.26,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.58,
        roughness: 0.24,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.72,
        roughness: 0.18,
        emissive: accentHex,
        emissiveIntensity: 0.3,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      ringGeos.forEach((g) => g.dispose());
      notchGeo.dispose();
      coreGeo.dispose();
      pointerGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [ringGeos, notchGeo, coreGeo, pointerGeo, materials]);

  const rotations: [number, number, number][] = [
    [angle, 0.4, 0],
    [0.3, -angle * 2, 0.5],
    [-angle, 0.6, angle],
    [angle * 2, -angle, 0.2],
  ];

  return (
    <>
      <ambientLight intensity={0.88} />
      <directionalLight position={[6, 8, 12]} intensity={1.35} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.5} color={accentHex} />

      <group scale={[uiScale, uiScale, uiScale]}>
        {GIMBAL_RADII.map((r, rIdx) => (
          <group key={rIdx} rotation={rotations[rIdx]}>
            <mesh
              geometry={ringGeos[rIdx]}
              material={rIdx % 2 === 0 ? materials[0] : materials[1]}
            />
            {Array.from({ length: 8 }).map((_, nIdx) => {
              const theta = (nIdx / 8) * Math.PI * 2;
              return (
                <group key={nIdx} rotation={[0, 0, theta]}>
                  <mesh
                    geometry={notchGeo}
                    material={nIdx % 2 === 0 ? materials[2] : materials[1]}
                    position={[0, r, 0]}
                  />
                </group>
              );
            })}
          </group>
        ))}

        {/* Central compass core + 4 cardinal pointers */}
        <group rotation={[angle * 0.5, angle, 0]}>
          <mesh geometry={coreGeo} material={materials[2]} />
          <mesh
            geometry={pointerGeo}
            material={materials[2]}
            position={[0, 0.64, 0]}
          />
          <mesh
            geometry={pointerGeo}
            material={materials[1]}
            position={[0, -0.64, 0]}
            rotation={[0, 0, Math.PI]}
          />
          <mesh
            geometry={pointerGeo}
            material={materials[1]}
            position={[0.64, 0, 0]}
            rotation={[0, 0, -Math.PI * 0.5]}
          />
          <mesh
            geometry={pointerGeo}
            material={materials[1]}
            position={[-0.64, 0, 0]}
            rotation={[0, 0, Math.PI * 0.5]}
          />
        </group>
      </group>
    </>
  );
};

export const GyroscopeCompassSphere3D4K: React.FC<
  GyroscopeCompassSphere3D4KProps
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
        <GyroscopeCompassScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
