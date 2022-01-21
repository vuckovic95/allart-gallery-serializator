import {
  Color,
  Material,
  MeshPhysicalMaterial,
  Object3D,
  Quaternion,
  Vector2,
  Vector3,
  MeshLambertMaterial,
  CubeTexture,
  LinearFilter,
  LinearMipMapLinearFilter,
  Scene,
  FrontSide,
  Mesh,
  Group,
  RGBM7Encoding,
  Texture,
  sRGBEncoding,
  LinearEncoding,
  RGBAFormat,
  Euler,
} from "three"

import {
  iMeshJson,
  iMeshData,
  iMaterial,
  iTex,
  iMeshRefProbes,
  iTextureFormat,
  TextureQueue,
  IndexedArray,
  iExhibition,
  CubemapOrder,
} from "../../definitions"

import { Image } from "image-js"
import { worldposReplace } from "../../Shaders/worldposReplace.glsl"
import { envmapPhysicalParsReplace } from "../../Shaders/envmapPhysicalParsReplace.glsl"
import { customReflection } from "../../Shaders/envMapPhysicalCustomRoughness.glsl"
import { meshPhysical_frag } from "../../Shaders/meshphysical_frag.glsl"
import { Loaders } from "./Loaders"

// roots
const vrAllArt_ArtRoot = "https://vrallart.com/embedded-art/";
const vrAllArt_ArtifactRoot = "https://vrallart.com/embedded-artifact/";

// tags
const artPieceTag = "ArtPiece";
const videoTag = "Video";
const outlineTag = "outline";

export class SceneLoaderUtilities {
  static ApplyTexturesForMaterial(
    material: Material,
    matInfo: iMaterial,
    textures: IndexedArray<TextureQueue>,
    addEmissive = false,
  ) {
    const promises: any[] = []
    if (matInfo.textures.length > 0) {
      matInfo.textures.forEach((mat) => {
        switch (mat.slot) {
          case "_MainTex":
            if (matInfo?.shaderName === "VRAA/Bump-Reflect-Transparent") {
              promises.push(
                SceneLoaderUtilities.ApplyTextureToSlot(
                  "alphaMap",
                  material,
                  mat,
                  textures,
                ),
              )
            }
            if (addEmissive === true) {
              promises.push(
                SceneLoaderUtilities.ApplyTextureToSlot(
                  "emissiveMap",
                  material,
                  mat,
                  textures,
                ),
              )
            }
            promises.push(
              SceneLoaderUtilities.ApplyTextureToSlot(
                "map",
                material,
                mat,
                textures,
              ),
            )
            break
          case "_MetallicGlossMap":
            promises.push(
              SceneLoaderUtilities.ApplyTextureToSlot(
                "metalnessMap",
                material,
                mat,
                textures,
              ),
            )
            promises.push(
              SceneLoaderUtilities.ApplyTextureToSlot(
                "roughnessMap",
                material,
                mat,
                textures,
              ),
            )
            promises.push(
              SceneLoaderUtilities.ApplyTextureToSlot(
                "aoMap",
                material,
                mat,
                textures,
              ),
            )
            break
          case "_BumpMap":
            promises.push(
              SceneLoaderUtilities.ApplyTextureToSlot(
                "normalMap",
                material,
                mat,
                textures,
              ),
            )
            break
        }
      })
    }
    return Promise.all(promises)
  }

  static ApplyTextureToSlot(
    slot: string,
    material: Material,
    matInfo: iTex,
    textures: IndexedArray<TextureQueue>,
  ) {
    return new Promise((resolve) => {
      const tex = textures[matInfo.hash]
      if (tex) {
        if (tex.isLoaded) {
          tex.texture?.offset.set(matInfo.offset.x, matInfo.offset.y)
          tex.texture?.repeat.set(matInfo.scale.x, matInfo.scale.y)
          if (tex.texture) {
            switch (slot) {
              case "normalMap":
              case "metalnessMap":
              case "aoMap":
              case "roughnessMap":
                tex.texture.encoding = LinearEncoding
                break
              case "map":
                tex.texture.encoding = sRGBEncoding
                break
              case "emissiveMap":
                tex.texture.encoding = sRGBEncoding
                break
            }
            tex.texture.minFilter = LinearMipMapLinearFilter
            tex.texture.magFilter = LinearFilter
            tex.texture.needsUpdate = true
          }
          material.setValues({ [slot]: tex.texture })
        } else {
          tex.queue.push({
            slot,
            material,
            offset: matInfo.offset,
            scale: matInfo.scale,
          })
        }
      }

      resolve(true)
    })
  }

