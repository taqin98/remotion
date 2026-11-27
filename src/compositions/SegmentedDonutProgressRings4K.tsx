import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { makePie } from "@remotion/shapes";
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

export const segmentedDonutProgressRingsThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type SegmentedDonutProgressRingsThemePreset =
  (typeof segmentedDonutProgressRingsThemePresets)[number];

export const segmentedDonutProgressRings4KSchema = z.object({
  themePreset: z.enum(segmentedDonutProgressRingsThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type SegmentedDonutProgressRings4KProps = z.infer<
  typeof segmentedDonutProgressRings4KSchema
>;

export const defaultSegmentedDonutProgressRings4KProps: SegmentedDonutProgressRings4KProps =
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

export const segmentedDonutProgressRings4KVariations: Record<
  SegmentedDonutProgressRingsThemePreset,
  Omit<
    SegmentedDonutProgressRings4KProps,
    "aspectRatio" | "speedMultiplier" | "strokeWidth"
  >
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    backgroundColor: "transparent",
    primaryColor: "#1E293B",
    secondaryColor: "#64748B",
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
    secondaryColor: "#3F3F46",
    accentColor: "#D4AF37",
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

function resolveThemeColors(props: SegmentedDonutProgressRings4KProps) {
  const preset = segmentedDonutProgressRings4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultSegmentedDonutProgressRings4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultSegmentedDonutProgressRings4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultSegmentedDonutProgressRings4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

const SegmentedDonutScene: React.FC<{
  props: SegmentedDonutProgressRings4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const uiScale = isVertical ? 0.78 : 1;

  const tubeScale = Math.max(0.6, props.strokeWidth * 0.55);

  const outerArcGeo = useMemo(
    () => new THREE.TorusGeometry(2.65, 0.12 * tubeScale, 20, 64, Math.PI * 0.56),
    [tubeScale],
  );
  const midArcGeo = useMemo(
    () => new THREE.TorusGeometry(2.05, 0.1 * tubeScale, 20, 56, Math.PI * 0.72),
    [tubeScale],
  );
  const innerArcGeo = useMemo(
    () => new THREE.TorusGeometry(1.48, 0.085 * tubeScale, 18, 48, Math.PI * 0.45),
    [tubeScale],
  );
  const coreArcGeo = useMemo(
    () => new THREE.TorusGeometry(0.92, 0.065 * tubeScale, 16, 40, Math.PI * 1.15),
    [tubeScale],
  );

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.36,
        roughness: 0.34,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.42,
        roughness: 0.28,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.68,
        roughness: 0.2,
        emissive: accentHex,
        emissiveIntensity: 0.28,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      outerArcGeo.dispose();
      midArcGeo.dispose();
      innerArcGeo.dispose();
      coreArcGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [outerArcGeo, midArcGeo, innerArcGeo, coreArcGeo, materials]);

  const tiltX = Math.sin(angle) * 0.14;
  const tiltY = Math.cos(angle) * 0.14;

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 12]} intensity={1.3} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.5} color={accentHex} />

      <group
        rotation={[tiltX, tiltY, 0]}
        scale={[uiScale, uiScale, uiScale]}
      >
        {/* Outer 2 segments (1x speed) */}
        <group rotation={[0, 0, angle]}>
          <mesh geometry={outerArcGeo} material={materials[2]} rotation={[0, 0, 0]} />
          <mesh
            geometry={outerArcGeo}
            material={materials[0]}
            rotation={[0, 0, Math.PI]}
          />
        </group>

        {/* Mid 2 segments (-2x harmonic speed) */}
        <group rotation={[0, 0, -angle * 2]} position={[0, 0, 0.12]}>
          <mesh geometry={midArcGeo} material={materials[1]} rotation={[0, 0, 0.3]} />
          <mesh
            geometry={midArcGeo}
            material={materials[2]}
            rotation={[0, 0, Math.PI + 0.3]}
          />
        </group>

        {/* Inner 3 segments (3x harmonic speed) */}
        <group rotation={[0, 0, angle * 3]} position={[0, 0, 0.24]}>
          {[0, 1, 2].map((i) => (
            <mesh
              key={i}
              geometry={innerArcGeo}
              material={i === 0 ? materials[2] : materials[0]}
              rotation={[0, 0, (i * Math.PI * 2) / 3]}
            />
          ))}
        </group>

        {/* Core ring (-1x speed) */}
        <group rotation={[0, 0, -angle]} position={[0, 0, 0.34]}>
          <mesh geometry={coreArcGeo} material={materials[2]} />
        </group>
      </group>
    </>
  );
};

export const SegmentedDonutProgressRings4K: React.FC<
  SegmentedDonutProgressRings4KProps
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

  const { secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const uiScale = isVertical ? 0.78 : 1;

  const cx = width * 0.5;
  const cy = height * 0.5;
  const strokePx = Math.max(2, props.strokeWidth * 2.2 * uiScale);

  const pie1Radius = 3.15 * uiScale * zoom;
  const pie1Progress = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(angle));
  const pie1 = makePie({
    radius: pie1Radius,
    progress: pie1Progress,
    closePath: false,
    rotation: angle,
  });

  const pie2Radius = 1.78 * uiScale * zoom;
  const pie2Progress = 0.35 + 0.4 * (0.5 + 0.5 * Math.cos(angle * 2));
  const pie2 = makePie({
    radius: pie2Radius,
    progress: pie2Progress,
    closePath: false,
    rotation: -angle * 2,
  });

  const rotDeg = (angle * 180) / Math.PI;
  const tickR = 3.35 * uiScale * zoom;

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
        <g transform={`translate(${cx - pie1Radius}, ${cy - pie1Radius})`}>
          <path
            d={pie1.path}
            fill="none"
            stroke={accentHex}
            strokeWidth={strokePx}
            strokeLinecap="round"
            strokeOpacity={0.82}
          />
        </g>

        <g transform={`translate(${cx - pie2Radius}, ${cy - pie2Radius})`}>
          <path
            d={pie2.path}
            fill="none"
            stroke={secondaryHex}
            strokeWidth={strokePx * 0.8}
            strokeLinecap="round"
            strokeOpacity={0.78}
          />
        </g>

        <g transform={`rotate(${rotDeg} ${cx} ${cy})`}>
          {Array.from({ length: 48 }).map((_, i) => {
            const deg = (i * 360) / 48;
            const isMajor = i % 4 === 0;
            const len = (isMajor ? 0.16 : 0.08) * uiScale * zoom;
            return (
              <line
                key={i}
                x1={cx}
                y1={cy - tickR}
                x2={cx}
                y2={cy - tickR - len}
                stroke={isMajor ? accentHex : secondaryHex}
                strokeWidth={isMajor ? strokePx * 0.8 : strokePx * 0.45}
                strokeOpacity={isMajor ? 0.75 : 0.45}
                transform={`rotate(${deg} ${cx} ${cy})`}
              />
            );
          })}
        </g>
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
        <SegmentedDonutScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
