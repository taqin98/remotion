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

export const prismLightLeakEdgeOverlayThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type PrismLightLeakEdgeOverlayThemePreset =
  (typeof prismLightLeakEdgeOverlayThemePresets)[number];

export const prismLightLeakEdgeOverlay4KSchema = z.object({
  themePreset: z.enum(prismLightLeakEdgeOverlayThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type PrismLightLeakEdgeOverlay4KProps = z.infer<
  typeof prismLightLeakEdgeOverlay4KSchema
>;

export const defaultPrismLightLeakEdgeOverlay4KProps: PrismLightLeakEdgeOverlay4KProps =
  {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#38BDF8",
    secondaryColor: "#EC4899",
    accentColor: "#F59E0B",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const prismLightLeakEdgeOverlay4KVariations: Record<
  PrismLightLeakEdgeOverlayThemePreset,
  Omit<
    PrismLightLeakEdgeOverlay4KProps,
    "aspectRatio" | "speedMultiplier" | "strokeWidth"
  >
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    backgroundColor: "transparent",
    primaryColor: "#E0F2FE",
    secondaryColor: "#93C5FD",
    accentColor: "#38BDF8",
  },
  "dark-tech": {
    themePreset: "dark-tech",
    backgroundColor: "transparent",
    primaryColor: "#38BDF8",
    secondaryColor: "#EC4899",
    accentColor: "#F59E0B",
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    backgroundColor: "transparent",
    primaryColor: "#FDE68A",
    secondaryColor: "#FB923C",
    accentColor: "#F43F5E",
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    backgroundColor: "transparent",
    primaryColor: "#FFFFFF",
    secondaryColor: "#F3D37A",
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

function resolveThemeColors(props: PrismLightLeakEdgeOverlay4KProps) {
  const preset = prismLightLeakEdgeOverlay4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultPrismLightLeakEdgeOverlay4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultPrismLightLeakEdgeOverlay4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultPrismLightLeakEdgeOverlay4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

function pseudoHash(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const PRISM_COUNT = 14;

const PrismLightLeakScene: React.FC<{
  props: PrismLightLeakEdgeOverlay4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const edgeX = isVertical ? 3.85 : 7.15;
  const spanY = isVertical ? 13.5 : 7.2;

  const prismGeo = useMemo(
    () => new THREE.CylinderGeometry(0.68, 0.68, 1.85, 3),
    [],
  );

  const materials = useMemo(() => {
    return [primaryHex, secondaryHex, accentHex].map(
      (col) =>
        new THREE.MeshPhysicalMaterial({
          color: col,
          transmission: 0.78,
          roughness: 0.1,
          ior: 1.55,
          thickness: 1.4,
          clearcoat: 1,
          iridescence: 1,
          iridescenceIOR: 1.35,
          iridescenceThicknessRange: [100, 700],
          emissive: col,
          emissiveIntensity: 0.18,
          transparent: true,
          opacity: 0.72,
        }),
    );
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      prismGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [prismGeo, materials]);

  const prisms = useMemo(() => {
    return Array.from({ length: PRISM_COUNT }).map((_, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      const sideNorm = Math.floor(i / 2) / (PRISM_COUNT / 2 - 1) - 0.5;
      return {
        baseX: side * (edgeX + (pseudoHash(i * 6 + 1) - 0.5) * 0.8),
        baseY: sideNorm * spanY,
        z: (pseudoHash(i * 6 + 2) - 0.5) * 2.5,
        scale: 0.8 + pseudoHash(i * 6 + 3) * 0.7,
        phase: pseudoHash(i * 6 + 4) * Math.PI * 2,
        rotSign: pseudoHash(i * 6 + 5) > 0.5 ? 1 : -1,
        matIdx: i % 3,
      };
    });
  }, [edgeX, spanY]);

  const lightX = Math.cos(angle) * 8;
  const lightY = Math.sin(angle) * 6;

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[lightX, lightY, 12]} intensity={1.6} color={primaryHex} />
      <directionalLight position={[-lightX, -lightY, 10]} intensity={1.3} color={secondaryHex} />
      <directionalLight position={[0, 8, 8]} intensity={0.9} color={accentHex} />

      {prisms.map((p, idx) => {
        const y = p.baseY + Math.sin(angle + p.phase) * 0.45;
        const x = p.baseX + Math.cos(angle + p.phase) * 0.25;
        return (
          <mesh
            key={idx}
            geometry={prismGeo}
            material={materials[p.matIdx]}
            position={[x, y, p.z]}
            rotation={[
              angle * p.rotSign + p.phase,
              angle * 0.5 + p.phase,
              p.phase * 0.4,
            ]}
            scale={[p.scale, p.scale, p.scale]}
          />
        );
      })}
    </>
  );
};

export const PrismLightLeakEdgeOverlay4K: React.FC<
  PrismLightLeakEdgeOverlay4KProps
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
        <PrismLightLeakScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
