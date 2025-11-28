"use client";

import { IGRPIcon } from "@igrp/igrp-framework-react-design-system";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-2">
          <div className="text-9xl md:text-[120px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-destructive to-destructive/60 leading-none">
            500
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl md:text-5xl font-bold text-balance">
            Algo correu mal
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Ocorreu um erro inesperado. Por favor, tente novamente.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <IGRPIcon iconName="RefreshCw" className="w-4 h-4 mr-2" />
            Tentar Novamente
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="inline-flex items-center justify-center px-6 py-3 bg-muted text-foreground font-medium rounded-lg hover:bg-muted/80 transition-colors"
          >
            <IGRPIcon iconName="Home" className="w-4 h-4 mr-2" />
            Voltar ao Início
          </button>
        </div>

        <div className="pt-12 text-xs text-muted-foreground space-y-1">
          <p>Error code: 500</p>
          {error.digest && <p>ID: {error.digest}</p>}
        </div>

        {process.env.NODE_ENV === "development" && (
          <details className="mt-8 text-left">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
              Ver detalhes do erro
            </summary>
            <pre className="mt-4 p-4 bg-muted rounded-lg text-xs overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}