"""Tests for check-pr-description.py. Run: python3 -m unittest discover .github/scripts"""

import contextlib
import importlib.util
import io
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("check-pr-description.py")
spec = importlib.util.spec_from_file_location("check_pr_description", SCRIPT)
check = importlib.util.module_from_spec(spec)
spec.loader.exec_module(check)

TEMPLATE = "## Summary\n<!-- Describe the change. -->\n\n## Test Plan\n"


def run(body: str) -> tuple[int, str]:
    with tempfile.TemporaryDirectory() as tmp:
        template_file = Path(tmp, "template.md")
        body_file = Path(tmp, "body.md")
        template_file.write_text(TEMPLATE, encoding="utf-8")
        body_file.write_text(body, encoding="utf-8")
        argv = [
            str(SCRIPT),
            "--template-file",
            str(template_file),
            "--pr-body-file",
            str(body_file),
        ]
        out = io.StringIO()
        old_argv = sys.argv
        sys.argv = argv
        try:
            with contextlib.redirect_stdout(out):
                rc = check.main()
        finally:
            sys.argv = old_argv
        return rc, out.getvalue()


class CheckPrDescriptionTest(unittest.TestCase):
    def test_customized_body_passes(self):
        rc, _ = run("## Summary\nFix a bug.\n\n## Test Plan\nRan tests.\n")
        self.assertEqual(rc, 0)

    def test_empty_body_fails(self):
        rc, _ = run("  \n")
        self.assertEqual(rc, 1)

    def test_template_body_fails(self):
        rc, _ = run(TEMPLATE)
        self.assertEqual(rc, 1)

    def test_comment_only_body_fails(self):
        rc, _ = run("<!-- nothing here -->\n")
        self.assertEqual(rc, 1)

    def test_echoed_body_cannot_issue_workflow_commands(self):
        rc, out = run(TEMPLATE + "<!--\n::warning::injected\n-->\n")
        self.assertEqual(rc, 1)
        lines = out.splitlines()
        start = next(i for i, l in enumerate(lines) if l.startswith("::stop-commands::"))
        token = lines[start].removeprefix("::stop-commands::")
        self.assertTrue(token)
        end = lines.index(f"::{token}::")
        for line in lines[:start] + lines[end + 1 :]:
            self.assertNotIn("Visible", line)
        self.assertTrue(any("## Summary" in l for l in lines[start:end]))

if __name__ == "__main__":
    unittest.main()
