import React, { useEffect, useLayoutEffect, useMemo } from "react";
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

export const helixScannerTunnel3DThemePresets = [
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
] as const;

export type HelixScannerTunnel3DThemePreset =
  (typeof helixScannerTunnel3DThemePresets)[number];

export const helixScannerTunnel3D4KSchema = z.object({
  themePreset: z.enum(helixScannerTunnel3DThemePresets),
  aspectRatio: z.enum(["16:9", "9:16"]),
  backgroundColor: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  speedMultiplier: z.number().int().min(1).max(6),
  strokeWidth: z.number().min(0.5).max(8),
});

export type HelixScannerTunnel3D4KProps = z.infer<
  typeof helixScannerTunnel3D4KSchema
>;

export const defaultHelixScannerTunnel3D4KProps: HelixScannerTunnel3D4KProps =
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

export const helixScannerTunnel3D4KVariations: Record<
  HelixScannerTunnel3DThemePreset,
  Omit<
    HelixScannerTunnel3D4KProps,
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
  position: [0, 0, 8] as [number, number, number],
  fov: 45,
  near: 0.1,
  far: 100,
};

const GL_CONFIG = {
  antialias: true,
  alpha: true,
};

const PerspectiveCameraRig: React.FC<{
  aspect: number;
  fov: number;
}> = ({ aspect, fov }) => {
  const { camera } = useThree();

  useLayoutEffect(() => {
    const persp = camera as THREE.PerspectiveCamera;
    persp.position.set(0, 0, 8);
    persp.fov = fov;
    persp.lookAt(0, 0, 0);
    persp.updateProjectionMatrix();
    void aspect;
  }, [camera, aspect, fov]);

  return null;
};

function resolveThemeColors(props: HelixScannerTunnel3D4KProps) {
  const preset = helixScannerTunnel3D4KVariations[props.themePreset];
  const primaryHex =
    props.primaryColor === defaultHelixScannerTunnel3D4KProps.primaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.primaryColor
      : props.primaryColor;
  const secondaryHex =
    props.secondaryColor ===
      defaultHelixScannerTunnel3D4KProps.secondaryColor &&
    props.themePreset !== "dark-tech"
      ? preset.secondaryColor
      : props.secondaryColor;
  const accentHex =
    props.accentColor === defaultHelixScannerTunnel3D4KProps.accentColor &&
    props.themePreset !== "dark-tech"
      ? preset.accentColor
      : props.accentColor;

  return { primaryHex, secondaryHex, accentHex };
}

const FRAME_COUNT = 16;

const HelixScannerTunnelScene: React.FC<{
  props: HelixScannerTunnel3D4KProps;
  cycleProgress: number;
  angle: number;
}> = ({ props, cycleProgress, angle }) => {
  const { primaryHex, accentHex } = resolveThemeColors(props);

  const arcGeo = useMemo(
    () =>
      new THREE.TorusGeometry(
        2.35,
        0.045 * Math.max(0.6, props.strokeWidth * 0.55),
        16,
        36,
        Math.PI * 0.52,
      ),
    [props.strokeWidth],
  );
  const tickGeo = useMemo(
    () => new RoundedBoxGeometry(0.11, 0.26, 0.11, 2, 0.02),
    [],
  );

  const frameMaterials = useMemo(() => {
    return Array.from({ length: FRAME_COUNT }).map((_, i) => {
      return new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? accentHex : primaryHex,
        metalness: 0.65,
        roughness: 0.22,
        emissive: accentHex,
        emissiveIntensity: i % 2 === 0 ? 0.42 : 0.15,
        transparent: true,
        opacity: 1,
      });
    });
  }, [primaryHex, accentHex]);

  useLayoutEffect(() => {
    frameMaterials.forEach((mat, i) => {
      const u = (i / FRAME_COUNT + cycleProgress) % 1;
      mat.opacity = Math.sin(u * Math.PI) * 0.95;
    });
  }, [frameMaterials, cycleProgress]);

  useEffect(() => {
    return () => {
      arcGeo.dispose();
      tickGeo.dispose();
      frameMaterials.forEach((m) => m.dispose());
    };
  }, [arcGeo, tickGeo, frameMaterials]);

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 12]} intensity={1.3} color="#ffffff" />
      <directionalLight position={[-6, -4, 8]} intensity={0.5} color={accentHex} />

      {Array.from({ length: FRAME_COUNT }).map((_, i) => {
        const u = (i / FRAME_COUNT + cycleProgress) % 1;
        const z = -14 + u * 18;
        const rotZ = u * Math.PI * 2 + angle;
        const fadeScale = 0.7 + 0.3 * Math.sin(u * Math.PI);

        return (
          <group
            key={i}
            position={[0, 0, z]}
            rotation={[0, 0, rotZ]}
            scale={[fadeScale, fadeScale, 1]}
          >
            {[0, 1, 2].map((seg) => (
              <mesh
                key={seg}
                geometry={arcGeo}
                material={frameMaterials[i]}
                rotation={[0, 0, (seg * Math.PI * 2) / 3]}
              />
            ))}
            {[0, 1, 2, 3, 4, 5].map((tk) => (
              <group key={tk} rotation={[0, 0, (tk * Math.PI) / 3]}>
                <mesh
                  geometry={tickGeo}
                  material={frameMaterials[i]}
                  position={[0, 2.35, 0]}
                />
              </group>
            ))}
          </group>
        );
      })}
    </>
  );
};

export const HelixScannerTunnel3D4K: React.FC<
  HelixScannerTunnel3D4KProps
> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const progress =
    ((frame % durationInFrames) / durationInFrames) * props.speedMultiplier;
  const cycleProgress = progress % 1;
  const angle = cycleProgress * Math.PI * 2;
  const fov = props.aspectRatio === "9:16" ? 58 : 45;

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
        dpr={1}
        camera={CAMERA_CONFIG}
        gl={GL_CONFIG}
      >
        <PerspectiveCameraRig aspect={width / height} fov={fov} />
        <HelixScannerTunnelScene
          props={props}
          cycleProgress={cycleProgress}
          angle={angle}
        />
      </ThreeCanvas>
    </div>
  );
};
