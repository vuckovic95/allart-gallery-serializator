import { RefObject, useEffect, useMemo } from "react"
import {
  PCFSoftShadowMap,
  ReinhardToneMapping,
  Scene,
  sRGBEncoding,
  WebGLRenderer,
} from "three"

interface iUseSceneProps {
  container: RefObject<HTMLDivElement>
}

interface iUseSceneReturn {
  scene: Scene
  renderer: WebGLRenderer
}

export function UseScene({ container }: iUseSceneProps): iUseSceneReturn {
  const scene = useMemo(() => {
    return new Scene()
  }, [])

  const renderer = useMemo(() => {
    const rend = new WebGLRenderer({
      antialias: true,
      alpha: true,
      premultipliedAlpha: true,
    })
    rend.setPixelRatio(window.devicePixelRatio)
    rend.toneMapping = ReinhardToneMapping
    rend.toneMappingExposure = 1
    rend.outputEncoding = sRGBEncoding
    rend.shadowMap.enabled = true
    rend.shadowMap.type = PCFSoftShadowMap
    rend.setSize(window.innerWidth, window.innerHeight)
    return rend
  }, [])

  useEffect(() => {
    if (container.current) {
      container.current.appendChild(renderer.domElement)
    }
  }, [container])

  return { renderer, scene }
}
