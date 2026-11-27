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

export const luxuryGoldCornerOrnamentsThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type LuxuryGoldCornerOrnamentsThemePreset =
  (typeof luxuryGoldCornerOrnamentsThemePresets)[number];

export const luxuryGoldCornerOrnaments4KSchema = z.object({
  themePreset: z.enum(luxuryGoldCornerOrnamentsThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type LuxuryGoldCornerOrnaments4KProps = z.infer<
  typeof luxuryGoldCornerOrnaments4KSchema
>;

export const defaultLuxuryGoldCornerOrnaments4KProps: LuxuryGoldCornerOrnaments4KProps =
  {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#D4AF37",
    secondaryColor: "#F3D37A",
    accentColor: "#FFFBEB",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const luxuryGoldCornerOrnaments4KVariations: Record<
  LuxuryGoldCornerOrnamentsThemePreset,
  Omit<
    LuxuryGoldCornerOrnaments4KProps,
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
    primaryColor: "#38BDF8",
    secondaryColor: "#818CF8",
    accentColor: "#E0F2FE",
  },
  "warm-minimalist": {
    themePreset: "warm-minimalist",
    backgroundColor: "transparent",
    primaryColor: "#D97706",
    secondaryColor: "#F59E0B",
    accentColor: "#FEF3C7",
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    backgroundColor: "transparent",
    primaryColor: "#D4AF37",
    secondaryColor: "#F3D37A",
    accentColor: "#FFFBEB",
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

function resolveThemeColors(props: LuxuryGoldCornerOrnaments4KProps) {
  const preset = luxuryGoldCornerOrnaments4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultLuxuryGoldCornerOrnaments4KProps.primaryColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultLuxuryGoldCornerOrnaments4KProps.secondaryColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultLuxuryGoldCornerOrnaments4KProps.accentColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

const LuxuryGoldCornerScene: React.FC<{
  props: LuxuryGoldCornerOrnaments4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const cornerX = isVertical ? 3.85 : 7.1;
  const cornerY = isVertical ? 7.1 : 3.85;

  const thick = 0.042 * props.strokeWidth;
  const armOuter = 1.65;
  const armInner = 1.15;
  const diamondSide = 0.38;

  const hOuterGeo = useMemo(
    () => new RoundedBoxGeometry(armOuter, thick, 0.16, 2, 0.015),
    [armOuter, thick],
  );
  const vOuterGeo = useMemo(
    () => new RoundedBoxGeometry(thick, armOuter, 0.16, 2, 0.015),
    [armOuter, thick],
  );
  const hInnerGeo = useMemo(
    () => new RoundedBoxGeometry(armInner, thick * 0.72, 0.14, 2, 0.012),
    [armInner, thick],
  );
  const vInnerGeo = useMemo(
    () => new RoundedBoxGeometry(thick * 0.72, armInner, 0.14, 2, 0.012),
    [armInner, thick],
  );
  const diamondBarGeo = useMemo(
    () => new RoundedBoxGeometry(diamondSide, thick * 0.7, 0.18, 2, 0.01),
    [diamondSide, thick],
  );
  const jewelGeo = useMemo(() => new THREE.IcosahedronGeometry(0.11, 0), []);

  const materials = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({
        color: primaryHex,
        metalness: 0.9,
        roughness: 0.2,
      }),
      new THREE.MeshStandardMaterial({
        color: secondaryHex,
        metalness: 0.88,
        roughness: 0.16,
      }),
      new THREE.MeshStandardMaterial({
        color: accentHex,
        metalness: 0.92,
        roughness: 0.1,
        emissive: accentHex,
        emissiveIntensity: 0.28,
        flatShading: true,
      }),
    ];
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      hOuterGeo.dispose();
      vOuterGeo.dispose();
      hInnerGeo.dispose();
      vInnerGeo.dispose();
      diamondBarGeo.dispose();
      jewelGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [
    hOuterGeo,
    vOuterGeo,
    hInnerGeo,
    vInnerGeo,
    diamondBarGeo,
    jewelGeo,
    materials,
  ]);

  const shimmerX = Math.cos(angle) * 7.5;
  const shimmerY = Math.sin(angle) * 5.0;
  const breathe = Math.sin(angle * 2) * 0.04;
  const corners: Array<[number, number]> = [
    [-1, 1],
    [1, 1],
    [-1, -1],
    [1, -1],
  ];

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[shimmerX, shimmerY, 12]} intensity={1.7} color="#ffffff" />
      <directionalLight position={[-shimmerX, -shimmerY, 9]} intensity={0.75} color={secondaryHex} />

      {corners.map(([sx, sy], idx) => {
        const cx = sx * (cornerX + breathe);
        const cy = sy * (cornerY + breathe);
        return (
          <group key={idx} position={[cx, cy, 0]}>
            {/* Outer L-bracket */}
            <mesh
              geometry={hOuterGeo}
              material={materials[0]}
              position={[-sx * armOuter * 0.5, 0, 0]}
            />
            <mesh
              geometry={vOuterGeo}
              material={materials[0]}
              position={[0, -sy * armOuter * 0.5, 0]}
            />

            {/* Stepped inner L-bracket */}
            <mesh
              geometry={hInnerGeo}
              material={materials[1]}
              position={[-sx * (armInner * 0.5 + 0.18), -sy * 0.16, 0.04]}
            />
            <mesh
              geometry={vInnerGeo}
              material={materials[1]}
              position={[-sx * 0.16, -sy * (armInner * 0.5 + 0.18), 0.04]}
            />

            {/* Art-deco diamond filigree */}
            <group
              position={[-sx * 0.24, -sy * 0.24, 0.08]}
              rotation={[0, 0, Math.PI * 0.25]}
            >
              <mesh geometry={diamondBarGeo} material={materials[1]} position={[0, diamondSide * 0.5, 0]} />
              <mesh geometry={diamondBarGeo} material={materials[1]} position={[0, -diamondSide * 0.5, 0]} />
              <mesh
                geometry={diamondBarGeo}
                material={materials[1]}
                position={[diamondSide * 0.5, 0, 0]}
                rotation={[0, 0, Math.PI * 0.5]}
              />
              <mesh
                geometry={diamondBarGeo}
                material={materials[1]}
                position={[-diamondSide * 0.5, 0, 0]}
                rotation={[0, 0, Math.PI * 0.5]}
              />
            </group>

            {/* Spinning faceted corner jewel */}
            <mesh
              geometry={jewelGeo}
              material={materials[2]}
              position={[-sx * 0.24, -sy * 0.24, 0.14]}
              rotation={[angle, angle * 2, 0]}
            />
          </group>
        );
      })}
    </>
  );
};

export const LuxuryGoldCornerOrnaments4K: React.FC<
  LuxuryGoldCornerOrnaments4KProps
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
        <LuxuryGoldCornerScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
