import { Box3, PerspectiveCamera, Vector3 } from "three"
interface iRepositionProps {
  camera: PerspectiveCamera
  bounds: Vector3
}

export function repositionCamera({ camera, bounds }: iRepositionProps) {
  camera.position.set(bounds.y / 3, (bounds.y / 3) * 2, -(bounds.y / 3) * 2)
  const size = Math.max(bounds.x, bounds.y, bounds.z)
  const fitHeightDistance = size / (2 * Math.atan((Math.PI * camera.fov) / 360))
  const fitWidthDistance = fitHeightDistance / camera.aspect
  const distance = 1.2 * Math.max(fitHeightDistance, fitWidthDistance)

  const direction = new Vector3(0, bounds.y / 2, 0)
    .sub(camera.position)
    .normalize()
    .multiplyScalar(distance)

  camera.near = distance / 100
  camera.far = distance * 100
  camera.updateProjectionMatrix()

  camera.position.copy(new Vector3(0, bounds.y / 2, 0)).sub(direction)
}
