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

export const floatingGoldGeometricDustThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type FloatingGoldGeometricDustThemePreset =
  (typeof floatingGoldGeometricDustThemePresets)[number];

export const floatingGoldGeometricDust4KSchema = z.object({
  themePreset: z.enum(floatingGoldGeometricDustThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type FloatingGoldGeometricDust4KProps = z.infer<
  typeof floatingGoldGeometricDust4KSchema
>;

export const defaultFloatingGoldGeometricDust4KProps: FloatingGoldGeometricDust4KProps =
  {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#F3D37A",
    secondaryColor: "#D4AF37",
    accentColor: "#FFF3C4",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const floatingGoldGeometricDust4KVariations: Record<
  FloatingGoldGeometricDustThemePreset,
  Omit<
    FloatingGoldGeometricDust4KProps,
    "aspectRatio" | "speedMultiplier" | "strokeWidth"
  >
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    backgroundColor: "transparent",
    primaryColor: "#E2E8F0",
    secondaryColor: "#94A3B8",
    accentColor: "#3B82F6",
  },
  "dark-tech": {
    themePreset: "dark-tech",
    backgroundColor: "transparent",
    primaryColor: "#38BDF8",
    secondaryColor: "#6366F1",
    accentColor: "#22D3EE",
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    backgroundColor: "transparent",
    primaryColor: "#FBBF24",
    secondaryColor: "#D97706",
    accentColor: "#FEF3C7",
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    backgroundColor: "transparent",
    primaryColor: "#F3D37A",
    secondaryColor: "#D4AF37",
    accentColor: "#FFF3C4",
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

function resolveThemeColors(props: FloatingGoldGeometricDust4KProps) {
  const preset = floatingGoldGeometricDust4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultFloatingGoldGeometricDust4KProps.primaryColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultFloatingGoldGeometricDust4KProps.secondaryColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultFloatingGoldGeometricDust4KProps.accentColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

function pseudoHash(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const PARTICLE_COUNT = 120;

const FloatingGoldDustScene: React.FC<{
  props: FloatingGoldGeometricDust4KProps;
  cycleProgress: number;
  angle: number;
}> = ({ props, cycleProgress, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const spreadX = isVertical ? 8.2 : 15.2;
  const spanY = isVertical ? 16.4 : 9.6;

  const triangleGeo = useMemo(
    () => new THREE.CylinderGeometry(0.11, 0.11, 0.024, 3),
    [],
  );
  const diamondGeo = useMemo(() => new THREE.IcosahedronGeometry(0.095, 0), []);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.88,
        roughness: 0.16,
        flatShading: true,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.92,
        roughness: 0.22,
        flatShading: true,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.85,
        roughness: 0.12,
        emissive: accentHex,
        emissiveIntensity: 0.35,
        flatShading: true,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      triangleGeo.dispose();
      diamondGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [triangleGeo, diamondGeo, materials]);

  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
      baseX: (pseudoHash(i * 7 + 1) - 0.5) * spreadX,
      baseU: pseudoHash(i * 7 + 2),
      z: (pseudoHash(i * 7 + 3) - 0.5) * 4.5,
      size: 0.55 + pseudoHash(i * 7 + 4) * 0.95,
      phase: pseudoHash(i * 7 + 5) * Math.PI * 2,
      rotSpeedX: pseudoHash(i * 7 + 6) > 0.5 ? 2 : -2,
      rotSpeedY: pseudoHash(i * 7 + 7) > 0.5 ? 3 : -3,
      isDiamond: i % 2 === 0,
      matIdx: i % 3,
      wraps: i % 4 === 0 ? 2 : 1,
    }));
  }, [spreadX]);

  return (
    <>
      <ambientLight intensity={0.78} />
      <directionalLight position={[7, 9, 12]} intensity={1.6} color="#ffffff" />
      <directionalLight position={[-8, -5, 10]} intensity={0.85} color={accentHex} />

      {particles.map((p, idx) => {
        const u = (p.baseU + cycleProgress * p.wraps) % 1;
        const y = -spanY * 0.5 + u * spanY;
        const x = p.baseX + Math.sin(angle + p.phase) * 0.45;
        const edgeFade = Math.min(1, Math.sin(u * Math.PI) * 3.2);
        const twinkle = 0.72 + 0.42 * Math.sin(angle * 3 + p.phase);
        const finalScale = p.size * edgeFade * twinkle;

        return (
          <mesh
            key={idx}
            geometry={p.isDiamond ? diamondGeo : triangleGeo}
            material={materials[p.matIdx]}
            position={[x, y, p.z]}
            rotation={[angle * p.rotSpeedX + p.phase, angle * p.rotSpeedY + p.phase, p.phase]}
            scale={[finalScale, finalScale, finalScale]}
          />
        );
      })}
    </>
  );
};

export const FloatingGoldGeometricDust4K: React.FC<
  FloatingGoldGeometricDust4KProps
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
        <FloatingGoldDustScene
          props={props}
          cycleProgress={cycleProgress}
          angle={angle}
        />
      </ThreeCanvas>
    </div>
  );
};
