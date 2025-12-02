"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  IGRPCardPrimitive,
  IGRPCardHeaderPrimitive,
  IGRPCardTitlePrimitive,
  IGRPCardDescriptionPrimitive,
  IGRPCardContentPrimitive,
  IGRPCardFooterPrimitive,
  IGRPButton,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";

export default function InviteErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");


  useEffect(() => {
    if (!token) {
      router.push("/");
    }
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <IGRPCardPrimitive className="w-full max-w-md py-14">
        <IGRPCardHeaderPrimitive className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <IGRPIcon iconName="AlertTriangle" className="w-6 h-6 text-destructive" />
          </div>
          <IGRPCardTitlePrimitive className="text-destructive">
            Convite não corresponde
          </IGRPCardTitlePrimitive>
          <IGRPCardDescriptionPrimitive>
            Este convite não foi enviado para sua conta.
          </IGRPCardDescriptionPrimitive>
        </IGRPCardHeaderPrimitive>

        <IGRPCardFooterPrimitive className="flex justify-center mt-6 gap-3">
          <IGRPButton
            variant="outline"
            className="flex"
            onClick={() => router.push("/")}
            showIcon
            iconName="ArrowLeft"
            iconPlacement="start"
          >
            Voltar
          </IGRPButton>
          
        </IGRPCardFooterPrimitive>
      </IGRPCardPrimitive>
    </div>
  );
}