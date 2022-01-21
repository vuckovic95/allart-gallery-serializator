/* eslint-disable @typescript-eslint/ban-types */
import { ShaderMaterial } from "three"

import { Pass } from "../Pass/Pass"

export class ShaderPass extends Pass {
  constructor(shader: object, textureID?: string)
  textureID: string
  uniforms: { [name: string]: { value: any } }
  material: ShaderMaterial
  fsQuad: object
}
