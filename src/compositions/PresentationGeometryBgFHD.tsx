import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";

export const presentationGeometryBgSchema = z.object({
  backgroundColor: z.string().default("#F8FAFC"),
  primaryColor: z.string().default("#1E3A8A"),
  secondaryColor: z.string().default("#3B82F6"),
  accentColor: z.string().default("#06B6D4"),
  speedMultiplier: z.number().int().positive().default(1),
  strokeWidth: z.number().positive().default(1.5),
});

export type PresentationGeometryBgProps = z.infer<
  typeof presentationGeometryBgSchema
>;

export const defaultPresentationGeometryBgProps: PresentationGeometryBgProps = {
  backgroundColor: "#F8FAFC",
  primaryColor: "#1E3A8A",
  secondaryColor: "#3B82F6",
  accentColor: "#06B6D4",
  speedMultiplier: 1,
  strokeWidth: 1.5,
};

export const presentationGeometryVariations: Record<
  string,
  PresentationGeometryBgProps
> = {
  corporateBlue: defaultPresentationGeometryBgProps,
  executiveSlate: {
    backgroundColor: "#F1F5F9",
    primaryColor: "#0F172A",
    secondaryColor: "#475569",
    accentColor: "#6366F1",
    speedMultiplier: 1,
    strokeWidth: 1.5,
  },
  emeraldTech: {
    backgroundColor: "#F4FBF8",
    primaryColor: "#064E3B",
    secondaryColor: "#10B981",
    accentColor: "#14B8A6",
    speedMultiplier: 1,
    strokeWidth: 1.5,
  },
  warmIvoryGold: {
    backgroundColor: "#FDFBF7",
    primaryColor: "#292524",
    secondaryColor: "#B45309",
    accentColor: "#D97706",
    speedMultiplier: 1,
    strokeWidth: 1.5,
  },
};

interface DotPoint {
  id: string;
  cx: number;
  cy: number;
  phase: number;
}

interface FloatingPolygon {
  id: string;
  cx: number;
  cy: number;
  radius: number;
  sides: number;
  baseRotation: number;
  phase: number;
  useAccent: boolean;
  dashed: boolean;
}

const buildPolygonPoints = (
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  rotationDeg: number,
): string => {
  const points: string[] = [];
  const baseRad = (rotationDeg * Math.PI) / 180;
  for (let i = 0; i < sides; i += 1) {
    const theta = baseRad + (i * Math.PI * 2) / sides;
    const px = cx + Math.cos(theta) * radius;
    const py = cy + Math.sin(theta) * radius;
    points.push(`${px.toFixed(2)},${py.toFixed(2)}`);
  }
  return points.join(" ");
};

const createDotCluster = (
  prefix: string,
  startX: number,
  startY: number,
  cols: number,
  rows: number,
  gap: number,
): DotPoint[] => {
  const items: DotPoint[] = [];
  for (let col = 0; col < cols; col += 1) {
    for (let row = 0; row < rows; row += 1) {
      items.push({
        id: `${prefix}-${col}-${row}`,
        cx: startX + col * gap,
        cy: startY + row * gap,
        phase: col * 0.42 + row * 0.36,
      });
    }
  }
  return items;
};

export const PresentationGeometryBgFHD: React.FC<
  PresentationGeometryBgProps
