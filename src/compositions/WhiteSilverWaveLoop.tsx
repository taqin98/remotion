import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";

export const whiteSilverWaveLoopSchema = z.object({
  bgTopColor: z.string().default("#ffffff"),
  bgBottomColor: z.string().default("#f3f3f3"),
  ribbonLightColor: z.string().default("#f8f8f7"),
  ribbonDarkColor: z.string().default("#b5b7bc"),
  wireframeLineColor: z.string().default("#b4b6bb"),
  accentHairlineColor: z.string().default("#cbcdcf"),
  dotColor: z.string().default("#dcdee1"),
  speedMultiplier: z.number().int().positive().default(1),
  amplitudeMultiplier: z.number().positive().default(2.5),
  enableGrain: z.boolean().default(true),
  grainOpacity: z.number().min(0).max(1).default(0.015),
});

export type WhiteSilverWaveLoopProps = z.infer<
  typeof whiteSilverWaveLoopSchema
>;

export const defaultWhiteSilverWaveLoopProps: WhiteSilverWaveLoopProps = {
  bgTopColor: "#ffffff",
  bgBottomColor: "#f3f3f3",
  ribbonLightColor: "#f8f8f7",
  ribbonDarkColor: "#b5b7bc",
  wireframeLineColor: "#b4b6bb",
  accentHairlineColor: "#cbcdcf",
  dotColor: "#dcdee1",
  speedMultiplier: 1,
  amplitudeMultiplier: 2.5,
  enableGrain: true,
  grainOpacity: 0.015,
};

