# CI secrets for release builds

The [Release](../.github/workflows/release.yml) workflow builds signed Windows and macOS installers (and unsigned Linux packages) when you push a tag matching `v*` — for example after `npm run release -- patch`.

On macOS, signing alone is not enough for Gatekeeper. After a clean download, macOS shows **“Apple could not verify Consoleri.app…”** until the app is **notarized**. This document covers signing and notarization secrets end to end.

Add secrets under the repository: **Settings → Secrets and variables → Actions → New repository secret**. Do **not** store certificates or Apple passwords in **Variables** — those values can appear in logs.

## Secret overview

| Secret | Platform | Purpose |
|--------|----------|---------|
| `WIN_CSC_LINK` | Windows | Base64-encoded `.pfx` / `.p12` code-signing certificate |
| `WIN_CSC_KEY_PASSWORD` | Windows | Password for that certificate |
| `MAC_CSC_LINK` | macOS | Base64-encoded `.p12` **Developer ID Application** certificate |
| `MAC_CSC_KEY_PASSWORD` | macOS | Password for that certificate |
| `APPLE_API_KEY` | macOS notarization (preferred) | Base64-encoded App Store Connect API `.p8` private key |
| `APPLE_API_KEY_ID` | macOS notarization (preferred) | Key ID of that API key |
| `APPLE_API_ISSUER` | macOS notarization (preferred) | Issuer ID (UUID) from App Store Connect |
| `APPLE_TEAM_ID` | macOS notarization | 10-character Apple Team ID |
| `APPLE_ID` | macOS notarization (alternative) | Apple ID email |
| `APPLE_APP_SPECIFIC_PASSWORD` | macOS notarization (alternative) | App-specific password for that Apple ID |

Linux builds do not need signing or notarization secrets. `GITHUB_TOKEN` is provided by GitHub Actions automatically.

If a signing secret is missing, `electron-builder` still produces installers, but they are unsigned. If notarization secrets are missing while notarize is enabled, the macOS job fails.

You only need **one** complete notarization method (API Key **or** Apple ID), plus `APPLE_TEAM_ID` in both cases. Preferred for CI: API Key.

---

## Windows signing (`WIN_CSC_*`)

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

4. In GitHub: **Settings → Secrets and variables → Actions → New repository secret**.
5. Name: `WIN_CSC_LINK` — paste the contents of `win-csc-link.txt` (the base64 string itself, not a file path).
6. Name: `WIN_CSC_KEY_PASSWORD` — paste the `.pfx` password.

If GitHub rejects a very long secret (Windows env vars can truncate above ~8192 characters), re-export the `.pfx` **without** the full certificate chain and encode again.

---

## macOS signing (`MAC_CSC_*`)

