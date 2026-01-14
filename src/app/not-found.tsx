"use client";

import { IGRPIcon } from "@igrp/igrp-framework-react-design-system";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-2">
          <div className="text-9xl md:text-[120px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60 leading-none">
            404
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl md:text-5xl font-bold text-balance">
            Página não encontrada
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            A página que voce esta procurando não foi encontrada.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <IGRPIcon iconName="ArrowLeft" className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </div>

        <div className="pt-12 text-xs text-muted-foreground">
          <p>Error code: 404</p>
        </div>
      </div>
    </div>
  );
}
