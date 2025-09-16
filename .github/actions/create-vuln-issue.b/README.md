# Create Vulnerability Issue (local composite action)

Creates a GitHub Issue **iff** the given vulnerability report file is **non-empty**.

## Inputs
- `report_path` (required): Path to the vulnerability report, e.g. `vuln-report.txt`.
- `package_name` (required)
- `package_version` (required)
- `release_branch` (required)
- `title_prefix` (optional, default: "Security vulnerabilities detected")
- `labels` (optional, comma-separated, default: "security,automated")
- `artifact_name` (optional): If provided, the action will link to the matching run artifact.

## Permissions
Job must grant:
```yaml
permissions:
  contents: read
  issues: write
