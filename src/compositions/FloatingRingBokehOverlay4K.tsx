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

export const floatingRingBokehOverlayThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type FloatingRingBokehOverlayThemePreset =
  (typeof floatingRingBokehOverlayThemePresets)[number];

export const floatingRingBokehOverlay4KSchema = z.object({
  themePreset: z.enum(floatingRingBokehOverlayThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type FloatingRingBokehOverlay4KProps = z.infer<
  typeof floatingRingBokehOverlay4KSchema
>;

export const defaultFloatingRingBokehOverlay4KProps: FloatingRingBokehOverlay4KProps =
  {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#38BDF8",
    secondaryColor: "#6366F1",
    accentColor: "#22D3EE",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const floatingRingBokehOverlay4KVariations: Record<
  FloatingRingBokehOverlayThemePreset,
  Omit<
    FloatingRingBokehOverlay4KProps,
    "aspectRatio" | "speedMultiplier" | "strokeWidth"
  >
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    backgroundColor: "transparent",
    primaryColor: "#93C5FD",
    secondaryColor: "#DBEAFE",
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
    primaryColor: "#FDE68A",
    secondaryColor: "#FDBA74",
    accentColor: "#F59E0B",
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    backgroundColor: "transparent",
    primaryColor: "#F3D37A",
    secondaryColor: "#E4E4E7",
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

function resolveThemeColors(props: FloatingRingBokehOverlay4KProps) {
  const preset = floatingRingBokehOverlay4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultFloatingRingBokehOverlay4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultFloatingRingBokehOverlay4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultFloatingRingBokehOverlay4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

function pseudoHash(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const RING_COUNT = 32;

const FloatingRingBokehScene: React.FC<{
  props: FloatingRingBokehOverlay4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";

  const ringGeo = useMemo(
    () =>
      new THREE.TorusGeometry(
        0.52,
        0.032 * Math.max(0.6, props.strokeWidth * 0.5),
        16,
        48,
      ),
    [props.strokeWidth],
  );

  const materials = useMemo(() => {
    return [primaryHex, secondaryHex, accentHex].map(
      (col) =>
        new THREE.MeshPhysicalMaterial({
          color: col,
          transmission: 0.62,
          roughness: 0.18,
          clearcoat: 1,
          ior: 1.46,
          transparent: true,
          opacity: 0.62,
        }),
    );
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      ringGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [ringGeo, materials]);

  const rings = useMemo(() => {
    return Array.from({ length: RING_COUNT }).map((_, i) => {
      const theta = (i / RING_COUNT) * Math.PI * 2 + (pseudoHash(i * 6 + 1) - 0.5) * 0.25;
      const jitter = pseudoHash(i * 6 + 2);
      const rx = isVertical ? 3.2 + jitter * 1.1 : 5.4 + jitter * 2.2;
      const ry = isVertical ? 5.4 + jitter * 2.2 : 2.9 + jitter * 1.4;
      return {
        baseX: Math.cos(theta) * rx,
        baseY: Math.sin(theta) * ry,
        z: (pseudoHash(i * 6 + 3) - 0.5) * 3.6,
        scale: 0.65 + pseudoHash(i * 6 + 4) * 1.15,
        phase: pseudoHash(i * 6 + 5) * Math.PI * 2,
        tiltSign: pseudoHash(i * 6 + 6) > 0.5 ? 1 : -1,
        matIdx: i % 3,
      };
    });
  }, [isVertical]);

  return (
    <>
      <ambientLight intensity={0.88} />
      <directionalLight position={[6, 8, 12]} intensity={1.3} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.6} color={accentHex} />

      {rings.map((r, idx) => {
        const x = r.baseX + Math.sin(angle + r.phase) * 0.48;
        const y = r.baseY + Math.cos(angle + r.phase) * 0.36;
        const sc = r.scale * (0.9 + 0.14 * Math.sin(angle * 2 + r.phase));

        return (
          <mesh
            key={idx}
            geometry={ringGeo}
            material={materials[r.matIdx]}
            position={[x, y, r.z]}
            rotation={[
              Math.sin(angle + r.phase) * 0.45 * r.tiltSign,
              Math.cos(angle + r.phase) * 0.45 * r.tiltSign,
              0,
            ]}
            scale={[sc, sc, sc]}
          />
        );
      })}
    </>
  );
};

export const FloatingRingBokehOverlay4K: React.FC<
  FloatingRingBokehOverlay4KProps
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
        <FloatingRingBokehScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
