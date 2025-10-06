namespace NodeJS {
  interface ProcessEnv {
    KEYCLOAK_CLIENT_ID: string;
    KEYCLOAK_CLIENT_SECRET: string;
    KEYCLOAK_ISSUER: string;
    NEXTAUTH_URL: string;
    NEXTAUTH_SECRET: string;
    IGRP_APP_MANAGER_API: string;
    IGRP_APP_CODE: string;
    IGRP_NEXTAUTH_CALLBACK: string;
    IGRP_LOGIN_URL: string;
    IGRP_LOGOUT_URL: string;
    IGRP_MINIO_URL: string;
  }
}
