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

export const hexagonEmblemTechBarLowerThirdThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type HexagonEmblemTechBarLowerThirdThemePreset =
  (typeof hexagonEmblemTechBarLowerThirdThemePresets)[number];

export const hexagonEmblemTechBarLowerThird4KSchema = z.object({
  themePreset: z.enum(hexagonEmblemTechBarLowerThirdThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type HexagonEmblemTechBarLowerThird4KProps = z.infer<
  typeof hexagonEmblemTechBarLowerThird4KSchema
>;

export const defaultHexagonEmblemTechBarLowerThird4KProps: HexagonEmblemTechBarLowerThird4KProps =
  {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#0F172A",
    secondaryColor: "#1E293B",
    accentColor: "#38BDF8",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const hexagonEmblemTechBarLowerThird4KVariations: Record<
  HexagonEmblemTechBarLowerThirdThemePreset,
  Omit<
    HexagonEmblemTechBarLowerThird4KProps,
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
    primaryColor: "#0F172A",
    secondaryColor: "#1E293B",
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
    secondaryColor: "#27272A",
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

function resolveThemeColors(props: HexagonEmblemTechBarLowerThird4KProps) {
  const preset = hexagonEmblemTechBarLowerThird4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultHexagonEmblemTechBarLowerThird4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultHexagonEmblemTechBarLowerThird4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultHexagonEmblemTechBarLowerThird4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

const HexagonEmblemScene: React.FC<{
  props: HexagonEmblemTechBarLowerThird4KProps;
  progress: number;
}> = ({ props, progress }) => {
  const { secondaryHex, accentHex } = resolveThemeColors(props);

  const isVertical = props.aspectRatio === "9:16";
  const anchorX = isVertical ? -3.2 : -5.95;
  const anchorY = isVertical ? -4.55 : -2.55;
  const uiScale = isVertical ? 0.88 : 1;

  const hexWireGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(0.56, 0.56, 0.18, 6);
  }, []);

  const hexRingGeometry = useMemo(() => {
    return new THREE.TorusGeometry(0.5, 0.026 * props.strokeWidth, 12, 6);
  }, [props.strokeWidth]);

  const hexCoreGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(0.28, 0.28, 0.2, 6);
  }, []);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.34,
        roughness: 0.36,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.68,
        roughness: 0.2,
        emissive: accentHex,
        emissiveIntensity: 0.24,
      }),
      new THREE.MeshBasicMaterial({
        color: accentHex,
        wireframe: true,
        transparent: true,
        opacity: 0.92,
      }),
    ];
  }, [secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      hexWireGeometry.dispose();
      hexRingGeometry.dispose();
      hexCoreGeometry.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [hexWireGeometry, hexRingGeometry, hexCoreGeometry, materials]);

  const hexScale =
    progress <= 0.17
      ? interpolate(progress, [0, 0.1], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : progress >= 0.83
        ? interpolate(progress, [0.9, 1], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const spin = progress * Math.PI * 2;
  const visible = hexScale > 0.002;

  return (
    <>
      <ambientLight intensity={0.82} />
      <directionalLight position={[6, 8, 12]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-6, -4, 7]} intensity={0.48} color={accentHex} />

      <group
        position={[anchorX, anchorY + 0.04 * uiScale, 0.26]}
        scale={
          visible
            ? [hexScale * uiScale, hexScale * uiScale, hexScale * uiScale]
            : [0.0001, 0.0001, 0.0001]
        }
        visible={visible}
      >
        <group rotation={[Math.PI * 0.5, spin, spin * 0.5]}>
          <mesh geometry={hexWireGeometry} material={materials[2]} />
          <mesh geometry={hexCoreGeometry} material={materials[0]} />
        </group>
        <mesh
          geometry={hexRingGeometry}
          material={materials[1]}
          rotation={[0.28, -spin, Math.PI / 6]}
        />
      </group>
    </>
  );
};

