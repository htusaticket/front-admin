"use client";

import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { InputField, PasswordField } from "@/components/auth/FormInputs";

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateField = (field: string, value: string) => {
    switch (field) {
    case "email": {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value) return "El correo es requerido";
      if (!emailRegex.test(value)) return "Ingresa un correo válido";
      return "";
    }
    case "password":
      if (!value) return "La contraseña es requerida";
      return "";
    default:
      return "";
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
    router.push("/dashboard");
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
          Iniciar Sesión
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          ¡Bienvenido de nuevo! Ingresa a tu cuenta
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <InputField
          id="email"
          label="Correo electrónico"
          type="email"
          value={formData.email}
          onChange={(v) => handleChange("email", v)}
          error={errors.email}
          placeholder="tu@email.com"
        />

        <div className="flex flex-col">
          <PasswordField
            id="password"
            label="Contraseña"
            value={formData.password}
            onChange={(v) => handleChange("password", v)}
            show={showPassword}
            onToggle={() => setShowPassword(!showPassword)}
            error={errors.password}
          />
          <div className="mt-1 flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm font-bold text-brand-cyan-dark transition-colors hover:text-[#2892a5] hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="group relative mt-6 flex w-full items-center justify-center overflow-hidden rounded-xl bg-brand-cyan-dark py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-cyan-dark/20 transition-all hover:-translate-y-0.5 hover:bg-[#2eaa c2] hover:shadow-xl hover:shadow-brand-cyan-dark/30 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:opacity-70"
        >
          <div className="relative flex items-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <>
                <span>Ingresar</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </div>
        </button>

        <p className="mt-8 text-center text-sm text-gray-500">
          ¿No tienes cuenta?{" "}
          <Link
            href="/register"
            className="font-bold text-brand-cyan-dark transition-colors hover:text-[#2892a5] hover:underline"
          >
            Regístrate aquí
          </Link>
        </p>
      </form>
    </motion.div>
  );
}
