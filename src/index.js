const io = require('@actions/io')
const { easyExec, setOutput } = require('./utils')
const CheckRun = require('./check_run')

const {
  GITHUB_WORKSPACE,
  INPUT_CONCLUSIONLEVEL,
} = process.env

const event = require(process.env.GITHUB_EVENT_PATH)
const checkName = 'TypeScript'

let typeScriptCommand = null



async function setupTypescriptCommand () {
  try {
    require(`${GITHUB_WORKSPACE}/tsc-silent.config.js`)
    typeScriptCommand = `${GITHUB_WORKSPACE}/node_modules/.bin/tsc-silent -p ${GITHUB_WORKSPACE}/tsconfig.json --suppressConfig ${GITHUB_WORKSPACE}/tsc-silent.config.js --compiler ${GITHUB_WORKSPACE}/node_modules/typescript/lib/typescript.js`
  } catch(e) {
    typeScriptCommand = `${GITHUB_WORKSPACE}/node_modules/.bin/tsc --pretty`
  }
}

async function runTypeScriptCommand () {
  const results = await easyExec(typeScriptCommand)
  let currentErrorComplete = true
  const annotations = results.output.split("\n")
                                    .reduce((acc, line) => {
                                      if (line === '' || line === "\n") {
                                        // console.log('skipping line')
                                        currentErrorComplete = true
                                        return acc
                                      }

                                      const lineWithoutAsciiColors = line.replace(/\u001b[^m]*?m/g, "")
                                      const foo = lineWithoutAsciiColors.match(/(.*\.tsx?)[\(:](.*)[:,].*(error.*)/)
                                      if (!foo) {
                                        if (currentErrorComplete) return acc
                                        const lastAnnotation = acc[acc.length - 1]
                                        // console.log('appending to message', lastAnnotation, lineWithoutAsciiColors)
                                        if (lastAnnotation)  {
                                          lastAnnotation.message += `\n${lineWithoutAsciiColors}`
                                        }
                                        return acc
                                      }

                                      currentErrorComplete = false
                                      const lineNumber = parseInt(foo[2], 10)
                                      // console.log('adding new error', lineWithoutAsciiColors)
                                      return [...acc, {
                                        path: foo[1],
                                        start_line: lineNumber,
                                        end_line: lineNumber,
                                        annotation_level: 'failure',
                                        message: foo[3]
                                      }]
                                    }, [])
  const conclusion = annotations.length > 0 ? INPUT_CONCLUSIONLEVEL : 'success'

  return {
    conclusion,
    output: {
      title: checkName,
      summary: `${annotations.length} error${annotations.length === 1 ? "" : "s"} found. ${annotations.length > 50 ? "(only 50 shown in annotations)" : ""}`,
      annotations: annotations.slice(0, 50)
    }
  }
}

async function run () {
  const checkRun = new CheckRun({ name: checkName, event })
  await checkRun.create()
  let report = {}
  try {
    process.chdir(GITHUB_WORKSPACE)
    await setupTypescriptCommand()
    report = await runTypeScriptCommand()
  } catch (e) {
    report = {
      conclusion: 'failure',
      output: { title: checkName, summary: `Balto error: ${e}`, annotations: [] }
    }
  } finally {
    await checkRun.update(report)
    setOutput("issuesCount", report.output.annotations.length)
  }
}

run()
