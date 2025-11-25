# 🚀 Release Pipeline Guide

A GitHub Actions workflow has been set up to automate building, scanning, packaging, and releasing npm packages in the `packages/` directory.

---

## 🔑 **Usage**

You can manually trigger the release workflow from the [GitHub Actions UI](https://github.com/xrplf/xrpl.js/actions/workflows/release.yml).

### **Before triggering a release**

**Stable release **
1. Create a release branch. A qualified branch name should start with "release-" or "release/", case-insensitive. e.g: `release/xrpl@4.3.8`, `release-xrpl-4.3.8`, `Release/xrpl@4.3.8`.
2. Raise a PR from the release branch to main branch
3. Update the **`version`** field in `packages/<package_name>/package.json` to the intended release version.
   ```json
   {
     "name": "<package_name>",
     "version": "x.y.z"
   }
   ```
4. Set `npm distribution tag` to `latest`.
5. Run npm i to update the package-lock with the updated versions and commit the lock file to the release branch

**Beta release **
1. Create a release branch. There is no restriction for branch name.
2. 2. Update the **`version`** field in `packages/<package_name>/package.json` to the intended beta release version.
   ```json
   {
     "name": "<package_name>",
     "version": "x.y.z-<beta|rc>.a"
   }
   ```
3. Provide a non-`latest` `npm distribution tag` and not starting with `v` + digit or a digit. The workflow will automatically append `-experimental`, as `<tag>-experimental`.
4. Run `npm i` to refresh `package-lock.json` and commit it.

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

1. The pipeline will pause at the "Print Test/Security scan result and invite Dev team to review" step and also before the final release step, relevant team should review the release details and scan result. Stable release release will be reviewed by infosec team as Sec reviewer. Beta release will be reviewed by security champions from Dev team.


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
