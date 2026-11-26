import React from "react";
import { Composition, Folder } from "remotion";
import {
  WhiteSilverWaveLoop,
  whiteSilverWaveLoopSchema,
} from "./compositions/WhiteSilverWaveLoop";
import {
  PresentationGeometryBgFHD,
  presentationGeometryBgSchema,
} from "./compositions/PresentationGeometryBgFHD";
import {
  CorporateGeometry3DBgFHD,
  corporateGeometry3DSchema,
} from "./compositions/CorporateGeometry3DBgFHD";
import {
  IsometricPillarGrid3DFHD,
  isometricPillarGrid3DSchema,
} from "./compositions/IsometricPillarGrid3DFHD";
import {
  GeometricConstellationMesh3DFHD,
  geometricConstellationMesh3DSchema,
} from "./compositions/GeometricConstellationMesh3DFHD";
import {
  LowPolyPaperFoldWave3DFHD,
  lowPolyPaperFoldWave3DSchema,
} from "./compositions/LowPolyPaperFoldWave3DFHD";
import {
  GeometricTileWipeTransition3DFHD,
  geometricTileWipeTransition3DSchema,
} from "./compositions/GeometricTileWipeTransition3DFHD";
import {
  CommercialArchGeometry4K,
  commercialArchGeometry4KSchema,
} from "./compositions/CommercialArchGeometry4K";
import {
  BlankLowerThird3D4K,
  blankLowerThird3D4KSchema,
} from "./compositions/BlankLowerThird3D4K";
import {
  FloatingMinimalistArches4K,
  floatingMinimalistArches4KSchema,
} from "./compositions/FloatingMinimalistArches4K";
import {
  EndlessIsometricStaircase4K,
  endlessIsometricStaircase4KSchema,
} from "./compositions/EndlessIsometricStaircase4K";
import {
  OrbitingSmoothPills4K,
  orbitingSmoothPills4KSchema,
} from "./compositions/OrbitingSmoothPills4K";
import {
  RotatingConcentricTorusRings4K,
  rotatingConcentricTorusRings4KSchema,
} from "./compositions/RotatingConcentricTorusRings4K";
import {
  KineticBalanceSpheres4K,
  kineticBalanceSpheres4KSchema,
} from "./compositions/KineticBalanceSpheres4K";
import {
  ChamferedCubeHorizon4K,
  chamferedCubeHorizon4KSchema,
} from "./compositions/ChamferedCubeHorizon4K";
import {
  SlidingArchitecturalPanels4K,
  slidingArchitecturalPanels4KSchema,
} from "./compositions/SlidingArchitecturalPanels4K";
import {
  RibbonWaveSculpture4K,
  ribbonWaveSculpture4KSchema,
} from "./compositions/RibbonWaveSculpture4K";
import {
  FloatingSteppingStones4K,
  floatingSteppingStones4KSchema,
} from "./compositions/FloatingSteppingStones4K";
import {
  SoftFoldedPaperLandscape4K,
  softFoldedPaperLandscape4KSchema,
} from "./compositions/SoftFoldedPaperLandscape4K";
import {
  PlexusNeuralConstellation4K,
  plexusNeuralConstellation4KSchema,
} from "./compositions/PlexusNeuralConstellation4K";
import {
  IsometricDataPillarMatrix4K,
  isometricDataPillarMatrix4KSchema,
} from "./compositions/IsometricDataPillarMatrix4K";
import {
  InfiniteWireframeDataTunnel4K,
  infiniteWireframeDataTunnel4KSchema,
} from "./compositions/InfiniteWireframeDataTunnel4K";
import {
  HexagonalCyberWaveGrid4K,
  hexagonalCyberWaveGrid4KSchema,
} from "./compositions/HexagonalCyberWaveGrid4K";
import {
  RotatingDottedDigitalGlobe4K,
  rotatingDottedDigitalGlobe4KSchema,
} from "./compositions/RotatingDottedDigitalGlobe4K";
import {
  BinaryVoxelStream4K,
  binaryVoxelStream4KSchema,
} from "./compositions/BinaryVoxelStream4K";
import {
  LowPolyCyberTerrainFlyover4K,
  lowPolyCyberTerrainFlyover4KSchema,
} from "./compositions/LowPolyCyberTerrainFlyover4K";
import {
  QuantumCoreGyroscope4K,
  quantumCoreGyroscope4KSchema,
} from "./compositions/QuantumCoreGyroscope4K";
import {
  CircuitTraceLightPulses4K,
  circuitTraceLightPulses4KSchema,
} from "./compositions/CircuitTraceLightPulses4K";
import {
  HarmonicSineWaveBars4K,
  harmonicSineWaveBars4KSchema,
} from "./compositions/HarmonicSineWaveBars4K";
import {
  LayeredFrostedGlassCards4K,
  layeredFrostedGlassCards4KSchema,
} from "./compositions/LayeredFrostedGlassCards4K";
import {
  RefractiveGlassPrisms4K,
  refractiveGlassPrisms4KSchema,
} from "./compositions/RefractiveGlassPrisms4K";
import {
  IridescentLiquidSpheres4K,
  iridescentLiquidSpheres4KSchema,
} from "./compositions/IridescentLiquidSpheres4K";
import {
  TranslucentAcrylicRings4K,
  translucentAcrylicRings4KSchema,
} from "./compositions/TranslucentAcrylicRings4K";
import {
  ChromaticGlassLouvers4K,
  chromaticGlassLouvers4KSchema,
} from "./compositions/ChromaticGlassLouvers4K";
import {
  FloatingGlassHexagons4K,
  floatingGlassHexagons4KSchema,
} from "./compositions/FloatingGlassHexagons4K";
import {
  VelvetGoldLuxuryWaves4K,
  velvetGoldLuxuryWaves4KSchema,
} from "./compositions/VelvetGoldLuxuryWaves4K";
import {
  MinimalistBauhausKineticMobile4K,
  minimalistBauhausKineticMobile4KSchema,
} from "./compositions/MinimalistBauhausKineticMobile4K";
import {
  SoftPearlBubblesDrift4K,
  softPearlBubblesDrift4KSchema,
} from "./compositions/SoftPearlBubblesDrift4K";
import {
  AbstractOrigamiHelix4K,
  abstractOrigamiHelix4KSchema,
} from "./compositions/AbstractOrigamiHelix4K";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Tech">
        <Composition
          id="HarmonicSineWaveBars4K"
          component={HarmonicSineWaveBars4K}
          durationInFrames={360}
          fps={30}
          width={3840}
          height={2160}
          schema={harmonicSineWaveBars4KSchema}
          defaultProps={{
            themePreset: "dark-tech",
            aspectRatio: "16:9",
            backgroundColor: "#050B1A",
            primaryColor: "#162033",
            secondaryColor: "#38BDF8",
            accentColor: "#22D3EE",
            waveAmplitude: 1,
            speedMultiplier: 1,
            strokeWidth: 1,
          }}
        />
        <Composition
          id="CircuitTraceLightPulses4K"
          component={CircuitTraceLightPulses4K}
          durationInFrames={360}
          fps={30}
          width={3840}
          height={2160}
          schema={circuitTraceLightPulses4KSchema}
          defaultProps={{
            themePreset: "dark-tech",
            aspectRatio: "16:9",
            backgroundColor: "#050B1A",
            primaryColor: "#162033",
            secondaryColor: "#38BDF8",
            accentColor: "#22D3EE",
            boardTilt: 0.16,
            speedMultiplier: 1,
            strokeWidth: 1,
          }}
        />
        <Composition
          id="QuantumCoreGyroscope4K"
          component={QuantumCoreGyroscope4K}
          durationInFrames={360}
          fps={30}
          width={3840}
          height={2160}
          schema={quantumCoreGyroscope4KSchema}
          defaultProps={{
            themePreset: "dark-tech",
            aspectRatio: "16:9",
            backgroundColor: "#050B1A",
            primaryColor: "#334155",
            secondaryColor: "#38BDF8",
            accentColor: "#22D3EE",
            horizontalOffset: 2.85,
            speedMultiplier: 1,
            strokeWidth: 1,
          }}
        />
        <Composition
          id="LowPolyCyberTerrainFlyover4K"
          component={LowPolyCyberTerrainFlyover4K}
          durationInFrames={360}
          fps={30}
          width={3840}
          height={2160}
          schema={lowPolyCyberTerrainFlyover4KSchema}
          defaultProps={{
            themePreset: "dark-tech",
            aspectRatio: "16:9",
            backgroundColor: "#040917",
            primaryColor: "#0F172A",
            secondaryColor: "#38BDF8",
            accentColor: "#22D3EE",
            terrainAmplitude: 1,
            speedMultiplier: 1,
            strokeWidth: 1,
          }}
        />
        <Composition
          id="BinaryVoxelStream4K"
          component={BinaryVoxelStream4K}
          durationInFrames={360}
          fps={30}
          width={3840}
          height={2160}
          schema={binaryVoxelStream4KSchema}
          defaultProps={{
            themePreset: "dark-tech",
            aspectRatio: "16:9",
            backgroundColor: "#050B1A",
            primaryColor: "#162033",
            secondaryColor: "#38BDF8",
            accentColor: "#22D3EE",
            streamSpread: 1,
            speedMultiplier: 1,
            strokeWidth: 1,
          }}
        />
        <Composition
          id="RotatingDottedDigitalGlobe4K"
          component={RotatingDottedDigitalGlobe4K}
          durationInFrames={360}
          fps={30}
          width={3840}
          height={2160}
          schema={rotatingDottedDigitalGlobe4KSchema}
          defaultProps={{
            themePreset: "dark-tech",
            aspectRatio: "16:9",
            backgroundColor: "#050B1A",
            primaryColor: "#38BDF8",
            secondaryColor: "#6366F1",
            accentColor: "#22D3EE",
            globeOffset: 2.95,
            speedMultiplier: 1,
            strokeWidth: 1,
          }}
        />
        <Composition
          id="HexagonalCyberWaveGrid4K"
          component={HexagonalCyberWaveGrid4K}
          durationInFrames={360}
          fps={30}
          width={3840}
          height={2160}
          schema={hexagonalCyberWaveGrid4KSchema}
          defaultProps={{
            themePreset: "dark-tech",
            aspectRatio: "16:9",
            backgroundColor: "#050B1A",
            primaryColor: "#162033",
            secondaryColor: "#38BDF8",
            accentColor: "#22D3EE",
            waveAmplitude: 0.9,
            speedMultiplier: 1,
            strokeWidth: 1,
          }}
        />
        <Composition
          id="InfiniteWireframeDataTunnel4K"
          component={InfiniteWireframeDataTunnel4K}
          durationInFrames={360}
          fps={30}
          width={3840}
          height={2160}
          schema={infiniteWireframeDataTunnel4KSchema}
          defaultProps={{
            themePreset: "monochrome-luxury" as const,
            aspectRatio: "16:9" as const,
            backgroundColor: "#040917",
            primaryColor: "#38BDF8",
            secondaryColor: "#6366F1",
            accentColor: "#22D3EE",
            tunnelTwist: 1,
            speedMultiplier: 1,
            strokeWidth: 1,
          }}
        />
        <Composition
          id="IsometricDataPillarMatrix4K"
          component={IsometricDataPillarMatrix4K}
          durationInFrames={360}
          fps={30}
          width={3840}
          height={2160}
          schema={isometricDataPillarMatrix4KSchema}
          defaultProps={{
            themePreset: "clean-corporate" as const,
            aspectRatio: "16:9" as const,
            backgroundColor: "#050B1A",
            primaryColor: "#162033",
            secondaryColor: "#1E293B",
            accentColor: "#22D3EE",
            waveAmplitude: 0.75,
            speedMultiplier: 1,
            strokeWidth: 1,
          }}
        />
        <Composition
          id="PlexusNeuralConstellation4K"
          component={PlexusNeuralConstellation4K}
          durationInFrames={360}
          fps={30}
          width={3840}
          height={2160}
          schema={plexusNeuralConstellation4KSchema}
          defaultProps={{
            themePreset: "warm-minimalist" as const,
            aspectRatio: "16:9" as const,
            backgroundColor: "#050B1A",
            primaryColor: "#38BDF8",
            secondaryColor: "#6366F1",
            accentColor: "#22D3EE",
            driftAmplitude: 1,
            speedMultiplier: 1,
            strokeWidth: 1,
          }}
        />
      </Folder>
      <Composition
        id="SoftFoldedPaperLandscape4K"
        component={SoftFoldedPaperLandscape4K}
        durationInFrames={360}
        fps={30}
        width={3840}
        height={2160}
        schema={softFoldedPaperLandscape4KSchema}
        defaultProps={{
          themePreset: "warm-minimalist" as const,
          aspectRatio: "16:9" as const,
          backgroundColor: "#F8FAFC",
          primaryColor: "#E2E8F0",
          secondaryColor: "#CBD5E1",
          accentColor: "#3B82F6",
          foldAmplitude: 1,
          speedMultiplier: 1,
          strokeWidth: 1,
        }}
      />
      <Composition
        id="FloatingSteppingStones4K"
        component={FloatingSteppingStones4K}
        durationInFrames={360}
        fps={30}
        width={3840}
        height={2160}
        schema={floatingSteppingStones4KSchema}
        defaultProps={{
          themePreset: "clean-corporate",
          aspectRatio: "16:9",
          backgroundColor: "#F8FAFC",
          primaryColor: "#E2E8F0",
          secondaryColor: "#CBD5E1",
          accentColor: "#3B82F6",
          bobAmplitude: 1,
          speedMultiplier: 1,
          strokeWidth: 1,
        }}
      />
      <Composition
        id="RibbonWaveSculpture4K"
        component={RibbonWaveSculpture4K}
        durationInFrames={360}
        fps={30}
        width={3840}
        height={2160}
        schema={ribbonWaveSculpture4KSchema}
        defaultProps={{
          themePreset: "clean-corporate",
          aspectRatio: "16:9",
          backgroundColor: "#F8FAFC",
          primaryColor: "#E2E8F0",
          secondaryColor: "#CBD5E1",
          accentColor: "#3B82F6",
          waveAmplitude: 1,
          speedMultiplier: 1,
          strokeWidth: 1,
        }}
      />
      <Composition
        id="SlidingArchitecturalPanels4K"
        component={SlidingArchitecturalPanels4K}
        durationInFrames={360}
        fps={30}
        width={3840}
        height={2160}
        schema={slidingArchitecturalPanels4KSchema}
        defaultProps={{
          themePreset: "clean-corporate",
          aspectRatio: "16:9",
          backgroundColor: "#F8FAFC",
          primaryColor: "#E2E8F0",
          secondaryColor: "#CBD5E1",
          accentColor: "#3B82F6",
          slideAmplitude: 1,
          speedMultiplier: 1,
        }}
      />
      <Composition
        id="ChamferedCubeHorizon4K"
        component={ChamferedCubeHorizon4K}
        durationInFrames={360}
        fps={30}
        width={3840}
        height={2160}
        schema={chamferedCubeHorizon4KSchema}
        defaultProps={{
          themePreset: "warm-minimalist" as const,
          aspectRatio: "16:9" as const,
          backgroundColor: "#F8FAFC",
          primaryColor: "#E2E8F0",
          secondaryColor: "#CBD5E1",
          accentColor: "#3B82F6",
          waveAmplitude: 0.85,
          speedMultiplier: 1,
        }}
      />
      <Composition
        id="KineticBalanceSpheres4K"
        component={KineticBalanceSpheres4K}
        durationInFrames={360}
        fps={30}
        width={3840}
        height={2160}
        schema={kineticBalanceSpheres4KSchema}
        defaultProps={{
          themePreset: "warm-minimalist",
          aspectRatio: "16:9",
          backgroundColor: "#FAF6F0",
          primaryColor: "#E07A5F",
          secondaryColor: "#D4A373",
          accentColor: "#F2CC8F",
          speedMultiplier: 1,
        }}
      />
      <Composition
        id="RotatingConcentricTorusRings4K"
        component={RotatingConcentricTorusRings4K}
        durationInFrames={360}
        fps={30}
        width={3840}
        height={2160}
        schema={rotatingConcentricTorusRings4KSchema}
        defaultProps={{
          themePreset: "clean-corporate" as const,
          aspectRatio: "16:9" as const,
          backgroundColor: "#F8FAFC",
          primaryColor: "#1E293B",
          secondaryColor: "#3B82F6",
          accentColor: "#0EA5E9",
          horizontalOffset: 2.15,
          speedMultiplier: 1,
        }}
      />
      <Composition
        id="OrbitingSmoothPills4K"
        component={OrbitingSmoothPills4K}
        durationInFrames={360}
        fps={30}
        width={3840}
        height={2160}
        schema={orbitingSmoothPills4KSchema}
        defaultProps={{
          themePreset: "warm-minimalist" as const,
          aspectRatio: "16:9" as const,
          backgroundColor: "#F8FAFC",
          primaryColor: "#1E293B",
          secondaryColor: "#3B82F6",
          accentColor: "#0EA5E9",
          orbitAmplitude: 1,
          speedMultiplier: 1,
        }}
      />
      <Composition
        id="EndlessIsometricStaircase4K"
        component={EndlessIsometricStaircase4K}
        durationInFrames={360}
        fps={30}
        width={3840}
        height={2160}
        schema={endlessIsometricStaircase4KSchema}
        defaultProps={{
          themePreset: "dark-tech" as const,
          aspectRatio: "16:9" as const,
          backgroundColor: "#F8FAFC",
          primaryColor: "#F1F5F9",
          secondaryColor: "#64748B",
          accentColor: "#3B82F6",
          speedMultiplier: 1,
          cameraZoom: 215,
        }}
      />
      <Composition
        id="FloatingMinimalistArches4K"
        component={FloatingMinimalistArches4K}
        durationInFrames={360}
        fps={30}
        width={3840}
        height={2160}
        schema={floatingMinimalistArches4KSchema}
        defaultProps={{
          themePreset: "monochrome-luxury" as const,
          aspectRatio: "16:9" as const,
          backgroundColor: "#F8FAFC",
          primaryColor: "#1E293B",
          secondaryColor: "#3B82F6",
          accentColor: "#0EA5E9",
          floatAmplitude: 0.42,
          speedMultiplier: 1,
        }}
      />
      <Composition
        id="BlankLowerThird3D4K"
        component={BlankLowerThird3D4K}
        durationInFrames={180}
        fps={30}
        width={3840}
        height={2160}
        schema={blankLowerThird3D4KSchema}
        defaultProps={{
          primaryColor: "#0F172A",
          accentColor: "#38BDF8",
          secondaryColor: "#1E293B",
          backgroundColor: "transparent",
          barOpacity: 0.92,
          mirrorPosition: false,
          speedMultiplier: 1,
        }}
      />
      <Composition
        id="CommercialArchGeometry4K"
        component={CommercialArchGeometry4K}
        durationInFrames={360}
        fps={30}
        width={3840}
        height={2160}
        schema={commercialArchGeometry4KSchema}
        defaultProps={{
          themePreset: "clean-corporate" as const,
          backgroundColor: "#F8FAFC",
          primaryColor: "#1E293B",
          secondaryColor: "#3B82F6",
          accentColor: "#0EA5E9",
          speedMultiplier: 1,
          cameraZoom: 1,
        }}
      />
      <Composition
        id="GeometricTileWipeTransition3DFHD"
        component={GeometricTileWipeTransition3DFHD}
        durationInFrames={45}
        fps={30}
        width={1920}
        height={1080}
        schema={geometricTileWipeTransition3DSchema}
        defaultProps={{
          primaryColor: "#1E293B",
          accentColor: "#3B82F6",
          surfaceColor: "#F8FAFC",
          waveDirection: "bottomLeftToTopRight",
        }}
      />
      <Composition
        id="LowPolyPaperFoldWave3DFHD"
        component={LowPolyPaperFoldWave3DFHD}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        schema={lowPolyPaperFoldWave3DSchema}
        defaultProps={{
          backgroundColor: "#FAF8F5",
          primaryColor: "#E07A5F",
          secondaryColor: "#81B29A",
          accentColor: "#F2CC8F",
          foldAmplitude: 0.65,
          speedMultiplier: 1,
        }}
      />
      <Composition
        id="GeometricConstellationMesh3DFHD"
        component={GeometricConstellationMesh3DFHD}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        schema={geometricConstellationMesh3DSchema}
        defaultProps={{
          baseColor: "#0F172A",
          wireframeColor: "#38BDF8",
          wireframeOpacity: 0.42,
          displacementIntensity: 0.85,
          backgroundColor: "#060B14",
          accentColor: "#6366F1",
          speedMultiplier: 1,
        }}
      />
      <Composition
        id="IsometricPillarGrid3DFHD"
        component={IsometricPillarGrid3DFHD}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
        schema={isometricPillarGrid3DSchema}
        defaultProps={{
          backgroundColor: "#0F172A",
          primaryColor: "#1E293B",
          secondaryColor: "#334155",
          accentColor: "#38BDF8",
          speedMultiplier: 1,
          waveAmplitude: 0.65,
          cameraZoom: 115,
        }}
      />
      <Composition
        id="CorporateGeometry3DBgFHD"
        component={CorporateGeometry3DBgFHD}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        schema={corporateGeometry3DSchema}
        defaultProps={{
          primaryColor: "#1E293B",
          accentColor: "#3B82F6",
          backgroundColor: "#F8FAFC",
          speed: 1,
          cameraZoom: 1,
        }}
      />
      <Composition
        id="PresentationGeometryBgFHD"
        component={PresentationGeometryBgFHD}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        schema={presentationGeometryBgSchema}
        defaultProps={{
          backgroundColor: "#F8FAFC",
          primaryColor: "#1E3A8A",
          secondaryColor: "#3B82F6",
          accentColor: "#06B6D4",
          speedMultiplier: 1,
          strokeWidth: 1.5,
        }}
      />
      <Composition
        id="WhiteSilverWaveLoop"
        component={WhiteSilverWaveLoop}
        durationInFrames={300}
        fps={30}
        width={3840}
        height={2160}
        schema={whiteSilverWaveLoopSchema}
        defaultProps={{
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
        }}
      />
      <Folder name="Glass">
        <Composition
          id="LayeredFrostedGlassCards4K"
          component={LayeredFrostedGlassCards4K}
          durationInFrames={360}
          fps={30}
          width={3840}
          height={2160}
          schema={layeredFrostedGlassCards4KSchema}
          defaultProps={{
            themePreset: "clean-corporate" as const,
            aspectRatio: "16:9" as const,
            backgroundColor: "#F4F7FC",
            primaryColor: "#E0ECFF",
            secondaryColor: "#3B82F6",
            accentColor: "#A855F7",
            speedMultiplier: 1,
            strokeWidth: 1,
          }}
        />
        <Composition
          id="RefractiveGlassPrisms4K"
          component={RefractiveGlassPrisms4K}
          durationInFrames={360}
          fps={30}
          width={3840}
          height={2160}
          schema={refractiveGlassPrisms4KSchema}
          defaultProps={{
            themePreset: "clean-corporate" as const,
            aspectRatio: "16:9" as const,
            backgroundColor: "#F8FAFC",
            primaryColor: "#E0F2FE",
            secondaryColor: "#3B82F6",
            accentColor: "#06B6D4",
            speedMultiplier: 1,
            strokeWidth: 1,
          }}
        />
        <Composition
          id="IridescentLiquidSpheres4K"
          component={IridescentLiquidSpheres4K}
          durationInFrames={360}
          fps={30}
          width={3840}
          height={2160}
          schema={iridescentLiquidSpheres4KSchema}
          defaultProps={{
            themePreset: "clean-corporate" as const,
            aspectRatio: "16:9" as const,
            backgroundColor: "#F4F7FC",
            primaryColor: "#E0ECFF",
            secondaryColor: "#38BDF8",
            accentColor: "#A855F7",
            displacementIntensity: 0.14,
            speedMultiplier: 1,
            strokeWidth: 1,
          }}
        />
        <Composition
          id="TranslucentAcrylicRings4K"
          component={TranslucentAcrylicRings4K}
          durationInFrames={360}
          fps={30}
          width={3840}
          height={2160}
          schema={translucentAcrylicRings4KSchema}
          defaultProps={{
            themePreset: "clean-corporate" as const,
            aspectRatio: "16:9" as const,
            backgroundColor: "#F8FAFC",
            primaryColor: "#E0F2FE",
            secondaryColor: "#3B82F6",
            accentColor: "#38BDF8",
            speedMultiplier: 1,
            strokeWidth: 1,
          }}
        />
        <Composition
          id="ChromaticGlassLouvers4K"
          component={ChromaticGlassLouvers4K}
          durationInFrames={360}
          fps={30}
          width={3840}
          height={2160}
          schema={chromaticGlassLouvers4KSchema}
          defaultProps={{
            themePreset: "clean-corporate" as const,
            aspectRatio: "16:9" as const,
            backgroundColor: "#F8FAFC",
            primaryColor: "#E0F2FE",
            secondaryColor: "#3B82F6",
            accentColor: "#EC4899",
            speedMultiplier: 1,
            strokeWidth: 1,
          }}
        />
        <Composition
          id="FloatingGlassHexagons4K"
          component={FloatingGlassHexagons4K}
          durationInFrames={360}
          fps={30}
          width={3840}
          height={2160}
          schema={floatingGlassHexagons4KSchema}
          defaultProps={{
            themePreset: "clean-corporate" as const,
            aspectRatio: "16:9" as const,
            backgroundColor: "#F8FAFC",
            primaryColor: "#E0F2FE",
            secondaryColor: "#3B82F6",
            accentColor: "#0EA5E9",
            speedMultiplier: 1,
            strokeWidth: 1,
          }}
        />
        <Composition
          id="VelvetGoldLuxuryWaves4K"
          component={VelvetGoldLuxuryWaves4K}
          durationInFrames={360}
          fps={30}
          width={3840}
          height={2160}
          schema={velvetGoldLuxuryWaves4KSchema}
          defaultProps={{
            themePreset: "monochrome-luxury" as const,
            aspectRatio: "16:9" as const,
            backgroundColor: "#0B0B0E",
            primaryColor: "#16161B",
            secondaryColor: "#D4AF37",
            accentColor: "#F3D37A",
            waveAmplitude: 1.05,
            speedMultiplier: 1,
            strokeWidth: 1,
          }}
        />
        <Composition
          id="MinimalistBauhausKineticMobile4K"
          component={MinimalistBauhausKineticMobile4K}
          durationInFrames={360}
          fps={30}
          width={3840}
          height={2160}
          schema={minimalistBauhausKineticMobile4KSchema}
          defaultProps={{
            themePreset: "warm-minimalist" as const,
            aspectRatio: "16:9" as const,
            backgroundColor: "#FAF6EE",
            primaryColor: "#1D3557",
            secondaryColor: "#E07A5F",
            accentColor: "#F4A261",
            speedMultiplier: 1,
            strokeWidth: 1,
          }}
        />
        <Composition
          id="SoftPearlBubblesDrift4K"
          component={SoftPearlBubblesDrift4K}
          durationInFrames={360}
          fps={30}
          width={3840}
          height={2160}
          schema={softPearlBubblesDrift4KSchema}
          defaultProps={{
            themePreset: "clean-corporate" as const,
            aspectRatio: "16:9" as const,
            backgroundColor: "#F8FAFC",
            primaryColor: "#F8FAFC",
            secondaryColor: "#DBEAFE",
            accentColor: "#FCE7F3",
            speedMultiplier: 1,
            strokeWidth: 1,
          }}
        />
        <Composition
          id="AbstractOrigamiHelix4K"
          component={AbstractOrigamiHelix4K}
          durationInFrames={360}
          fps={30}
          width={3840}
          height={2160}
          schema={abstractOrigamiHelix4KSchema}
          defaultProps={{
            themePreset: "clean-corporate" as const,
            aspectRatio: "16:9" as const,
            backgroundColor: "#F8FAFC",
            primaryColor: "#E2E8F0",
            secondaryColor: "#3B82F6",
            accentColor: "#0EA5E9",
            speedMultiplier: 1,
            strokeWidth: 1,
          }}
        />
      </Folder>
    </>
  );
};
