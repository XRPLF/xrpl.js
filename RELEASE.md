# 🚀 Release Pipeline Guide

A GitHub Actions workflow has been set up to automate building, scanning, packaging, and releasing npm packages in the `packages/` directory.

---

## 🔑 **Usage**

You can manually trigger the release workflow from the [GitHub Actions UI](https://github.com/xrplf/xrpl.js/actions/workflows/release.yml).

### **Before triggering a release**

1. Create a release branch. A qualified branch name should start with "release-" or "release/". e.g: `release/xrpl@4.3.8`, `release-xrpl-4.3.8`, `Release/xrpl@4.3.8`, `release-xrpl@5.0.0-alpha.1`.
2. Update the **`version`** field in `packages/<package_name>/package.json` to the intended release version.
   ```json
   {
     "name": "<package_name>",
     "version": "x.y.z"
   }
   ```
3. Run `npm i` to update the `package-lock.json` with the updated versions and commit the lock file to the release branch.

### **Triggering a Release**

1. Go to **GitHub → Actions → Release Pipeline → Run workflow**
2. Choose the release branch from dropdown
3. Fill in these fields:
   - **package_name** → The folder name under `packages/`, e.g., `xrpl` or `ripple-address-codec`.
   - **npmjs_dist_tag** → The npm distribution tag to publish under. Defaults to `latest`.
     - Examples:
       - `latest` → Stable release
       - `beta`, `feature-name` → Pre-release for testing
       - `rc` → Release candidate

➡️ Stable release example:

| Field            | Example               |
|------------------|-----------------------|
| package_name     | xrpl                  |
| npmjs_dist_tag   | latest                |

➡️ Beta release example:

| Field            | Example               |
|------------------|-----------------------|
| package_name     | xrpl                  |
| npmjs_dist_tag   | smart-escrow          |

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

### 6. Send an email to [xrpl-announce](https://groups.google.com/g/xrpl-announce).

---

### 7. Lastly, send a similar message to the XRPL Discord in the [`javascript` channel](https://discord.com/channels/886050993802985492/886053111179915295). The message should include:
    1. The version changes for xrpl libraries
    2. A link to the more detailed changes
    3. Highlights of important changes

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

- PR created from release branch to main branch needs to closed and reopened for the tests to automatically execute. This won't be needed going forward as this step will be removed.

- The release workflow does not overwrite existing tags. If the same version tag already exists, the workflow will fail.

- Vulnerability scanning does not block the release, but it is the approvers' responsibility to review the scan results in the Review stage.
