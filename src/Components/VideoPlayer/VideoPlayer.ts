//import { SceneLoaderUtilities } from "allart-gallery-serializator/src/Loaders/SceneLoader/SceneLoaderUtilities"
import * as THREE from "three"
import { BoxGeometry, BoxHelper, MeshBasicMaterial, Object3D } from "three"
import { Matrix4 } from "three"
import { Mesh } from "three"
import { Quaternion } from "three"

export class VideoPlayer extends THREE.Object3D {
  videoName: string
  videoSrc: string
  videoId: string
  videoMesh: THREE.Mesh
  scene: THREE.Group
  material: THREE.MeshPhysicalMaterial

  playTexture: THREE.Object3D
  pauseTexture: THREE.Object3D

  btnBox : THREE.BoxHelper
  btnObject : THREE.Mesh

  video: HTMLVideoElement
  private isPlaying = false
  private loop = false
  private restartOnPlay = false
  private setFirstFrame = false

  // tags
  private artPieceTag = "ArtPiece";
  private videoTag = "Video";
  private videoBtnTag = "VideoBtn"

  // endpoints
  private playCircleEndPoint = "/icons/play-circle-regular.png";
  private pauseCircleEndPoint = "/icons/pause-circle-regular.png";

  // plane
  private planeWidth = 0.2;
  private planeHeight = 0.2;
  private planeWidthSegments = 32;

  constructor(
    videoName: string,
    videoSrc: string,
    videoId: string,
    videoMesh: THREE.Mesh,
    material: THREE.MeshPhysicalMaterial,
    scene: THREE.Group,
    setFirstFrame = false,
  ) {
    super()

    const nameParse = videoName.split("/")
    this.setFirstFrame = setFirstFrame
    //this.name = nameParse[nameParse.length - 1].split(".")[0]
    this.videoName = videoName
    this.videoSrc = videoSrc
    this.videoId = videoId
    this.videoMesh = videoMesh
    this.material = material
    this.scene = scene
    this.video = document.createElement("video")
    this.video.id = this.videoId
    this.video.src = this.videoSrc
    this.video.muted = false
    this.video.crossOrigin = "anonymous"

    this.btnBox = new THREE.BoxHelper( new THREE.Object3D, 0xffff00 );
    this.btnObject = new THREE.Mesh

    const pauseIcons = new THREE.PlaneGeometry(this.planeWidth, this.planeHeight, this.planeWidthSegments)
    const pauseMat = new THREE.MeshLambertMaterial()
    const pausePlane = new THREE.Mesh(pauseIcons, pauseMat)

    const playIcons = new THREE.PlaneGeometry(this.planeWidth, this.planeHeight, this.planeWidthSegments)
    const playMat = new THREE.MeshLambertMaterial()
    const playPlane = new THREE.Mesh(playIcons, playMat)

    const loader = new THREE.TextureLoader()
    loader.load(
      // resource URL
      window.location.origin + this.pauseCircleEndPoint,
      // called when the resource is loaded
       (data : any) => {
        pauseMat.transparent = true
        pauseMat.depthWrite = false
        pauseMat.side = THREE.DoubleSide
        pauseMat.map = data
        pauseMat.alphaTest = 0.5
        pauseMat.emissiveMap = data
        pauseMat.emissiveIntensity = 1
        pauseMat.emissive = new THREE.Color(1, 1, 1)
      },
    )

    loader.load (
      // resource URL
      window.location.origin + this.playCircleEndPoint,
      // called when the resource is loaded
      (data : any) => {
        playMat.transparent = true
        playMat.depthWrite = false
        playMat.side = THREE.DoubleSide
        playMat.map = data
        playMat.alphaTest = 0.5
        playMat.emissiveMap = data
        playMat.emissiveIntensity = 1
        playMat.emissive = new THREE.Color(1, 1, 1)
      },
    )

    this.playTexture = playPlane
    this.pauseTexture = pausePlane


    this.playTexture.visible = false
    this.pauseTexture.visible = false

    this.scene.add(pausePlane)
    this.scene.add(playPlane)
    this.pauseTexture.layers.enable(0)
    this.playTexture.layers.enable(0)

    this.video.onended = () => {
      this.isPlaying = false
    }

    this.scene.add(this)
  }

