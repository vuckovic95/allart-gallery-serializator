import {
  Color,
  Group,
  Material,
  Mesh,
  MeshPhysicalMaterial,
  Object3D,
  Quaternion,
  RepeatWrapping,
  RGBM7Encoding,
  Texture,
  WebGLRenderer,
  CubeTextureLoader,
  Scene,
  BoxGeometry,
  MeshBasicMaterial,
  Matrix4,
  NearestMipmapLinearFilter,
  NearestFilter,
  TangentSpaceNormalMap,
} from "three"
import {
  iMeshJson,
  iMeshData,
  iTextObject,
  iReduction,
  eTextAlignment,
  fontURLS,
  TextureQueue,
  IndexedArray,
  MeshQueue,
  Delegate,
  iSceneLoaderProps,
  iQualityReduction,
  CubemapOrder,
} from "../../definitions"
import { LoadMesh } from "./LoadMesh"
import { Text } from "troika-three-text"
import { VideoPlayer } from "../../Components/VideoPlayer/VideoPlayer"
import iconv from "iconv-lite"
import { get } from "../../Helpers/requests"
import { gunzip } from "zlib"
import { Loaders } from "../../Loaders/SceneLoader/Loaders"
import { SceneLoaderUtilities } from "../../Loaders/SceneLoader/SceneLoaderUtilities"

export default class SceneLoader {
  json: iMeshJson
  group: Group
  cubemap: TextureQueue | undefined
  textures: IndexedArray<TextureQueue> = {}
  reflections: IndexedArray<TextureQueue> = {}
  meshes: Array<MeshQueue> = []
  renderer: WebGLRenderer
  root: string
  reduction: iQualityReduction
  lightMaps: Array<TextureQueue>
  cubemapLoader: CubeTextureLoader
  loaders: Loaders
  cubeName = ""
  resetPosition = false
  objectCount = 0
  progress = 0
  OnProgress: Delegate | undefined

  constructor({
    json,
    renderer,
    group,
    root,
    reduction,
    resetPosition = false,
    onProgress,
  }: iSceneLoaderProps) {
    this.cubemapLoader = new CubeTextureLoader()

    this.json = json
    this.group = group
    this.renderer = renderer
    this.root = root
    this.reduction = reduction
    this.lightMaps = new Array<TextureQueue>(json.lightmapDB.lightmaps.length)
    this.resetPosition = resetPosition
    this.loaders = new Loaders(this.renderer)
    this.OnProgress = onProgress

    this.objectCount +=
      json.cubemapDB.scubemap.length +
      json.lightmapDB.lightmaps.length +
      json.textureDB.stexture2D.length +
      json.reflectionDB.reflections.length +
      json.nodes.length

    this.LoadFirstPass(reduction)
  }

  LoadPass(reduction: iQualityReduction, reload = false) {
    this.progress = 0
    const empties = this.meshes.filter((x) => {
      return true
    }).length

    this.objectCount =
      this.json.cubemapDB.scubemap.length +
      this.json.lightmapDB.lightmaps.length +
      this.json.textureDB.stexture2D.length +
      this.json.reflectionDB.reflections.length +
      empties

    Promise.all([
      this.LoadLightMaps(
        this.json,
        new iQualityReduction(reduction.reduction, reduction.reduction),
      ),
      this.LoadReflections(
        this.json,
        new iQualityReduction(reduction.reduction, reduction.reduction),
      ),
      this.LoadCubemap(
        this.json,
        new iQualityReduction(reduction.reduction, reduction.resolution),
      ),
      this.LoadTextures(
        this.json,
        new iQualityReduction(reduction.reduction, reduction.reduction),
      ),
    ]).then(() => {
      if (reload) {
        this.UpdateMeshes()
      }
    })
  }
 
  LoadFirstPass(reduction: iQualityReduction) {
    this.LoadCubemap(this.json, reduction)
    this.LoadReflections(this.json, reduction)
    this.LoadLightMaps(this.json, reduction)
    this.LoadTextures(this.json, reduction)
  }

  // #region  textures loading

