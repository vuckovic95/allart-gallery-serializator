import {
  Color,
  Object3D,
  Quaternion,
  Vector2,
  Vector3,
  Vector4,
  Texture,
  WebGLRenderer,
  Group,
  Material,
  Mesh,
} from "three"
import { iImageVersions } from "./definitions/Image"

export type Delegate = (val: number) => void

export interface iTextureDB {
  stexture2D: iTexture[]
}

export interface iMaterialDB {
  smaterial: iMaterial[]
}

export interface iReflectionsDB {
  reflections: iReflection[]
}

export interface iCubemapDB {
  scubemap: iReflection[]
}

export interface iReflection {
  cubemapHash: string
  fileName: string
  filePath: string
  type: string
  name: string
  resolution: number
  mipmapCount: number
  linear: boolean
  faceFormats: iTextureFormat[]
  atlasFormats: iTextureFormat[]
}

export interface iTransform {
  position: Vector3
  rotation: Quaternion
  scale: Vector3
  ParentID: number
}

export interface iMeshRenderer {
  materialNames: string[]
  lightmapindex: number
  lightmapscaleoffset: Vector4
  rendererPriority: number
  materialGuids: string[]
  reflections: iMeshRefProbes[]
}

export interface iMeshRefProbes {
  reflectionHash: string
  weight: number
}

export interface iMeshData {
  activeInHierarchy: boolean
  activeSelf: boolean
  meshname: string
  name: string
  trans: iTransform
  tag: string
  objectID: number
  meshrenderer: iMeshRenderer[]
  reflectionprobe: iReflectionProbe[]
  meshcollider: iMeshCollider[]
  boxcollider: iBoxCollider[]
  scubemapDB: iCubemapDB
  text: iTextObject[]
  meshBufferOffset: number
  meshBufferLength: number
  videoplayer: iVideoPlayer[]
  size: Vector3
}

export interface iMeshCollider {
  center: Vector3
  size: Vector3
  enabled: boolean
  isTrigger: boolean
  contactOffset: number
  convex: boolean
}

export interface iBoxCollider {
  center: Vector3
  size: Vector3
  enabled: boolean
  isTrigger: boolean
  contactOffset: number
}

export interface iVideoPlayer {
  aspectRatio: number
  isLooping: boolean
  name: string
  playbackSpeed: number
  url: string
  playOnAwake: boolean
}

export interface iReflectionProbe {
  size: Vector3
  center: Vector3
  name: string
  backgroundColor: Color
  bakedCubemap: iBakedCubemap
  farClipPlane: number
  nearClipPlane: number
  resolution: number
  reflectionHash: string
  boxProjection: boolean
  intensity: number
}

export interface iBakedCubemap {
  name: string
  mipmapCount: number
  format: number
  resolution: number
  uvs: Array<iCubemapUV>
  center: Vector3
  intensity: number
  shadowDistance: number
  size: Vector3
}

export interface iCubemapUV {
  x: number
  y: number
  width: number
  height: number
}

export interface iTexture {
  hash: string
  fileName: string
  filePath: string
  name: string
  isLoaded: boolean
  wrapMode: number
  formats: iTextureFormat[]
  type: string
}

export interface iTextureFormat {
  fileSize: number
  fileName: string
  extension: string
  format: string
  mipmapCount: number
  width: number
  height: number
  reduction: string
  atlasUVs: iCubemapUV[]
  cubemapFaceName: string
}

export interface iAlphaColor {
  r: number
  b: number
  g: number
  a: number
}

export interface iMaterial {
  name: string
  guid: string
  isInstanced: boolean
  _Color: iAlphaColor
  textures: Array<iTex>
  floats: Array<iMatValues>
  colors: Array<iMatColor>
  shaderName: string
  tagRenderType: string
  shaderKeywords: string[]
}

export interface iMatColor {
  slot: string
  value: iAlphaColor
}

export interface iMatValues {
  slot: string
  value: number
}

export interface iTex {
  slot: string
  hash: string
  name: string
  offset: Vector2
  scale: Vector2
}

export interface iLightmap {
  lightmaps: iTexture[]
}

export interface iMeshJson {
  materialDB: iMaterialDB
  textureDB: iTextureDB
  nodes: iMeshData[]
  cubemapDB: iCubemapDB
  reflectionDB: iReflectionsDB
  lightmapDB: iLightmap
  meshUrl: string
  meshGUID: string
  objectID: number
}

export interface iNesto {
  objectID: number
  mesh: Object3D
  parentID: number
}

export interface iMesh {
  vertices: Float32Array
  subMeshCount: number
  name: string
  normals: Float32Array
  tangents: Float32Array
  colors: Uint8Array
  UV: Float32Array[]
  indexes: number[]
  topology: number
}

export class iQualityReduction {
  reduction: iReduction
  resolution: number

  constructor(reduction: iReduction, resolution: number) {
    this.reduction = reduction
    this.resolution = resolution
  }
}

export interface iQualitySetting {
  cubemap: iQualityReduction
  lightmaps: iQualityReduction
  textures: iQualityReduction
  normal: iQualityReduction
  reflections: iQualityReduction
}

export enum iReduction {
  original,
  x1,
  x2,
  x4,
  x8,
  x16,
}

export enum EChunkID {
  End,
  Name,
  Normals,
  Tangents,
  Colors,
  BoneWeights,
  UV0,
  UV1,
  UV2,
  UV3,
  Submesh,
  Bindposes,
  BlendShape,
}

