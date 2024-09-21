![](.github/neon.svg)
# Setup Neon CLI

[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/nhedger/setup-neon?label=latest&logo=github)](https://github.com/marketplace/actions/setup-neon)
[![Test](https://github.com/nhedger/setup-neon/actions/workflows/test.yaml/badge.svg)](https://github.com/nhedger/setup-neon/actions/workflows/test.yaml)
[![Integrate](https://github.com/nhedger/setup-neon/actions/workflows/integrate.yaml/badge.svg)](https://github.com/nhedger/setup-neon/actions/workflows/integrate.yaml)

**Setup Neon** is a GitHub action that provides a cross-platform interface
for setting up the [Neon CLI](https://github.com/neondatabase/neonctl) in GitHub
Actions runners.

## Inputs

The following inputs are supported.

```yaml
- name: Setup Neon
  uses: nhedger/setup-neon@v1
  with:

    # The version of the Neon CLI to install.
    # This input is optional and defaults to "latest".
    # Example values: "1.36.0", "latest"
    version: "latest"

    # The GitHub token to use to authenticate GitHub API requests.
    # This input is optional and defaults to the job's GitHub token.
    # Example value: ${{ secrets.GITHUB_TOKEN }}
    token: ${{ github.token }}
```

## Examples

### Basic example

Setup the latest version of the Neon CLI.

```yaml
- name: Setup Neon
  uses: nhedger/setup-neon@v1

- name: List branches
  run: neonctl branches list
  env:
    NEON_API_KEY: ${{ secrets.NEON_API_KEY }}
```

### Specific version

Install version `1.36.0` of the Neon CLI.

```yaml
- name: Setup Neon CLI
  uses: nhedger/setup-neon@v1
  with:
    version: 1.36.0

- name: List branches
  run: neonctl branches list
  env:
    NEON_API_KEY: ${{ secrets.NEON_API_KEY }}
```

## License

The scripts and documentation in this project are licensed under
the [MIT License](LICENSE.md).
