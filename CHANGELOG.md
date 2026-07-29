# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.12] - 2026-07-29

### Features

- Add '--unreleased' option to changelog update in version bump script

- Enhance the updateChangelog function in bump-version.mjs to include the '--unreleased' flag for better changelog management during version bumps.
- This addition allows for clearer tracking of changes that have not yet been released, improving the overall release process.


### Other

- Update release process and documentation

- Enhance the release script to include an option for local commits without pushing (`--no-push`).
- Update README and AGENT documentation to clarify the release command and its effects.
- Modify the GitHub Actions workflow to allow for explicit dispatch of releases with optional tag input.
- Improve clarity in the release process by detailing the push behavior and artifact management.

- Upgrade GitHub release action to v3 for improved functionality

- Enhance release workflow to include additional artifacts for all platforms

- Update the GitHub Actions release workflow to specify artifacts for Linux, Windows, and macOS builds.
- Include .AppImage, .deb, .dmg, and .zip files in the artifact uploads for better distribution.
- Refine the publish step to ensure all relevant files are included in the release process.

- Bump version to 0.4.11 across all packages

- Update version in package.json for the main application, desktop app, and core package to 0.4.11.
- Update APP_VERSION constant in the desktop application to reflect the new version.

- Enhance version bumping and changelog management

- Update the version bumping script to require a clean git working tree before making changes.
- Integrate git-cliff for automatic changelog updates during version bumps.
- Modify the release script to reflect changes in the changelog update process and include appVersion.ts in versioning.
- Update AGENT documentation to clarify new version bump commands and their requirements.

- Enhance macOS notarization and update CI secrets documentation

- Update the release workflow to include additional Apple notarization secrets for improved security and functionality.
- Modify the electron-builder configuration to enable notarization and set hardened runtime for macOS builds.
- Revise the CI secrets documentation to provide a comprehensive overview of required secrets for signing and notarization processes, emphasizing the preferred use of App Store Connect API Key.
