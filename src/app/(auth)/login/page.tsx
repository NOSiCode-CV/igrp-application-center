import { getAuthProviderIdFromEnv } from "@igrp/framework-next-auth";
import { IGRPAuthCarousel, IGRPAuthForm } from "@igrp/framework-next-ui";
import { redirect } from "next/navigation";
import { carouselItems, loginConfig } from "@/config/login";
import { siteConfig } from "@/config/site";
import { cn, isAuthBypass } from "@/lib/utils";

const { sliderPosition, texts } = loginConfig;
const { logo, name } = siteConfig;

export default async function AuthPage({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  if (isAuthBypass()) { redirect("/"); }
  const { callbackUrl } = await searchParams;
  const providerId = getAuthProviderIdFromEnv(process.env);
  return (
    <section className="flex min-h-screen flex-col md:flex-row">
      <div className={cn("relative hidden w-full md:block md:w-1/2", "lg:order-first hidden lg:block", sliderPosition === "right" && "lg:order-last")}>
        <IGRPAuthCarousel carouselItems={carouselItems} />
      </div>
      <IGRPAuthForm texts={texts} logo={logo} name={name} callbackUrl={callbackUrl as string} providerId={providerId} />
    </section>
  );
}
