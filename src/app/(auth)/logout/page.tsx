"use client";

import { signOut } from "@igrp/framework-next-auth/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      await signOut({ redirect: false });
    };

    performLogout();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-accent">
      <div className="w-full max-w-md">
        <div className=" rounded-2xl shadow-2xl p-8 bg-card ">
          
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full flex items-center justify-center animate-pulse">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </div>
              <div className="absolute inset-0 w-20 h-20 bg-cardrounded-full opacity-20 animate-ping" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              A encerrar sessão
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Por favor aguarde...
            </p>
          </div>

          <div className="flex justify-center mt-6">
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 bg-accent rounded-full animate-bounce" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}