import { ClientBase } from "./ClientBase"

const { GITHUB_WORKSPACE, INPUT_TSCONFIG } = process.env

export class TSCSilentClient extends ClientBase {
  get command() {
    return `${GITHUB_WORKSPACE}/node_modules/.bin/tsc-silent -p ${GITHUB_WORKSPACE}/${INPUT_TSCONFIG} --suppressConfig ${GITHUB_WORKSPACE}/tsc-silent.config.js --compiler ${GITHUB_WORKSPACE}/node_modules/typescript/lib/typescript.js`
  }

  get annotations() {
    if (this._annotations) return this._annotations
    let currentErrorComplete = true
    return (this._annotations = this.output.reduce((acc, line) => {
      // blank lines separate the errors from the markup which shows where the error is in the code
      // since we annotate where it is in the code, we won't need those extra lines
      if (line === "" || line === "\n") {
        currentErrorComplete = true
        return acc
      }

      const lineWithoutAsciiColors = line.replace(/\u001b[^m]*?m/g, "")
      const [match, path, lineNumberString, message] =
        lineWithoutAsciiColors.match(/(.*\.tsx?)[\(:](.*)[:,].*(error.*)/) || []
      if (!match) {
        if (currentErrorComplete) return acc
        const lastAnnotation = acc[acc.length - 1]
        if (lastAnnotation) {
          lastAnnotation.message += `\n${lineWithoutAsciiColors}`
        }
        return acc
      }

      currentErrorComplete = false
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
