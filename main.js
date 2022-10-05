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
let yarnOutput = null

async function getYarn () {
  if (yarnOutput) return yarnOutput

  const { output } = await easyExec('yarn list --depth=0 --json')

  yarnOutput = JSON.parse(output)
  return yarnOutput
}

async function getPeerDependencies (error) {
  const peers = error
    .split('\n')
    .map(l => l.match(/ requires a peer of (?<packageName>.+)@/))
    .filter(m => m)
    .map(m => m.groups.packageName)

  const versions = []

  for (var peersIndex = 0; peersIndex < peers.length; peersIndex++) {
    const peer = peers[peersIndex]

    const yarn = await getYarn()

    yarn.data.trees
      .filter(p => p.name.startsWith(`${peer}@`))
      .forEach(p => versions.push(p.name))
  }

  return versions
}

async function installJSPackagesAsync () {
  const yarn = await getYarn()

  const versions = yarn.data.trees
    .filter(p => p.name.match(/@types/) || p.name.match(/typescript/) || p.name.match(/tsc-silent/))
    .map(p => p.name)

  await io.mv('package.json', 'package.json-bak')

  try {
    const { error } = await easyExec(
      ['npm i', ...versions, '--no-package-lock'].join(' ')
    )
    const peerVersions = await getPeerDependencies(error)
    if (peerVersions.length > 0) {
      await easyExec(['npm i', ...peerVersions, '--no-package-lock'].join(' '))
    }
  } finally {
    await io.mv('package.json-bak', 'package.json')
  }
}

async function setupTypescriptCommand () {
  try {
    require(`${GITHUB_WORKSPACE}/node_modules/tsc-silent`)
    require(`${GITHUB_WORKSPACE}/tsc-silent.config.js`)
    typeScriptCommand = `${GITHUB_WORKSPACE}/node_modules/.bin/tsc-silent -p ${GITHUB_WORKSPACE}/tsconfig.json --suppressConfig ${GITHUB_WORKSPACE}/tsc-silent.config.js`
  } catch(e) {
    typeScriptCommand = `${GITHUB_WORKSPACE}/node_modules/.bin/tsc`
  }
}

async function runTypeScriptCommand () {
  const results = await easyExec(typeScriptCommand, false)
  const conclusion = results.exitCode > 0 ? INPUT_CONCLUSIONLEVEL : 'success'

  const annotations = results.output.split("\n")
                                    .reduce((acc, line) => {
                                      const foo = line.match(/(.*\.tsx?)\((.*)\,.*(error.*)/)
                                      if (!foo) {
                                        const lastAnnotation = acc[acc.length - 1]
                                        lastAnnotation.message += `\n${line}`
                                        return acc
                                      }

                                      const lineNumber = parseInt(foo[2], 10)
                                      return [...acc, {
                                        path: foo[1],
                                        start_line: lineNumber,
                                        end_line: lineNumber,
                                        annotation_level: 'failure',
                                        message: foo[3]
                                      }]
                                    }, [])

  return {
    conclusion,
    output: {
      title: checkName,
      summary: `${annotations.length} errors found. ${annotations.length > 50 ? "(only 50 shown in annotations)" : ""}`,
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
    await installJSPackagesAsync()
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
