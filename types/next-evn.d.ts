declare global {
  namespace NodeJS {
    interface ProcessEnv {
      KEYCLOAK_CLIENT_ID: string;
      KEYCLOAK_CLIENT_SECRET: string;
      KEYCLOAK_ISSUER: string;
      
      NEXTAUTH_URL: string;
      NEXTAUTH_URL_INTERNAL: string;
      NEXTAUTH_SECRET: string;
      
      IGRP_APP_MANAGER_API: string;
      IGRP_APP_CODE: string;
      IGRP_PREVIEW_MODE: string;

      NEXT_IGRP_APP_CENTER_URL: string;
      NEXT_PUBLIC_BASE_PATH: string;
      NEXT_IGRP_APP_HOME_SLUG: string;
      NEXT_PUBLIC_ALLOWED_DOMAINS: string;
    }
  }
}
