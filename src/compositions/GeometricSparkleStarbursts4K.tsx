import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
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

export const geometricSparkleStarburstsThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type GeometricSparkleStarburstsThemePreset =
  (typeof geometricSparkleStarburstsThemePresets)[number];

export const geometricSparkleStarbursts4KSchema = z.object({
  themePreset: z.enum(geometricSparkleStarburstsThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type GeometricSparkleStarbursts4KProps = z.infer<
  typeof geometricSparkleStarbursts4KSchema
>;

export const defaultGeometricSparkleStarbursts4KProps: GeometricSparkleStarbursts4KProps =
  {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "transparent",
    primaryColor: "#F3D37A",
    secondaryColor: "#D4AF37",
    accentColor: "#FFFFFF",
    speedMultiplier: 1,
    strokeWidth: 2,
  };

export const geometricSparkleStarbursts4KVariations: Record<
  GeometricSparkleStarburstsThemePreset,
  Omit<
    GeometricSparkleStarbursts4KProps,
    "aspectRatio" | "speedMultiplier" | "strokeWidth"
  >
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    backgroundColor: "transparent",
    primaryColor: "#3B82F6",
    secondaryColor: "#93C5FD",
    accentColor: "#FFFFFF",
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
    primaryColor: "#F59E0B",
    secondaryColor: "#FDE68A",
    accentColor: "#FFFBEB",
  },
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    backgroundColor: "transparent",
    primaryColor: "#F3D37A",
    secondaryColor: "#D4AF37",
    accentColor: "#FFFFFF",
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

function resolveThemeColors(props: GeometricSparkleStarbursts4KProps) {
  const preset = geometricSparkleStarbursts4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor ===
      defaultGeometricSparkleStarbursts4KProps.primaryColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultGeometricSparkleStarbursts4KProps.secondaryColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor ===
      defaultGeometricSparkleStarbursts4KProps.accentColor &&
    props.themePreset !== "monochrome-luxury"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

function pseudoHash(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const STAR_COUNT = 20;

const GeometricSparkleScene: React.FC<{
  props: GeometricSparkleStarbursts4KProps;
  angle: number;
}> = ({ props, angle }) => {
  const { primaryHex, secondaryHex, accentHex } = resolveThemeColors(props);
  const isVertical = props.aspectRatio === "9:16";
  const spreadX = isVertical ? 7.4 : 13.8;
  const spreadY = isVertical ? 13.8 : 7.4;

  const rayGeo = useMemo(() => new THREE.ConeGeometry(0.11, 0.55, 4), []);
  const coreGeo = useMemo(() => new THREE.IcosahedronGeometry(0.13, 0), []);
  const haloGeo = useMemo(
    () =>
      new THREE.TorusGeometry(
        0.32,
        0.015 * Math.max(0.6, props.strokeWidth * 0.5),
        12,
        36,
      ),
    [props.strokeWidth],
  );

  const materials = useMemo(() => {
    return [primaryHex, secondaryHex, accentHex].map(
      (col, idx) =>
        new THREE.MeshStandardMaterial({
          color: col,
          metalness: 0.78,
          roughness: 0.16,
          emissive: col,
          emissiveIntensity: idx === 2 ? 0.65 : 0.35,
          flatShading: true,
        }),
    );
  }, [primaryHex, secondaryHex, accentHex]);

  useEffect(() => {
    return () => {
      rayGeo.dispose();
      coreGeo.dispose();
      haloGeo.dispose();
      materials.forEach((mat) => mat.dispose());
    };
  }, [rayGeo, coreGeo, haloGeo, materials]);

  const stars = useMemo(() => {
    return Array.from({ length: STAR_COUNT }).map((_, i) => ({
      x: (pseudoHash(i * 6 + 1) - 0.5) * spreadX,
      y: (pseudoHash(i * 6 + 2) - 0.5) * spreadY,
      z: (pseudoHash(i * 6 + 3) - 0.5) * 3.0,
      scale: 0.6 + pseudoHash(i * 6 + 4) * 0.85,
      phase: pseudoHash(i * 6 + 5) * Math.PI * 2,
      freq: (i % 3) + 1,
      matIdx: i % 3,
    }));
  }, [spreadX, spreadY]);

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 12]} intensity={1.4} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.6} color={accentHex} />

      {stars.map((s, idx) => {
        const twinkle = Math.pow(0.5 + 0.5 * Math.sin(angle * s.freq + s.phase), 1.8);
        const sc = s.scale * (0.1 + twinkle * 0.95);

        return (
          <group
            key={idx}
            position={[s.x, s.y, s.z]}
            rotation={[0, 0, angle * 0.5 + s.phase]}
            scale={[sc, sc, sc]}
          >
            <mesh geometry={coreGeo} material={materials[2]} />
            <mesh geometry={haloGeo} material={materials[s.matIdx]} />
            {/* 4-pointed star spikes */}
            <mesh
              geometry={rayGeo}
              material={materials[s.matIdx]}
              position={[0, 0.28, 0]}
            />
            <mesh
              geometry={rayGeo}
              material={materials[s.matIdx]}
              position={[0, -0.28, 0]}
              rotation={[0, 0, Math.PI]}
            />
            <mesh
              geometry={rayGeo}
              material={materials[s.matIdx]}
              position={[0.28, 0, 0]}
              rotation={[0, 0, -Math.PI * 0.5]}
            />
            <mesh
              geometry={rayGeo}
              material={materials[s.matIdx]}
              position={[-0.28, 0, 0]}
              rotation={[0, 0, Math.PI * 0.5]}
            />
          </group>
        );
      })}
    </>
  );
};

export const GeometricSparkleStarbursts4K: React.FC<
  GeometricSparkleStarbursts4KProps
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
        <GeometricSparkleScene props={props} angle={angle} />
      </ThreeCanvas>
    </div>
  );
};
