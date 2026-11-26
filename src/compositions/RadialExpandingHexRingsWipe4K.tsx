import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
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

export const radialExpandingHexRingsThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type RadialExpandingHexRingsThemePreset =
  (typeof radialExpandingHexRingsThemePresets)[number];

export const radialExpandingHexRingsWipe4KSchema = z.object({
  themePreset: z.enum(radialExpandingHexRingsThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type RadialExpandingHexRingsWipe4KProps = z.infer<
  typeof radialExpandingHexRingsWipe4KSchema
>;

export const defaultRadialExpandingHexRingsWipe4KProps: RadialExpandingHexRingsWipe4KProps =
  {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#1E293B",
    secondaryColor: "#334155",
    accentColor: "#38BDF8",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const radialExpandingHexRingsWipe4KVariations: Record<
  RadialExpandingHexRingsThemePreset,
  Omit<
    RadialExpandingHexRingsWipe4KProps,
    "aspectRatio" | "speedMultiplier" | "strokeWidth"
  >
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    backgroundColor: "transparent",
    primaryColor: "#FFFFFF",
    secondaryColor: "#E2E8F0",
    accentColor: "#2563EB",
  },
  "dark-tech": {
    themePreset: "dark-tech",
    backgroundColor: "transparent",
    primaryColor: "#1E293B",
    secondaryColor: "#334155",
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
    accentColor: "#E4E4E7",
  },
};

interface HexRingCell {
  key: string;
  x: number;
  y: number;
  ringNorm: number;
  matIndex: number;
}

const CAMERA_CONFIG = {
  position: [0, 0, 10] as [number, number, number],
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
    camera.position.set(0, 0, 10);
    camera.zoom = zoom;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, zoom]);

  return null;
};

const RadialExpandingHexRingsScene: React.FC<{
  props: RadialExpandingHexRingsWipe4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset = radialExpandingHexRingsWipe4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultRadialExpandingHexRingsWipe4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultRadialExpandingHexRingsWipe4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultRadialExpandingHexRingsWipe4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const cols = isVertical ? 11 : 15;
  const rows = isVertical ? 17 : 9;
  const radius = isVertical ? 0.62 : 0.72;
  const depth = 0.24;

  const hexGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(radius, radius * 0.94, depth, 6);
  }, [radius, depth]);

  const innerRingGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(radius * 0.66, radius * 0.66, depth + 0.02, 6);
  }, [radius, depth]);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.28,
        roughness: 0.35,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.34,
        roughness: 0.3,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.5,
        roughness: 0.22,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      hexGeometry.dispose();
      innerRingGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [hexGeometry, innerRingGeometry, materials]);

  const cells = useMemo<HexRingCell[]>(() => {
    const list: HexRingCell[] = [];
    const dx = radius * Math.sqrt(3);
    const dy = radius * 1.5;
    const totalW = (cols - 1) * dx;
    const totalH = (rows - 1) * dy;
    const maxDist = Math.hypot(totalW * 0.55, totalH * 0.55);

    for (let r = 0; r < rows; r++) {
      const rowOffset = r % 2 === 1 ? dx * 0.5 : 0;
      for (let c = 0; c < cols; c++) {
        const x = -totalW * 0.5 + c * dx + rowOffset - dx * 0.25;
        const y = totalH * 0.5 - r * dy;
        const dist = Math.hypot(x, y);
        const ringBand = Math.round((dist / Math.max(0.01, maxDist)) * 7);
        const ringNorm = Math.min(1, ringBand / 7);
        const matIndex = ringBand % 3 === 1 ? 2 : ringBand % 2;
        list.push({
          key: `hex-ring-${r}-${c}`,
          x,
          y,
          ringNorm,
          matIndex,
        });
      }
    }
    return list;
  }, [cols, rows, radius]);

  const phaseDur = 0.22;
  const enterSpan = 0.42 - phaseDur;
  const exitStart = 0.58;
  const exitSpan = 1 - exitStart - phaseDur;

  return (
    <>
      <ambientLight intensity={0.76} />
      <directionalLight position={[6, 8, 12]} intensity={1.15} color="#ffffff" />
      <directionalLight position={[-6, -5, 8]} intensity={0.44} color={accentHex} />

      <group>
        {cells.map((cell) => {
          const inStart = cell.ringNorm * enterSpan;
          const inT = interpolate(progress, [inStart, inStart + phaseDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });

          const outBegin = exitStart + cell.ringNorm * exitSpan;
          const outT = interpolate(progress, [outBegin, outBegin + phaseDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          });

          const scale =
            progress <= 0.5
              ? interpolate(inT, [0, 1], [0, 1.03])
              : interpolate(outT, [0, 1], [1.03, 0]);

          const zPos =
            progress <= 0.5
              ? Math.sin(inT * Math.PI) * 0.42
              : Math.sin(outT * Math.PI) * 0.42;

          const rotZ =
            progress <= 0.5
              ? interpolate(inT, [0, 1], [-Math.PI / 6, 0])
              : interpolate(outT, [0, 1], [0, Math.PI / 6]);

          const visible = scale > 0.002;

          return (
            <group
              key={cell.key}
              position={[cell.x, cell.y, zPos]}
              rotation={[0, 0, rotZ]}
              scale={visible ? [scale, scale, scale] : [0.0001, 0.0001, 0.0001]}
              visible={visible}
            >
              <mesh
                geometry={hexGeometry}
                material={materials[cell.matIndex]}
                rotation={[Math.PI / 2, 0, 0]}
              />
              {cell.matIndex === 2 && (
                <mesh
                  geometry={innerRingGeometry}
                  material={materials[0]}
                  rotation={[Math.PI / 2, 0, 0]}
                />
              )}
            </group>
          );
        })}
      </group>
    </>
  );
};

export const RadialExpandingHexRingsWipe4K: React.FC<
  RadialExpandingHexRingsWipe4KProps
> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const lastFrame = Math.max(1, durationInFrames - 1);
  const rawProgress = (frame / lastFrame) * props.speedMultiplier;
  const cycleProgress =
    props.speedMultiplier === 1
      ? Math.min(1, Math.max(0, rawProgress))
      : rawProgress >= props.speedMultiplier
        ? 1
        : rawProgress % 1;

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
        <RadialExpandingHexRingsScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

