declare module "three" {
  export type ColorRepresentation = string | number;

  export class Color {
    constructor(color?: ColorRepresentation);
    set(color: ColorRepresentation): this;
  }

  export class Vector2 {
    constructor(x?: number, y?: number);
    set(x: number, y: number): this;
  }

  export class Vector3 {
    constructor(x?: number, y?: number, z?: number);
    x: number;
    y: number;
    z: number;
    set(x: number, y: number, z: number): this;
    setScalar(scalar: number): this;
  }

  export class Vector4 {
    constructor(x?: number, y?: number, z?: number, w?: number);
    set(x: number, y: number, z: number, w: number): this;
  }

  export class Euler {
    constructor(x?: number, y?: number, z?: number, order?: string);
    set(x: number, y: number, z: number, order?: string): this;
  }

  export class Quaternion {
    set(x: number, y: number, z: number, w: number): this;
  }

  export class Matrix3 {
    set(...elements: number[]): this;
  }

  export class Matrix4 {
    set(...elements: number[]): this;
  }

  export class Layers {
    set(channel: number): void;
  }

  export class BufferAttribute {
    array: Float32Array;
    count: number;
    needsUpdate: boolean;
    getX(index: number): number;
    getY(index: number): number;
    getZ(index: number): number;
    setXYZ(index: number, x: number, y: number, z: number): this;
  }

  export class BufferGeometry {
    attributes: {
      position: BufferAttribute;
    };
    computeVertexNormals(): void;
    dispose(): void;
  }

  export class PlaneGeometry extends BufferGeometry {
    constructor(
      width?: number,
      height?: number,
      widthSegments?: number,
      heightSegments?: number,
    );
  }

  export class BoxGeometry extends BufferGeometry {
    constructor(
      width?: number,
      height?: number,
      depth?: number,
      widthSegments?: number,
      heightSegments?: number,
      depthSegments?: number,
    );
  }

  export class IcosahedronGeometry extends BufferGeometry {
    constructor(radius?: number, detail?: number);
  }

  export class TorusGeometry extends BufferGeometry {
    constructor(
      radius?: number,
      tube?: number,
      radialSegments?: number,
      tubularSegments?: number,
      arc?: number,
    );
  }

  export class CylinderGeometry extends BufferGeometry {
    constructor(
      radiusTop?: number,
      radiusBottom?: number,
      height?: number,
      radialSegments?: number,
      heightSegments?: number,
      openEnded?: boolean,
    );
  }

  export class SphereGeometry extends BufferGeometry {
    constructor(
      radius?: number,
      widthSegments?: number,
      heightSegments?: number,
      phiStart?: number,
      phiLength?: number,
      thetaStart?: number,
      thetaLength?: number,
    );
  }

  export class CapsuleGeometry extends BufferGeometry {
    constructor(
      radius?: number,
      length?: number,
      capSegments?: number,
      radialSegments?: number,
    );
  }

  export class Material {
    dispose(): void;
  }

  export class MeshStandardMaterial extends Material {
    constructor(parameters?: {
      color?: ColorRepresentation;
      emissive?: ColorRepresentation;
      emissiveIntensity?: number;
      roughness?: number;
      metalness?: number;
      flatShading?: boolean;
      wireframe?: boolean;
      transparent?: boolean;
      opacity?: number;
    });
    color: Color;
    emissive: Color;
    emissiveIntensity: number;
    roughness: number;
    metalness: number;
    flatShading: boolean;
    wireframe: boolean;
    transparent: boolean;
    opacity: number;
  }

  export class MeshBasicMaterial extends Material {
    constructor(parameters?: {
      color?: ColorRepresentation;
      wireframe?: boolean;
      transparent?: boolean;
      opacity?: number;
    });
    color: Color;
    wireframe: boolean;
    transparent: boolean;
    opacity: number;
  }

  export class Object3D {
    position: Vector3;
    rotation: Euler;
    scale: Vector3;
    visible: boolean;
    castShadow: boolean;
    receiveShadow: boolean;
    lookAt(x: number, y: number, z: number): void;
  }

  export class Group extends Object3D {
    constructor();
  }

  export class Mesh extends Object3D {
    constructor(geometry?: BufferGeometry, material?: Material);
    geometry: BufferGeometry;
    material: Material;
  }

  export class Light extends Object3D {
    color: Color;
    intensity: number;
  }

  export class AmbientLight extends Light {
    constructor(color?: ColorRepresentation, intensity?: number);
  }

  export class DirectionalLight extends Light {
    constructor(color?: ColorRepresentation, intensity?: number);
  }

  export class HemisphereLight extends Light {
    constructor(
      skyColor?: ColorRepresentation,
      groundColor?: ColorRepresentation,
      intensity?: number,
    );
    groundColor: Color;
  }

  export class PointLight extends Light {
    constructor(
      color?: ColorRepresentation,
      intensity?: number,
      distance?: number,
      decay?: number,
    );
  }

  export class Camera extends Object3D {
    zoom: number;
    near: number;
    far: number;
    updateProjectionMatrix(): void;
  }

  export class PerspectiveCamera extends Camera {
    constructor(fov?: number, aspect?: number, near?: number, far?: number);
    fov: number;
    near: number;
    far: number;
  }

  export class OrthographicCamera extends Camera {
    constructor();
  }

  export class Scene extends Object3D {
    background: Color | null;
  }

  export class Fog {
    constructor(color: ColorRepresentation, near?: number, far?: number);
  }

  export class Raycaster {
    near: number;
    far: number;
  }

  export interface Intersection {
    distance: number;
    object: Object3D;
  }

  export interface WebGLRendererParameters {
    antialias?: boolean;
    alpha?: boolean;
    preserveDrawingBuffer?: boolean;
    powerPreference?: string;
  }

  export class WebGLShadowMap {
    enabled: boolean;
  }

  export class WebGLRenderer {
    shadowMap: WebGLShadowMap;
  }

  export function setConsoleFunction(
    fn: (
      type: "log" | "warn" | "error",
      message: string,
      ...params: unknown[]
    ) => void,
  ): void;
}

declare module "three/examples/jsm/geometries/RoundedBoxGeometry.js" {
  import type { BoxGeometry } from "three";

  export class RoundedBoxGeometry extends BoxGeometry {
    constructor(
      width?: number,
      height?: number,
      depth?: number,
      segments?: number,
      radius?: number,
    );
  }
}

