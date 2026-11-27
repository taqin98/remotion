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

export const floatingStreamersRibbons3DThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type FloatingStreamersRibbons3DThemePreset =
  (typeof floatingStreamersRibbons3DThemePresets)[number];

export const floatingStreamersRibbons3D4KSchema = z.object({
  themePreset: z.enum(floatingStreamersRibbons3DThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type FloatingStreamersRibbons3D4KProps = z.infer<
  typeof floatingStreamersRibbons3D4KSchema
>;

export const defaultFloatingStreamersRibbons3D4KProps: FloatingStreamersRibbons3D4KProps =
  {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#D4AF37",
    secondaryColor: "#38BDF8",
    accentColor: "#F472B6",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const floatingStreamersRibbons3D4KVariations: Record<
  FloatingStreamersRibbons3DThemePreset,
  Omit<
    FloatingStreamersRibbons3D4KProps,
    "aspectRatio" | "speedMultiplier" | "strokeWidth"
  >
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    backgroundColor: "transparent",
    primaryColor: "#2563EB",
    secondaryColor: "#93C5FD",
    accentColor: "#E2E8F0",
  },
  "dark-tech": {
    themePreset: "dark-tech",
    backgroundColor: "transparent",
    primaryColor: "#38BDF8",
    secondaryColor: "#818CF8",
    accentColor: "#22D3EE",
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    backgroundColor: "transparent",
    primaryColor: "#F59E0B",
    secondaryColor: "#E07A5F",
    accentColor: "#FDE047",
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    backgroundColor: "transparent",
    primaryColor: "#D4AF37",
    secondaryColor: "#38BDF8",
    accentColor: "#F472B6",
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

  useLayoutEffect(() => {
    camera.position.set(0, 0, 12);
    camera.zoom = zoom;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, zoom]);

  return null;
};

function resolveThemeColors(props: FloatingStreamersRibbons3D4KProps) {
  const preset = floatingStreamersRibbons3D4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultFloatingStreamersRibbons3D4KProps.primaryColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultFloatingStreamersRibbons3D4KProps.secondaryColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultFloatingStreamersRibbons3D4KProps.accentColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

function pseudoHash(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const STREAMER_COUNT = 18;
const RIBBON_SEGS_Y = 44;

const FloatingStreamersScene: React.FC<{
  props: FloatingStreamersRibbons3D4KProps;
  cycleProgress: number;
  angle: number;
}> = ({ props, cycleProgress, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const spreadX = isVertical ? 7.8 : 14.4;
  const spanY = isVertical ? 17.6 : 11.4;

  const ribbonGeos = useMemo(() => {
    return Array.from({ length: STREAMER_COUNT }).map(
      () => new THREE.PlaneGeometry(0.24, 2.8, 2, RIBBON_SEGS_Y),
    );
  }, []);

  const materials = useMemo(() => {
    return [primaryHex, secondaryHex, accentHex].map(
      (col) =>
        new THREE.MeshStandardMaterial({
          color: col,
          metalness: 0.85,
          roughness: 0.2,
          side: THREE.DoubleSide,
        }),
    );
  }, [primaryHex, secondaryHex, accentHex]);

  const streamers = useMemo(() => {
    return Array.from({ length: STREAMER_COUNT }).map((_, i) => ({
      baseX: (pseudoHash(i * 6 + 1) - 0.5) * spreadX,
      baseU: pseudoHash(i * 6 + 2),
      z: (pseudoHash(i * 6 + 3) - 0.5) * 4.0,
      scale: 0.72 + pseudoHash(i * 6 + 4) * 0.58,
      phase: pseudoHash(i * 6 + 5) * Math.PI * 2,
      tiltZ: (pseudoHash(i * 6 + 6) - 0.5) * 0.65,
      matIdx: i % 3,
    }));
  }, [spreadX]);

  useLayoutEffect(() => {
    const cols = 3;
    ribbonGeos.forEach((geo, sIdx) => {
      const pos = geo.attributes.position;
      const phase = streamers[sIdx].phase;
      for (let i = 0; i < pos.count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const v = row / RIBBON_SEGS_Y;
        const y = (v - 0.5) * 2.8;
        const twist = v * Math.PI * 3.5 + angle * 2 + phase;
        const wOffset = (col / (cols - 1) - 0.5) * 0.24;
        const x = Math.cos(twist) * (0.2 + wOffset);
        const z = Math.sin(twist) * (0.2 + wOffset);
        pos.setXYZ(i, x, y, z);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    });
  }, [ribbonGeos, streamers, angle]);

  useEffect(() => {
    return () => {
      ribbonGeos.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    };
  }, [ribbonGeos, materials]);

  return (
    <>
      <ambientLight intensity={0.82} />
      <directionalLight position={[6, 9, 12]} intensity={1.55} color="#ffffff" />
      <directionalLight position={[-6, -5, 8]} intensity={0.65} color={accentHex} />

      {streamers.map((s, idx) => {
        const u = (s.baseU + cycleProgress) % 1;
        const y = spanY * 0.5 - u * spanY;
        const x = s.baseX + Math.sin(angle + s.phase) * 0.65;
        const edgeFade = Math.min(1, Math.sin(u * Math.PI) * 2.8);
        const sc = s.scale * edgeFade;

        return (
          <mesh
            key={idx}
            geometry={ribbonGeos[idx]}
            material={materials[s.matIdx]}
            position={[x, y, s.z]}
            rotation={[0, 0, s.tiltZ + Math.sin(angle + s.phase) * 0.18]}
            scale={[sc, sc, sc]}
          />
        );
      })}
    </>
  );
};

export const FloatingStreamersRibbons3D4K: React.FC<
  FloatingStreamersRibbons3D4KProps
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
        <FloatingStreamersScene
          props={props}
          cycleProgress={cycleProgress}
          angle={angle}
        />
      </ThreeCanvas>
    </div>
  );
};
