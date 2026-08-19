#!/usr/bin/env bash
# fetch-wasm.sh — vendor the mpt-crypto WASM module for the pinned release tag.
#
# Reads MPT_CRYPTO_VERSION, downloads the matching `mpt-crypto-wasm-<tag>.tar.gz`
# asset from the XRPLF/mpt-crypto GitHub release, verifies its checksums, and
# copies mpt_crypto.{js,mjs,web.mjs,wasm} into wasm/. The xrpl.js release pipeline runs
# this before packing so the published npm tarball carries the exact WASM built
# from that mpt-crypto release — never fetched at the consumer's `npm install`.
#
# Every anticipated failure prints a specific, actionable message; anything
# unforeseen is reported with its line number by the ERR trap. Requires `tar`
# and either `gh` or `curl`.
set -Eeuo pipefail

readonly SCRIPT="$(basename "$0")"
readonly REPO="XRPLF/mpt-crypto"

err() { printf '\n%s: ERROR: %s\n' "${SCRIPT}" "$*" >&2; }
die() { err "$*"; exit 1; }
info() { printf '%s: %s\n' "${SCRIPT}" "$*"; }

# Backstop for any step we did not guard explicitly: report the failing command
# and its line so a broken release step is debuggable from the log alone.
on_err() {
  local code=$?
  err "unexpected failure (exit ${code}) at line ${1}: \`${2}\`"
  exit "${code}"
}
trap 'on_err "${LINENO}" "${BASH_COMMAND}"' ERR

# ---------------------------------------------------------------------------
# 1. Resolve the pinned mpt-crypto release tag
# ---------------------------------------------------------------------------
PKG_DIR="$(cd "$(dirname "$0")/.." && pwd)" || die "cannot resolve the package directory."
cd "${PKG_DIR}" || die "cannot cd into ${PKG_DIR}."

[[ -f MPT_CRYPTO_VERSION ]] ||
  die "MPT_CRYPTO_VERSION not found in ${PKG_DIR}. It must contain a mpt-crypto release tag (e.g. 1.0.2)."
TAG="$(tr -d '[:space:]' < MPT_CRYPTO_VERSION)"
[[ -n "${TAG}" ]] ||
  die "MPT_CRYPTO_VERSION is empty. It must contain a mpt-crypto release tag (e.g. 1.0.2)."
readonly TAG
readonly ASSET="mpt-crypto-wasm-${TAG}.tar.gz"

# ---------------------------------------------------------------------------
# 2. Check required tooling
# ---------------------------------------------------------------------------
command -v tar >/dev/null 2>&1 || die "'tar' is required but was not found on PATH."
if command -v gh >/dev/null 2>&1; then
  DOWNLOADER="gh"
elif command -v curl >/dev/null 2>&1; then
  DOWNLOADER="curl"
else
  die "neither 'gh' nor 'curl' is available — cannot download ${ASSET}."
fi

TMP="$(mktemp -d)" || die "cannot create a temp directory."
trap 'rm -rf "${TMP}"' EXIT
mkdir -p "${TMP}/dl" "${TMP}/extract"

# ---------------------------------------------------------------------------
# 3. Download the WASM bundle (distinguishing the likely failure modes)
# ---------------------------------------------------------------------------
info "Fetching ${ASSET} from ${REPO}@${TAG} (via ${DOWNLOADER})..."
if [[ "${DOWNLOADER}" == "gh" ]]; then
  if ! assets="$(gh release view "${TAG}" --repo "${REPO}" --json assets --jq '.assets[].name' 2>&1)"; then
    die "release '${TAG}' not found in ${REPO} (or a gh/auth error). gh reported: ${assets}"
  fi
  if ! grep -qxF "${ASSET}" <<<"${assets}"; then
    err "${REPO}@${TAG} exists but does not attach '${ASSET}'."
    err "The mpt-crypto release must include the WASM bundle (see the mpt-crypto build-wasm workflow)."
    err "Assets present on ${TAG}:"
    printf '  - %s\n' ${assets:-"(none)"} >&2
    exit 1
  fi
  if ! gh release download "${TAG}" --repo "${REPO}" --pattern "${ASSET}" \
        --dir "${TMP}/dl" --clobber 2>"${TMP}/dl.err"; then
    die "failed to download ${ASSET} from ${REPO}@${TAG}: $(cat "${TMP}/dl.err")"
  fi
else
  url="https://github.com/${REPO}/releases/download/${TAG}/${ASSET}"
  code="$(curl -sSL -w '%{http_code}' -o "${TMP}/dl/${ASSET}" "${url}" 2>"${TMP}/dl.err" || true)"
  if [[ "${code}" != "200" ]]; then
    die "failed to download ${ASSET} (HTTP ${code:-000}) from ${url}. Ensure ${REPO}@${TAG} exists and attaches the WASM bundle. curl: $(cat "${TMP}/dl.err")"
  fi
fi

readonly ARCHIVE="${TMP}/dl/${ASSET}"
[[ -f "${ARCHIVE}" ]] || die "download reported success but ${ASSET} is missing at ${ARCHIVE}."

# ---------------------------------------------------------------------------
# 4. Extract
# ---------------------------------------------------------------------------
info "Extracting ${ASSET}..."
if ! tar -xzf "${ARCHIVE}" -C "${TMP}/extract" 2>"${TMP}/tar.err"; then
  die "failed to extract ${ASSET} (corrupt archive?): $(cat "${TMP}/tar.err")"
fi

# ---------------------------------------------------------------------------
# 5. Verify checksums when the bundle ships them
# ---------------------------------------------------------------------------
SUMS="$(find "${TMP}/extract" -name 'SHA256SUMS' -type f | head -n1 || true)"
if [[ -n "${SUMS}" ]]; then
  info "Verifying SHA256SUMS..."
  if ! (cd "$(dirname "${SUMS}")" && sha256sum -c "$(basename "${SUMS}")"); then
    die "SHA256SUMS verification failed for ${ASSET} — the artifact may be corrupt or tampered with."
  fi
else
  info "No SHA256SUMS in the bundle; skipping checksum verification."
fi

# ---------------------------------------------------------------------------
# 6. Vendor the glue + wasm into wasm/
# ---------------------------------------------------------------------------
# mpt_crypto.web.mjs is the `node:`-free browser glue the package's `./wasm` "browser"
# export resolves to, so browser bundlers avoid the Node-only import in mpt_crypto.mjs;
# Node keeps the full mpt_crypto.mjs/.js. The release must ship all four artifacts — a
# missing one fails loudly below.
mkdir -p wasm
for f in mpt_crypto.js mpt_crypto.mjs mpt_crypto.web.mjs mpt_crypto.wasm; do
  src="$(find "${TMP}/extract" -name "${f}" -type f | head -n1 || true)"
  if [[ -z "${src}" ]]; then
    err "expected file '${f}' was not found inside ${ASSET}."
    err "Bundle contents:"
    (cd "${TMP}/extract" && find . -type f | sed 's|^\./|  - |') >&2
    exit 1
  fi
  cp "${src}" "wasm/${f}" || die "failed to copy ${f} into ${PKG_DIR}/wasm/."
done

info "Vendored mpt-crypto WASM (${TAG}) into ${PKG_DIR}/wasm/:"
for f in mpt_crypto.js mpt_crypto.mjs mpt_crypto.web.mjs mpt_crypto.wasm; do
  info "  wasm/${f} ($(wc -c <"wasm/${f}") bytes)"
done