  async LoadCubemap(
    json: iMeshJson,
    reduction: iQualityReduction,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      // load scene cubemap
      if (json.cubemapDB.scubemap.length === 0) {
        resolve(true)
        return
      }
      json.cubemapDB.scubemap.forEach((scubemap) => {
        this.cubemap = new TextureQueue()

        let reductionCube = reduction.reduction
        if (reductionCube === iReduction.x1) {
          reductionCube = iReduction.original
        }
        reductionCube = iReduction.x4
        const form = scubemap.atlasFormats.find(
          (e) => e.reduction === iReduction[reductionCube],
        )

        if (form !== undefined) {
          SceneLoaderUtilities.GetTextureFromAtlas(
            `${this.root}/${scubemap.filePath}/${form?.fileName}`,
            form,
            CubemapOrder.cubeMap,
          ).then((t) => {
            const tmp = this.cubemap
            if (tmp) {
              tmp.texture = t
              tmp.isLoaded = true
              const scene = this.group.parent as Scene
              scene.background = tmp.texture
              this.HandleProgress()
              resolve(true)
            }
          })
        }
      })
    })
  }

  async LoadReflections(
    json: iMeshJson,
    reduction: iQualityReduction,
  ): Promise<boolean> {
    // load reflection cubemaps
    return new Promise((resolve) => {
      let index = 0
      this.reflections = {}
      if (json.reflectionDB.reflections.length === 0) {
        resolve(true)
        return
      }
      json.reflectionDB.reflections.forEach((ref) => {
        this.reflections[ref.cubemapHash] = new TextureQueue()

        let reductionCube = reduction.reduction
        if (reductionCube === iReduction.x1) {
          reductionCube = iReduction.original
        }
        // reductionCube = iReduction.original
        const form = ref.atlasFormats.find(
          (e) => e.reduction === iReduction[reductionCube],
        )

        if (form !== undefined) {
          SceneLoaderUtilities.GetTextureFromAtlas(
            `${this.root}/${ref.filePath}/${form?.fileName}`,
            form,
            CubemapOrder.reflections,
          ).then((t) => {
            const tmp = this.reflections[ref.cubemapHash]

            tmp.texture = t
            tmp.texture.needsUpdate = true
            tmp.isLoaded = true
            this.HandleProgress()
            index++
            if (index == json.reflectionDB.reflections.length) {
              resolve(true)
            }
          })
        } else {
          console.log("NO FROMAT")
        }
      })
    })
  }

  async LoadTextures(
    json: iMeshJson,
    reduction: iQualityReduction,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // load textures
      let index = 0
      if (json.textureDB.stexture2D.length === 0) {
        resolve(true)
        return
      }
      json.textureDB.stexture2D.forEach(async (texture) => {
        this.textures[texture.hash] = new TextureQueue()
        let [format] = texture.formats
        let t = {} as Texture

        if (texture.type === "NormalMap") {
          const form = texture.formats.find(
            (t) =>
              (t.width === reduction.resolution ||
                t.reduction === iReduction[reduction.reduction]) &&
              t.extension === "png",
          )
          if (form) {
            format = form
          }

          t = await Loaders.LoadTexture(
            `${this.root}/${texture.filePath}/${format.fileName}`,
          )
        } else {
          const form = texture.formats.find(
            (e) =>
              e.width <= reduction.resolution ||
              e.reduction === iReduction[reduction.reduction],
          )
          if (form) {
            format = form
          }

          t = await this.loaders.LoadBasisTexture(
            `${this.root}/${texture.filePath}/${format.fileName}`,
          )
        }
        if (t) {
          t.wrapS = RepeatWrapping
          t.wrapT = RepeatWrapping
          t.anisotropy = 16
          t.minFilter = NearestMipmapLinearFilter
          t.magFilter = NearestFilter
          const tmp = this.textures[texture.hash]
          tmp.isLoaded = true
          tmp.texture = t
          tmp.texture.needsUpdate = true

          if (tmp.queue.length > 0) {
            tmp.queue.forEach((mat) => {
              tmp.texture?.repeat.set(mat.scale?.x || 1, mat.scale?.y || 1)
              tmp.texture?.offset.set(mat.offset?.x || 0, mat.offset?.y || 0)
              mat.material.setValues({ [mat.slot]: tmp.texture })
              mat.material.dispose()
            })
            tmp.queue = []
          }
        }
        index++
        this.HandleProgress()
        if (index == json.textureDB.stexture2D.length) {
          resolve(true)
        }
      })
    })
  }

  async LoadLightMaps(
    json: iMeshJson,
    reduction: iQualityReduction,
  ): Promise<boolean> {
    // load lightmaps
    return new Promise((resolve, reject) => {
      let count = 0
      if (json.lightmapDB.lightmaps.length === 0) {
        resolve(true)
        return
      }
      json.lightmapDB.lightmaps.forEach((lightMaps, index) => {
        this.lightMaps[index] = new TextureQueue()
        let [format] = lightMaps.formats
        const form = lightMaps.formats.find(
          (t) =>
            (t.width === reduction.resolution ||
              t.reduction === iReduction[reduction.reduction]) &&
            t.extension === "png",
        )
        if (form) {
          format = form
        }

        Loaders.LoadTexture(
          `${this.root}/${lightMaps.filePath}/${format.fileName}`,
        ).then((t) => {
          t.encoding = RGBM7Encoding

          const tmp = this.lightMaps[index]
          t.needsUpdate = true
          tmp.isLoaded = true
          tmp.texture = t

          if (tmp.queue.length > 0) {
            tmp.queue.forEach((mat) => {
              const m = mat.material as MeshPhysicalMaterial
              m.setValues({
                lightMap: tmp.texture,
              })
              m.dispose()
            })
            tmp.queue = []
          }
          this.HandleProgress()
        })
        count++
        if (count == json.lightmapDB.lightmaps.length) {
          resolve(true)
        }
      })
    })
  }

  // #endregion

  HandleProgress() {
    this.progress++
    this.OnProgress && this.OnProgress(this.progress / this.objectCount)
  }

  // #region loaders

  Load(): Promise<void> {
    return new Promise((resolve, reject) => {
      const { nodes } = this.json
      const rnd = Math.floor(Math.random() * Math.floor(100000))
      get<ArrayBuffer>({
        link: `${this.root}/meshes/${this.json.meshGUID}/${this.json.meshGUID}.bin.gz?${rnd}`,
        responseType: "arraybuffer",
      }).then((data) => {
        gunzip(new Uint8Array(data), (err, res) => {
          if (err) {
            reject(err.message)
            return
          }
          Promise.all(
            nodes.map((go, index) => this.LoadObject(go, res.buffer, index)),
          ).then(() => {
            data = new ArrayBuffer(0)
            resolve()
          })
        })
      })
    })
  }

  LoadObject(go: iMeshData, data: ArrayBuffer, index: number) {
    return new Promise((resolve) => {
      let object: Mesh = new Mesh()
      if (go.meshrenderer.length > 0) {
        const [renderer] = go.meshrenderer
        LoadMesh(data, go.meshBufferOffset, go.meshBufferLength, renderer).then(
          (geometry) => {
            if (renderer) {
              this.meshes[index] = new MeshQueue()

              const meshData = this.meshes[index]
              meshData.meshData = go
              this.meshes[index].isLoaded = true
              const materials = renderer.materialGuids.map((guid) => {
                return SceneLoaderUtilities.HandleMaterial(
                  guid,
                  renderer.lightmapindex,
                  go,
                  this.json,
                  this.textures,
                  this.reflections,
                  this.lightMaps,
                  renderer.reflections,
                  this.group,
                )
              })
              object = new Mesh(geometry, materials)
              meshData.mesh = object

              object.name = go.name
              object.frustumCulled = false
              object.onAfterRender = () => {
                object.frustumCulled = true
                object.onAfterRender = () => {
                  /**/
                }
              }
              object.visible = true
              object.castShadow = false
              object.receiveShadow = false
              object.userData.objectData = go
              object.scale.set(
                go.trans.scale.x,
                go.trans.scale.y,
                go.trans.scale.z,
              )
              if (go.videoplayer.length > 0) {
                if (materials) {
                  const video = this.CreateVideo(go, object, materials);

                  video.setLoop(go.videoplayer[0].isLooping)
                  video.init()
                  if (go.videoplayer[0].playOnAwake) {
                    video.play()
                  }
                }
              }

              if (go.boxcollider.length > 0) {
                if (go.boxcollider[0].enabled) {
                  const geometry = this.CreateBoxCollider(go)

                  const material = new MeshBasicMaterial({ color: 0x00ff00 })
                  material.wireframe = true
                  const cube = new Mesh(geometry, material)

                  cube.layers.set(3)
                  SceneLoaderUtilities.SetObjectTransform(
                    go,
                    cube,
                    this.resetPosition,
                  )
                  cube.renderOrder = 0
                  cube.name = "-collider-" + go.name

                  this.group.add(cube)
                }
              }
              object.renderOrder = 0
              this.group.add(object as Object3D)
              SceneLoaderUtilities.SetObjectTransform(
                go,
                object,
                this.resetPosition,
              )
              // object.visible = false
              object.layers.set(0)
              this.group.add(object)
              this.HandleProgress()
              resolve(true)
            }
          },
        )
      } else {
        if (go.text.length > 0) {
          this.CreateTextObjectTroika(go.text[0], this.group)
        } else if (go.meshcollider.length > 0) {
          LoadMesh(data, go.meshBufferOffset, go.meshBufferLength).then(
            (geometry) => {
              const materials = new MeshBasicMaterial({ color: 0xff0000 })
              materials.wireframe = true
              const collider = new Mesh(geometry, materials)
              collider.userData.tag = go.tag
              if (go.tag === "Walkable") {
                collider.layers.set(1)
              } else {
                collider.layers.set(3)
              }

              this.group.add(collider)
              SceneLoaderUtilities.SetObjectTransform(
                go,
                collider,
                this.resetPosition,
              )
            },
          )
        } else if (go.boxcollider.length > 0) {
          if (go.boxcollider[0].enabled) {
            const geometry = this.CreateBoxCollider(go)

            const material = new MeshBasicMaterial({ color: 0x00ff00 })
            material.wireframe = true
            const cube = new Mesh(geometry, material)

            cube.layers.set(2)
            SceneLoaderUtilities.SetObjectTransform(
              go,
              cube,
              this.resetPosition,
            )
            this.group.add(cube)
          }
        }
        resolve(true)
        this.HandleProgress()
      }
    })
  }

  CreateBoxCollider(mesh : iMeshData) : BoxGeometry {
    const geometry = new BoxGeometry(
      mesh.boxcollider[0].size.x,
      mesh.boxcollider[0].size.y,
      mesh.boxcollider[0].size.z,
    )
    geometry.applyMatrix4(
      new Matrix4().makeTranslation(
        mesh.boxcollider[0].center.x,
        mesh.boxcollider[0].center.y,
        mesh.boxcollider[0].center.z,
      ))
      return geometry;
  }

  CreateVideo(mesh : iMeshData, object : Mesh, materials : Material[]) : VideoPlayer{
    const video = new VideoPlayer(
      mesh.videoplayer[0].url,
      mesh.videoplayer[0].url,
      mesh.videoplayer[0].url,
      object,
      materials[0] as MeshPhysicalMaterial,
      this.group,
    )
    return video;
  }

  UpdateMeshes() {
    this.meshes.forEach(async (mesh) => {
      setTimeout(async () => {
        if (mesh.meshData != null) {
          const [renderer] = mesh.meshData.meshrenderer

          const materials = renderer.materialGuids.map((guid) => {
            if (mesh.meshData) {
              return SceneLoaderUtilities.HandleMaterial(
                guid,
                renderer.lightmapindex,
                mesh.meshData,
                this.json,
                this.textures,
                this.reflections,
                this.lightMaps,
                renderer.reflections,
              )
            }
          }) as (Material | Material)[]

          if (mesh.mesh) {
            mesh.mesh.material = []

            mesh.mesh.material = materials || new Material()
            materials.forEach((element) => {
              element.needsUpdate = true
            })
          }
        }
        this.HandleProgress()
      })
    })
  }

  // #endregion

  ReorderObjects() {
    this.json.nodes.forEach((node) => {
      let obj: any

      this.group.traverse((element) => {
        if (element.userData.objectId === node.objectID) {
          obj = element
        }
      })
      if (obj) {
        if (obj.userData.objectData) {
          const parentID = node.trans.ParentID
          let found: any
          this.group.traverse((element) => {
            if (element.userData.objectId === parentID) {
              found = element
            }
          })

          if (found) {
            found.attach(obj)
            obj.userData.parent = found?.id
          }
        }
      }
    })
  }

  CreateTextObjectTroika(text: iTextObject, group: Group) {
    const tobject = new Text()
    const text64 = text.text

    const converted = atob(text64)
    iconv.skipDecodeWarning = true
    const utfText = iconv.decode(converted, "utf-16le")
    let yOffset = 0
    const newText = utfText.replace(/\r?\n|\r|\t/g, String.fromCharCode(10))
    tobject.text = newText

    tobject.anchorX = "50%"
    tobject.anchorY = "middle"

    switch (eTextAlignment[text.alignment]) {
      case "TopJustified":
        tobject.textAlign = "justify"
        tobject.anchorY = "top"
        yOffset =
          text.rectTransform.sizeDelta.y * text.rectTransform.transform.scale.y
        break
      case "Right":
        tobject.textAlign = "right"
        tobject.anchorY = "middle"
        break
      case "Left":
        tobject.textAlign = "left"
        tobject.anchorY = "middle"
        break
    }
    // boxIntersection - cubePos;return  boxIntersection - cubePos;
    tobject.letterSpacing =
      text.characterSpacing * text.rectTransform.transform.scale.x
    tobject.lineHeight = text.lineSpacing * text.rectTransform.transform.scale.x
    tobject.fontSize = text.fontSize * text.rectTransform.transform.scale.x
    tobject.color = new Color(
      text.color.r,
      text.color.g,
      text.color.b,
    ).convertSRGBToLinear()

    tobject.fillOpacity = text.color.a
    tobject.maxWidth =
      text.rectTransform.sizeDelta.x * text.rectTransform.transform.scale.x

    tobject.font = fontURLS[text.fontName]

    tobject.position.set(
      text.rectTransform.transform.position.x,
      text.rectTransform.transform.position.y +
        yOffset * text.rectTransform.pivot.y,
      text.rectTransform.transform.position.z,
    )

    tobject.rotation.setFromQuaternion(
      new Quaternion(
        text.rectTransform.transform.rotation.x,
        text.rectTransform.transform.rotation.y,
        text.rectTransform.transform.rotation.z,
        text.rectTransform.transform.rotation.w,
      ),
    )
    tobject.sync()
    group.add(tobject)
  }
}