  setLoop(val: boolean) {
    this.loop = val
    this.video.loop = val
  }

  setRestartOnPlay(val: boolean) {
    this.restartOnPlay = val
    if (val) {
      this.video.addEventListener(
        "play",
        function () {
          this.currentTime = 3
        },
        false,
      )
    } else {
      this.video.removeEventListener(
        "play",
       () => {
          return
        },
        false,
      )
    }
  }

  init() {
    this.video.currentTime = 3
    this.setRestartOnPlay(this.restartOnPlay)
    this.setLoop(this.loop)
    if (this.setFirstFrame) {
      const texture = new THREE.VideoTexture(this.video)
      this.material.map = texture
      this.material.emissiveMap = texture
    }

    if (this.videoMesh === undefined) {
      const geometry = new THREE.SphereBufferGeometry(500, 60, 40)
      geometry.scale(-1, 1, 1)
      const mesh = new THREE.Mesh(geometry, this.material)
      this.scene.add(mesh)
    }
    this.videoMesh.userData = {
      typetag: this.videoTag,
      tag: this.artPieceTag,
      name: this.videoName,
    }
    // this.videoMesh.layers.set(3)
  }

  toggleState() {
    if (this.isPlaying === true) {
      this.pause()
    } else {
      this.play()
    }
  }

  onHoverEnter() {
    let current = this.pauseTexture
    if (this.isPlaying) {
      current = this.pauseTexture
      this.pauseTexture.visible = true
      this.playTexture.visible = false
    } else {
      current = this.playTexture
      this.pauseTexture.visible = false
      this.playTexture.visible = true
    }

    current.visible = true
    const vector = new THREE.Vector3(0, 0, -1)
    const offset = vector
      .applyQuaternion(this.videoMesh.quaternion)
      .multiplyScalar(0.02)
    current.position.set(
      this.videoMesh.position.x + offset.x,
      this.videoMesh.position.y + offset.y,
      this.videoMesh.position.z + offset.z,
    )
    current.quaternion.set(
      this.videoMesh.quaternion.x,
      this.videoMesh.quaternion.y,
      this.videoMesh.quaternion.z,
      this.videoMesh.quaternion.w,
    )
    this.createBtnCollider(current)
  }

  createBtnCollider(object : Object3D){
    const smallGeometry = new THREE.SphereBufferGeometry(object.scale.x / 3, object.scale.y / 3, object.scale.z / 3)
    smallGeometry.scale(object.scale.x / 3, object.scale.y / 3, object.scale.z / 3)
    const material = new MeshBasicMaterial({ color: 0xffff00 })
    material.wireframe = true

    const btnObject = new THREE.BoxGeometry(object.scale.x / 3, object.scale.y / 3, object.scale.z / 3)

    const collider = new Mesh(smallGeometry, material)
    collider.userData.tag = this.videoBtnTag

    btnObject.applyMatrix4(
      new Matrix4().makeTranslation(
        object.position.x,
        object.position.y,
        object.position.z
      ))
    collider.visible = true
    collider.layers.set(4)
    collider.position.set(
      object.position.x,
      object.position.y,
      object.position.z
    )

    collider.rotation.setFromQuaternion(
      new Quaternion(
        object.rotation.x,
        object.rotation.y + 180,
        object.rotation.z
      ),
    )

    this.scene.add(collider)
    collider.updateMatrix
  }

  setBtnColliderPosition(object : Object3D){
    this.btnObject.position.set(
      object.position.x,
      object.position.y,
      object.position.z
    )

    this.btnBox.position.set(
      object.position.x,
      object.position.y,
      object.position.z
    )
    this.btnBox.update
    console.log(this.btnBox.position)
  }

  onHoverExit() {
    this.playTexture.visible = false
    this.pauseTexture.visible = false
    return undefined
  }

  play() {
    if (this.videoMesh.material !== this.material) {
      const texture = new THREE.VideoTexture(this.video)
      this.material.map = texture
      this.material.emissiveMap = texture
      this.material.needsUpdate = true
      this.videoMesh.material = this.material
    }
    this.video.play().then(() => {
      this.isPlaying = true
    })
  }

  pause() {
    this.isPlaying = false
    this.video.pause()
  }
}
