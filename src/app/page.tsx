"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Siempre redirigir a login - el middleware manejará si ya está autenticado
    router.replace("/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="animate-spin h-8 w-8 border-4 border-brand-cyan border-t-transparent rounded-full" />
    </div>
  );
}
