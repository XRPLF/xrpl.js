# 🚀 Release Pipeline Guide

A GitHub Actions workflow has been set up to automate building, scanning, packaging, and releasing npm packages in the `packages/` directory.

---

## 🔑 **Usage**

You can manually trigger the release workflow from the [GitHub Actions UI](https://github.com/xrplf/xrpl.js/actions/workflows/release.yml).

### **Before triggering a release**

**Stable release (`npmjs_dist_tag = latest`)**
1. Branch: must start with `release-` or `release/` (case-insensitive), e.g., `release/xrpl@4.3.8` or `release-xrpl-4.3.8`.
2. Version: `packages/<package_name>/package.json` must use strict SemVer `x.y.z`.
3. Tag: leave `npmjs_dist_tag` blank or set to `latest`.
4. Lockfile: run `npm i` to refresh `package-lock.json` and commit it.

**Beta/experimental release (any other `npmjs_dist_tag`)**
1. Branch: no `release-`/`release/` naming requirement.
2. Version: `packages/<package_name>/package.json` can be prerelease/other valid SemVer.
3. Tag: choose a non-`latest` `npmjs_dist_tag` matching `[a-z][a-z0-9._-]{0,127}` and not starting with `v` + digit or a digit; the workflow publishes it as `<tag>-experimental`.
4. Lockfile: run `npm i` to refresh `package-lock.json` and commit it.

### **Triggering a Release**

1. Go to **GitHub → Actions → Release Pipeline → Run workflow** (must be triggered from `main`).
2. Fill in these fields:
   - **release_branch_name** → Name of the release branch to run against.
   - **package_name** → The folder name under `packages/`, e.g., `xrpl` or `ripple-address-codec`.
   - **npmjs_dist_tag** → The npm distribution tag to publish under. Defaults to `latest`.
     - Examples:
       - `latest` → Standard production release
       - `beta` → Pre-release for testing
       - `rc` → Release candidate

➡️ Example:

| Field               | Example               |
|---------------------|-----------------------|
| release_branch_name | release/xrpl@4.3.8   |
| package_name        | xrpl                  |
| npmjs_dist_tag      | latest                |


### **Reviewing the release details and scan result**

1. The pipeline will pause at the "Print Test/Security scan result and invite Dev team to review" step and also before the final release step, relevant team should review the release details and scan result.


---

## 🔨 **How the Pipeline Works**

### 1. **Get Package Version**
- Extracts the version from `packages/<package_name>/package.json`.
- No manual version input is required.

---

### 2. **Run Tests**
- Triggers the `faucet_test.yml` and `nodejs.yml` workflows to run unit, integration, and faucet tests against the specified Git ref.
- Ensures the code at the given Git ref passes all tests.
- Tests are allowed to fail for beta releases.

---

### 3. **Pre-Release Steps**
- Builds the npm package.
- Generates a CycloneDX SBOM (Software Bill of Materials).
- Runs a vulnerability scan with Trivy.
- Uploads the SBOM to OWASP Dependency-Track for tracking vulnerabilities.
- Packages the module with Lerna and uploads the tarball as an artifact.
- Posts failure notifications to Slack..
- Create a Github issue for detected vulnerabilities.

---

### 4. **Review Stage**
- Generate a summary of:
  - Package name
  - Version
  - Vulnerability scan artifacts
- Requires the approvers to manually review security reports on the Actions page.

---

### 5. **Release Stage**
- Requires manual approval (Set up through **GitHub Environment**).
- Creates a GitHub Release with a tag like `<package_name>@<version>`.
- Downloads the built package tarball.
- Publishes the package to the public npm registry.
- Posts success or failure notifications to Slack.

---

## 📁 **Tag Format**

The GitHub release and git tag are named like this:

```text
<package_name>@<version>
```

Example:
```
xrpl@2.3.1
```


## ⚠️ **Important Notes**

- The release workflow does not overwrite existing tags. If the same version tag already exists, the workflow will fail.

- Vulnerability scanning does not block the release, but it is the approvers' responsibility to review the scan results in the Review stage.
