import {
  Texture,
  TextureLoader,
  WebGLRenderer,
  CubeTextureLoader,
  CubeTexture,
  LinearMipMapLinearFilter,
  LinearFilter,
  RGBM16Encoding,
  RGBM7Encoding,
} from "three"

import { BasisTextureLoader } from "../BasisLoader/BasisLoader"
import { RGBMLoader } from "three/examples/jsm/loaders/RGBMLoader"
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader"

export class Loaders {
  basisLoader: BasisTextureLoader
  renderer: WebGLRenderer
  constructor(renderer: WebGLRenderer) {
    this.basisLoader = new BasisTextureLoader()
    this.renderer = renderer
    this.basisLoader.detectSupport(renderer)
    this.basisLoader.setTranscoderPath("/libs/basis/")
  }

  LoadBasisTexture(path: string): Promise<Texture> {
    return new Promise((resolve) => {
      this.basisLoader.load(
        path,
        (t) => {
          t.generateMipmaps = false
          t.minFilter = LinearMipMapLinearFilter
          t.magFilter = LinearFilter
          t.needsUpdate = true
          resolve(t)
          t.dispose()
        },
        () => {
          /* */
        },
        () => {
          resolve(new Texture())
        },
      )
    })
  }

  static LoadBasisTexture(
    path: string,
    renderer: WebGLRenderer,
  ): Promise<Texture> {
    return new Promise((resolve) => {
      const basisLoader = new BasisTextureLoader()
      basisLoader.detectSupport(renderer)
      basisLoader.setTranscoderPath("/libs/basis/")
      basisLoader.load(
        path,
        (t) => {
          t.generateMipmaps = false

          resolve(t)
          t.dispose()
          basisLoader.dispose()
        },
        () => {
          /* */
        },
        () => {
          basisLoader.dispose()
          resolve(new Texture())
        },
      )
    })
  }

  static CubeLoadTexture(path: string[]): Promise<CubeTexture> {
    return new Promise((resolve) => {
      const loader = new CubeTextureLoader()
      loader.load(
        path,
        (t) => {
          resolve(t)
        },
        undefined,
        (e) => {
          console.log(e.error)
        },
      )
    })
  }

  static LoadTexture(path: string): Promise<Texture> {
    return new Promise((resolve) => {
      const loader = new TextureLoader()
      loader.load(path, (t) => {
        t.needsUpdate = true
        resolve(t)
      })
    })
  }

  static LoadRGBMTexture(path: string): Promise<Texture> {
    return new Promise((resolve) => {
      const loader = new RGBMLoader()
      loader.load(path, (t) => {
        t.encoding = RGBM16Encoding
        t.needsUpdate = true
        resolve(t)
      })
    })
  }

  static LoadRGBETexture(path: string): Promise<Texture> {
    return new Promise((resolve) => {
      const loader = new RGBELoader()
      loader.load(
        path,
        (t) => {
          t.encoding = RGBM7Encoding
          t.needsUpdate = true
          resolve(t)
        },
        undefined,
        (e) => {
          console.log(e.error)
        },
      )
    })
  }

  static LoadRGBMTextureCube(path: string[]): Promise<CubeTexture> {
    return new Promise((resolve, reject) => {
      const loader = new RGBMLoader()
      const t = loader.loadCubemap(
        path,
        () => {
          // t.encoding = RGBM7Encoding
          // t.needsUpdate = true
          resolve(t)
          // t.dispose()
        },
        undefined,
        (e) => {
          console.log(e)
          reject(e)
        },
      )
    })
  }
}
