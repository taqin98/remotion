import React, { useEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  ConeGeometry,
  CylinderGeometry,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  setConsoleFunction,
} from "three";
import { z } from "zod";

setConsoleFunction((type, message, ...params) => {
  if (
    type === "warn" &&
    typeof message === "string" &&
    message.startsWith("THREE.Clock:")
  ) {
    return;
  }
  if (type === "error") {
    console.error(message, ...params);
  } else if (type === "warn") {
    console.warn(message, ...params);
  } else {
    console.log(message, ...params);
  }
});

export const themePresetSchema = z.enum([
  "clean-corporate",
  "dark-tech",
  "warm-minimalist",
  "monochrome-luxury",
]);

export const aspectRatioSchema = z.enum(["16:9", "9:16"]);

export type ThemePreset = z.infer<typeof themePresetSchema>;
export type AspectRatio = z.infer<typeof aspectRatioSchema>;

export const minimalistBauhausKineticMobile4KSchema = z.object({
  themePreset: themePresetSchema.default("warm-minimalist"),
  aspectRatio: aspectRatioSchema.default("16:9"),
  backgroundColor: z.string().default("#FAF6EE"),
  primaryColor: z.string().default("#1D3557"),
  secondaryColor: z.string().default("#E07A5F"),
  accentColor: z.string().default("#F4A261"),
  speedMultiplier: z.number().int().positive().default(1),
  strokeWidth: z.number().min(0.4).max(2.5).default(1),
});

export type MinimalistBauhausKineticMobile4KProps = z.infer<
  typeof minimalistBauhausKineticMobile4KSchema
>;

export const defaultMinimalistBauhausKineticMobile4KProps: MinimalistBauhausKineticMobile4KProps =
  {
    themePreset: "warm-minimalist",
    aspectRatio: "16:9",
    backgroundColor: "#FAF6EE",
    primaryColor: "#1D3557",
    secondaryColor: "#E07A5F",
    accentColor: "#F4A261",
    speedMultiplier: 1,
    strokeWidth: 1,
  };

export const minimalistBauhausKineticMobile4KVariations: Record<
  ThemePreset,
  MinimalistBauhausKineticMobile4KProps
