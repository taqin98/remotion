import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
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

export const steppingStaircaseWipeThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type SteppingStaircaseWipeThemePreset =
  (typeof steppingStaircaseWipeThemePresets)[number];

export const steppingStaircaseWipe4KSchema = z.object({
  themePreset: z.enum(steppingStaircaseWipeThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type SteppingStaircaseWipe4KProps = z.infer<
  typeof steppingStaircaseWipe4KSchema
>;

export const defaultSteppingStaircaseWipe4KProps: SteppingStaircaseWipe4KProps = {
  themePreset: "monochrome-luxury",
  aspectRatio: "16:9",
  backgroundColor: "transparent",
  primaryColor: "#18181B",
  secondaryColor: "#3F3F46",
  accentColor: "#E4E4E7",
  speedMultiplier: 1,
  strokeWidth: 2,
};

export const steppingStaircaseWipe4KVariations: Record<
  SteppingStaircaseWipeThemePreset,
  Omit<SteppingStaircaseWipe4KProps, "aspectRatio" | "speedMultiplier" | "strokeWidth">
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

const SteppingStaircaseScene: React.FC<{
  props: SteppingStaircaseWipe4KProps;
  localFrame: number;
  cycleFrames: number;
}> = ({ props, localFrame, cycleFrames }) => {
  const { fps } = useVideoConfig();
  const preset = steppingStaircaseWipe4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor === defaultSteppingStaircaseWipe4KProps.primaryColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultSteppingStaircaseWipe4KProps.secondaryColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultSteppingStaircaseWipe4KProps.accentColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const barCount = 10;
  const worldW = isVertical ? 10 : 17.2;
  const worldH = isVertical ? 16.4 : 9.4;
  const barH = (worldH / barCount) * 1.08;

  const barGeometry = useMemo(() => {
    return new RoundedBoxGeometry(worldW, barH, 0.22, 2, 0.035);
  }, [worldW, barH]);

  const edgeAccentGeometry = useMemo(() => {
    return new THREE.BoxGeometry(0.16 * props.strokeWidth, barH * 0.9, 0.25);
  }, [barH, props.strokeWidth]);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.3,
        roughness: 0.34,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.36,
        roughness: 0.28,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.55,
        roughness: 0.2,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      barGeometry.dispose();
      edgeAccentGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [barGeometry, edgeAccentGeometry, materials]);

  const bars = useMemo(() => {
    const stepY = worldH / barCount;
    return Array.from({ length: barCount }, (_, i) => {
      const fromLeft = i % 2 === 0;
      return {
        key: `stair-${i}`,
        y: worldH * 0.5 - (i + 0.5) * stepY,
        dir: fromLeft ? -1 : 1,
        delayNorm: i / Math.max(1, barCount - 1),
        matIndex: i % 2,
      };
    });
  }, [barCount, worldH]);

  const effectiveFps = fps * props.speedMultiplier;
  const travelX = worldW + 0.8;
  const maxDelayFrames = cycleFrames * 0.18;
  const exitOffsetFrames = Math.round(cycleFrames * 0.58);

  return (
    <>
      <ambientLight intensity={0.78} />
      <directionalLight position={[6, 8, 12]} intensity={1.15} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.42} color={accentHex} />

      <group>
        {bars.map((bar) => {
          const delayFrames = bar.delayNorm * maxDelayFrames;
          const enterT = spring({
            frame: localFrame - delayFrames,
            fps: effectiveFps,
            config: { damping: 20, stiffness: 220, mass: 0.7 },
            durationInFrames: Math.max(8, Math.round(cycleFrames * 0.22)),
          });

          const exitT = spring({
            frame: localFrame - exitOffsetFrames - delayFrames,
            fps: effectiveFps,
            config: { damping: 20, stiffness: 210, mass: 0.7 },
            durationInFrames: Math.max(8, Math.round(cycleFrames * 0.22)),
          });

          const xPos =
            localFrame <= cycleFrames * 0.5
              ? (1 - enterT) * (bar.dir * travelX)
              : exitT * (bar.dir * travelX);

          const onScreen = Math.abs(xPos) < travelX - 0.35;

          return (
            <group
              key={bar.key}
              position={[xPos, bar.y, 0]}
              visible={onScreen}
            >
              <mesh geometry={barGeometry} material={materials[bar.matIndex]} />
              <mesh
                geometry={edgeAccentGeometry}
                material={materials[2]}
                position={[-bar.dir * (worldW * 0.48), 0, 0.02]}
              />
            </group>
          );
        })}
      </group>
    </>
  );
};

export const SteppingStaircaseWipe4K: React.FC<SteppingStaircaseWipe4KProps> = (
  props,
) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const lastFrame = Math.max(1, durationInFrames - 1);
  const cycleFrames = Math.max(10, lastFrame / props.speedMultiplier);
  const localFrame =
    props.speedMultiplier === 1
      ? Math.min(lastFrame, frame)
      : frame >= lastFrame
        ? cycleFrames
        : frame % cycleFrames;

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
        <SteppingStaircaseScene
          props={props}
          localFrame={localFrame}
          cycleFrames={cycleFrames}
        />
      </ThreeCanvas>
    </div>
  );
};

