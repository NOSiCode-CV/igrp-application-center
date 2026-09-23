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

## Relationships

- An **OAuth Client** has zero or one **Service Account**; a **Service Account** has exactly one **OAuth Client**.
- An **OAuth Client** can exist without a **Service Account**; a **Service Account** cannot exist without its **OAuth Client**.
- Deleting a **Service Account** does not by itself delete its **OAuth Client**; an **OAuth Client** that still has a **Service Account** cannot be deleted.
- A **Service Account** belongs to the same application as its **OAuth Client**; it never has an owner of its own.
- An **OAuth Client** with a **Service Account** always keeps the `client_credentials` **Grant Type**.
- **Roles** and **Permissions** belong to departments; that scoping is managed on the departments pages, not here.

## Flagged ambiguities

- "Client" alone is reserved for the TypeScript SDK classes (`AccessManagementClient`, `RoleClient`); in the domain always say **OAuth Client**.
- "Grant" alone means a **Grant Type**; permission assignments are "Permissions" (e.g. the Service Account list column reads `8 + 3 direct`).
