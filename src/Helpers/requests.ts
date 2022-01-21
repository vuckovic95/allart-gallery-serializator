import { parse, stringify } from "query-string"
import axios, { AxiosError, ResponseType } from "axios"
import { iDoc, iMeshJson } from "../definitions"
import { gunzip, gunzipSync, InputType } from "zlib"
import { unzipFile } from "./functions"
import { CONTENT_URL } from "../api/Definitions"

interface iGetters {
  link: string
  query?: unknown
  responseType?: ResponseType
}

export function get<T>({ link, query, responseType }: iGetters): Promise<T> {
  return new Promise((resolve, reject) => {
    axios
      .get(link, {
        params: query,
        responseType,
      })
      .then((res) => {
        resolve(res.data)
      })
      .catch((err: AxiosError) => {
        console.error("Promise error catched", err.message)
        reject(err.response)
      })
  })
}

interface iGetMeshResult {
  doc: iDoc
  json: iMeshJson
}

export async function getMesh({
  link,
  query,
}: iGetters): Promise<iGetMeshResult> {
  const rnd = Math.floor(Math.random() * Math.floor(100000))
  const doc = await get<iDoc>({ link, query })
  const data = await get<ArrayBuffer>({
    link: `${CONTENT_URL}meshes/${doc.meshguid}/${doc.meshguid}.json.gz?${rnd}`,
    responseType: "arraybuffer",
  })

  const buf = await unzipFile(new Uint8Array(data))
  return { doc, json: JSON.parse(buf.toString()) }
}
