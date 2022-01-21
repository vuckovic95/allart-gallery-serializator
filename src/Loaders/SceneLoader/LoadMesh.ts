import { BufferAttribute, BufferGeometry, Vector2 } from "three"
import { EChunkID, iMesh, iMeshRenderer } from "../../definitions"

export function LoadMesh(
  byteData: ArrayBuffer,
  off: number,
  lng: number,
  renderer?: iMeshRenderer,
): Promise<BufferGeometry> {
  return new Promise((resolve) => {
    const mesh: iMesh = { name: "" } as iMesh
    const tmp = new Uint8Array(byteData, off, lng)
    let offset = off
    const view = new DataView(byteData, offset, 12)

    const count = view.getUint32(4, true)
    mesh.subMeshCount = view.getUint32(8, true)
    const subMeshStartIndex = new Array<{ count: number; index: number }>(
      mesh.subMeshCount,
    )

    offset += 12
    mesh.UV = new Array(4)
    const vert = new DataView(byteData, offset, count * 3 * 4)

    mesh.vertices = new Float32Array(count * 3)
    mesh.normals = new Float32Array(count * 3)
    mesh.tangents = new Float32Array(count * 4)
    mesh.indexes = new Array<number>()

    for (let i = 0; i < count * 3; i++) {
      const vertex = vert.getFloat32(i * 4, true)
      mesh.vertices[i] = vertex
    }
    let componentCount = 0

    offset += count * 3 * 4
    const chunkLength = tmp.length - (offset - off)

    const chunks = new DataView(byteData, offset, chunkLength)

    let chunkOffset = 0

    let subMeshIndex = 0
    let meshTotalIndices = 0

    while (chunkOffset < chunkLength) {
      const chunkID = chunks.getUint8(chunkOffset++)
      switch (chunkID) {
        case EChunkID.Name:
          const strLength = chunks.getUint8(chunkOffset++)
          for (let i = 0; i < strLength; i++, chunkOffset++) {
            mesh.name += String.fromCharCode(chunks.getUint8(chunkOffset))
          }
          break
        case EChunkID.Normals:
          for (let i = 0; i < count * 3; i++, chunkOffset += 4) {
            mesh.normals[i] = chunks.getFloat32(chunkOffset, true)
          }
          break
        case EChunkID.Tangents:
          for (let i = 0; i < count * 4; i++, chunkOffset += 4) {
            mesh.tangents[i] = chunks.getFloat32(chunkOffset, true)
          }
          break
        case EChunkID.Colors:
          for (let i = 0; i < count * 4; i++, chunkOffset++) {
            // mesh.colors[i] = chunks.getUint8(chunkOffset)
          }
          break
        case EChunkID.UV1: {
          const offset = new Vector2(0, 0)
          const scale = new Vector2(1, 1)
          const uvChannel = 1

          if (renderer && renderer.lightmapscaleoffset) {
            scale.x = renderer.lightmapscaleoffset.x
            scale.y = renderer.lightmapscaleoffset.y
            offset.x = renderer.lightmapscaleoffset.z
            offset.y = renderer.lightmapscaleoffset.w
          }
          componentCount = chunks.getUint8(chunkOffset++)
          mesh.UV[uvChannel] = new Float32Array(count * 2)
          switch (componentCount) {
            case 2:
              for (let i = 0; i < count * 2; i++, chunkOffset += 4) {
                const val = chunks.getFloat32(chunkOffset, true)
                if (i % 2 === 1) {
                  mesh.UV[uvChannel][i] = val * scale.y + offset.y
                } else {
                  mesh.UV[uvChannel][i] = val * scale.x + offset.x
                }
              }
              break
            case 3:
              for (let i = 0; i < count * 3; i++, chunkOffset += 4) {
                mesh.UV[uvChannel][i] = chunks.getFloat32(chunkOffset, true)
              }
              break
            case 4:
              for (let i = 0; i < count * 4; i++, chunkOffset += 4) {
                mesh.UV[uvChannel][i] = chunks.getFloat32(chunkOffset, true)
              }
              break
          }
          break
        }
        case EChunkID.UV0:
        case EChunkID.UV2:
        case EChunkID.UV3:
          const uvChannel = chunkID - EChunkID.UV0
          componentCount = chunks.getUint8(chunkOffset++)
          mesh.UV[uvChannel] = new Float32Array(count * 2)

          switch (componentCount) {
            case 2:
              for (let i = 0; i < count * 2; i++, chunkOffset += 4) {
                mesh.UV[uvChannel][i] = chunks.getFloat32(chunkOffset, true)
              }
              break
            case 3:
              for (let i = 0; i < count * 3; i++, chunkOffset += 4) {
                mesh.UV[uvChannel][i] = chunks.getFloat32(chunkOffset, true)
              }
              break
            case 4:
              for (let i = 0; i < count * 4; i++, chunkOffset += 4) {
                mesh.UV[uvChannel][i] = chunks.getFloat32(chunkOffset, true)
              }
              break
          }
          break
        case EChunkID.Submesh:
          mesh.topology = chunks.getUint8(chunkOffset++)
          const indexCount = chunks.getInt32(chunkOffset, true)
          chunkOffset += 4
          componentCount = chunks.getUint8(chunkOffset++)

          subMeshStartIndex[subMeshIndex] = {
            count: indexCount,
            index: meshTotalIndices,
          }

          switch (componentCount) {
            case 1:
              for (
                let i = 0;
                i < indexCount;
                i++, chunkOffset++, meshTotalIndices++
              ) {
                mesh.indexes.push(chunks.getUint8(chunkOffset))
              }
              break
            case 2:
              for (
                let i = 0;
                i < indexCount;
                i++, chunkOffset += 2, meshTotalIndices++
              ) {
                mesh.indexes.push(chunks.getUint16(chunkOffset, true))
              }
              break
            case 4:
              for (
                let i = 0;
                i < indexCount;
                i++, chunkOffset += 4, meshTotalIndices++
              ) {
                mesh.indexes.push(chunks.getInt32(chunkOffset, true))
              }
              break
          }
          subMeshIndex++
          break
      }
    }

    const geometry = new BufferGeometry()
    geometry.setIndex(mesh.indexes)

    geometry.setAttribute("position", new BufferAttribute(mesh.vertices, 3))
    geometry.setAttribute("normal", new BufferAttribute(mesh.normals, 3))
    geometry.setAttribute("tangent", new BufferAttribute(mesh.tangents, 3))

    if (mesh.UV[0] && mesh.UV[0].length > 0) {
      geometry.setAttribute("uv", new BufferAttribute(mesh.UV[0], 2))
    }

    if (mesh.UV[1] && mesh.UV[1].length > 0) {
      geometry.setAttribute("uv2", new BufferAttribute(mesh.UV[1], 2))
    } else {
      const offset = new Vector2(0, 0)
      const scale = new Vector2(1, 1)
      const uvChannel = 1
      mesh.UV[uvChannel] = new Float32Array(count * 2)

      if (renderer && renderer.lightmapscaleoffset) {
        scale.x = renderer.lightmapscaleoffset.x
        scale.y = renderer.lightmapscaleoffset.y
        offset.x = renderer.lightmapscaleoffset.z
        offset.y = renderer.lightmapscaleoffset.w
      }

      if (mesh.UV[0]) {
        for (let i = 0; i < mesh.UV[0].length; i++) {
          const val = mesh.UV[0][i]
          if (i % 2 === 1) {
            mesh.UV[uvChannel][i] = val * scale.y + offset.y
          } else {
            mesh.UV[uvChannel][i] = val * scale.x + offset.x
          }
        }

        geometry.setAttribute("uv2", new BufferAttribute(mesh.UV[1], 2))
      }
    }

    if (mesh.UV[3] && mesh.UV[3].length > 0) {
      geometry.setAttribute("uv3", new BufferAttribute(mesh.UV[3], 2))
    }
    for (let i = 0; i < mesh.subMeshCount; i++) {
      geometry.addGroup(
        subMeshStartIndex[i].index,
        subMeshStartIndex[i].count,
        i,
      )
    }

    resolve(geometry)
  })
}
