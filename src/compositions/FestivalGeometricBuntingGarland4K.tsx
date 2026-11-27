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

export const festivalGeometricBuntingGarlandThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type FestivalGeometricBuntingGarlandThemePreset =
  (typeof festivalGeometricBuntingGarlandThemePresets)[number];

export const festivalGeometricBuntingGarland4KSchema = z.object({
  themePreset: z.enum(festivalGeometricBuntingGarlandThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type FestivalGeometricBuntingGarland4KProps = z.infer<
  typeof festivalGeometricBuntingGarland4KSchema
>;

export const defaultFestivalGeometricBuntingGarland4KProps: FestivalGeometricBuntingGarland4KProps =
  {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#F59E0B",
    secondaryColor: "#E07A5F",
    accentColor: "#D4AF37",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const festivalGeometricBuntingGarland4KVariations: Record<
  FestivalGeometricBuntingGarlandThemePreset,
  Omit<
    FestivalGeometricBuntingGarland4KProps,
    "aspectRatio" | "speedMultiplier" | "strokeWidth"
  >
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    backgroundColor: "transparent",
    primaryColor: "#2563EB",
    secondaryColor: "#38BDF8",
    accentColor: "#E2E8F0",
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
    primaryColor: "#F59E0B",
    secondaryColor: "#E07A5F",
    accentColor: "#D4AF37",
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    backgroundColor: "transparent",
    primaryColor: "#D4AF37",
    secondaryColor: "#E4E4E7",
    accentColor: "#F3D37A",
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

function resolveThemeColors(props: FestivalGeometricBuntingGarland4KProps) {
  const preset = festivalGeometricBuntingGarland4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultFestivalGeometricBuntingGarland4KProps.primaryColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultFestivalGeometricBuntingGarland4KProps.secondaryColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultFestivalGeometricBuntingGarland4KProps.accentColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

function evalStrandY(
  strandIdx: number,
  u: number,
  topY: number,
  sag: number,
  angle: number,
): number {
  const curve = Math.sin(u * Math.PI);
  const sway = Math.sin(angle + u * Math.PI + strandIdx * 1.4) * 0.08 * curve;
  return topY - curve * sag + sway;
}

const PENNANTS_PER_STRAND = 9;

const FestivalBuntingScene: React.FC<{
  props: FestivalGeometricBuntingGarland4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const spanX = isVertical ? 8.6 : 15.6;
  const topY = isVertical ? 7.6 : 4.25;

  const pennantGeo = useMemo(
    () => new THREE.CylinderGeometry(0.42, 0.42, 0.055, 3),
    [],
  );
  const claspGeo = useMemo(
    () => new RoundedBoxGeometry(0.68, 0.06, 0.09, 2, 0.015),
    [],
  );

  const materials = useMemo(() => {
    return [primaryHex, secondaryHex, accentHex].map(
      (col) =>
        new THREE.MeshStandardMaterial({
          color: col,
          metalness: 0.65,
          roughness: 0.24,
          flatShading: true,
        }),
    );
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      pennantGeo.dispose();
      claspGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [pennantGeo, claspGeo, materials]);

  const strands = [
    { topOffset: 0.15, sag: 0.95, z: 0.15 },
    { topOffset: -0.25, sag: 1.35, z: -0.15 },
  ];

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 12]} intensity={1.45} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.55} color={accentHex} />

      {strands.map((st, sIdx) =>
        Array.from({ length: PENNANTS_PER_STRAND }).map((_, pIdx) => {
          const u = (pIdx + 0.5 + (sIdx === 1 ? 0.35 : 0)) / PENNANTS_PER_STRAND;
          const clampedU = Math.min(0.95, Math.max(0.05, u));
          const x = (clampedU - 0.5) * spanX;
          const y = evalStrandY(
            sIdx,
            clampedU,
            topY + st.topOffset,
            st.sag,
            angle,
          );
          const swayZ = Math.sin(angle * 2 + pIdx * 0.55 + sIdx) * 0.12;
          const swayX = Math.cos(angle + pIdx * 0.4 + sIdx) * 0.18;

          return (
            <group
              key={`${sIdx}-${pIdx}`}
              position={[x, y, st.z]}
              rotation={[swayX, 0, swayZ]}
            >
              <mesh geometry={claspGeo} material={materials[2]} position={[0, 0, 0]} />
              <mesh
                geometry={pennantGeo}
                material={materials[(pIdx + sIdx) % 3]}
                position={[0, -0.21, 0]}
                rotation={[Math.PI * 0.5, 0, 0]}
              />
            </group>
          );
        }),
      )}
    </>
  );
};

export const FestivalGeometricBuntingGarland4K: React.FC<
  FestivalGeometricBuntingGarland4KProps
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

  const { accentHex, secondaryHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const spanX = isVertical ? 8.6 : 15.6;
  const topY = isVertical ? 7.6 : 4.25;
  const strokePx = Math.max(2, props.strokeWidth * 1.6);

  const buildPolyline = (strandIdx: number, topOffset: number, sag: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 48; i++) {
      const u = i / 48;
      const wx = (u - 0.5) * spanX;
      const wy = evalStrandY(strandIdx, u, topY + topOffset, sag, angle);
      const px = width * 0.5 + wx * zoom;
      const py = height * 0.5 - wy * zoom;
      pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
    }
    return pts.join(" ");
  };

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        backgroundColor: "transparent",
        overflow: "hidden",
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <polyline
          points={buildPolyline(0, 0.15, 0.95)}
          fill="none"
          stroke={accentHex}
          strokeOpacity={0.85}
          strokeWidth={strokePx}
        />
        <polyline
          points={buildPolyline(1, -0.25, 1.35)}
          fill="none"
          stroke={secondaryHex}
          strokeOpacity={0.75}
          strokeWidth={strokePx}
        />
      </svg>

      <ThreeCanvas
        width={width}
        height={height}
        orthographic
        dpr={1}
        camera={CAMERA_CONFIG}
        gl={GL_CONFIG}
        style={{ position: "absolute", inset: 0 }}
      >
        <OrthographicCameraRig zoom={zoom} />
        <FestivalBuntingScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
