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

export const hexagonalBokehDepthOverlayThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type HexagonalBokehDepthOverlayThemePreset =
  (typeof hexagonalBokehDepthOverlayThemePresets)[number];

export const hexagonalBokehDepthOverlay4KSchema = z.object({
  themePreset: z.enum(hexagonalBokehDepthOverlayThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type HexagonalBokehDepthOverlay4KProps = z.infer<
  typeof hexagonalBokehDepthOverlay4KSchema
>;

export const defaultHexagonalBokehDepthOverlay4KProps: HexagonalBokehDepthOverlay4KProps =
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

export const hexagonalBokehDepthOverlay4KVariations: Record<
  HexagonalBokehDepthOverlayThemePreset,
  Omit<
    HexagonalBokehDepthOverlay4KProps,
    "aspectRatio" | "speedMultiplier" | "strokeWidth"
  >
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    backgroundColor: "transparent",
    primaryColor: "#E0F2FE",
    secondaryColor: "#93C5FD",
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
    secondaryColor: "#D4AF37",
    accentColor: "#E4E4E7",
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

function resolveThemeColors(props: HexagonalBokehDepthOverlay4KProps) {
  const preset = hexagonalBokehDepthOverlay4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultHexagonalBokehDepthOverlay4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultHexagonalBokehDepthOverlay4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultHexagonalBokehDepthOverlay4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

function pseudoHash(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const BOKEH_COUNT = 36;

const HexagonalBokehScene: React.FC<{
  props: HexagonalBokehDepthOverlay4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const spreadX = isVertical ? 7.6 : 14.2;
  const spreadY = isVertical ? 14.2 : 7.6;

  const hexDiscGeo = useMemo(
    () => new THREE.CylinderGeometry(0.55, 0.55, 0.04, 6),
    [],
  );
  const hexRimGeo = useMemo(
    () => new THREE.TorusGeometry(0.55, 0.025 * Math.max(0.6, props.strokeWidth * 0.5), 12, 6),
    [props.strokeWidth],
  );

  const materials = useMemo(() => {
    return [
      new THREE.MeshPhysicalMaterial({
        color: primaryHex,
        transmission: 0.65,
        roughness: 0.25,
        clearcoat: 1,
        ior: 1.45,
        transparent: true,
        opacity: 0.45,
      }),
      new THREE.MeshPhysicalMaterial({
        color: secondaryHex,
        transmission: 0.6,
        roughness: 0.28,
        clearcoat: 1,
        ior: 1.45,
        transparent: true,
        opacity: 0.38,
      }),
      new THREE.MeshPhysicalMaterial({
        color: accentHex,
        transmission: 0.68,
        roughness: 0.2,
        clearcoat: 1,
        ior: 1.45,
        transparent: true,
        opacity: 0.52,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      hexDiscGeo.dispose();
      hexRimGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [hexDiscGeo, hexRimGeo, materials]);

  const items = useMemo(() => {
    return Array.from({ length: BOKEH_COUNT }).map((_, i) => {
      const layer = i % 3;
      const baseScale = layer === 0 ? 0.55 : layer === 1 ? 1.05 : 1.75;
      const z = layer === 0 ? -3.2 : layer === 1 ? 0 : 2.6;
      return {
        baseX: (pseudoHash(i * 6 + 1) - 0.5) * spreadX,
        baseY: (pseudoHash(i * 6 + 2) - 0.5) * spreadY,
        z,
        scale: baseScale * (0.8 + pseudoHash(i * 6 + 3) * 0.4),
        phase: pseudoHash(i * 6 + 4) * Math.PI * 2,
        ampX: 0.45 + pseudoHash(i * 6 + 5) * 0.55,
        ampY: 0.35 + pseudoHash(i * 6 + 6) * 0.45,
        matIdx: i % 3,
      };
    });
  }, [spreadX, spreadY]);

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[6, 8, 12]} intensity={1.35} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.65} color={accentHex} />

      {items.map((item, idx) => {
        const x = item.baseX + Math.sin(angle + item.phase) * item.ampX;
        const y = item.baseY + Math.cos(angle + item.phase) * item.ampY;
        const breathe = 1 + Math.sin(angle * 2 + item.phase) * 0.1;
        const sc = item.scale * breathe;

        return (
          <group
            key={idx}
            position={[x, y, item.z]}
            rotation={[Math.sin(angle + item.phase) * 0.16, Math.cos(angle + item.phase) * 0.16, item.phase * 0.25]}
            scale={[sc, sc, sc]}
          >
            <mesh
              geometry={hexDiscGeo}
              material={materials[item.matIdx]}
              rotation={[Math.PI * 0.5, 0, 0]}
            />
            <mesh
              geometry={hexRimGeo}
              material={materials[item.matIdx]}
              rotation={[0, 0, Math.PI / 6]}
            />
          </group>
        );
      })}
    </>
  );
};

export const HexagonalBokehDepthOverlay4K: React.FC<
  HexagonalBokehDepthOverlay4KProps
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
        <HexagonalBokehScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
