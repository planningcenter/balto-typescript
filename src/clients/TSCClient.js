import { ClientBase } from "./ClientBase"

const { GITHUB_WORKSPACE, INPUT_TSCONFIG } = process.env

const ERROR_REGEX = /(.*\.tsx?)[\(:](.*)[:,].*(error.*)/

export class TSCClient extends ClientBase {
  get command() {
    return `${GITHUB_WORKSPACE}/node_modules/.bin/tsc --pretty false${
      INPUT_TSCONFIG ? ` -p ${GITHUB_WORKSPACE}/${INPUT_TSCONFIG}` : ""
    }`
  }

  get annotations() {
    if (this._annotations) return this._annotations

    const firstLineWeCareAbout = this.output.findIndex((line) =>
      line.match(ERROR_REGEX)
    )
    if (firstLineWeCareAbout === -1) return (this._annotations = [])
    const linesWeCareAbout = this.output.slice(firstLineWeCareAbout)

    return (this._annotations = linesWeCareAbout.reduce((acc, line) => {
      const [match, path, lineNumberString, message] =
        line.match(ERROR_REGEX) || []
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