export interface iDoc {
  _id: string
  meshguid: string
}

export interface iExhibition extends iDoc {
  artPieces: iArtpiece[]
  artifacts: iArtpiece[]
  assets: iAsset[]
  title: string
  subtitle: string
  descriptionAudio: iDescriptionAudio
  settings: string //iExhibitionSettings
  screenshots: iImageVersions[]
  fileVersions: iImageVersions
}

export interface iExhibitionSettings {
  spawnPointVR: iTransform
  spawnPointAR: iTransform
  spawnPointWeb: iTransform
}

export interface iArtifact extends iDoc {
  title: string
}

export interface iDescriptionAudio {
  original: iAudioVersion
}

export interface iAudioVersion {
  extension: string
  path: string
  size: number
  type: string
  meta: iAudioMeta
}

export interface iAudioMeta {
  pipePath: string
}

export interface iArtpiece extends iDoc {
  published: boolean
  shrAccess: string
  shrArtistId: string
  shrMedium: string
  shrTitle: string
  shrUrl: string
  url: string
  shrType: string
  file: string
  externalUrl: string
}

export interface iAsset extends iDoc {
  title: string
  url: string
  type: string
  file: string
  videoId: string
  video: iVideo
}

export interface iVideo {
  meta: iMeta[]
  extension: string
  path: string
  size: number
  type: string
}

export interface iMeta {
  pipePath: string
}

export interface iTextObject {
  alignment: number
  characterSpacing: number
  color: iAlphaColor
  fontName: string
  fontSize: number
  fontStyle: number
  lineSpacing: number
  text: string
  rectTransform: iRectTransform
}

export interface iRectTransform {
  anchorMax: Vector2
  anchorMin: Vector2
  anchoredPosition: Vector2
  anchoredPosition3D: Vector3
  pivot: Vector2
  sizeDelta: Vector2
  transform: iTransform
  offsetMax: Vector2
  offsetMin: Vector2
}

export enum eLayers {
  Main = 0,
  Walkable = 1,
  Collision = 2,
  ArtPieces = 3,
}

export enum eTextAlignment {
  TopLeft = 257,
  Top = 258,
  TopRight = 260,
  TopJustified = 264,
  TopFlush = 272,
  TopGeoAligned = 288,
  Left = 513,
  Center = 514,
  Right = 516,
  Justified = 520,
  Flush = 528,
  CenterGeoAligned = 544,
  BottomLeft = 1025,
  Bottom = 1026,
  BottomRight = 1028,
  BottomJustified = 1032,
  BottomFlush = 1040,
  BottomGeoAligned = 1056,
  BaselineLeft = 2049,
  Baseline = 2050,
  BaselineRight = 2052,
  BaselineJustified = 2056,
  BaselineFlush = 2064,
  BaselineGeoAligned = 2080,
  MidlineLeft = 4097,
  Midline = 4098,
  MidlineRight = 4100,
  MidlineJustified = 4104,
  MidlineFlush = 4112,
  MidlineGeoAligned = 4128,
  CaplineLeft = 8193,
  Capline = 8194,
  CaplineRight = 8196,
  CaplineJustified = 8200,
  CaplineFlush = 8208,
  CaplineGeoAligned = 8224,
}

export interface KeyValue {
  key: string
  value: string
}

export interface iSceneLoaderProps {
  json: iMeshJson
  renderer: WebGLRenderer
  group: Group
  root: string
  reduction: iQualityReduction
  resetPosition?: boolean
  onProgress?: Delegate
}

export interface iMaterialQueue {
  slot: string
  material: Material
  offset?: Vector2
  scale?: Vector2
}

export class TextureQueue {
  queue: iMaterialQueue[]
  texture: Texture | null
  isLoaded: boolean
  constructor() {
    this.queue = []
    this.texture = null
    this.isLoaded = false
  }
}

export class MeshQueue {
  meshData: iMeshData | null
  mesh: Mesh | null
  isLoaded: boolean
  constructor() {
    this.meshData = null
    this.mesh = null
    this.isLoaded = true
  }
}

export interface IndexedArray<T> {
  [key: string]: T
}

export const fontURLS: { [key: string]: string } = {
  "CrimsonText-Regular SDF":
    "https://fonts.gstatic.com/s/crimsontext/v11/wlp2gwHKFkZgtmSR3NB0oRJvaw.woff",

  "Montserrat-Regular SDF":
    "https://fonts.gstatic.com/s/montserrat/v15/JTUSjIg1_i6t8kCHKm45xW0.woff",

  "OpenSans-Regular SDF":
    "https://fonts.gstatic.com/s/opensans/v18/mem8YaGs126MiZpBA-U1UQ.woff",

  "Oswald-Regular SDF":
    "https://fonts.gstatic.com/s/oswald/v36/TK3_WkUHHAIjg75cFRf3bXL8LICs1_FvgUI.woff",

  "PlayfairDisplay-Regular SDF":
    "https://fonts.gstatic.com/s/playfairdisplay/v22/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDT.woff",

  "RobotoSlab-Regular SDF":
    "https://fonts.gstatic.com/s/robotoslab/v13/BngbUXZYTXPIvIBgJJSb6s3BzlRRfKOFbvjojISWaw.woff",
}

export const CubemapOrder = {
  reflections: [1, 0, 2, 3, 5, 4],
  cubeMap: [5, 4, 2, 3, 0, 1],
}
