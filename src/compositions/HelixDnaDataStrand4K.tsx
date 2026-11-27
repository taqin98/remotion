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

export const helixDnaDataStrandThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type HelixDnaDataStrandThemePreset =
  (typeof helixDnaDataStrandThemePresets)[number];

export const helixDnaDataStrand4KSchema = z.object({
  themePreset: z.enum(helixDnaDataStrandThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type HelixDnaDataStrand4KProps = z.infer<
  typeof helixDnaDataStrand4KSchema
>;

export const defaultHelixDnaDataStrand4KProps: HelixDnaDataStrand4KProps = {
  themePreset: "dark-tech",
  aspectRatio: "16:9",
  backgroundColor: "transparent",
  primaryColor: "#0F172A",
  secondaryColor: "#1E293B",
  accentColor: "#38BDF8",
  speedMultiplier: 1,
  strokeWidth: 2,
};

export const helixDnaDataStrand4KVariations: Record<
  HelixDnaDataStrandThemePreset,
  Omit<
    HelixDnaDataStrand4KProps,
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

function resolveThemeColors(props: HelixDnaDataStrand4KProps) {
  const preset = helixDnaDataStrand4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor === defaultHelixDnaDataStrand4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor === defaultHelixDnaDataStrand4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultHelixDnaDataStrand4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

const LEVELS = 24;
const HELIX_RADIUS = 1.35;
const HELIX_HEIGHT = 6.6;

const HelixDnaScene: React.FC<{
  props: HelixDnaDataStrand4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const uiScale = isVertical ? 0.92 : 1;

  const strandSphereGeo = useMemo(() => new THREE.SphereGeometry(0.16, 24, 24), []);
  const beadSphereGeo = useMemo(() => new THREE.SphereGeometry(0.075, 16, 16), []);
  const centerNodeGeo = useMemo(() => new THREE.SphereGeometry(0.085, 16, 16), []);
  const rungGeo = useMemo(() => {
    const r = 0.032 * Math.max(0.6, props.strokeWidth * 0.55);
    return new THREE.CylinderGeometry(r, r, HELIX_RADIUS, 12);
  }, [props.strokeWidth]);

  const materials = useMemo(() => {
    return [
      new THREE.MeshPhysicalMaterial({
        color: accentHex,
        metalness: 0.45,
        roughness: 0.16,
        clearcoat: 1,
        emissive: accentHex,
        emissiveIntensity: 0.25,
      }),
      new THREE.MeshPhysicalMaterial({
        color: primaryHex,
        metalness: 0.35,
        roughness: 0.22,
        clearcoat: 0.9,
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
      strandSphereGeo.dispose();
      beadSphereGeo.dispose();
      centerNodeGeo.dispose();
      rungGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [strandSphereGeo, beadSphereGeo, centerNodeGeo, rungGeo, materials]);

  return (
    <>
      <ambientLight intensity={0.88} />
      <directionalLight position={[6, 8, 12]} intensity={1.35} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.55} color={accentHex} />

      <group
        rotation={[0, angle, 0.14]}
        scale={[uiScale, uiScale, uiScale]}
      >
        {Array.from({ length: LEVELS }).map((_, i) => {
          const t = i / (LEVELS - 1);
          const y = (t - 0.5) * HELIX_HEIGHT;
          const twist = t * Math.PI * 2.5;

          const subSteps = i < LEVELS - 1 ? [0.33, 0.67] : [];

          return (
            <React.Fragment key={i}>
              <group position={[0, y, 0]} rotation={[0, twist, 0]}>
                <mesh
                  geometry={strandSphereGeo}
                  material={materials[0]}
                  position={[HELIX_RADIUS, 0, 0]}
                />
                <mesh
                  geometry={strandSphereGeo}
                  material={materials[1]}
                  position={[-HELIX_RADIUS, 0, 0]}
                />
                <mesh
                  geometry={rungGeo}
                  material={materials[2]}
                  position={[HELIX_RADIUS * 0.5, 0, 0]}
                  rotation={[0, 0, Math.PI * 0.5]}
                />
                <mesh
                  geometry={rungGeo}
                  material={materials[2]}
                  position={[-HELIX_RADIUS * 0.5, 0, 0]}
                  rotation={[0, 0, Math.PI * 0.5]}
                />
                <mesh
                  geometry={centerNodeGeo}
                  material={materials[0]}
                  position={[0, 0, 0]}
                />
              </group>

              {subSteps.map((s, si) => {
                const st = (i + s) / (LEVELS - 1);
                const sy = (st - 0.5) * HELIX_HEIGHT;
                const sTwist = st * Math.PI * 2.5;
                return (
                  <group key={si} position={[0, sy, 0]} rotation={[0, sTwist, 0]}>
                    <mesh
                      geometry={beadSphereGeo}
                      material={materials[0]}
                      position={[HELIX_RADIUS, 0, 0]}
                    />
                    <mesh
                      geometry={beadSphereGeo}
                      material={materials[1]}
                      position={[-HELIX_RADIUS, 0, 0]}
                    />
                  </group>
                );
              })}
            </React.Fragment>
          );
        })}
      </group>
    </>
  );
};

export const HelixDnaDataStrand4K: React.FC<HelixDnaDataStrand4KProps> = (
  props,
) => {
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
        <HelixDnaScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
