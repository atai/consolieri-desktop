Consolieri documentation
=======================

Consolieri is a desktop host console manager for SSH, local shells, RDP, and VNC.

Published site: https://atai.github.io/consolieri-desktop/

Prerequisites
-------------

- Node.js 20+

pnpm is bundled in the repo (``devDependencies``). You do **not** need a global
``pnpm`` install.

Setup
-----

.. code-block:: bash

   # First time (fresh clone) — bootstrap with npx if pnpm is not on PATH:
   npx pnpm install

   # Afterwards, or if node_modules already exists:
   npm run install:deps
   # postinstall downloads Electron (if needed) and rebuilds node-pty for Electron
   npm run rebuild-native     # optional re-run if local terminals break after Electron upgrades

.. note::

   If install scripts were skipped, run ``npm run install:electron`` then
   ``npm run rebuild-native``.

Development
-----------

.. code-block:: bash

   npm run dev

``npm run dev`` runs a full ``electron-vite build`` first, then starts the
dev server — so the app always launches with the latest compiled
main/preload/renderer bundles.

For hot-reload only (skip pre-build):

.. code-block:: bash

   node scripts/pnpm.mjs --filter @consoleri/desktop dev:watch

If you have ``pnpm`` on PATH, ``pnpm dev`` works the same way.

Build and test
--------------

.. code-block:: bash

   npm run build
   npm run package
   npm run test

Build this documentation locally
--------------------------------

.. code-block:: bash

   python3 -m venv docs/.venv
   docs/.venv/bin/pip install -r docs/requirements.txt
   cd docs && make html

Open ``docs/build/html/index.html`` in a browser.

.. toctree::
   :maxdepth: 2
   :caption: Contents

   release
   ci-secrets
   agent
