import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
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

export const checkerboardFlipTransitionThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type CheckerboardFlipTransitionThemePreset =
  (typeof checkerboardFlipTransitionThemePresets)[number];

export const checkerboardFlipTransition4KSchema = z.object({
  themePreset: z.enum(checkerboardFlipTransitionThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type CheckerboardFlipTransition4KProps = z.infer<
  typeof checkerboardFlipTransition4KSchema
>;

export const defaultCheckerboardFlipTransition4KProps: CheckerboardFlipTransition4KProps =
  {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#FFFFFF",
    secondaryColor: "#E2E8F0",
    accentColor: "#2563EB",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const checkerboardFlipTransition4KVariations: Record<
  CheckerboardFlipTransitionThemePreset,
  Omit<
    CheckerboardFlipTransition4KProps,
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

interface CheckerCell {
  key: string;
  x: number;
  y: number;
  delayNorm: number;
  flipXAxis: boolean;
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

const CheckerboardFlipScene: React.FC<{
  props: CheckerboardFlipTransition4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset = checkerboardFlipTransition4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultCheckerboardFlipTransition4KProps.primaryColor &&
    props.themePreset !== "clean-corporate"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultCheckerboardFlipTransition4KProps.secondaryColor &&
    props.themePreset !== "clean-corporate"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultCheckerboardFlipTransition4KProps.accentColor &&
    props.themePreset !== "clean-corporate"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const cols = isVertical ? 7 : 12;
  const rows = isVertical ? 12 : 7;
  const worldW = isVertical ? 9 : 16;
  const worldH = isVertical ? 16 : 9;
  const tileW = worldW / cols;
  const tileH = worldH / rows;

  const tileGeometry = useMemo(() => {
    return new RoundedBoxGeometry(tileW * 1.03, tileH * 1.03, 0.16, 2, 0.03);
  }, [tileW, tileH]);

  const inlayGeometry = useMemo(() => {
    return new RoundedBoxGeometry(tileW * 0.72, tileH * 0.72, 0.18, 2, 0.02);
  }, [tileW, tileH]);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.24,
        roughness: 0.34,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.28,
        roughness: 0.3,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.45,
        roughness: 0.22,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      tileGeometry.dispose();
      inlayGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [tileGeometry, inlayGeometry, materials]);

  const cells = useMemo<CheckerCell[]>(() => {
    const list: CheckerCell[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = -worldW * 0.5 + (c + 0.5) * tileW;
        const y = worldH * 0.5 - (r + 0.5) * tileH;
        const isEven = (r + c) % 2 === 0;
        const waveNorm =
          (c / Math.max(1, cols - 1)) * 0.65 + (r / Math.max(1, rows - 1)) * 0.35;
        list.push({
          key: `checker-${r}-${c}`,
          x,
          y,
          delayNorm: waveNorm,
          flipXAxis: isEven,
          matIndex: isEven ? 0 : 1,
        });
      }
    }
    return list;
  }, [cols, rows, worldW, worldH, tileW, tileH]);

  const phaseDur = 0.24;
  const enterSpan = 0.42 - phaseDur;
  const exitStart = 0.58;
  const exitSpan = 1 - exitStart - phaseDur;

  return (
    <>
      <ambientLight intensity={0.78} />
      <directionalLight position={[6, 8, 12]} intensity={1.15} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.4} color={accentHex} />

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
              ? interpolate(inT, [0, 0.2, 1], [0, 1, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              : interpolate(outT, [0, 0.8, 1], [1, 1, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });

          const flipAngle =
            progress <= 0.5
              ? interpolate(inT, [0, 1], [-Math.PI, 0])
              : interpolate(outT, [0, 1], [0, Math.PI]);

          const rotX = cell.flipXAxis ? flipAngle : 0;
          const rotY = cell.flipXAxis ? 0 : flipAngle;
          const zPos =
            progress <= 0.5
              ? Math.sin(inT * Math.PI) * 0.4
              : Math.sin(outT * Math.PI) * 0.4;

          const visible = scale > 0.002;

          return (
            <group
              key={cell.key}
              position={[cell.x, cell.y, zPos]}
              rotation={[rotX, rotY, 0]}
              scale={visible ? [scale, scale, scale] : [0.0001, 0.0001, 0.0001]}
              visible={visible}
            >
              <mesh geometry={tileGeometry} material={materials[cell.matIndex]} />
              {!cell.flipXAxis && (
                <mesh geometry={inlayGeometry} material={materials[2]} />
              )}
            </group>
          );
        })}
      </group>
    </>
  );
};

export const CheckerboardFlipTransition4K: React.FC<
  CheckerboardFlipTransition4KProps
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
        <CheckerboardFlipScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

