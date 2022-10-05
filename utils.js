const os = require('os')
const exec = require('@actions/exec')

exports.easyExec = async function easyExec (commandWithArgs, silent = true) {
  let output = ''
  let error = ''

  const options = {
    listeners: {
      stdout: data => {
        output += data.toString()
      },
      stderr: data => {
        error += data.toString()
      },
    },
    silent
  }

  const commandParts = commandWithArgs.split(' ')
  const command = commandParts[0]
  const args = commandParts.slice(1)

  console.log(commandWithArgs)

  let exitCode
  try {
    exitCode = await exec.exec(command, args, options)
  } catch(e) {
    return { output, error, exitCode: 2 }
  }

  if (exitCode !== 0) {
    throw new Error(`"${command}" returned an exit code of ${exitCode}`)
  }

  return {
    output,
    error,
    exitCode
  }
}

exports.setOutput = function setOutput (key, value) {
  process.stdout.write(`::set-output name=${key}::${value}` + os.EOL)
}