  static SetObjectTransform(
    go: iMeshData,
    object: Object3D,
    resetPosition: boolean,
  ) {
    object.userData.objectData = go
    if (go.tag) {
      if (go.videoplayer.length <= 0) {
        object.userData.tag = go.tag
        object.userData.objectData = go
      }
    }
    if (go.name) {
      object.name = go.name
    }
    object.userData.objectId = go.objectID
    if (!resetPosition) {
      object.position.set(
        go.trans.position.x,
        go.trans.position.y,
        go.trans.position.z,
      )
    }

    object.rotation.setFromQuaternion(
      new Quaternion(
        go.trans.rotation.x,
        go.trans.rotation.y,
        go.trans.rotation.z,
        go.trans.rotation.w,
      ),
    )
    object.scale.set(go.trans.scale.x, go.trans.scale.y, go.trans.scale.z)
    object.updateMatrix()
  }

  static HandleMaterial(
    guid: string,
    lightmapIndex: number,
    node: iMeshData | null,
    json: iMeshJson,
    textures: IndexedArray<TextureQueue>,
    reflectionCubes: IndexedArray<TextureQueue>,
    lightMaps: Array<TextureQueue>,
    reflections?: iMeshRefProbes[],
    group?: Group,
  ): Material {
    const mat = json.materialDB.smaterial.find((m) => m.guid === guid)
    let material: any

    if (mat) {
      material = new MeshPhysicalMaterial({ name: guid })
      material = SceneLoaderUtilities.SetupMaterialByType(mat, material, guid)

      if (mat?.shaderName === "VRAA/Emissive") {
        SceneLoaderUtilities.ApplyTexturesForMaterial(
          material,
          mat,
          textures,
          true,
        )
      }

      if (node && node.videoplayer) {
        if (node.videoplayer.length <= 0) {
          SceneLoaderUtilities.ApplyTexturesForMaterial(material, mat, textures)
        } else {
          SceneLoaderUtilities.ApplyTexturesForMaterial(
            material,
            mat,
            textures,
            true,
          )
        }
      }

      if (reflections != null && mat?.shaderName !== "VRAA/Texture") {
        if (reflections?.length > 0) {
          SceneLoaderUtilities.SetupReflectionMap(
            reflectionCubes,
            reflections,
            json,
            material,
          )
        }
      }

      if (mat.floats.length > 0) {
        SceneLoaderUtilities.SetMaterialParameters(mat, material)
      }
    }

    SceneLoaderUtilities.ApplyLightmaps(
      lightmapIndex,
      lightMaps,
      material,
      node,
    )

    material.needsUpdate = true
    return material
  }

  private static ApplyLightmaps(
    lightmapIndex: number,
    lightMaps: TextureQueue[],
    material: any,
    node: iMeshData | null,
  ) {
    if (lightmapIndex !== -1) {
      const lm = lightMaps[lightmapIndex]
      if (lm) {
        material.name = node?.name as string

        if (lm.isLoaded) {
          material.setValues({ lightMap: lm.texture })
          material.dispose()
        } else {
          lm.queue.push({ material, slot: "lightMap" })
        }
      }
    }
  }

  private static SetupReflectionMap(
    reflectionCubes: IndexedArray<TextureQueue>,
    reflections: iMeshRefProbes[],
    json: iMeshJson,
    material: any,
  ) {
    const refMap = reflectionCubes[reflections[0].reflectionHash]
    const refProbe = json.nodes.find(
      (n) =>
        n.reflectionprobe.length > 0 &&
        n.reflectionprobe[0].reflectionHash === reflections[0].reflectionHash,
    )
    if (refMap != null) {
      if (refMap.texture) {
        refMap.texture.minFilter = LinearMipMapLinearFilter
        refMap.texture.magFilter = LinearFilter

        refMap.texture.generateMipmaps = false
        refMap.texture.needsUpdate = true
      }
      material.envMap = refMap.texture
      material.envMapIntensity = 1
    }

    if (refProbe) {
      this.UpdateReflectionShader(refProbe, material)
    }
  }

  private static SetupMaterialByType(
    mat: iMaterial,
    material: any,
    guid: string,
  ) {
    if (mat?.shaderName === "VRAA/Bump-Reflect-Transparent") {
      material.transparent = true
      material.depthWrite = false
      material.color = new Color(mat._Color.r, mat._Color.g, mat._Color.b)
      material.color.convertSRGBToLinear()

      material.premultipliedAlpha = true
      material.transmission = 1 - mat.colors[0].value.a
      material.opacity = 1
    } else if (mat?.shaderName === "VRAA/Transparent") {
      material.transparent = true
      material.alphaTest = 0.5
      material.color = new Color(mat._Color.r, mat._Color.g, mat._Color.b)
      material.color.convertSRGBToLinear()
    } else {
      if (mat?.shaderName === "VRAA/Texture") {
        material = new MeshLambertMaterial({ name: guid })
      } else {
        material = new MeshPhysicalMaterial({ name: guid })
      }
      material.color = new Color(mat._Color.r, mat._Color.g, mat._Color.b)

      material.color.convertSRGBToLinear()
      material.opacity = 1
    }
    return material
  }

