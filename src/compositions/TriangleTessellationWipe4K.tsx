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

export const triangleTessellationThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type TriangleTessellationThemePreset =
  (typeof triangleTessellationThemePresets)[number];

export const triangleTessellationWipe4KSchema = z.object({
  themePreset: z.enum(triangleTessellationThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type TriangleTessellationWipe4KProps = z.infer<
  typeof triangleTessellationWipe4KSchema
>;

export const defaultTriangleTessellationWipe4KProps: TriangleTessellationWipe4KProps =
  {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#F5F0E6",
    secondaryColor: "#E5DAC8",
    accentColor: "#D97706",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const triangleTessellationWipe4KVariations: Record<
  TriangleTessellationThemePreset,
  Omit<
    TriangleTessellationWipe4KProps,
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

interface TriangleCell {
  key: string;
  x: number;
  y: number;
  isDown: boolean;
  delayNorm: number;
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

const TriangleTessellationScene: React.FC<{
  props: TriangleTessellationWipe4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset = triangleTessellationWipe4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultTriangleTessellationWipe4KProps.primaryColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultTriangleTessellationWipe4KProps.secondaryColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultTriangleTessellationWipe4KProps.accentColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const cols = isVertical ? 13 : 21;
  const rows = isVertical ? 15 : 8;
  const triRadius = isVertical ? 0.88 : 0.94;
  const depth = 0.2;

  const triGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(triRadius, triRadius * 0.94, depth, 3);
  }, [triRadius, depth]);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.22,
        roughness: 0.36,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.28,
        roughness: 0.3,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.44,
        roughness: 0.24,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      triGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [triGeometry, materials]);

  const cells = useMemo<TriangleCell[]>(() => {
    const list: TriangleCell[] = [];
    const baseW = triRadius * Math.sqrt(3);
    const triH = 1.5 * triRadius;
    const dx = baseW * 0.5;
    const totalW = (cols - 1) * dx;
    const totalH = (rows - 1) * triH;

    for (let r = 0; r < rows; r++) {
      const yBase = totalH * 0.5 - r * triH - triH * 0.5;
      for (let c = 0; c < cols; c++) {
        const isDown = (r + c) % 2 === 1;
        const x = -totalW * 0.5 + c * dx;
        const y = isDown ? yBase + triRadius : yBase + triRadius * 0.5;
        const delayNorm =
          (c / Math.max(1, cols - 1)) * 0.65 +
          (r / Math.max(1, rows - 1)) * 0.35;
        const hash = Math.abs(Math.sin((r + 2) * 23.17 + (c + 5) * 51.89));
        const matIndex = hash > 0.85 ? 2 : isDown ? 1 : 0;
        list.push({
          key: `tri-${r}-${c}`,
          x,
          y,
          isDown,
          delayNorm,
          matIndex,
        });
      }
    }
    return list;
  }, [cols, rows, triRadius]);

  const phaseDur = 0.24;
  const enterSpan = 0.42 - phaseDur;
  const exitStart = 0.58;
  const exitSpan = 1 - exitStart - phaseDur;

  return (
    <>
      <ambientLight intensity={0.78} />
      <directionalLight position={[6, 8, 12]} intensity={1.15} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.42} color={accentHex} />

      <group>
        {cells.map((cell) => {
          const inStart = cell.delayNorm * enterSpan;
          const inT = interpolate(progress, [inStart, inStart + phaseDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.cubic),
          });

          const outBegin = exitStart + cell.delayNorm * exitSpan;
          const outT = interpolate(progress, [outBegin, outBegin + phaseDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.cubic),
          });

          const scale =
            progress <= 0.5
              ? interpolate(inT, [0, 0.22, 1], [0, 1.03, 1.03], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              : interpolate(outT, [0, 0.78, 1], [1.03, 1.03, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });

          const spinZ = cell.isDown ? Math.PI : 0;
          const rotY =
            progress <= 0.5
              ? interpolate(inT, [0, 1], [Math.PI * 0.7, 0])
              : interpolate(outT, [0, 1], [0, -Math.PI * 0.7]);

          const zPos =
            progress <= 0.5
              ? Math.sin(inT * Math.PI) * 0.35
              : Math.sin(outT * Math.PI) * 0.35;

          const visible = scale > 0.002;

          return (
            <group
              key={cell.key}
              position={[cell.x, cell.y, zPos]}
              rotation={[0, rotY, spinZ]}
              scale={visible ? [scale, scale, scale] : [0.0001, 0.0001, 0.0001]}
              visible={visible}
            >
              <mesh
                geometry={triGeometry}
                material={materials[cell.matIndex]}
                rotation={[Math.PI / 2, 0, 0]}
              />
            </group>
          );
        })}
      </group>
    </>
  );
};

export const TriangleTessellationWipe4K: React.FC<
  TriangleTessellationWipe4KProps
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
        <TriangleTessellationScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

