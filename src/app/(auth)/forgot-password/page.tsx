"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { InputField } from "@/components/auth/FormInputs";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("El correo es requerido");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Ingresa un correo válido");
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
    setIsSent(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mx-auto w-full max-w-lg"
    >
      <div className="mb-8 flex flex-col items-center text-center">
        <Image
          src="/logo.webp"
          alt="High Ticket English"
          width={100}
          height={100}
          className="mb-4"
          priority
        />
        <h2 className="font-display text-3xl font-bold text-gray-900">
          Recuperar Contraseña
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Ingresa tu correo y te enviaremos las instrucciones
        </p>
      </div>

      {!isSent ? (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <InputField
            id="email"
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(v) => {
              setEmail(v);
              setError("");
            }}
            error={error}
            placeholder="tu@email.com"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="group relative mt-6 flex w-full items-center justify-center overflow-hidden rounded-xl bg-brand-cyan-dark py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-cyan-dark/20 transition-all hover:-translate-y-0.5 hover:bg-[#2eaa c2] hover:shadow-xl hover:shadow-brand-cyan-dark/30 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:opacity-70"
          >
            <div className="relative flex items-center gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <span>Recuperar contraseña</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </div>
          </button>

          <p className="mt-8 text-center text-sm text-gray-500">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 font-bold text-brand-cyan-dark transition-colors hover:text-[#2892a5] hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a Iniciar Sesión
            </Link>
          </p>
        </form>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl bg-green-50 p-6 text-center"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-bold text-green-800">
            ¡Correo de recuperación enviado!
          </h3>
          <p className="mb-6 text-sm text-green-700">
            Hemos enviado las instrucciones a <strong>{email}</strong>. Revisa
            tu bandeja de entrada (y spam).
          </p>
          <Link
            href="/login"
            className="block w-full rounded-xl bg-green-600 py-3 text-sm font-bold text-white transition-colors hover:bg-green-700"
          >
            Volver a Iniciar Sesión
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}