Prerequisite: an active [Apple Developer Program](https://developer.apple.com/programs/) membership.

You need a **Developer ID Application** certificate (distribution outside the Mac App Store — GitHub Releases DMG/ZIP).

### On Apple Developer

1. Open [Certificates, Identifiers & Profiles → Certificates](https://developer.apple.com/account/resources/certificates/list).
2. Click **+** to create a certificate.
3. Under **Software**, select **Developer ID Application** (not Apple Development, Apple Distribution, or Mac App Distribution).
4. Choose **G2 Sub-CA** when asked for the intermediary.
5. Create a Certificate Signing Request on a Mac: **Keychain Access → Certificate Assistant → Request a Certificate From a Certificate Authority**.
   - Choose **Saved to disk** (do not use “Emailed to the CA”).
   - Leave CA Email empty.
6. Upload the `.certSigningRequest` on the Apple site, continue, then download the `.cer` certificate.
7. Double-click the `.cer` to install it into your **login** keychain.
8. In Keychain Access → **My Certificates**, find **Developer ID Application: …** (it must show a disclosure triangle and a private key underneath).
9. Export that certificate as a `.p12` file and set an export password.
10. Note your **Team ID**: [developer.apple.com/account](https://developer.apple.com/account) → Membership details (10 characters, e.g. `ABCDE12345`). You will need it for notarization as `APPLE_TEAM_ID`.

### On GitHub — signing secrets

```bash
base64 -i Consoleri-macos.p12 | tr -d '\n' > mac-csc-link.txt
```

1. Open the GitHub repository → **Settings → Secrets and variables → Actions**.
2. Click **New repository secret** (not Variables).
3. Name: `MAC_CSC_LINK` — paste the contents of `mac-csc-link.txt` (the base64 string itself, not a file path).
4. Name: `MAC_CSC_KEY_PASSWORD` — paste the `.p12` export password.

The Release workflow maps these to `CSC_LINK` / `CSC_KEY_PASSWORD` for `electron-builder` on the macOS runner.

In a successful Release log, signing must show:

```text
identityName=Developer ID Application: …
```

If you see `Apple Development: …` instead, `MAC_CSC_*` is missing or the `.p12` is not a Developer ID Application certificate.

---

## macOS notarization

Notarization is required so Gatekeeper stops showing **“Apple could not verify Consoleri.app…”** after a clean download of the DMG.

### On Apple — preferred: App Store Connect API Key

1. Open [App Store Connect](https://appstoreconnect.apple.com/).
2. Go to **Users and Access → Integrations → Team Keys** (App Store Connect API).
3. Copy the **Issuer ID** (UUID) at the top of the page — this becomes `APPLE_API_ISSUER`.
4. Click **Generate API Key** (or **+**).
5. Name it something like `Consoleri CI`, access **Developer**, then generate.
6. Copy the **Key ID** — this becomes `APPLE_API_KEY_ID`.
7. Download the `.p8` private key file. Apple shows this download **once**; store it securely.
8. Get **Team ID**: [developer.apple.com/account](https://developer.apple.com/account) → Membership details (10 characters) — this becomes `APPLE_TEAM_ID`.

Encode the `.p8` for GitHub:

```bash
# AuthKey_XXXXXXXXXX.p8 from the App Store Connect download
base64 -i AuthKey_XXXXXXXXXX.p8 | tr -d '\n' > apple-api-key.txt
```

### On Apple — alternative: Apple ID + app-specific password

1. Open [appleid.apple.com](https://appleid.apple.com) and sign in with the Apple ID that belongs to the Developer team.
2. Go to **Sign-In and Security → App-Specific Passwords**.
3. Generate a password (label e.g. `Consoleri CI`). Copy it once — this becomes `APPLE_APP_SPECIFIC_PASSWORD`.
4. `APPLE_ID` is that Apple ID email address.
5. `APPLE_TEAM_ID` is the 10-character Team ID from [developer.apple.com/account](https://developer.apple.com/account) → Membership details.

### On GitHub — notarization secrets

1. Open the repository → **Settings → Secrets and variables → Actions**.
2. Click **New repository secret** (do **not** use Variables).
3. Add secrets for the method you chose.

**Preferred for CI — API Key**

| Secret name | Value |
|-------------|--------|
| `APPLE_API_KEY` | Contents of `apple-api-key.txt` (base64 of the `.p8` file, no newlines) |
| `APPLE_API_KEY_ID` | Key ID from App Store Connect (e.g. `AB12CD34EF`) |
| `APPLE_API_ISSUER` | Issuer ID UUID from the Integrations / Team Keys page |
| `APPLE_TEAM_ID` | 10-character Team ID from Membership details |

**Alternative — Apple ID**

| Secret name | Value |
|-------------|--------|
| `APPLE_ID` | Apple ID email used for the Developer team |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password from appleid.apple.com |
| `APPLE_TEAM_ID` | 10-character Team ID from Membership details |

The Release workflow passes both credential sets into the macOS build. `electron-builder` uses the first complete set that is present.

---

## Verifying

1. Confirm signing secrets and at least one complete notarization set exist in the repository.
2. Cut a release: `npm run release -- patch` (pushes commit and tag when push is enabled).
3. Open the **Release** workflow → macOS job. Expect:
   - `identityName=Developer ID Application: …` (not `Apple Development`)
   - notarization succeeding (not skipped / `notarize: false`)
4. On a clean Mac: download the DMG from the GitHub Release, open the app. Gatekeeper should **not** show **“Apple could not verify Consoleri.app…”**.
5. Confirm Release assets include `.exe`, `.dmg`, `.AppImage`, and `.deb` installers only (not helper tools from unpacked builds).
