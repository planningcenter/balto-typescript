const { setOutput } = require("./utils")
const CheckRun = require("./check_run")
const { TSCClient } = require("./clients/TSCClient")
const { TSCSilentClient } = require("./clients/TSCSilentClient")

const { GITHUB_WORKSPACE } = process.env

const event = require(process.env.GITHUB_EVENT_PATH)
const checkName = "TypeScript"

function getClient() {
  try {
    require(`${GITHUB_WORKSPACE}/tsc-silent.config.js`)
    return new TSCSilentClient()
  } catch (e) {
    return new TSCClient()
  }
}

async function run() {
  const checkRun = new CheckRun({ name: checkName, event })
  await checkRun.create()
  let report = {}
  try {
    const client = getClient()
    await client.run()
    report = client.report()
  } catch (e) {
    report = {
      conclusion: "failure",
      output: {
        title: checkName,
        summary: `Balto error: ${e}`,
        annotations: [],
      },
    }
  } finally {
    await checkRun.update(report)
    setOutput("issuesCount", report.output.annotations.length)
  }
}

run()
