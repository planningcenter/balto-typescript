import { easyExec } from "../utils"

const { INPUT_CONCLUSIONLEVEL } = process.env
const checkName = "TypeScript"

export class ClientBase {
  async run() {
    this.results = await easyExec(this.command)
  }

  get command() {
    throw "Not Implemented"
  }

  get annotations() {
    return []
  }

  report() {
    return {
      conclusion: this.conclusion,
      output: {
        title: checkName,
        summary: this.summary,
        annotations: this.annotations.slice(0, 50),
      },
    }
  }

  get output() {
    return this.results.output.split("\n")
  }

  get conclusion() {
    return this.count > 0 ? INPUT_CONCLUSIONLEVEL : "success"
  }

  get summary() {
    return `${this.count} error${this.count === 1 ? "" : "s"} found. ${
      this.count > 50 ? "(only 50 shown in annotations)" : ""
    }`
  }

  get count() {
    return this.annotations.length
  }
}
