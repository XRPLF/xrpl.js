# 🚀 Release Pipeline Guide

A GitHub Actions workflow has been set up to automate building, scanning, packaging, and releasing npm packages in the `packages/` directory.

---

## 🔑 **Usage**

You can manually trigger the release workflow from the [GitHub Actions UI](https://github.com/xrplf/xrpl.js/actions/workflows/release.yml).

### **Before triggering a release**

1. Create a release branch and update the **`version`** field in `packages/<package_name>/package.json` to the intended release version.
   ```json
   {
     "name": "<package_name>",
     "version": "x.y.z"
   }
   ```
2. Run npm i to update the package-lock with the updated versions and commit the lock file to the releaes branch

### **Triggering a Release**

1. Go to **GitHub → Actions → Release Pipeline → Run workflow**
2. Fill in these fields:
   - **package_name** → The folder name under `packages/`, e.g., `xrpl` or `ripple-address-codec`.
   - **release_branch** → The Git branch the release is generated from, e.g., `release/xrpl@4.3.8`.
   - **npmjs_dist_tag** → The npm distribution tag to publish under. Defaults to `latest`.
     - Examples:
       - `latest` → Standard production release
       - `beta` → Pre-release for testing
       - `rc` → Release candidate

➡️ Example:

| Field            | Example               |
|------------------|-----------------------|
| package_name     | xrpl                  |
| release_branch   | release/xrpl@4.3.8    |
| npmjs_dist_tag   | latest                |


### **Reviewing the release details and scan result**

1. The pipeline will pause at the "Review test and security scan result" step, at least 2 approvers are required to review and approve the release.


---

## 🔨 **How the Pipeline Works**

### 1. **Get Package Version**
- Extracts the version from `packages/<package_name>/package.json`.
- No manual version input is required.

---

### 2. **Run Tests**
- Triggers the `faucet_test.yml` and `nodejs.yml` workflows to run unit, integration, and faucet tests against the specified Git ref.
- Ensures the code at the given Git ref passes all tests.

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
