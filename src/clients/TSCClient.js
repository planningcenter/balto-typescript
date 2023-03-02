import { ClientBase } from "./ClientBase"

const { GITHUB_WORKSPACE } = process.env

const ERROR_REGEX = /(.*\.tsx?)[\(:](.*)[:,].*(error.*)/

export class TSCClient extends ClientBase {
  get command() {
    return `${GITHUB_WORKSPACE}/node_modules/.bin/tsc --pretty false`
  }

  get annotations() {
    if (this._annotations) return this._annotations

    const firstLineWeCareAbout = this.output.findIndex((line) =>
      line.match(ERROR_REGEX)
    )
    const linesWeCareAbout = this.output.slice(firstLineWeCareAbout)

    return (this._annotations = linesWeCareAbout.reduce((acc, line) => {
      const [match, path, lineNumberString, message] =
        line.match(ERROR_REGEX) || []
      if (!match && acc.length === 0)
        throw `something went wrong with line ${line}, ${this.output}`
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
