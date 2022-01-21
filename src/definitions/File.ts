export interface iFile {
  _id: string
  name?: string
  size?: number
  type?: string
  versions?: iFileVersions
}
export interface iFileVersions {
  original?: SingleType
}

export interface iFileMeta {
  pipePath: string
}

export interface SingleType {
  meta: iFileMeta
}