  private static SetMaterialParameters(mat: iMaterial, material: any) {
    mat.floats.forEach((f) => {
      switch (f.slot) {
        case "_Metallic":
          material.metalness = f.value
          break
        case "_BumpScale":
          material.normalScale = new Vector2(f.value, f.value)
          break
        case "_OcclusionStrength":
          material.aoMapIntensity = f.value
          break
        case "_Intensity":
          material.emissiveIntensity = f.value
          material.setValues({
            emissive: new Color(
              mat.colors[0].value.r,
              mat.colors[0].value.g,
              mat.colors[0].value.b,
            ).convertSRGBToLinear(),
          })
          break
        case "_GlossMapScale":
          material.roughness = f.value
          break
        case "_Glossines":
          material.roughness = f.value
          break
      }
    })
  }

  private static UpdateReflectionShader(refProbe: iMeshData, material: any) {
    const customFragmentShader = `float roughnessFactor = roughness;
      #ifdef USE_ROUGHNESSMAP
        vec4 texelRoughness = texture2D( roughnessMap, vUv );
        // reads channel G, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
        roughnessFactor *= texelRoughness.g;
      #else
        roughnessFactor = roughness;
      #endif
    `
    if (refProbe.reflectionprobe[0].boxProjection === true) {
      ;(<Material>material).onBeforeCompile = function (shader) {
        const size = new Vector3(0, 0, 0)
        size.copy(refProbe.reflectionprobe[0].size) as Vector3
        const pos = new Vector3()
        pos.copy(refProbe.reflectionprobe[0].center) as Vector3

        const rot = new Quaternion()
        rot.copy(refProbe.trans.rotation) as Quaternion
        const q = new Quaternion(-rot.x, rot.y, rot.z, -rot.w)

        const v = new Euler()
        v.setFromQuaternion(q)
        v.z *= -1

        shader.uniforms.cubeMapSize = {
          value: new Vector3(size.x, size.y, size.z),
        }

        shader.uniforms.cubeMapPos = {
          value: new Vector3(
            refProbe.trans.position.x + pos.x,
            refProbe.trans.position.y + pos.y,
            -refProbe.trans.position.z - pos.z,
          ),
        }

        shader.uniforms.refProbePos = {
          value: new Vector3(
            refProbe.trans.position.x,
            refProbe.trans.position.y,
            -refProbe.trans.position.z,
          ),
        }

        shader.vertexShader =
          "varying vec3 vWorldPosition;\n" + shader.vertexShader

        shader.vertexShader = shader.vertexShader.replace(
          "#include <worldpos_vertex>",
          worldposReplace,
        )
        shader.fragmentShader = meshPhysical_frag.replace(
          "#include <envmap_physical_pars_fragment>",
          envmapPhysicalParsReplace,
        )

        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <roughnessmap_fragment>",
          customFragmentShader,
        )
      }
    } else {
      ;(<Material>material).onBeforeCompile = function (shader) {
        shader.fragmentShader = meshPhysical_frag.replace(
          "#include <envmap_physical_pars_fragment>",
          customReflection,
        )

        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <roughnessmap_fragment>",
          customFragmentShader,
        )
      }
    }
  }

  static UpdateArtifacts(exhibition: iExhibition, scene: Scene | undefined) {
    exhibition.assets.forEach(function (e) {
      const sceneObject = scene?.getObjectByName(e._id)
      const col = scene?.getObjectByName("-collider-" + e._id)
      if (col) {
        col.userData.colTarget = sceneObject
        col.layers.set(3)
        col.userData.tag = artPieceTag
        if (e.type === "VIDEO") {
          col.userData.typetag = videoTag
          col.userData.file = e.videoId
        }
        col.userData.url = e.url
      }

      if (sceneObject !== undefined) {
        if (col === undefined) {
          sceneObject.layers.set(3)
        }
        if (e.type === "VIDEO") {
          sceneObject.userData.typetag = videoTag
          sceneObject.userData.file = e.videoId
        }
        sceneObject.userData.tag = artPieceTag
        sceneObject.userData.url = vrAllArt_ArtRoot + e.url
      }
    })

    exhibition.artPieces.forEach(function (e) {
      const sceneObject = scene?.getObjectByName(e._id)
      const col = scene?.getObjectByName("-collider-" + e._id)
      if (col) {
        col.userData.colTarget = sceneObject
        col.layers.set(3)
        col.userData.tag = artPieceTag
        if (e.shrType === "VIDEO") {
          col.userData.typetag = videoTag
          col.userData.file = e.file
        }

        col.userData.url = e.shrUrl
      }

      if (sceneObject !== undefined) {
        if (col === undefined) {
          sceneObject.layers.set(3)
        }
        if (e.shrType === "VIDEO") {
          sceneObject.userData.typetag = videoTag
          sceneObject.userData.file = e.file
        }
        sceneObject.userData.tag = artPieceTag
        sceneObject.userData.url =
          vrAllArt_ArtRoot + e.shrUrl
      }
    })
    exhibition.artifacts.forEach(function (e) {
      const sceneObject = scene?.getObjectByName(e._id)
      const col = scene?.getObjectByName("-collider-" + e._id)
      if (col) {
        col.userData.colTarget = sceneObject
        col.layers.set(3)
        col.userData.tag = artPieceTag
        if (e.shrType === "VIDEO") {
          col.userData.typetag = videoTag
          col.userData.file = e.file
        }
        col.userData.url = vrAllArt_ArtifactRoot + e.url
      }

      if (sceneObject !== undefined) {
        if (col === undefined) {
          sceneObject.layers.set(3)
        }
        if (e.shrType === "VIDEO") {
          sceneObject.userData.typetag = videoTag
          sceneObject.userData.file = e.file
        }
        sceneObject.userData.tag = artPieceTag
        sceneObject.userData.url = e.shrUrl
      }
    })
  }

  static CreateObjectOutline(
    object: Object3D,
    group: Group,
    outlineThickness = 1.04,
  ) {
    const copyTarget = object
    let outline = copyTarget.clone(false)
    outline.matrixAutoUpdate = true
    outline.layers.set(0)
    if (object.children.length > 0) {
      outline = new Object3D()
      object.children.forEach((element) => {
        element.renderOrder = 1
        const clone = element.clone()
        outline.attach(clone)
        const mesh = clone as Mesh
        const mat = new MeshLambertMaterial({
          emissive: 0xffff00,
          side: FrontSide,
          depthTest: false,
        })

        clone.quaternion.copy(element.quaternion)
        clone.scale.copy(element.scale)
        clone.scale.multiplyScalar(outlineThickness)

        clone.layers.set(0)
        clone.userData.tag = outlineTag
        mesh.material = mat

        clone.renderOrder = 0
      })
    }

    outline.layers.set(0)
    const mesh = outline as Mesh
    const mat = new MeshLambertMaterial({
      emissive: 0xffff00,
      side: FrontSide,
      depthTest: false,
    })
    mat.depthTest = false
    group.add(outline)

    outline.position.copy(copyTarget.position)

    outline.quaternion.copy(copyTarget.quaternion)
    outline.scale.copy(copyTarget.scale)
    outline.scale.multiplyScalar(outlineThickness)

    outline.rotation.copy(copyTarget.rotation)
    outline.userData.tag = outlineTag
    mesh.material = mat
    object.userData.outline = outline
    copyTarget.renderOrder = 1
    outline.renderOrder = 0
    outline.visible = false
  }

  static GetTextureFromAtlas(
    url: string,
    format: iTextureFormat,
    order: number[],
  ): Promise<CubeTexture | Texture> {
    return new Promise((resolve) => {
      this.LoadAtlas(url).then((img) => {
        const mips = new Array<Array<string>>()

        for (let i = 0; i < format.mipmapCount; i++) {
          const texArr = new Array<string>(6)
          for (let x = 0; x < 6; x++) {
            const index = x * format.mipmapCount + i

            const w = format.width * format.atlasUVs[index].width
            const h = format.height * format.atlasUVs[index].height
            const xpos = format.width * format.atlasUVs[index].x
            const ypos = format.height * (1 - format.atlasUVs[index].y) - h

            let cropped = img.crop({ x: xpos, y: ypos, width: w, height: h })

            if (x === 2 || x === 3) {
              if (order === CubemapOrder.cubeMap) {
                cropped = cropped.rotate(90)
              } else {
                cropped = cropped.rotate(180)
              }
            }

            texArr[order[x]] = cropped.toDataURL("image/png")
          }

          mips.push(texArr)
        }
        const mipmaps = new Array<CubeTexture>()
        let index = 0
        mips.forEach((arr) => {
          Loaders.LoadRGBMTextureCube(arr).then((cube) => {
            cube.flipY = true
            cube.encoding = RGBM7Encoding
            cube.format = RGBAFormat
            cube.magFilter = LinearFilter
            cube.needsUpdate = true
            mipmaps[index] = cube
            index++

            if (index == mips.length) {
              const final = mipmaps.shift() as CubeTexture
              final.premultiplyAlpha = false

              final.mipmaps = mipmaps
              final.encoding = RGBM7Encoding
              final.magFilter = LinearFilter
              final.needsUpdate = true

              resolve(final)
            }
          })
        })
      })
    })
  }

  static LoadAtlas(url: string): Promise<Image> {
    return new Promise((resolve) => {
      Image.load(url).then((i) => {
        resolve(i)
      })
    })
  }
}
