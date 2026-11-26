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

export const rotatingVenetianLouversThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type RotatingVenetianLouversThemePreset =
  (typeof rotatingVenetianLouversThemePresets)[number];

export const rotatingVenetianLouversWipe4KSchema = z.object({
  themePreset: z.enum(rotatingVenetianLouversThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type RotatingVenetianLouversWipe4KProps = z.infer<
  typeof rotatingVenetianLouversWipe4KSchema
>;

export const defaultRotatingVenetianLouversWipe4KProps: RotatingVenetianLouversWipe4KProps = {
  themePreset: "monochrome-luxury",
  aspectRatio: "16:9",
  backgroundColor: "transparent",
  primaryColor: "#18181B",
  secondaryColor: "#3F3F46",
  accentColor: "#E4E4E7",
  speedMultiplier: 1,
  strokeWidth: 2,
};

export const rotatingVenetianLouversWipe4KVariations: Record<
  RotatingVenetianLouversThemePreset,
  Omit<RotatingVenetianLouversWipe4KProps, "aspectRatio" | "speedMultiplier" | "strokeWidth">
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

const RotatingVenetianLouversScene: React.FC<{
  props: RotatingVenetianLouversWipe4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const preset = rotatingVenetianLouversWipe4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor === defaultRotatingVenetianLouversWipe4KProps.primaryColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultRotatingVenetianLouversWipe4KProps.secondaryColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultRotatingVenetianLouversWipe4KProps.accentColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.accentColor
      : props.accentColor;

  const isVertical = props.aspectRatio === "9:16";
  const slatCount = isVertical ? 12 : 16;
  const worldW = isVertical ? 9.2 : 16.2;
  const worldH = isVertical ? 16.4 : 9.4;
  const slatW = worldW / slatCount;

  const slatGeometry = useMemo(() => {
    return new RoundedBoxGeometry(slatW * 1.045, worldH, 0.16, 2, 0.025);
  }, [slatW, worldH]);

  const spineGeometry = useMemo(() => {
    return new THREE.BoxGeometry(0.03 * Math.max(0.5, props.strokeWidth * 0.5), worldH, 0.19);
  }, [worldH, props.strokeWidth]);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.3,
        roughness: 0.34,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.34,
        roughness: 0.3,
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
      slatGeometry.dispose();
      spineGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [slatGeometry, spineGeometry, materials]);

  const slats = useMemo(() => {
    return Array.from({ length: slatCount }, (_, i) => {
      const x = -worldW * 0.5 + (i + 0.5) * slatW;
      const norm = i / Math.max(1, slatCount - 1);
      return {
        key: `louver-${i}`,
        x,
        delayNorm: norm,
        matIndex: i % 2,
        hasSpine: i % 4 === 1,
      };
    });
  }, [slatCount, worldW, slatW]);

  const phaseDur = 0.24;
  const enterSpan = 0.42 - phaseDur;
  const exitStart = 0.58;
  const exitSpan = 1 - exitStart - phaseDur;

  return (
    <>
      <ambientLight intensity={0.78} />
      <directionalLight position={[7, 6, 12]} intensity={1.18} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.42} color={accentHex} />

      <group>
        {slats.map((slat) => {
          const inStart = slat.delayNorm * enterSpan;
          const inT = interpolate(progress, [inStart, inStart + phaseDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.cubic),
          });

          const outBegin = exitStart + slat.delayNorm * exitSpan;
          const outT = interpolate(progress, [outBegin, outBegin + phaseDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.cubic),
          });

          const rotY =
            progress <= 0.5
              ? interpolate(inT, [0, 1], [Math.PI / 2, 0])
              : interpolate(outT, [0, 1], [0, -Math.PI / 2]);

          const scaleIn = interpolate(inT, [0, 0.22, 1], [0, 1, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const scaleOut = interpolate(outT, [0, 0.78, 1], [1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const scale = progress <= 0.5 ? scaleIn : scaleOut;
          const visible = scale > 0.002;

          return (
            <group
              key={slat.key}
              position={[slat.x, 0, 0]}
              rotation={[0, rotY, 0]}
              scale={visible ? [scale, 1, scale] : [0.0001, 1, 0.0001]}
              visible={visible}
            >
              <mesh geometry={slatGeometry} material={materials[slat.matIndex]} />
              {slat.hasSpine && (
                <mesh
                  geometry={spineGeometry}
                  material={materials[2]}
                  position={[slatW * 0.42, 0, 0]}
                />
              )}
            </group>
          );
        })}
      </group>
    </>
  );
};

export const RotatingVenetianLouversWipe4K: React.FC<
  RotatingVenetianLouversWipe4KProps
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
        <RotatingVenetianLouversScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};

