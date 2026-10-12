# Independent review

Applied the local Matt Pocock code-review skill with two independent read-only agents. Baseline `bd835e0` (approved autonomous spec), implementation initially `bce670c`; resolved implementation `5ade8e58c2f2735f477810038bcc878afb2c3ba0`. No originating tracker issue; source is docs/SPEC.md. Both reviewers independently ran the domain suite.

## Standards
Initial findings, all P2: strict saves allowed impossible progression; SVG replacement lost map focus after tool shortcuts/settlement; global Space intercepted native button activation. Fixed by progression/history invariants that preserve won sandbox saves, central focus restoration excluding modals, and native-control exclusion for Space. Reviewer rechecked the exact resolved commit: **pass, no new blocking standards issue, 36 tests passed**. Browser subsequently verified tool selection and arrows, persistent map focus through running ticks, Space pause on map, and Space activation of Field guide/Save/Continue sandbox.

## Spec
Initial medium finding: a shared pre-growth snapshot allowed each home its own startup allowance. Public-seam reproduction admitted 150 residents with no jobs in month 1. Fixed to distribute one total 40-person allowance deterministically across all homes; job-backed growth still uses a shared snapshot. Reviewer independently reproduced 15 homes with no jobs: **40 residents after months 1 and 2; all 36 tests passed; no remaining spec blocker**. The six-home/six-shop charter path now finishes in month 7 and was replayed through actual Chrome controls.

## Final small delivery changes
Visible export JSON fallback, original favicon, formatting CI step and delivery documentation were added after the main review, and independently reviewed against `38c302e`. Both axes passed with no new blockers; both reviewers independently ran all 37 tests. These changes do not change simulation semantics. Final validation is recorded in QA.md.
