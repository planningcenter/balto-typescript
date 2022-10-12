import { ClientBase } from "./ClientBase"

const { GITHUB_WORKSPACE } = process.env

export class TSCClient extends ClientBase {
  get command() {
    return `${GITHUB_WORKSPACE}/node_modules/.bin/tsc --pretty false`
  }

  get annotations() {
    if (this._annotations) return this._annotations
    return (this._annotations = this.output.reduce((acc, line) => {
      const [match, path, lineNumberString, message] =
        line.match(/(.*\.tsx?)[\(:](.*)[:,].*(error.*)/) || []
      if (!match) {
        const lastAnnotation = acc[acc.length - 1]
        lastAnnotation.message += `\n${line}`
        return acc
      }

      const lineNumber = parseInt(lineNumberString, 10)
      return [
        ...acc,
        {
          path,
          start_line: lineNumber,
          end_line: lineNumber,
          annotation_level: "failure",
          message,
        },
      ]
    }, []))
  }
}