export const WhiteSilverWaveLoop: React.FC<WhiteSilverWaveLoopProps> = ({
  bgTopColor = "#ffffff",
  bgBottomColor = "#f3f3f3",
  ribbonLightColor = "#f8f8f7",
  ribbonDarkColor = "#b5b7bc",
  wireframeLineColor = "#b4b6bb",
  accentHairlineColor = "#cbcdcf",
  dotColor = "#dcdee1",
  speedMultiplier = 1,
  amplitudeMultiplier = 2.5,
  enableGrain = true,
  grainOpacity = 0.015,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Normalized seamless loop angle (0 -> 2*PI across durationInFrames)
  const normalizedProgress = (frame % durationInFrames) / durationInFrames;
  const loopAngle = normalizedProgress * Math.PI * 2 * speedMultiplier;

  // Layer 1: Metallic Sheen Light-Sweep Coordinates (sinusoidal sweep)
  const frontSheenShift = Math.sin(loopAngle) * (450 * amplitudeMultiplier);
  const backSheenShift = -Math.sin(loopAngle) * (350 * amplitudeMultiplier);

  // Layer 2: Dot Matrix grid with horizontal wave ripple cascade
  const dots = useMemo(() => {
    const items: Array<{ col: number; row: number; baseX: number; baseY: number }> = [];
    for (let col = 0; col < 24; col += 1) {
      for (let row = 0; row < 6; row += 1) {
        items.push({
          col,
          row,
          baseX: 51 + col * 80,
          baseY: 1843 + row * 55,
        });
      }
    }
    return items;
  }, []);

  // Layer 3: Wireframe Waves individual contour phase calculation helper
  const calculateContourShift = (index: number, baseAmp: number, phaseShift = 0) => {
    const angle = loopAngle + index * 0.22 + phaseShift;
    return Math.sin(angle) * (baseAmp * amplitudeMultiplier);
  };

  // Flowing dashoffset (exact multiple of 60 for seamless loop at frame 300)
  const dashPeriod = 60;
  const streamOffset = normalizedProgress * dashPeriod * 8 * speedMultiplier;

  // Layer 4: Elastic undulation, rotation, skew & floating parallax on ribbons
  const backRibbonTranslateY = Math.sin(loopAngle) * (18 * amplitudeMultiplier);
  const backRibbonRotate = Math.sin(loopAngle) * (0.7 * amplitudeMultiplier);
  const backRibbonScaleY = 1.0 - Math.sin(loopAngle) * (0.035 * amplitudeMultiplier);
  const backRibbonSkewY = -Math.sin(loopAngle) * (0.5 * amplitudeMultiplier);

  const frontRibbonTranslateY = -Math.sin(loopAngle) * (18 * amplitudeMultiplier);
  const frontRibbonRotate = -Math.sin(loopAngle) * (0.7 * amplitudeMultiplier);
  const frontRibbonScaleY = 1.0 + Math.sin(loopAngle) * (0.04 * amplitudeMultiplier);
  const frontRibbonSkewY = Math.sin(loopAngle) * (0.6 * amplitudeMultiplier);

  // Layer 5: Technical Crosshairs CAD breathing & scanning
  const crosshairEased = Easing.inOut(Easing.sin)((Math.sin(loopAngle) + 1) / 2);
  const crosshairScale = interpolate(crosshairEased, [0, 1], [0.75, 1.02]);
  const crosshairDashOffset = normalizedProgress * 80 * 4 * speedMultiplier;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgTopColor,
        overflow: "hidden",
      }}
    >
      <svg
        width="3840"
        height="2160"
        viewBox="0 0 3840 2160"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      >
        <defs>
          {/* Layer 1: Background & Dynamic Metallic Sheen Gradients */}
          <linearGradient
            id="bg-linear-grad"
            x1="-70.74"
            y1="2008.297"
            x2="3910.74"
            y2="151.703"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor={bgTopColor} />
            <stop offset="0.55" stopColor="#fafafa" />
            <stop offset="1" stopColor={bgBottomColor} />
          </linearGradient>

          <linearGradient
            id="back-ribbon-grad"
            x1={0 + backSheenShift}
            y1="1887.5"
            x2={2100 + backSheenShift}
            y2="1887.5"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor={ribbonDarkColor} />
            <stop offset="0.35" stopColor="#d2d3d6" />
            <stop offset="0.7" stopColor="#c4c6ca" />
            <stop offset="1" stopColor="#e2e3e5" />
          </linearGradient>

          <linearGradient
            id="front-ribbon-grad-1"
            x1={0 + frontSheenShift}
            y1="1791"
            x2={3840 + frontSheenShift}
            y2="1791"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#e8e9eb" />
            <stop offset="0.18" stopColor={ribbonLightColor} />
            <stop offset="0.38" stopColor="#f6f6f4" />
            <stop offset="0.62" stopColor="#f7f7f6" />
            <stop offset="0.85" stopColor="#c0c2c7" />
            <stop offset="1" stopColor="#d6d8dc" />
          </linearGradient>

          <linearGradient
            id="front-ribbon-grad-2"
            x1={0 + frontSheenShift * 0.7}
            y1="1846.5"
            x2={3840 + frontSheenShift * 0.7}
            y2="1846.5"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#c2c4c8" />
            <stop offset="0.18" stopColor="#cfd1d5" />
            <stop offset="0.38" stopColor="#dfe0e3" />
            <stop offset="0.62" stopColor="#d2d4d8" />
            <stop offset="0.85" stopColor="#eaebec" />
            <stop offset="1" stopColor="#f3f4f5" />
          </linearGradient>

          <clipPath id="viewport-clip">
            <rect x="0" y="0" width="3840" height="2160" />
          </clipPath>

          {/* Procedural subtle grain filter */}
          <filter
            id="grain-noise-filter"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves="3"
              stitchTiles="stitch"
              result="noise"
            />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"
            />
          </filter>
        </defs>

        {/* =========================================================================
            LAYER 1: Background & Subtle Anti-Banding Grain
           ========================================================================= */}
        <g id="Layer_1_Background">
          <rect
            x="0"
            y="0"
            width="3840"
            height="2160"
            fill="url(#bg-linear-grad)"
          />
          {enableGrain && (
            <rect
              x="0"
              y="0"
              width="3840"
              height="2160"
              filter="url(#grain-noise-filter)"
              opacity={grainOpacity}
              style={{ pointerEvents: "none" }}
            />
          )}
        </g>

        <g clipPath="url(#viewport-clip)">
          {/* =========================================================================
              LAYER 2: Dot Matrix with Wave Ripple Propagation
             ========================================================================= */}
          <g id="Layer_2_DotMatrix">
            {dots.map((dot, idx) => {
              // Wave ripple phase traveling from left to right
              const dotPhase = loopAngle - dot.col * 0.22;
              const opacity = interpolate(Math.sin(dotPhase), [-1, 1], [0.15, 0.95]);
              const dynamicY = dot.baseY + Math.sin(dotPhase) * (9 * amplitudeMultiplier);
              const dynamicX = dot.baseX + Math.cos(loopAngle) * (14 * amplitudeMultiplier);

              return (
                <circle
                  key={idx}
                  cx={dynamicX}
                  cy={dynamicY}
                  r="3.2"
                  fill={dotColor}
                  opacity={opacity}
                />
              );
            })}
          </g>

          {/* =========================================================================
              LAYER 3: Staggered Parallax Wireframe Wave Lines
             ========================================================================= */}
          <g id="Layer_3_WireframeWaves">
            {/* Group A: Left waves with individual organic parallax floating */}
            <g id="Contour_Group_A">
              <path
                d="M0 1594 C237.33 1741.15 474.67 1994 712 1994 C956 1994 1200 1830 1444 1830 C1568.67 1830 1693.33 1861.3 1818 1880"
                fill="none"
                stroke={wireframeLineColor}
                strokeWidth="3.5"
                strokeDasharray="36 24"
                strokeDashoffset={-streamOffset}
                transform={`translate(0, ${calculateContourShift(0, 16)})`}
              />
              <path
                d="M0 1588 C237.33 1735.15 474.67 2010 712 2010 C956 2010 1200 1848 1444 1848 C1561.33 1848 1678.67 1877.4 1796 1895"
                fill="none"
                stroke={wireframeLineColor}
                strokeWidth="3.5"
                strokeDasharray="48 12"
                strokeDashoffset={-streamOffset * 0.75}
                transform={`translate(0, ${calculateContourShift(1, 15)})`}
              />
              <path
                d="M0 1582 C237.33 1729.15 474.67 2026 712 2026 C956 2026 1200 1866 1444 1866 C1554 1866 1664 1893.5 1774 1910"
                fill="none"
                stroke={wireframeLineColor}
                strokeWidth="3.5"
                transform={`translate(0, ${calculateContourShift(2, 14)})`}
              />
              <path
                d="M0 1576 C237.33 1723.15 474.67 2042 712 2042 C956 2042 1200 1884 1444 1884 C1546.67 1884 1649.33 1909.6 1752 1925"
                fill="none"
                stroke={wireframeLineColor}
                strokeWidth="3.5"
                strokeDasharray="30 30"
                strokeDashoffset={streamOffset * 0.5}
                transform={`translate(0, ${calculateContourShift(3, 13)})`}
              />
              <path
                d="M0 1570 C237.33 1717.15 474.67 2058 712 2058 C956 2058 1200 1902 1444 1902 C1539.33 1902 1634.67 1925.7 1730 1940"
                fill="none"
                stroke={wireframeLineColor}
                strokeWidth="3.5"
                transform={`translate(0, ${calculateContourShift(4, 12)})`}
              />
              <path
                d="M0 1564 C237.33 1711.15 474.67 2074 712 2074 C956 2074 1200 1920 1444 1920 C1532 1920 1620 1941.8 1708 1955"
                fill="none"
                stroke={wireframeLineColor}
                strokeWidth="3.5"
                strokeDasharray="40 20"
                strokeDashoffset={-streamOffset * 0.6}
                transform={`translate(0, ${calculateContourShift(5, 11)})`}
              />
              <path
                d="M0 1558 C237.33 1705.15 474.67 2090 712 2090 C956 2090 1200 1938 1444 1938 C1524.67 1938 1605.33 1957.9 1686 1970"
                fill="none"
                stroke={wireframeLineColor}
                strokeWidth="3.5"
                transform={`translate(0, ${calculateContourShift(6, 10)})`}
              />
              <path
                d="M0 1552 C237.33 1699.15 474.67 2106 712 2106 C956 2106 1200 1956 1444 1956 C1517.33 1956 1590.67 1974 1664 1985"
                fill="none"
                stroke={wireframeLineColor}
                strokeWidth="3.5"
                strokeDasharray="36 24"
                strokeDashoffset={streamOffset}
                transform={`translate(0, ${calculateContourShift(7, 9)})`}
              />
            </g>

            {/* Group B: Middle waves with fluid phase delay */}
            <g id="Contour_Group_B">
              <path
                d="M1680 1785 C1888.67 1711.97 2097.33 1538 2306 1538 C2524 1538 2742 1645.84 2960 1672"
                fill="none"
                stroke="#bcbec3"
                strokeWidth="3.2"
                strokeDasharray="36 24"
                strokeDashoffset={-streamOffset}
                transform={`translate(0, ${calculateContourShift(0, 15, Math.PI * 0.5)})`}
              />
              <path
                d="M1708 1807 C1907.33 1737.23 2106.67 1580 2306 1580 C2516 1580 2726 1674.8 2936 1700"
                fill="none"
                stroke="#bcbec3"
                strokeWidth="3.2"
                strokeDasharray="45 15"
                strokeDashoffset={-streamOffset * 0.8}
                transform={`translate(0, ${calculateContourShift(1, 14, Math.PI * 0.5)})`}
              />
              <path
                d="M1736 1829 C1926 1762.5 2116 1622 2306 1622 C2508 1622 2710 1703.76 2912 1728"
                fill="none"
                stroke="#bcbec3"
                strokeWidth="3.2"
                transform={`translate(0, ${calculateContourShift(2, 13, Math.PI * 0.5)})`}
              />
              <path
                d="M1764 1851 C1944.67 1787.77 2125.33 1664 2306 1664 C2500 1664 2694 1732.72 2888 1756"
                fill="none"
                stroke="#bcbec3"
                strokeWidth="3.2"
                strokeDasharray="30 30"
                strokeDashoffset={streamOffset * 0.7}
                transform={`translate(0, ${calculateContourShift(3, 12, Math.PI * 0.5)})`}
              />
              <path
                d="M1792 1873 C1963.33 1813.03 2134.67 1706 2306 1706 C2492 1706 2678 1761.68 2864 1784"
                fill="none"
                stroke="#bcbec3"
                strokeWidth="3.2"
                transform={`translate(0, ${calculateContourShift(4, 11, Math.PI * 0.5)})`}
              />
              <path
                d="M1820 1895 C1982 1838.3 2144 1748 2306 1748 C2484 1748 2662 1790.64 2840 1812"
                fill="none"
                stroke="#bcbec3"
                strokeWidth="3.2"
                strokeDasharray="40 20"
                strokeDashoffset={-streamOffset * 0.6}
                transform={`translate(0, ${calculateContourShift(5, 10, Math.PI * 0.5)})`}
              />
              <path
                d="M1848 1917 C2000.67 1863.57 2153.33 1790 2306 1790 C2476 1790 2646 1819.6 2816 1840"
                fill="none"
                stroke="#bcbec3"
                strokeWidth="3.2"
                transform={`translate(0, ${calculateContourShift(6, 9, Math.PI * 0.5)})`}
              />
              <path
                d="M2160 1915 C2260 1900 2360 1670 2460 1670 C2560 1670 2660 1740 2760 1765"
                fill="none"
                stroke="#bcbec3"
                strokeWidth="3.2"
                strokeDasharray="36 24"
                strokeDashoffset={streamOffset}
                transform={`translate(0, ${calculateContourShift(7, 8, Math.PI * 0.5)})`}
              />
              <path
                d="M2190 1933 C2280 1919.5 2370 1714 2460 1714 C2553.33 1714 2646.67 1769.67 2740 1793"
                fill="none"
                stroke="#bcbec3"
                strokeWidth="3.2"
                transform={`translate(0, ${calculateContourShift(8, 7, Math.PI * 0.5)})`}
              />
            </g>

            {/* Group C: Upper Right waves */}
            <g id="Contour_Group_C">
              <path
                d="M2920 1630 C3093.33 1552 3266.67 1442 3440 1442 C3573.33 1442 3706.67 1461.67 3840 1495"
                fill="none"
                stroke="#abaeb4"
                strokeWidth="3.8"
                strokeDasharray="36 24"
                strokeDashoffset={streamOffset}
                transform={`translate(0, ${calculateContourShift(0, 14, Math.PI)})`}
              />
              <path
                d="M2880 1665 C3063.33 1588 3246.67 1502 3430 1502 C3566.67 1502 3703.33 1523.73 3840 1562"
                fill="none"
                stroke="#abaeb4"
                strokeWidth="3.8"
                strokeDasharray="48 12"
                strokeDashoffset={-streamOffset * 0.8}
                transform={`translate(0, ${calculateContourShift(1, 12, Math.PI)})`}
              />
            </g>

            {/* Group D: Lower Right waves */}
            <g id="Contour_Group_D">
              <path
                d="M2168 2050 C2292 2093.4 2416 2090 2540 2090 C2824.67 2090 3109.33 1732 3394 1732 C3542.67 1732 3691.33 1800.56 3840 1863"
                fill="none"
                stroke="#b6b8bd"
                strokeWidth="3.4"
                strokeDasharray="36 24"
                strokeDashoffset={-streamOffset}
                transform={`translate(0, ${calculateContourShift(0, 16, Math.PI * 1.5)})`}
              />
              <path
                d="M2186 2065 C2304 2106.3 2422 2110 2540 2110 C2824.67 2110 3109.33 1778 3394 1778 C3542.67 1778 3691.33 1848.56 3840 1911"
                fill="none"
                stroke="#b6b8bd"
                strokeWidth="3.4"
                strokeDasharray="40 20"
                strokeDashoffset={-streamOffset * 0.6}
                transform={`translate(0, ${calculateContourShift(1, 15, Math.PI * 1.5)})`}
              />
              <path
                d="M2204 2080 C2316 2119.2 2428 2130 2540 2130 C2824.67 2130 3109.33 1824 3394 1824 C3542.67 1824 3691.33 1896.56 3840 1959"
                fill="none"
                stroke="#b6b8bd"
                strokeWidth="3.4"
                transform={`translate(0, ${calculateContourShift(2, 14, Math.PI * 1.5)})`}
              />
              <path
                d="M2222 2095 C2328 2132.1 2434 2150 2540 2150 C2824.67 2150 3109.33 1870 3394 1870 C3542.67 1870 3691.33 1944.56 3840 2007"
                fill="none"
                stroke="#b6b8bd"
                strokeWidth="3.4"
                strokeDasharray="30 30"
                strokeDashoffset={streamOffset * 0.75}
                transform={`translate(0, ${calculateContourShift(3, 13, Math.PI * 1.5)})`}
              />
              <path
                d="M2240 2110 C2340 2145 2440 2170 2540 2170 C2824.67 2170 3109.33 1916 3394 1916 C3542.67 1916 3691.33 1992.56 3840 2055"
                fill="none"
                stroke="#b6b8bd"
                strokeWidth="3.4"
                transform={`translate(0, ${calculateContourShift(4, 12, Math.PI * 1.5)})`}
              />
              <path
                d="M2258 2125 C2352 2157.9 2446 2190 2540 2190 C2824.67 2190 3109.33 1962 3394 1962 C3542.67 1962 3691.33 2040.56 3840 2103"
                fill="none"
                stroke="#b6b8bd"
                strokeWidth="3.4"
                strokeDasharray="45 15"
                strokeDashoffset={-streamOffset * 0.8}
                transform={`translate(0, ${calculateContourShift(5, 11, Math.PI * 1.5)})`}
              />
              <path
                d="M2276 2140 C2364 2170.8 2452 2210 2540 2210 C2824.67 2210 3109.33 2008 3394 2008 C3542.67 2008 3691.33 2088.56 3840 2151"
                fill="none"
                stroke="#b6b8bd"
                strokeWidth="3.4"
                transform={`translate(0, ${calculateContourShift(6, 10, Math.PI * 1.5)})`}
              />
              <path
                d="M2294 2155 C2376 2183.7 2458 2230 2540 2230 C2824.67 2230 3109.33 2054 3394 2054 C3542.67 2054 3691.33 2136.56 3840 2199"
                fill="none"
                stroke="#b6b8bd"
                strokeWidth="3.4"
                strokeDasharray="36 24"
                strokeDashoffset={streamOffset}
                transform={`translate(0, ${calculateContourShift(7, 9, Math.PI * 1.5)})`}
              />
            </g>
          </g>

          {/* =========================================================================
              LAYER 4: Elastic Undulating Ribbons with Parallax
             ========================================================================= */}
          {/* Back Ribbon Group: undulating scaleY + skewY + parallax floating */}
          <g
            id="Layer_4_BackRibbon"
            transform={`translate(0, ${backRibbonTranslateY}) rotate(${backRibbonRotate}, 1050, 1860) translate(1050, 1860) scale(1, ${backRibbonScaleY}) skewY(${backRibbonSkewY}) translate(-1050, -1860)`}
          >
            <path
              d="M0 1745 C212.67 1670.57 425.33 1575 638 1575 C906.67 1575 1175.33 1652.16 1444 1765 C1682.67 1865.24 1921.33 2004.87 2160 2160 L2100 2160 C1881.33 2017.87 1662.67 1896.84 1444 1805 C1175.33 1692.16 906.67 1615 638 1615 C425.33 1615 212.67 1710.57 0 1785 Z"
              fill="#f6f6f5"
            />
            <path
              d="M0 1785 C212.67 1710.57 425.33 1615 638 1615 C906.67 1615 1175.33 1692.16 1444 1805 C1662.67 1896.84 1881.33 2017.87 2100 2160 L2020 2160 C1828 2035.2 1636 1935.64 1444 1855 C1175.33 1742.16 906.67 1665 638 1665 C425.33 1665 212.67 1760.57 0 1835 Z"
              fill="url(#back-ribbon-grad)"
            />
            <path
              d="M0 1835 C212.67 1760.57 425.33 1665 638 1665 C906.67 1665 1175.33 1742.16 1444 1855 C1636 1935.64 1828 2035.2 2020 2160 L1950 2160 C1781.33 2050.37 1612.67 1968.84 1444 1898 C1175.33 1785.16 906.67 1712 638 1712 C425.33 1712 212.67 1805.57 0 1880 Z"
              fill="#efeff0"
            />
            <path
              d="M0 1690 C212.67 1615.57 425.33 1530 638 1530 C885.33 1530 1132.67 1616.01 1380 1710"
              fill="none"
              stroke="#aeb0b5"
              strokeWidth="3.5"
            />
            <path
              d="M0 1745 C212.67 1670.57 425.33 1575 638 1575 C906.67 1575 1175.33 1652.16 1444 1765 C1682.67 1865.24 1921.33 2004.87 2160 2160"
              fill="none"
              stroke="#aeb0b5"
              strokeWidth="3.5"
            />
            <path
              d="M0 1785 C212.67 1710.57 425.33 1615 638 1615 C906.67 1615 1175.33 1692.16 1444 1805 C1662.67 1896.84 1881.33 2017.87 2100 2160"
              fill="none"
              stroke="#aeb0b5"
              strokeWidth="3.5"
            />
            <path
              d="M0 1835 C212.67 1760.57 425.33 1665 638 1665 C906.67 1665 1175.33 1742.16 1444 1855 C1636 1935.64 1828 2035.2 2020 2160"
              fill="none"
              stroke="#aeb0b5"
              strokeWidth="3.5"
            />
          </g>

          {/* Front Ribbon Group: undulating scaleY + skewY + counter-parallax floating */}
          <g
            id="Layer_4_FrontRibbon"
            transform={`translate(0, ${frontRibbonTranslateY}) rotate(${frontRibbonRotate}, 1920, 1820) translate(1920, 1820) scale(1, ${frontRibbonScaleY}) skewY(${frontRibbonSkewY}) translate(-1920, -1820)`}
          >
            <path
              d="M0 1595 C237.33 1725.53 474.67 1890 712 1890 C956 1890 1200 1698 1444 1698 C1731.33 1698 2018.67 1940 2306 1940 C2668.67 1940 3031.33 1580 3394 1580 C3542.67 1580 3691.33 1617.97 3840 1670 L3840 1732 C3691.33 1679.97 3542.67 1638 3394 1638 C3031.33 1638 2668.67 2002 2306 2002 C2018.67 2002 1731.33 1758 1444 1758 C1200 1758 956 1938 712 1938 C474.67 1938 237.33 1775.53 0 1645 Z"
              fill="url(#front-ribbon-grad-1)"
            />
            <path
              d="M0 1645 C237.33 1775.53 474.67 1938 712 1938 C956 1938 1200 1758 1444 1758 C1731.33 1758 2018.67 2002 2306 2002 C2668.67 2002 3031.33 1638 3394 1638 C3542.67 1638 3691.33 1679.97 3840 1732 L3840 1782 C3691.33 1729.97 3542.67 1686 3394 1686 C3031.33 1686 2668.67 2055 2306 2055 C2018.67 2055 1731.33 1812 1444 1812 C1200 1812 956 1978 712 1978 C474.67 1978 237.33 1815.53 0 1685 Z"
              fill="url(#front-ribbon-grad-2)"
            />

            {/* Ribbon Edge Contour Strokes */}
            <path
              d="M0 1595 C237.33 1725.53 474.67 1890 712 1890 C956 1890 1200 1698 1444 1698 C1731.33 1698 2018.67 1940 2306 1940 C2668.67 1940 3031.33 1580 3394 1580 C3542.67 1580 3691.33 1617.97 3840 1670"
              fill="none"
              stroke="#a6a9af"
              strokeWidth="4.2"
            />
            <path
              d="M0 1645 C237.33 1775.53 474.67 1938 712 1938 C956 1938 1200 1758 1444 1758 C1731.33 1758 2018.67 2002 2306 2002 C2668.67 2002 3031.33 1638 3394 1638 C3542.67 1638 3691.33 1679.97 3840 1732"
              fill="none"
              stroke="#b8bac0"
              strokeWidth="3.5"
            />
            <path
              d="M0 1685 C237.33 1815.53 474.67 1978 712 1978 C956 1978 1200 1812 1444 1812 C1731.33 1812 2018.67 2055 2306 2055 C2668.67 2055 3031.33 1686 3394 1686 C3542.67 1686 3691.33 1729.97 3840 1782"
              fill="none"
              stroke="#a8abb1"
              strokeWidth="4"
            />
          </g>

          {/* =========================================================================
              LAYER 5: Technical Crosshairs CAD Scan
             ========================================================================= */}
          {/* Bottom-Left Technical Lines */}
          <g
            id="Layer_5_Crosshair_Left"
            transform={`translate(139, 1961) scale(${crosshairScale}) translate(-139, -1961)`}
          >
            <path
              d="M139 1500 L139 2160"
              fill="none"
              stroke={accentHairlineColor}
              strokeWidth="2.5"
              strokeDasharray="40 10"
              strokeDashoffset={-crosshairDashOffset}
            />
            <path
              d="M98 1825 L98 2035"
              fill="none"
              stroke={accentHairlineColor}
              strokeWidth="2.5"
            />
            <path
              d="M206 1759 L695 1759"
              fill="none"
              stroke={accentHairlineColor}
              strokeWidth="2.5"
              strokeDasharray="50 15"
              strokeDashoffset={crosshairDashOffset}
            />
            <path
              d="M740 1759 L815 1759"
              fill="none"
              stroke={accentHairlineColor}
              strokeWidth="2.5"
            />
            <path
              d="M0 1961 L1088 1961"
              fill="none"
              stroke={accentHairlineColor}
              strokeWidth="2.5"
              strokeDasharray="60 20"
              strokeDashoffset={-crosshairDashOffset * 0.75}
            />
          </g>

          {/* Bottom-Right Technical Lines */}
          <g
            id="Layer_5_Crosshair_Right"
            transform={`translate(3701, 1961) scale(${crosshairScale}) translate(-3701, -1961)`}
          >
            <path
              d="M3701 1320 L3701 2032"
              fill="none"
              stroke={accentHairlineColor}
              strokeWidth="2.5"
              strokeDasharray="40 10"
              strokeDashoffset={crosshairDashOffset}
            />
            <path
              d="M2794 1961 L3758 1961"
              fill="none"
              stroke={accentHairlineColor}
              strokeWidth="2.5"
              strokeDasharray="60 20"
              strokeDashoffset={-crosshairDashOffset}
            />
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
