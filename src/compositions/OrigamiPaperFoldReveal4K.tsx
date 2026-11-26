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

export const origamiPaperFoldRevealThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type OrigamiPaperFoldRevealThemePreset =
  (typeof origamiPaperFoldRevealThemePresets)[number];

export const origamiPaperFoldReveal4KSchema = z.object({
  themePreset: z.enum(origamiPaperFoldRevealThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type OrigamiPaperFoldReveal4KProps = z.infer<
  typeof origamiPaperFoldReveal4KSchema
>;

export const defaultOrigamiPaperFoldReveal4KProps: OrigamiPaperFoldReveal4KProps = {
  themePreset: "warm-minimalist",
  aspectRatio: "16:9",
  backgroundColor: "transparent",
  primaryColor: "#F5F0E6",
  secondaryColor: "#E5DAC8",
  accentColor: "#D97706",
  speedMultiplier: 1,
  strokeWidth: 2,
};

export const origamiPaperFoldReveal4KVariations: Record<
  OrigamiPaperFoldRevealThemePreset,
  Omit<OrigamiPaperFoldReveal4KProps, "aspectRatio" | "speedMultiplier" | "strokeWidth">
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

const OrigamiPaperFoldScene: React.FC<{
  props: OrigamiPaperFoldReveal4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset = origamiPaperFoldReveal4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor === defaultOrigamiPaperFoldReveal4KProps.primaryColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultOrigamiPaperFoldReveal4KProps.secondaryColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultOrigamiPaperFoldReveal4KProps.accentColor &&
    props.themePreset !== "warm-minimalist"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const worldW = isVertical ? 9.4 : 16.4;
  const worldH = isVertical ? 16.4 : 9.4;

  const horizFlapGeom = useMemo(() => {
    return new RoundedBoxGeometry(worldW, worldH * 0.56, 0.1, 2, 0.02);
  }, [worldW, worldH]);

  const vertFlapGeom = useMemo(() => {
    return new RoundedBoxGeometry(worldW * 0.56, worldH, 0.1, 2, 0.02);
  }, [worldW, worldH]);

  const sealGeom = useMemo(() => {
    return new RoundedBoxGeometry(2.6, 2.6, 0.12, 2, 0.03);
  }, []);

  const creaseGeom = useMemo(() => {
    return new THREE.BoxGeometry(worldW * 0.94, 0.05 * props.strokeWidth, 0.12);
  }, [worldW, props.strokeWidth]);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.14,
        roughness: 0.52,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.18,
        roughness: 0.46,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.42,
        roughness: 0.28,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      horizFlapGeom.dispose();
      vertFlapGeom.dispose();
      sealGeom.dispose();
      creaseGeom.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [horizFlapGeom, vertFlapGeom, sealGeom, creaseGeom, materials]);

  const getFlapState = (delayNorm: number) => {
    const dur = 0.28;
    const enterSpan = 0.42 - dur;
    const exitStart = 0.58;
    const exitSpan = 1 - exitStart - dur;

    const inStart = delayNorm * enterSpan;
    const inT = interpolate(progress, [inStart, inStart + dur], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    });

    const outBegin = exitStart + delayNorm * exitSpan;
    const outT = interpolate(progress, [outBegin, outBegin + dur], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    });

    const foldAngle =
      progress <= 0.5
        ? interpolate(inT, [0, 1], [Math.PI * 0.52, 0])
        : interpolate(outT, [0, 1], [0, -Math.PI * 0.52]);

    const scale =
      progress <= 0.5
        ? interpolate(inT, [0, 0.18, 1], [0, 1, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        : interpolate(outT, [0, 0.82, 1], [1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

    return { foldAngle, scale, visible: scale > 0.002 };
  };

  const leftState = getFlapState(0.0);
  const rightState = getFlapState(0.25);
  const topState = getFlapState(0.55);
  const bottomState = getFlapState(0.8);

  const sealScale =
    progress <= 0.5
      ? interpolate(progress, [0.3, 0.43], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : interpolate(progress, [0.57, 0.7], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.in(Easing.cubic),
        });

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 8, 12]} intensity={1.1} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.38} color={accentHex} />

      <group>
        <group
          position={[-worldW * 0.5, 0, 0.02]}
          rotation={[0, leftState.foldAngle, 0]}
          scale={leftState.visible ? [leftState.scale, 1, 1] : [0.0001, 1, 1]}
          visible={leftState.visible}
        >
          <mesh
            geometry={vertFlapGeom}
            material={materials[0]}
            position={[worldW * 0.28, 0, 0]}
          />
        </group>

        <group
          position={[worldW * 0.5, 0, 0.06]}
          rotation={[0, -rightState.foldAngle, 0]}
          scale={rightState.visible ? [rightState.scale, 1, 1] : [0.0001, 1, 1]}
          visible={rightState.visible}
        >
          <mesh
            geometry={vertFlapGeom}
            material={materials[0]}
            position={[-worldW * 0.28, 0, 0]}
          />
        </group>

        <group
          position={[0, worldH * 0.5, 0.14]}
          rotation={[topState.foldAngle, 0, 0]}
          scale={topState.visible ? [1, topState.scale, 1] : [1, 0.0001, 1]}
          visible={topState.visible}
        >
          <mesh
            geometry={horizFlapGeom}
            material={materials[1]}
            position={[0, -worldH * 0.28, 0]}
          />
          <mesh
            geometry={creaseGeom}
            material={materials[2]}
            position={[0, -worldH * 0.54, 0.02]}
          />
        </group>

        <group
          position={[0, -worldH * 0.5, 0.18]}
          rotation={[-bottomState.foldAngle, 0, 0]}
          scale={bottomState.visible ? [1, bottomState.scale, 1] : [1, 0.0001, 1]}
          visible={bottomState.visible}
        >
          <mesh
            geometry={horizFlapGeom}
            material={materials[1]}
            position={[0, worldH * 0.28, 0]}
          />
          <mesh
            geometry={creaseGeom}
            material={materials[2]}
            position={[0, worldH * 0.54, 0.02]}
          />
        </group>

        {sealScale > 0.002 && (
          <group
            position={[0, 0, 0.28]}
            rotation={[0, 0, Math.PI / 4]}
            scale={[sealScale, sealScale, sealScale]}
          >
            <mesh geometry={sealGeom} material={materials[2]} />
          </group>
        )}
      </group>
    </>
  );
};

export const OrigamiPaperFoldReveal4K: React.FC<
  OrigamiPaperFoldReveal4KProps
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
        <OrigamiPaperFoldScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