> = {
  "clean-corporate": {
    themePreset: "clean-corporate",
    aspectRatio: "16:9",
    backgroundColor: "#F8FAFC",
    primaryColor: "#1E293B",
    secondaryColor: "#3B82F6",
    accentColor: "#0EA5E9",
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "dark-tech": {
    themePreset: "dark-tech",
    aspectRatio: "16:9",
    backgroundColor: "#060B18",
    primaryColor: "#1E293B",
    secondaryColor: "#06B6D4",
    accentColor: "#6366F1",
    speedMultiplier: 1,
    strokeWidth: 1,
  },
  "warm-minimalist": defaultMinimalistBauhausKineticMobile4KProps,
  "monochrome-luxury": {
    themePreset: "monochrome-luxury",
    aspectRatio: "16:9",
    backgroundColor: "#0E0E11",
    primaryColor: "#1C1C22",
    secondaryColor: "#D4AF37",
    accentColor: "#F3D37A",
    speedMultiplier: 1,
    strokeWidth: 1,
  },
};

interface ThemePalette {
  bgTop: string;
  bgBottom: string;
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  rod: string;
  ambientIntensity: number;
}

const THEME_PALETTES: Record<ThemePreset, ThemePalette> = {
  "clean-corporate": {
    bgTop: "#FFFFFF",
    bgBottom: "#E7EFF8",
    primary: "#1E293B",
    secondary: "#3B82F6",
    accent: "#0EA5E9",
    neutral: "#E2E8F0",
    rod: "#64748B",
    ambientIntensity: 0.9,
  },
  "dark-tech": {
    bgTop: "#091124",
    bgBottom: "#040814",
    primary: "#1E293B",
    secondary: "#06B6D4",
    accent: "#6366F1",
    neutral: "#E0F2FE",
    rod: "#475569",
    ambientIntensity: 0.58,
  },
  "warm-minimalist": {
    bgTop: "#FDFBF5",
    bgBottom: "#EFE4D3",
    primary: "#1D3557",
    secondary: "#E07A5F",
    accent: "#F4A261",
    neutral: "#EAE0D0",
    rod: "#4A453F",
    ambientIntensity: 0.92,
  },
  "monochrome-luxury": {
    bgTop: "#151519",
    bgBottom: "#08080B",
    primary: "#1C1C22",
    secondary: "#D4AF37",
    accent: "#F3D37A",
    neutral: "#E4E4E7",
    rod: "#A1A1AA",
    ambientIntensity: 0.5,
  },
};

const resolvePalette = (
  props: MinimalistBauhausKineticMobile4KProps,
): ThemePalette => {
  const base = THEME_PALETTES[props.themePreset];
  return {
    ...base,
    bgTop:
      props.backgroundColor !==
      defaultMinimalistBauhausKineticMobile4KProps.backgroundColor
        ? props.backgroundColor
        : base.bgTop,
    primary:
      props.primaryColor !==
      defaultMinimalistBauhausKineticMobile4KProps.primaryColor
        ? props.primaryColor
        : base.primary,
    secondary:
      props.secondaryColor !==
      defaultMinimalistBauhausKineticMobile4KProps.secondaryColor
        ? props.secondaryColor
        : base.secondary,
    accent:
      props.accentColor !==
      defaultMinimalistBauhausKineticMobile4KProps.accentColor
        ? props.accentColor
        : base.accent,
  };
};

const CANVAS_GL = { antialias: true, alpha: true } as const;
const CAMERA_CONFIG = {
  position: [0, 0, 12] as [number, number, number],
  fov: 40,
  near: 0.1,
  far: 100,
};

interface BauhausSceneProps {
  frame: number;
  durationInFrames: number;
  palette: ThemePalette;
  speedMultiplier: number;
  strokeWidth: number;
  aspectRatio: AspectRatio;
}

const BauhausScene: React.FC<BauhausSceneProps> = ({
  frame,
  durationInFrames,
  palette,
  speedMultiplier,
  strokeWidth,
  aspectRatio,
}) => {
  const progress = (frame % durationInFrames) / durationInFrames;
  const loopAngle = progress * Math.PI * 2 * speedMultiplier;

  const geometries = useMemo(
    () => ({
      topStem: new CylinderGeometry(0.03 * strokeWidth, 0.03 * strokeWidth, 2.2, 16),
      mainArm: new CylinderGeometry(0.035 * strokeWidth, 0.035 * strokeWidth, 5.2, 16),
      subArm: new CylinderGeometry(0.03 * strokeWidth, 0.03 * strokeWidth, 3.2, 16),
      dropWire: new CylinderGeometry(0.022 * strokeWidth, 0.022 * strokeWidth, 1.4, 16),
      bigSphere: new SphereGeometry(0.72, 36, 36),
      smallSphere: new SphereGeometry(0.45, 32, 32),
      cone: new ConeGeometry(0.65, 1.25, 36),
      arch: new TorusGeometry(0.85, 0.16, 24, 56, Math.PI),
      disc: new CylinderGeometry(0.55, 0.55, 0.14, 36),
    }),
    [strokeWidth],
  );

  const materials = useMemo(
    () => ({
      primary: new MeshStandardMaterial({
        color: palette.primary,
        roughness: 0.42,
        metalness: 0.08,
      }),
      secondary: new MeshStandardMaterial({
        color: palette.secondary,
        roughness: 0.44,
        metalness: 0.08,
      }),
      accent: new MeshStandardMaterial({
        color: palette.accent,
        roughness: 0.38,
        metalness: 0.12,
      }),
      neutral: new MeshStandardMaterial({
        color: palette.neutral,
        roughness: 0.48,
        metalness: 0.05,
      }),
      rod: new MeshStandardMaterial({
        color: palette.rod,
        roughness: 0.25,
        metalness: 0.72,
      }),
    }),
    [
      palette.primary,
      palette.secondary,
      palette.accent,
      palette.neutral,
      palette.rod,
    ],
  );

  useEffect(() => {
    return () => {
      geometries.topStem.dispose();
      geometries.mainArm.dispose();
      geometries.subArm.dispose();
      geometries.dropWire.dispose();
      geometries.bigSphere.dispose();
      geometries.smallSphere.dispose();
      geometries.cone.dispose();
      geometries.arch.dispose();
      geometries.disc.dispose();
    };
  }, [geometries]);

  useEffect(() => {
    return () => {
      materials.primary.dispose();
      materials.secondary.dispose();
      materials.accent.dispose();
      materials.neutral.dispose();
      materials.rod.dispose();
    };
  }, [materials]);

  const offsetX = aspectRatio === "9:16" ? 0 : 2.15;
  const mobileScale = aspectRatio === "9:16" ? 0.72 : 1;

  // Hierarchical deterministic kinetic pendulum harmonics
  const mainArmRotY = Math.sin(loopAngle) * 0.48;
  const mainArmTiltZ = Math.cos(loopAngle) * 0.045;
  const lowerArmRotY = -Math.sin(loopAngle + 0.9) * 0.65;
  const lowerArmTiltZ = Math.sin(loopAngle + 0.5) * 0.055;
  const archRotY = loopAngle;

  return (
    <>
      <ambientLight intensity={palette.ambientIntensity} color="#FFFFFF" />
      <hemisphereLight args={["#FFFFFF", palette.bgBottom, 0.72]} />
      <directionalLight
        position={[9, 13, 10]}
        intensity={1.45}
        color="#FFFFFF"
        castShadow
      />
      <directionalLight
        position={[-10, -4, 8]}
        intensity={0.75}
        color={palette.accent}
      />
      <directionalLight
        position={[0, 6, -10]}
        intensity={0.85}
        color="#FFFFFF"
      />

      <group
        position={[offsetX, 0.25, 0]}
        scale={[mobileScale, mobileScale, mobileScale]}
      >
        {/* Top vertical suspension stem */}
        <mesh
          geometry={geometries.topStem}
          material={materials.rod}
          position={[0, 3.3, 0]}
        />

        {/* Level 1 Primary Crossbar */}
        <group
          position={[0, 2.2, 0]}
          rotation={[0, mainArmRotY, mainArmTiltZ]}
        >
          <mesh
            geometry={geometries.mainArm}
            material={materials.rod}
            rotation={[0, 0, Math.PI / 2]}
          />

          {/* Left side counterweight + suspended semi-circle arch */}
          <group position={[-2.4, 0, 0]}>
            <mesh
              geometry={geometries.dropWire}
              material={materials.rod}
              position={[0, -0.7, 0]}
            />
            <mesh
              geometry={geometries.bigSphere}
              material={materials.primary}
              position={[0, -1.55, 0]}
              castShadow
              receiveShadow
            />
            <mesh
              geometry={geometries.arch}
              material={materials.accent}
              position={[0, -2.55, 0]}
              rotation={[Math.PI, archRotY, 0]}
              castShadow
              receiveShadow
            />
          </group>

          {/* Right side Level 2 Sub-Crossbar */}
          <group
            position={[2.3, -0.7, 0]}
            rotation={[0, lowerArmRotY, lowerArmTiltZ]}
          >
            <mesh
              geometry={geometries.dropWire}
              material={materials.rod}
              position={[0, 0.35, 0]}
            />
            <mesh
              geometry={geometries.subArm}
              material={materials.rod}
              rotation={[0, 0, Math.PI / 2]}
            />

            {/* Sub-left inverted cone */}
            <group position={[-1.45, 0, 0]}>
              <mesh
                geometry={geometries.dropWire}
                material={materials.rod}
                position={[0, -0.7, 0]}
              />
              <mesh
                geometry={geometries.cone}
                material={materials.secondary}
                position={[0, -1.75, 0]}
                rotation={[Math.PI, 0, 0]}
                castShadow
                receiveShadow
              />
            </group>

            {/* Sub-right floating sphere + disc */}
            <group position={[1.45, 0, 0]}>
              <mesh
                geometry={geometries.dropWire}
                material={materials.rod}
                position={[0, -0.7, 0]}
              />
              <mesh
                geometry={geometries.smallSphere}
                material={materials.neutral}
                position={[0, -1.5, 0]}
                castShadow
                receiveShadow
              />
              <mesh
                geometry={geometries.disc}
                material={materials.accent}
                position={[0, -2.25, 0]}
                rotation={[Math.PI / 2, Math.sin(loopAngle) * 0.4, 0]}
                castShadow
                receiveShadow
              />
            </group>
          </group>
        </group>
      </group>
    </>
  );
};

export const MinimalistBauhausKineticMobile4K: React.FC<
  MinimalistBauhausKineticMobile4KProps
> = (props) => {
  const {
    themePreset = "warm-minimalist",
    aspectRatio = "16:9",
    backgroundColor = "#FAF6EE",
    primaryColor = "#1D3557",
    secondaryColor = "#E07A5F",
    accentColor = "#F4A261",
    speedMultiplier = 1,
    strokeWidth = 1,
  } = props;

  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const palette = useMemo(
    () =>
      resolvePalette({
        themePreset,
        aspectRatio,
        backgroundColor,
        primaryColor,
        secondaryColor,
        accentColor,
        speedMultiplier,
        strokeWidth,
      }),
    [
      themePreset,
      aspectRatio,
      backgroundColor,
      primaryColor,
      secondaryColor,
      accentColor,
      speedMultiplier,
      strokeWidth,
    ],
  );

  return (
    <AbsoluteFill style={{ backgroundColor: palette.bgTop, overflow: "hidden" }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <defs>
          <linearGradient
            id="bauhaus-bg-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={palette.bgTop} />
            <stop offset="100%" stopColor={palette.bgBottom} />
          </linearGradient>
          <filter
            id="bauhaus-grain"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed="79"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width={width} height={height} fill="url(#bauhaus-bg-grad)" />
        <rect
          width={width}
          height={height}
          filter="url(#bauhaus-grain)"
          opacity="0.012"
        />
      </svg>

      <ThreeCanvas
        width={width}
        height={height}
        shadows="soft"
        dpr={1}
        camera={CAMERA_CONFIG}
        gl={CANVAS_GL}
        style={{ position: "absolute", inset: 0 }}
      >
        <BauhausScene
          frame={frame}
          durationInFrames={durationInFrames}
          palette={palette}
          speedMultiplier={speedMultiplier}
          strokeWidth={strokeWidth}
          aspectRatio={aspectRatio}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

