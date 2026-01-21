# 🚀 Release Pipeline Guide

A GitHub Actions workflow has been set up to automate building, scanning, packaging, and releasing npm packages in the `packages/` directory.

---

## 🔑 **Usage**

You can manually trigger the release workflow from the [GitHub Actions UI](https://github.com/xrplf/xrpl.js/actions/workflows/release.yml).

### **Before triggering a release**

**Stable release **
1. Create a release branch. A qualified branch name should start with "release-" or "release/", **case-insensitive**. e.g: `release/xrpl@4.3.8`, `release-xrpl-4.3.8`, `Release/xrpl@4.3.8`.
2. Update the **`version`** field in `packages/<package_name>/package.json` to the intended release version.
   ```json
   {
     "name": "<package_name>",
     "version": "x.y.z"
   }
   ```
3. Run npm i to refresh package-lock.json and commit it.

**Beta release **
1. Create a release branch. There is no restriction for branch name.
2. Update the **`version`** field in `packages/<package_name>/package.json` to the intended beta release version.
   ```json
   {
     "name": "<package_name>",
     "version": "x.y.z-<beta|rc>.a"
   }
   ```
3. Run `npm i` to refresh `package-lock.json` and commit it.

### **Triggering a Release**

1. Go to **GitHub → Actions → Release Pipeline → Run workflow** (must be triggered from `main`).

2. Triggering the workflow with following requied inputs:

   - **Stable release**
     - `release_branch_name`: e.g., `release/xrpl@4.3.8` or `release-xrpl-4.3.8`  (must start with `release-`/`release/`, **case-insensitive**).
     - `package_name`: e.g., `xrpl`.
     - `npmjs_dist_tag`: `latest`.

  Example: `release_branch_name=release/xrpl@4.3.8`, `package_name=xrpl`, `npmjs_dist_tag=latest`.

   - **Beta release** (publishes as `<tag>-experimental`)
     - `release_branch_name`: e.g., `feature/xrpl-beta` (no naming restriction).
     - `package_name`: e.g., `xrpl`.
     - `npmjs_dist_tag`: a non-`latest` tag like `beta` or `rc` (must match `[a-z][a-z0-9._-]{0,127}` and not start with `v` + digit or a digit).

  Example: `release_branch_name=feature/xrpl-beta`, `package_name=xrpl`, `npmjs_dist_tag=feature-a` (will be published as `feature-a-experimental`, `-experimental` will be automatically appended by the workflow).

3. For stable release, after `Pre Release Pipeline` has been executed, update the PR automatically created by the release pipeline (release branch → main branch) from Draft to Ready for Review, and ensure all CI tests have passed.

### **Reviewing the release details and scan result**

The pipeline will pause at the "Print Test/Security scan result and invite Dev team to review" step and also before the final release step, relevant team should review the release details and scan result. Stable release will be reviewed by infosec team as Sec reviewer. Beta release will be reviewed by security champions from Dev team.


---

## 🔨 **How the Pipeline Works**

### 1. **Get Package Version**
- Extracts the version from `packages/<package_name>/package.json`.
- Validate inputs.

---

### 2. **Run Tests**
- Triggers the `faucet_test.yml` and `nodejs.yml` workflows to run unit, integration, and faucet tests against the specified Git ref. Integration and taucet tests are skipped for beta release.
- Ensures the code at the given Git ref passes required tests.

---

### 3. **Pre-Release Steps**
- Builds the npm package.
- Generates a CycloneDX SBOM (Software Bill of Materials).
- Runs a vulnerability scan with Trivy.
- Uploads the SBOM to OWASP Dependency-Track for tracking vulnerabilities.
- Packages the module with Lerna and uploads the tarball as an artifact.
- Posts failure notifications to Slack..
- Create a Github issue for detected vulnerabilities.
- Automatically raise a PR from relase branch to main branch for stable release

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

- For stable release, after `Pre Release Pipeline` has been executed, update the PR automatically created by the release pipeline (release branch → main branch) from Draft to Ready for Review, and ensure all CI tests have passed.
