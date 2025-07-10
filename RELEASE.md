# 🚀 Release Pipeline Guide

A GitHub Actions workflow has been setup to automate building, scanning, packaging, and releasing npm packages in the `packages/` directory.

---

## 🔑 **Usage**

You can manually trigger the release workflow from the [GitHub Actions UI](https://github.com/xrplf/xrpl.js/actions/workflows/release.yml).

### **Before triggering a release**

1. Create a release branch and update the **`version`** field in `packages/<package_name>/package.json` to the intended release version.
   ```
   {
     "name": "<package_name>",
     "version": "x.y.z"
   }
   ```

### **Triggering a Release**

1. Go to **GitHub → Actions → Release Pipeline → Run workflow**
2. Fill in these fields:
   - **package_name:** The folder name under `packages/`, e.g., `xrpl` or `ripple-address-codec`.
   - **git_ref:** The Git branch, tag, or commit SHA to release from.

➡️ Example:

| Field         | Example               |
|---------------|------------------------|
| package_name  | xrpl                   |
| git_ref       | release/xrpl@4.3.8     |

### **Reviewing the release details and scan result**

1. The pipelin will pause at the "Review test and security scan result" step, at least 1 approver is required to review and approve the release.


---

## 🔨 **How the Pipeline Works**

### 1. **Get Package Version**
- Extracts the version from `packages/<package_name>/package.json`.
- No manual version input is required.

---

### 2. **Run Tests**
- Triggers the integration test workflow.
- Ensures the code at the given Git ref passes tests.

---

### 3. **Pre-Release Steps**
- Builds the npm package.
- Generates a CycloneDX SBOM (Software Bill of Materials).
- Runs a security vulnerability scan with Trivy.
- Uploads SBOM to OWASP Dependency-Track for tracking the vulnerabilites.
- Packages the module with lerna and uploads the tarball as an artifact.
- Posts build failure notifications to Slack.

---

### 4. **Review Stage**
- Genrate a summary of:
  - Package name
  - Version
  - Vulnerability scan artifacts
- Requires the approvers to manually review security reports on the Actions page.

---

### 5. **Release Stage**
- Requires manual approval (Setup through **GitHub Environment**).
- Creates a GitHub Release with a tag like `<package_name>@<version>`.
- Downloads the built package tarball.
- Publishes the package to the public npm registry.
- Posts success or failure notifications to Slack.

---

## 📁 **Tag Format**

The GitHub release and git tag are named like this:

```
<package_name>@<version>
```

Example:
```
xrpl@2.3.1
```


##⚠️ **Important Notes**

- The release workflow does not overwrite existing tags. If the same version tag already exists, the workflow will fail.

- Vulnerability scanning does not block the release, but it is the approvers' responsibility to review the scan results in the Review stage.

- The final release step performs an npm publish --dry-run. We can remove --dry-run when ready for production release.
