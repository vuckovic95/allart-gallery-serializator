import { parse, stringify } from "query-string"
import { gunzip, InputType } from "zlib"

export function unzipFile(buffer: InputType): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    gunzip(buffer, (err, res) => {
      if (err) {
        reject(err)
        return
      }
      resolve(res)
    })
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseQuery(params: string): any {
  return parse(params, {
    arrayFormat: "comma",
    parseBooleans: true,
    parseNumbers: true,
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stringifyQuery(data: any) {
  return stringify(data, {
    arrayFormat: "comma",
  })
}
