import { iFileVersions, SingleType, iFile } from "./File"

export interface iImageVersions extends iFileVersions {
  LIcon?: SingleType
  SWRegular?: SingleType
  LWRegular?: SingleType
  XLWRegular?: SingleType
}

export interface iImageFile extends iFile {
  versions?: iImageVersions
}

export enum eImageVersions {
  original = "original",
  LIcon = "LIcon",
  SWRegular = "SWRegular",
  LWRegular = "LWRegular",
  XLWRegular = "XLWRegular",
}
