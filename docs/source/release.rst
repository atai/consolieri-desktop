Release process
===============

Prerequisites:

- `git-cliff <https://git-cliff.org/>`_ in ``PATH`` (``scoop install git-cliff`` on Windows)
- Git Bash or another ``bash`` shell (``bash`` ships with Git for Windows)
- Clean working tree on ``main`` or ``master``

.. code-block:: bash

   # Preview the next version and changelog
   npm run release -- --dry-run patch

   # Bump version, update CHANGELOG.md, commit, tag, and push to origin
   # (pushing the tag starts the GitHub Actions Release workflow)
   npm run release -- patch   # or minor | major

If you only push a version bump to ``main`` without a tag, the **Tag version**
workflow creates ``vX.Y.Z`` automatically when that tag is missing.

Release commits use the message ``chore(release): vX.Y.Z`` and are excluded from
future changelogs. Pass ``--no-test`` to skip the pre-release test run,
``--no-push`` to create commit+tag locally only.

The Release workflow builds installers for Windows, macOS, and Linux, publishes a
GitHub Release, and deploys this documentation to GitHub Pages. Signing and
notarization secrets are documented in :doc:`ci-secrets`.
