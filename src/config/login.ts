// Welcome, description, copyright and the carousel copy live in the `login`
// namespace of `src/i18n/messages` so they follow the current language.
export const loginConfig = {
  texts: {
    // No `loginButton`: the framework's chrome catalog supplies it in the
    // current language. Setting it here would pin one language on every locale.
    igrpLabel: "igrp",
    igrpUrl: "https://igrp.cv",
    nosiLabel: "NOSi",
    nosiUrl: "https://nosi.cv",
  },
  sliderPosition: "left" as "left" | "right",
};

export type LoginConfig = typeof loginConfig;

/** One image per slide; the text comes from `login.carousel.<key>`. */
export const carouselImages = {
  workflow: "/placeholder-carousel.png",
  security: "/placeholder-carousel.png",
  collaboration: "/placeholder-carousel.png",
} as const;
