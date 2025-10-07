namespace NodeJS {
  interface ProcessEnv {
    KEYCLOAK_CLIENT_ID: string;
    KEYCLOAK_CLIENT_SECRET: string;
    KEYCLOAK_ISSUER: string;
    NEXTAUTH_URL: string;
    NEXTAUTH_SECRET: string;
    IGRP_APP_MANAGER_API: string;
    IGRP_APP_CODE: string;
    IGRP_MINIO_URL: string;
    IGRP_PREVIEW_MODE: string;
    IGRP_APP_CENTER_URL: string;
    IGRP_APP_BASE_PATH: string;
    IGRP_APP_HOME_SLUG: string;
  }
}
