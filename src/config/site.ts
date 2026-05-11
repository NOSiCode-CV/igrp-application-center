const bp = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const siteConfig = {
  name: "IGRP",
  url: "https://igrp.cv",
  ogImage:
    "https://storage-api.nosi.cv/cms-portal-igrp/wallpaper_workshop_v1_0_brocy_d88849289b.webp",
  description: "Inovação e Transformação Digital Low-Code",
  links: {
    portal: "https://igrp.cv",
    github: "https://github.com/NOSiCode-CV/IGRP-Framework",
  },
  logo: {
    src: `${bp}/logo-no-text.png`,
    srcDark: `${bp}/logo-no-text.png`,
    width: 100,
    height: 60,
  },
  texts: {
    welcome: "Bem-vindo ao",
  },
};

export type SiteConfig = typeof siteConfig;
