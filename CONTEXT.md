# Application Center

The admin portal for the iGRP platform: administrators manage applications, departments, users, roles, permissions, and the machine identities that call iGRP APIs.

## Language

### Machine identities

**OAuth Client**:
A registered API consumer on the iGRP authorization server, identified by a `clientId` and authenticated by a secret that is disclosed exactly once, at registration.
_Avoid_: Client (unqualified), app, API key

**Service Account**:
A named, human-manageable machine identity that wraps exactly one OAuth Client using the `client_credentials` grant type and carries Roles and Direct Permissions.
_Avoid_: Bot, technical user, M2M account

**Grant Type**:
An OAuth2 flow an OAuth Client is allowed to use (`authorization_code`, `refresh_token`, `client_credentials`, `device_code`).
_Avoid_: Grant (when meaning a permission assignment)

**Client Secret**:
The credential an OAuth Client presents to authenticate; shown once at registration and never retrievable afterwards.
_Avoid_: Password, token

### Access

**Direct Permission**:
A Permission assigned to a Service Account without going through a Role.
_Avoid_: Direct grant, bypass permission

**Role-Inherited Permission**:
A Permission a Service Account holds because one of its assigned Roles contains it.

**Effective Permissions**:
The union of a Service Account's Role-Inherited Permissions and Direct Permissions.

**Deactivation** (of a Service Account):
Turning off both the Service Account and its OAuth Client, so the identity can no longer authenticate at all.
_Avoid_: Suspend, disable (for partial states)

### Audit

**Audit Log**:
The single append-only, tamper-evident record of every security-relevant event on the platform, each entry hash-chained to the one before it.
_Avoid_: Audit trail, security log, history

**Audit Event**:
One entry in the Audit Log — a login, token issue, access decision, session change, or administrative configuration change.
_Avoid_: Row, record, log line

**Report**:
A read-only, filtered view over the Audit Log for a required date range. There are exactly three: Access Period Report, Access Report, Settings Report.
_Avoid_: Query, view, log

**Access Period**:
A time-limited authorisation for a user to reach a module: a window (start to end), who authorised it, the device it was used from, and the state of the operation.
_Avoid_: Session, grant (see Grant Type)

**Access Period Report** (API: `audit`; UI: "Relatório de Períodos de Acesso"):
The period-oriented Report: one Access Period per entry, answering "who was allowed in, for how long, and on whose authority".
_Avoid_: Audit Report (collides with the Audit Log and the feature name), Activity Report

**Access Report** (API: `access`; UI: "Relatório de Acessos"):
The event-oriented Report: one access attempt at a point in time and its outcome — granted, denied, or from an unusual IP.

**Settings Report** (API: `settings`; UI: "Relatório de Configurações"):
The Report of administrative configuration changes, showing what changed and, for edits, the previous and new values.
_Avoid_: Change log, admin log

**Export**:
A one-off download of a Report, with the Report's filters, as PDF, XLSX, or CSV; contains every matching Audit Event, not a page.
_Avoid_: Download (as a noun), archive

**Archive**:
An Export rendered once, stored in object storage, and recorded so it can be listed and downloaded again later.
_Avoid_: Saved report, backup, snapshot

**Hash Chain**:
The link from each Audit Event to the one before it (each event's previous hash is the prior event's current hash), which makes any after-the-fact edit detectable.

**Integrity Check** (UI: "Verificar integridade"):
Walking the Hash Chain to confirm it is unbroken, or to find the first Audit Event where it breaks.
_Avoid_: Validation (too generic), audit

**Legacy Audit Event**:
An Audit Event written before the Hash Chain existed; it carries no hashes, is skipped by the Integrity Check, and is not evidence of tampering.
_Avoid_: Unverified, corrupt

**Platform Time Zone**:
The single time zone (`Atlantic/Cape_Verde`) in which every audit date range is interpreted and every audit time is displayed, regardless of where the server or browser runs.
_Avoid_: Local time (ambiguous — whose?)

**Active Role**:
The one Role a user is currently acting as (the token's `selectedRole`). A user's Permissions in the token come from the Active Role only — a Permission held through any other Role is not in effect until the user switches to it.
_Avoid_: Current profile, main role

**Role** (on an Audit Event; UI: "Perfil"):
The Active Role the user was acting as when the event happened — always a Role, never a Permission, even when a code looks like a permission name.

**Roles Held** (on an Audit Event; UI: "Perfis detidos"):
Every Role the user held at the time of the event, whether active or not. Evidence of what the user *could* have acted as, kept separate from the Role they *did* act as.
_Avoid_: Roles (plural, unqualified)

## Relationships

- An **OAuth Client** has zero or one **Service Account**; a **Service Account** has exactly one **OAuth Client**.
- An **OAuth Client** can exist without a **Service Account**; a **Service Account** cannot exist without its **OAuth Client**.
- Deleting a **Service Account** does not by itself delete its **OAuth Client**; an **OAuth Client** that still has a **Service Account** cannot be deleted.
- A **Service Account** belongs to the same application as its **OAuth Client**; it never has an owner of its own.
- An **OAuth Client** with a **Service Account** always keeps the `client_credentials` **Grant Type**.
- **Roles** and **Permissions** belong to departments; that scoping is managed on the departments pages, not here.
- Every **Report** reads from the one **Audit Log**; the **Access Period** and **Access Reports** are two lenses on authentication/authorization **Audit Events** (a window vs. a moment), and the **Settings Report** covers configuration changes.
- No **Audit Event** records an **Access Period** yet; until one does, the **Access Period Report** returns every **Audit Event** in the range, configuration changes included.
- An **Access Period** falls in a date range when the two overlap — it need not start or end inside the range. A period with no end is still open and overlaps every range after its start. An **Audit Event** with no period falls in a range by its own time. Today the backend matches only the event's own time.
- A user's effective **Permissions** come from their **Active Role**; holding a Permission through another Role does not grant access.
- An **Access Period** is authorised by exactly one user and is for exactly one user and one module.
- An **Export** or **Archive** always belongs to exactly one **Report** and carries that Report's filters and date range.

## Flagged ambiguities

- "Client" alone is reserved for the TypeScript SDK classes (`AccessManagementClient`, `RoleClient`); in the domain always say **OAuth Client**.
- "Audit" alone means the feature or the **Audit Log**, never one Report; the API's "Audit Report" is the **Access Period Report**.
- Audit Events written before the backend change store **Roles Held** (a comma-joined list) in the field that will hold the **Role**; until the change ships, the portal labels that field "Perfis detidos" and filters it by "contains".
- The Audit Log is never purged from this portal; purging exists only as a backend dev/test reset.
- "Grant" alone means a **Grant Type**; permission assignments are "Permissions" (e.g. the Service Account list column reads `8 + 3 direct`).
