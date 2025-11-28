"use client";

import {
  IGRPBadgePrimitive,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import Link from "next/link";
import Image from "next/image";

import { config, ROUTES } from "@/lib/constants";
import { ApplicationDTO } from "@igrp/platform-access-management-client-ts";

export function ApplicationCardHOme({ app }: { app: ApplicationDTO }) {
  const { name, description, code, picture } = app;
  const href = code === "APP_IGRP_CENTER" ? "/applications" : app.url ?? "#";
  
  return (
    <Link href={href} className="group block h-full">
      <div className="relative h-full overflow-hidden rounded-sm border-2 border-border/40 bg-card p-5 hover:shadow-sm">
        <div className="flex gap-4">
          <div className="relative size-14 rounded-md overflow-hidden flex items-center justify-center shrink-0 ring-1 ring-border/50">
            {picture ? (
              <Image
                src={config.minioUrl + picture}
                alt={name}
                fill
                className="object-cover"
                quality={100}
                sizes="100px"
                priority
              />
            ) : (
              <IGRPIcon iconName="AppWindow" className="size-7 text-primary" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors mb-1">
              {name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-snug line-clamp-2"> {description} </p>
          </div>
          <IGRPIcon iconName="Star" className="size-4 " />
        </div>
      </div>
    </Link>
  );
}
