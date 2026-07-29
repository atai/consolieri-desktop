# CI secrets for release builds

The [Release](../.github/workflows/release.yml) workflow builds signed Windows and macOS installers when you push a tag matching `v*` (for example after `npm run release -- patch`).

Add repository secrets under **Settings → Secrets and variables → Actions → New repository secret**.

| Secret | Used for |
|--------|----------|
| `WIN_CSC_LINK` | Windows code-signing certificate |
| `WIN_CSC_KEY_PASSWORD` | Password for the Windows certificate |
| `MAC_CSC_LINK` | macOS code-signing certificate |
| `MAC_CSC_KEY_PASSWORD` | Password for the macOS certificate |

Linux builds do not need signing secrets. `GITHUB_TOKEN` is provided by GitHub Actions automatically.

If a signing secret is missing, `electron-builder` still produces installers, but they are unsigned.

---

## Windows (`WIN_CSC_*`)

You need a code-signing certificate as a `.pfx` / `.p12` file (EV or OV from a public CA such as DigiCert, Sectigo, SSL.com).

1. Export the certificate from your CA portal or Windows Certificate Manager as a **Personal Information Exchange (`.pfx`)**, including the private key.
2. Note the export password — that becomes `WIN_CSC_KEY_PASSWORD`.
3. Encode the file as base64 for `WIN_CSC_LINK`:

```bash
# macOS / Linux
base64 -i Consoleri-windows.pfx | tr -d '\n' > win-csc-link.txt

# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("Consoleri-windows.pfx")) | Set-Content -NoNewline win-csc-link.txt
```

4. Paste the contents of `win-csc-link.txt` into the `WIN_CSC_LINK` secret (no file path — the base64 string itself).

If GitHub rejects a very long secret (Windows env vars can truncate above ~8192 characters), re-export the `.pfx` **without** the full certificate chain and encode again.

---

## macOS (`MAC_CSC_*`)

You need an Apple Developer Program membership and a **Developer ID Application** certificate (for distribution outside the Mac App Store).

1. Open [Apple Developer → Certificates](https://developer.apple.com/account/resources/certificates/list).
2. Create or download a **Developer ID Application** certificate.
3. Install it in Keychain Access on a Mac, then export it as a `.p12` file with a password.
4. That password is `MAC_CSC_KEY_PASSWORD`.
5. Encode the `.p12` for `MAC_CSC_LINK`:

```bash
base64 -i Consoleri-macos.p12 | tr -d '\n' > mac-csc-link.txt
```

6. Paste the contents of `mac-csc-link.txt` into the `MAC_CSC_LINK` secret.

The workflow maps these secrets to `CSC_LINK` / `CSC_KEY_PASSWORD` for `electron-builder` on the macOS runner.

Notarization is currently **disabled** (`mac.notarize: false` in `apps/desktop/electron-builder.yml`). Signed builds still install, but Gatekeeper may warn until notarization is enabled and Apple credentials are added.

---

## Optional: macOS notarization (not wired yet)

To notarize later, set `mac.notarize: true` (or remove `notarize: false`) and add one of these credential sets:

**Option A — Apple ID**

| Secret | Where to get it |
|--------|-----------------|
| `APPLE_ID` | Your Apple ID email |
| `APPLE_APP_SPECIFIC_PASSWORD` | [appleid.apple.com](https://appleid.apple.com) → Sign-In and Security → App-Specific Passwords |
| `APPLE_TEAM_ID` | [developer.apple.com/account](https://developer.apple.com/account) → Membership details (10-character Team ID) |

**Option B — App Store Connect API key (preferred for CI)**

| Secret | Where to get it |
|--------|-----------------|
| `APPLE_API_KEY` | Base64 of the `.p8` private key from [App Store Connect → Users and Access → Integrations → Team Keys](https://appstoreconnect.apple.com/access/integrations/api) |
| `APPLE_API_KEY_ID` | Key ID shown next to the API key |
| `APPLE_API_ISSUER` | Issuer ID on the same Integrations page |
| `APPLE_TEAM_ID` | Same Team ID as above |

Then pass those variables into the macOS build step in `.github/workflows/release.yml`.

---

## Verifying

1. Ensure all four signing secrets exist in the repository.
2. Cut a release: `npm run release -- patch`, then push the commit and tag.
3. Open the **Release** workflow run and confirm Windows/macOS jobs complete without signing errors.
4. Check the GitHub Release assets for `.exe`, `.dmg`, `.AppImage`, and `.deb`.
