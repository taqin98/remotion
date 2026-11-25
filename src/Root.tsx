import React from "react";
import { Composition } from "remotion";
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

export const RemotionRoot: React.FC = () => {
  return (
    <>
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
          themePreset: "dark-tech" as const,
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
          themePreset: "monochrome-luxury" as const,
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
          themePreset: "dark-tech" as const,
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
    </>
  );
};
