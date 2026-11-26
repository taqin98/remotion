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

export const verticalPillarDropThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type VerticalPillarDropThemePreset =
  (typeof verticalPillarDropThemePresets)[number];

export const verticalPillarDropWipe4KSchema = z.object({
  themePreset: z.enum(verticalPillarDropThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type VerticalPillarDropWipe4KProps = z.infer<
  typeof verticalPillarDropWipe4KSchema
>;

export const defaultVerticalPillarDropWipe4KProps: VerticalPillarDropWipe4KProps = {
  themePreset: "monochrome-luxury",
  aspectRatio: "16:9",
  backgroundColor: "transparent",
  primaryColor: "#18181B",
  secondaryColor: "#3F3F46",
  accentColor: "#E4E4E7",
  speedMultiplier: 1,
  strokeWidth: 2,
};

export const verticalPillarDropWipe4KVariations: Record<
  VerticalPillarDropThemePreset,
  Omit<VerticalPillarDropWipe4KProps, "aspectRatio" | "speedMultiplier" | "strokeWidth">
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

const VerticalPillarDropScene: React.FC<{
  props: VerticalPillarDropWipe4KProps;
  localFrame: number;
  cycleFrames: number;
}> = ({ props, localFrame, cycleFrames }) => {
  const { fps } = useVideoConfig();
  const preset = verticalPillarDropWipe4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor === defaultVerticalPillarDropWipe4KProps.primaryColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor === defaultVerticalPillarDropWipe4KProps.secondaryColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultVerticalPillarDropWipe4KProps.accentColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const pillarCount = isVertical ? 10 : 14;
  const worldW = isVertical ? 9.2 : 16.2;
  const worldH = isVertical ? 16.6 : 9.6;
  const pillarW = worldW / pillarCount;

  const pillarGeometry = useMemo(() => {
    return new RoundedBoxGeometry(pillarW * 1.045, worldH, 0.28, 2, 0.04);
  }, [pillarW, worldH]);

  const trimGeometry = useMemo(() => {
    return new THREE.BoxGeometry(pillarW * 1.05, 0.14 * props.strokeWidth, 0.31);
  }, [pillarW, props.strokeWidth]);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.3,
        roughness: 0.34,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.35,
        roughness: 0.28,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.55,
        roughness: 0.22,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      pillarGeometry.dispose();
      trimGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [pillarGeometry, trimGeometry, materials]);

  const pillars = useMemo(() => {
    return Array.from({ length: pillarCount }, (_, i) => {
      const x = -worldW * 0.5 + (i + 0.5) * pillarW;
      const centerDist = Math.abs(i - (pillarCount - 1) * 0.5) / ((pillarCount - 1) * 0.5);
      return {
        key: `pillar-${i}`,
        x,
        delayNorm: i % 2 === 0 ? centerDist * 0.7 : 0.3 + centerDist * 0.7,
        matIndex: i % 2,
        hasTrim: i % 3 === 1,
      };
    });
  }, [pillarCount, worldW, pillarW]);

  const effectiveFps = fps * props.speedMultiplier;
  const travelY = worldH + 0.8;
  const maxDelayFrames = cycleFrames * 0.2;
  const exitOffsetFrames = Math.round(cycleFrames * 0.58);

  return (
    <>
      <ambientLight intensity={0.76} />
      <directionalLight position={[6, 8, 12]} intensity={1.15} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.42} color={accentHex} />

      <group>
        {pillars.map((pillar) => {
          const delayFrames = pillar.delayNorm * maxDelayFrames;
          const enterT = spring({
            frame: localFrame - delayFrames,
            fps: effectiveFps,
            config: { damping: 19, stiffness: 200, mass: 0.75 },
            durationInFrames: Math.max(8, Math.round(cycleFrames * 0.22)),
          });

          const exitT = spring({
            frame: localFrame - exitOffsetFrames - delayFrames,
            fps: effectiveFps,
            config: { damping: 20, stiffness: 190, mass: 0.75 },
            durationInFrames: Math.max(8, Math.round(cycleFrames * 0.22)),
          });

          const yPos =
            localFrame <= cycleFrames * 0.5
              ? (1 - enterT) * travelY
              : -exitT * travelY;

          const onScreen = Math.abs(yPos) < worldH - 0.15;

          return (
            <group
              key={pillar.key}
              position={[pillar.x, yPos, 0]}
              visible={onScreen}
            >
              <mesh geometry={pillarGeometry} material={materials[pillar.matIndex]} />
              {pillar.hasTrim && (
                <>
                  <mesh
                    geometry={trimGeometry}
                    material={materials[2]}
                    position={[0, -worldH * 0.44, 0]}
                  />
                  <mesh
                    geometry={trimGeometry}
                    material={materials[2]}
                    position={[0, worldH * 0.44, 0]}
                  />
                </>
              )}
            </group>
          );
        })}
      </group>
    </>
  );
};

export const VerticalPillarDropWipe4K: React.FC<
  VerticalPillarDropWipe4KProps
> = (props) => {
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
        <VerticalPillarDropScene
          props={props}
          localFrame={localFrame}
          cycleFrames={cycleFrames}
        />
      </ThreeCanvas>
    </div>
  );
};

