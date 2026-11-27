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

export const starfieldWarpParticlesThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type StarfieldWarpParticlesThemePreset =
  (typeof starfieldWarpParticlesThemePresets)[number];

export const starfieldWarpParticles4KSchema = z.object({
  themePreset: z.enum(starfieldWarpParticlesThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type StarfieldWarpParticles4KProps = z.infer<
  typeof starfieldWarpParticles4KSchema
>;

export const defaultStarfieldWarpParticles4KProps: StarfieldWarpParticles4KProps =
  {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#FFFFFF",
    secondaryColor: "#38BDF8",
    accentColor: "#22D3EE",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const starfieldWarpParticles4KVariations: Record<
  StarfieldWarpParticlesThemePreset,
  Omit<
    StarfieldWarpParticles4KProps,
    "aspectRatio" | "speedMultiplier" | "strokeWidth"
  >
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    backgroundColor: "transparent",
    primaryColor: "#FFFFFF",
    secondaryColor: "#93C5FD",
    accentColor: "#2563EB",
  },
  "dark-tech": {
    themePreset: "dark-tech",
    backgroundColor: "transparent",
    primaryColor: "#FFFFFF",
    secondaryColor: "#38BDF8",
    accentColor: "#22D3EE",
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    backgroundColor: "transparent",
    primaryColor: "#FEF3C7",
    secondaryColor: "#F59E0B",
    accentColor: "#FDE047",
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    backgroundColor: "transparent",
    primaryColor: "#FFFFFF",
    secondaryColor: "#D4AF37",
    accentColor: "#F3D37A",
  },
};

const CAMERA_CONFIG = {
  position: [0, 0, 6] as [number, number, number],
  fov: 55,
  near: 0.1,
  far: 100,
};

const GL_CONFIG = {
  antialias: true,
  alpha: true,
};

const PerspectiveCameraRig: React.FC<{ fov: number }> = ({ fov }) => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    const persp = camera as THREE.PerspectiveCamera;
    persp.position.set(0, 0, 6);
    persp.fov = fov;
    persp.lookAt(0, 0, 0);
    persp.updateProjectionMatrix();
  }, [camera, fov]);

  return null;
};

function resolveThemeColors(props: StarfieldWarpParticles4KProps) {
  const preset = starfieldWarpParticles4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor === defaultStarfieldWarpParticles4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultStarfieldWarpParticles4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultStarfieldWarpParticles4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

function pseudoHash(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const STAR_COUNT = 120;

const StarfieldWarpScene: React.FC<{
  props: StarfieldWarpParticles4KProps;
  cycleProgress: number;
}> = ({ props, cycleProgress }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);

  const streakGeo = useMemo(
    () =>
      new THREE.CapsuleGeometry(
        0.025 * Math.max(0.6, props.strokeWidth * 0.5),
        0.55,
        6,
        10,
      ),
    [props.strokeWidth],
  );
  const headGeo = useMemo(() => new THREE.IcosahedronGeometry(0.055, 0), []);

  const materials = useMemo(() => {
    return [primaryHex, secondaryHex, accentHex].map(
      (col) =>
        new THREE.MeshStandardMaterial({
          color: col,
          metalness: 0.3,
          roughness: 0.2,
          emissive: col,
          emissiveIntensity: 0.72,
        }),
    );
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      streakGeo.dispose();
      headGeo.dispose();
      materials.forEach((m) => m.dispose());
    };
  }, [streakGeo, headGeo, materials]);

  const stars = useMemo(() => {
    return Array.from({ length: STAR_COUNT }).map((_, i) => {
      const theta = pseudoHash(i * 5 + 1) * Math.PI * 2;
      const radial = 0.55 + pseudoHash(i * 5 + 2) * 4.5;
      return {
        x: Math.cos(theta) * radial,
        y: Math.sin(theta) * radial,
        baseU: pseudoHash(i * 5 + 3),
        wraps: i % 3 === 0 ? 2 : 1,
        scale: 0.65 + pseudoHash(i * 5 + 4) * 0.7,
        matIdx: i % 3,
      };
    });
  }, []);

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 6, 10]} intensity={1.2} color="#ffffff" />

      {stars.map((s, idx) => {
        const u = (s.baseU + cycleProgress * s.wraps) % 1;
        const z = -18 + u * 23.2;
        const edgeFade = Math.min(1, Math.sin(u * Math.PI) * 2.8);
        const sc = s.scale * edgeFade;

        return (
          <group key={idx} position={[s.x, s.y, z]} scale={[sc, sc, sc * (0.6 + u * 0.9)]}>
            <mesh
              geometry={streakGeo}
              material={materials[s.matIdx]}
              rotation={[Math.PI * 0.5, 0, 0]}
            />
            <mesh
              geometry={headGeo}
              material={materials[s.matIdx]}
              position={[0, 0, 0.28]}
            />
          </group>
        );
      })}
    </>
  );
};

export const StarfieldWarpParticles4K: React.FC<
  StarfieldWarpParticles4KProps
> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const progress =
    ((frame % durationInFrames) / durationInFrames) * props.speedMultiplier;
  const cycleProgress = progress % 1;
  const fov = props.aspectRatio === "9:16" ? 65 : 55;

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
        dpr={1}
        camera={CAMERA_CONFIG}
        gl={GL_CONFIG}
      >
        <PerspectiveCameraRig fov={fov} />
        <StarfieldWarpScene props={props} cycleProgress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};