> = ({
  backgroundColor = "#F8FAFC",
  primaryColor = "#1E3A8A",
  secondaryColor = "#3B82F6",
  accentColor = "#06B6D4",
  speedMultiplier = 1,
  strokeWidth = 1.5,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = (frame % durationInFrames) / durationInFrames;
  const angle = progress * Math.PI * 2 * speedMultiplier;

  // Seamless grid shift matching exact 60px pattern period
  const gridTileSize = 60;
  const gridShift = progress * gridTileSize * speedMultiplier;

  // Smooth symmetric breathing curve
  const easedBreath = Easing.inOut(Easing.sin)((Math.sin(angle) + 1) / 2);

  // Corner geometric ribbon displacements
  const trPrimaryX = Math.sin(angle) * 22;
  const trPrimaryY = Math.cos(angle) * 14;
  const trSecondaryX = Math.sin(angle + 0.85) * 28;
  const trSecondaryY = Math.cos(angle + 0.85) * 18;
  const trAccentX = Math.sin(angle + 1.7) * 18;
  const trAccentY = -Math.sin(angle + 0.6) * 20;

  const blPrimaryX = -Math.sin(angle + 0.4) * 20;
  const blPrimaryY = Math.cos(angle + 0.4) * 16;
  const blSecondaryX = Math.sin(angle + 1.2) * 24;
  const blSecondaryY = -Math.cos(angle + 1.2) * 14;

  // Dash cycle exact integer multiple of (16 + 8) = 24
  const dashPeriod = 24;
  const dashOffset = progress * dashPeriod * 5 * speedMultiplier;

  const topLeftDots = useMemo(
    () => createDotCluster("tl", 64, 68, 7, 4, 24),
    [],
  );
  const bottomRightDots = useMemo(
    () => createDotCluster("br", 1680, 924, 7, 4, 24),
    [],
  );

  const floatingPolygons = useMemo<FloatingPolygon[]>(
    () => [
      {
        id: "poly-tr-hex",
        cx: 1715,
        cy: 335,
        radius: 56,
        sides: 6,
        baseRotation: 15,
        phase: 0.2,
        useAccent: true,
        dashed: false,
      },
      {
        id: "poly-tr-diamond",
        cx: 1595,
        cy: 215,
        radius: 34,
        sides: 4,
        baseRotation: 0,
        phase: 1.4,
        useAccent: false,
        dashed: true,
      },
      {
        id: "poly-right-hex",
        cx: 1805,
        cy: 565,
        radius: 42,
        sides: 6,
        baseRotation: 30,
        phase: 2.1,
        useAccent: false,
        dashed: true,
      },
      {
        id: "poly-bl-diamond",
        cx: 265,
        cy: 870,
        radius: 46,
        sides: 4,
        baseRotation: 0,
        phase: 0.9,
        useAccent: true,
        dashed: false,
      },
      {
        id: "poly-bl-tri",
        cx: 150,
        cy: 745,
        radius: 28,
        sides: 3,
        baseRotation: -15,
        phase: 2.7,
        useAccent: false,
        dashed: false,
      },
    ],
    [],
  );

  const renderDotCluster = (dots: DotPoint[]) =>
    dots.map((dot) => {
      const wave = Math.sin(angle + dot.phase);
      const radius = interpolate(wave, [-1, 1], [1.8, 3.4]);
      const opacity = interpolate(wave, [-1, 1], [0.12, 0.34]);
      return (
        <circle
          key={dot.id}
          cx={dot.cx}
          cy={dot.cy}
          r={radius}
          fill={secondaryColor}
          opacity={opacity}
        />
      );
    });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        overflow: "hidden",
      }}
    >
      <svg
        width="1920"
        height="1080"
        viewBox="0 0 1920 1080"
        style={{
          display: "block",
          width: "100%",
          height: "100%",
        }}
      >
        <defs>
          {/* Soft diagonal canvas wash preserving center-left presentation contrast */}
          <linearGradient id="ppt-bg-wash" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={backgroundColor} stopOpacity="1" />
            <stop offset="65%" stopColor={secondaryColor} stopOpacity="0.035" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.065" />
          </linearGradient>

          {/* Subtle glowing ambient corner wash */}
          <radialGradient id="ppt-tr-glow" cx="92%" cy="10%" r="48%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.11" />
            <stop offset="60%" stopColor={secondaryColor} stopOpacity="0.04" />
            <stop offset="100%" stopColor={backgroundColor} stopOpacity="0" />
          </radialGradient>

          <radialGradient id="ppt-bl-glow" cx="8%" cy="92%" r="42%">
            <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.09" />
            <stop offset="100%" stopColor={backgroundColor} stopOpacity="0" />
          </radialGradient>

          {/* Seamless architectural grid pattern */}
          <pattern
            id="ppt-iso-grid"
            width={gridTileSize}
            height={gridTileSize}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${gridShift}, ${gridShift})`}
          >
            <path
              d={`M ${gridTileSize} 0 L 0 0 0 ${gridTileSize}`}
              fill="none"
              stroke={primaryColor}
              strokeWidth={strokeWidth * 0.55}
              opacity="0.09"
            />
            <circle cx="0" cy="0" r="1.3" fill={secondaryColor} opacity="0.16" />
          </pattern>

          {/* Subtle anti-banding grain filter */}
          <filter id="ppt-geo-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.75"
              numOctaves="2"
              seed="7"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>

        {/* Layer 1: Clean Canvas & Architectural Grid */}
        <rect width="1920" height="1080" fill="url(#ppt-bg-wash)" />
        <rect width="1920" height="1080" fill="url(#ppt-tr-glow)" />
        <rect width="1920" height="1080" fill="url(#ppt-bl-glow)" />
        <rect width="1920" height="1080" fill="url(#ppt-iso-grid)" />

        {/* Subtle presentation safe-zone margin framing hairlines */}
        <g opacity="0.18">
          <line
            x1="88"
            y1="56"
            x2="340"
            y2="56"
            stroke={primaryColor}
            strokeWidth={strokeWidth * 0.75}
          />
          <line
            x1="1580"
            y1="1024"
            x2="1832"
            y2="1024"
            stroke={primaryColor}
            strokeWidth={strokeWidth * 0.75}
          />
        </g>

        {/* Layer 2: Dot Matrix Margin Clusters */}
        <g id="dot-matrices">
          {renderDotCluster(topLeftDots)}
          {renderDotCluster(bottomRightDots)}
        </g>

        {/* Layer 3: Top-Right Geometric Ribbons & Layered Planes */}
        <g id="top-right-geometry">
          {/* Large translucent secondary backing slab */}
          <polygon
            points="1390,-40 1960,-40 1960,520 1640,210"
            fill={secondaryColor}
            opacity="0.11"
            transform={`translate(${trSecondaryX}, ${trSecondaryY})`}
          />

          {/* Primary structural angled ribbon */}
          <polygon
            points="1540,-30 1960,-30 1960,360 1740,145"
            fill={primaryColor}
            opacity="0.16"
            transform={`translate(${trPrimaryX}, ${trPrimaryY})`}
          />

          {/* Accent geometric chevron shard */}
          <polygon
            points="1665,-20 1835,-20 1960,105 1960,240"
            fill={accentColor}
            opacity="0.24"
            transform={`translate(${trAccentX}, ${trAccentY})`}
          />

          {/* Sharp crisp outline parallelogram accent */}
          <polygon
            points="1465,60 1635,60 1775,200 1605,200"
            fill="none"
            stroke={secondaryColor}
            strokeWidth={strokeWidth * 1.15}
            opacity="0.34"
            transform={`translate(${-trPrimaryX * 0.8}, ${trSecondaryY * 0.7})`}
          />

          {/* Animated parallel diagonal vector guidelines */}
          <line
            x1="1430"
            y1="-20"
            x2="1950"
            y2="500"
            stroke={accentColor}
            strokeWidth={strokeWidth}
            strokeDasharray="16 8"
            strokeDashoffset={-dashOffset}
            opacity="0.42"
          />
          <line
            x1="1520"
            y1="-20"
            x2="1950"
            y2="410"
            stroke={primaryColor}
            strokeWidth={strokeWidth * 0.85}
            opacity="0.22"
            transform={`translate(${trAccentX * 0.45}, 0)`}
          />
        </g>

        {/* Layer 4: Bottom-Left Geometric Framing Planes */}
        <g id="bottom-left-geometry">
          {/* Backing geometric wedge */}
          <polygon
            points="-40,700 440,1120 -40,1120"
            fill={secondaryColor}
            opacity="0.1"
            transform={`translate(${blSecondaryX}, ${blSecondaryY})`}
          />

          {/* Primary corner anchor prism */}
          <polygon
            points="-40,835 280,1120 -40,1120"
            fill={primaryColor}
            opacity="0.16"
            transform={`translate(${blPrimaryX}, ${blPrimaryY})`}
          />

          {/* Accent diagonal strip */}
          <polygon
            points="-20,785 45,785 355,1095 290,1095"
            fill={accentColor}
            opacity="0.25"
            transform={`translate(${blPrimaryX * 0.6}, ${-blSecondaryY * 0.8})`}
          />

          {/* Flowing dashed architectural track */}
          <line
            x1="-20"
            y1="720"
            x2="410"
            y2="1110"
            stroke={secondaryColor}
            strokeWidth={strokeWidth}
            strokeDasharray="16 8"
            strokeDashoffset={dashOffset}
            opacity="0.38"
          />
        </g>

        {/* Layer 5: Floating Isometric / Polygon Accents & Crosshairs */}
        <g id="floating-accents">
          {floatingPolygons.map((poly) => {
            const floatX = Math.sin(angle + poly.phase) * 9;
            const floatY = Math.cos(angle + poly.phase) * 11;
            const rotDelta = Math.sin(angle + poly.phase * 0.7) * 10;
            const scale = interpolate(
              Math.sin(angle + poly.phase),
              [-1, 1],
              [0.94, 1.06],
            );
            const strokeColor = poly.useAccent ? accentColor : secondaryColor;

            return (
              <g
                key={poly.id}
                transform={`translate(${poly.cx + floatX}, ${poly.cy + floatY}) rotate(${poly.baseRotation + rotDelta}) scale(${scale})`}
              >
                <polygon
                  points={buildPolygonPoints(0, 0, poly.radius, poly.sides, 0)}
                  fill={strokeColor}
                  fillOpacity="0.045"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={poly.dashed ? "16 8" : undefined}
                  strokeDashoffset={poly.dashed ? -dashOffset : undefined}
                  opacity="0.45"
                />
                <circle cx="0" cy="0" r="2.2" fill={primaryColor} opacity="0.4" />
              </g>
            );
          })}

          {/* Technical calibration crosshair (right periphery) */}
          <g
            transform={`translate(1820, 775) scale(${interpolate(easedBreath, [0, 1], [0.88, 1.08])})`}
            opacity="0.38"
          >
            <line
              x1="-14"
              y1="0"
              x2="14"
              y2="0"
              stroke={primaryColor}
              strokeWidth={strokeWidth}
            />
            <line
              x1="0"
              y1="-14"
              x2="0"
              y2="14"
              stroke={primaryColor}
              strokeWidth={strokeWidth}
            />
            <circle
              cx="0"
              cy="0"
              r="7"
              fill="none"
              stroke={accentColor}
              strokeWidth={strokeWidth}
            />
          </g>

          {/* Technical calibration crosshair (top-left periphery) */}
          <g
            transform={`translate(345, 118) scale(${interpolate(easedBreath, [0, 1], [1.06, 0.9])})`}
            opacity="0.32"
          >
            <line
              x1="-10"
              y1="0"
              x2="10"
              y2="0"
              stroke={secondaryColor}
              strokeWidth={strokeWidth}
            />
            <line
              x1="0"
              y1="-10"
              x2="0"
              y2="10"
              stroke={secondaryColor}
              strokeWidth={strokeWidth}
            />
          </g>
        </g>

        {/* Layer 6: Anti-banding subtle grain overlay */}
        <rect
          width="1920"
          height="1080"
          filter="url(#ppt-geo-grain)"
          opacity="0.012"
          style={{ pointerEvents: "none" }}
        />
      </svg>
    </AbsoluteFill>
  );
};

