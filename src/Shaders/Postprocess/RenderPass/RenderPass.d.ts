import { Scene, Camera, Material, Color } from "three"

import { Pass } from "../Pass/Pass"

export class RenderPass extends Pass {
  constructor(
    scene: Scene,
    camera: Camera,
    overrideMaterial?: Material,
    clearColor?: Color,
    clearAlpha?: number,
  )
  scene: Scene
  camera: Camera
  overrideMaterial: Material
  clearColor: Color
  clearAlpha: number
  clearDepth: boolean
}
