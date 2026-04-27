"use client";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  IGRPButton,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

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
      <Card className="w-full max-w-md py-14">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <IGRPIcon
              iconName="AlertTriangle"
              className="w-6 h-6 text-destructive"
            />
          </div>
          <CardTitle className="text-destructive">
            Convite não corresponde
          </CardTitle>
          <CardDescription>
            Este convite não foi enviado para sua conta.
          </CardDescription>
        </CardHeader>

        <CardFooter className="flex justify-center mt-6 gap-3">
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
        </CardFooter>
      </Card>
    </div>
  );
}
