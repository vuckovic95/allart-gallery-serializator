import { CONTENT_URL } from "../api/Definitions"
import { eImageVersions, iImageVersions } from "../definitions/Image"

export function UseImageUrl(
  version: eImageVersions = eImageVersions.original,
  versions: iImageVersions = {},
) {
  const pp = versions && versions[eImageVersions[version]]?.meta?.pipePath

  if (pp) {
    return `${CONTENT_URL}${pp}`
  }
  return ""
}