export const HexagonEmblemTechBarLowerThird4K: React.FC<
  HexagonEmblemTechBarLowerThird4KProps
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

  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const anchorX = isVertical ? -3.2 : -5.95;
  const anchorY = isVertical ? -4.55 : -2.55;
  const uiScale = isVertical ? 0.88 : 1;

  const barWipe =
    cycleProgress <= 0.17
      ? interpolate(cycleProgress, [0.04, 0.15], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : cycleProgress >= 0.83
        ? interpolate(cycleProgress, [0.85, 0.96], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.cubic),
          })
        : 1;

  const barOriginX = width * 0.5 + (anchorX + 0.74 * uiScale) * zoom;
  const barCenterY = height * 0.5 - (anchorY + 0.08 * uiScale) * zoom;
  const barW = 5.45 * uiScale * zoom;
  const barH = 0.82 * uiScale * zoom;
  const chamfer = 0.22 * uiScale * zoom;
  const strokePx = Math.max(1.5, props.strokeWidth * 1.5 * uiScale);

  const topY = barCenterY - barH * 0.5;
  const botY = barCenterY + barH * 0.5;
  const leftX = barOriginX;
  const rightX = barOriginX + barW;

  const barPoints = [
    `${leftX},${topY + chamfer}`,
    `${leftX + chamfer},${topY}`,
    `${rightX},${topY}`,
    `${rightX},${botY - chamfer}`,
    `${rightX - chamfer},${botY}`,
    `${leftX},${botY}`,
  ].join(" ");

  const innerPad = 0.07 * uiScale * zoom;
  const innerPoints = [
    `${leftX + innerPad},${topY + chamfer}`,
    `${leftX + chamfer},${topY + innerPad}`,
    `${rightX - innerPad},${topY + innerPad}`,
    `${rightX - innerPad},${botY - chamfer}`,
    `${rightX - chamfer},${botY - innerPad}`,
    `${leftX + innerPad},${botY - innerPad}`,
  ].join(" ");

  const railY = botY + 0.14 * uiScale * zoom;
  const railH = 0.04 * props.strokeWidth * uiScale * zoom;

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
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
      >
        <defs>
          <clipPath id="hexTechBarClip">
            <rect
              x={leftX - 10}
              y={topY - 40}
              width={(barW + 20) * barWipe}
              height={barH + 140}
            />
          </clipPath>
        </defs>

        {barWipe > 0.002 && (
          <g clipPath="url(#hexTechBarClip)">
            <polygon
              points={barPoints}
              fill={primaryHex}
              fillOpacity={0.94}
              stroke={accentHex}
              strokeWidth={strokePx}
            />
            <polygon
              points={innerPoints}
              fill={secondaryHex}
              fillOpacity={0.75}
            />
            <line
              x1={leftX + chamfer}
              y1={topY}
              x2={rightX}
              y2={topY}
              stroke={accentHex}
              strokeWidth={strokePx * 2.2}
            />
            <rect
              x={leftX}
              y={railY - railH * 0.5}
              width={barW * 0.62}
              height={railH}
              rx={railH * 0.5}
              fill={secondaryHex}
            />
            {[0, 1, 2, 3].map((idx) => {
              const inStart = 0.08 + idx * 0.02;
              const inEnd = Math.min(0.17, inStart + 0.045);
              const outStart = 0.83 + (3 - idx) * 0.015;
              const outEnd = outStart + 0.05;
              const tickT =
                cycleProgress <= 0.17
                  ? interpolate(cycleProgress, [inStart, inEnd], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                      easing: Easing.out(Easing.cubic),
                    })
                  : cycleProgress >= 0.83
                    ? interpolate(cycleProgress, [outStart, outEnd], [1, 0], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                        easing: Easing.in(Easing.cubic),
                      })
                    : 1;

              const tickW = 0.22 * uiScale * zoom;
              const tickH = 0.09 * uiScale * zoom;
              const tickX = rightX - (1.15 - idx * 0.3) * uiScale * zoom;
              return (
                <rect
                  key={idx}
                  x={tickX}
                  y={railY - tickH * 0.5}
                  width={tickW}
                  height={tickH}
                  rx={4}
                  fill={idx === 0 ? accentHex : secondaryHex}
                  opacity={tickT}
                />
              );
            })}
          </g>
        )}
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
        <HexagonEmblemScene props={props} progress={cycleProgress} />
      </ThreeCanvas>
    </div>
  );
};
