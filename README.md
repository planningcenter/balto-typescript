# 🐺 Balto-TypeScript

Balto is Smart and Fast:

* Runs your TypeScript compilation with your settings and versions to make sure that everything compiles correctly
* Supports ignoring specific errors using [tsc-silent](https://github.com/evolution-gaming/tsc-silent)

Sample config (place in `.github/workflows/balto.yml`):

```yaml
name: Balto-TypeScript

on: [pull_request]

jobs:
  typescript:
    runs-on: ubuntu-latest
    steps:
      - uses: planningcenter/balto-typescript/yarn@v1
      - uses: planningcenter/balto-typescript@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          conclusionLevel: "failure"
```

## Inputs

| Name | Description | Required | Default |
|:-:|:-:|:-:|:-:|
| `conclusionLevel` | Which check run conclusion type to use when annotations are created (`"neutral"` or `"failure"` are most common). See [GitHub Checks documentation](https://developer.github.com/v3/checks/runs/#parameters) for all available options.  | no | `"neutral"` |
| `failureLevel` | The lowest annotation level to fail on | no | `"error"` |


## Outputs

| Name | Description |
|:-:|:-:|
| `issuesCount` | Number of TypeScript errors found |

## A note about permissions

Because some tools, like [dependabot](https://github.com/dependabot), use tokens for actions that have read-only permissions, you'll need to elevate its permissions for this action to work with those sorts of tools. If you don't use any of those tools, and your workflow will only run when users with permissions in your repo create and update pull requests, you may not need these explicit permissions at all.

When defining any permissions in a workflow or job, you need to explicitly include any permission the action needs. In the sample config above, we explicitly give `write` permissons to the [checks API](https://docs.github.com/en/rest/checks/runs) for the job that includes balto-typescript as a step. Because balto-typescript uses [check runs](https://docs.github.com/en/rest/guides/getting-started-with-the-checks-api), the `GITHUB_TOKEN` used in an action must have permissions to create a `check run`. You'll also need `contents: read` for `actions/checkout` to be able to clone the code.
