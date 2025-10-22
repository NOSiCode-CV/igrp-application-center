export const loginConfig = {
  texts: {
    welcome: "Bem-vindo ao IGRP",
    description: "Introduza as suas credenciais para aceder.",
    loginButton: "Login Now",
    copyright: "Desenvolvido por",
    igrpLabel: "igrp",
    igrpUrl: "https://igrp.cv",
    nosiLabel: "NOSi",
    nosiUrl: "https://nosi.cv",
  },
  sliderPosition: "left" as "left" | "right",
};

export type LoginConfig = typeof loginConfig;

export const carouselItems = [
  {
    image: "/igrp/placeholder-carousel.png",
    title: "Streamlined Workflow",
    description:
      "Boost your productivity with our intuitive interface and powerful tools.",
  },
  {
    image: "/igrp/placeholder-carousel.png",
    title: "Secure by Design",
    description:
      "Your data is protected with enterprise-grade security and encryption.",
  },
  {
    image: "/igrp/placeholder-carousel.png",
    title: "Collaborative Platform",
    description: "Work together seamlessly with your team in real-time.",
  },
];

export type CarouselLoginType = (typeof carouselItems)[number];
