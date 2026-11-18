# No Audit Log purge in the UI

The Access Management API exposes `DELETE /api/auth/audit/purge`, gated by `igrp.audit.purge`, and the SDK wraps it (`authAudit.purge`). We deliberately do not surface it anywhere in the Application Center — not behind a permission, not behind an environment flag. The endpoint wipes the entire tamper-evident Audit Log and exists only for backend dev/test resets; a delete button beside a Hash Chain Integrity Check would undermine the evidence the feature exists to preserve. Anyone who genuinely needs a reset calls the API directly.

## Considered Options

- Show it only in non-production with a typed confirmation and a forced export first — rejected: environment flags leak, and the feature's value is that the log cannot be erased from the admin portal.
