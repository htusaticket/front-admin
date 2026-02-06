"use client";

import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { InputField, PasswordField } from "@/components/auth/FormInputs";

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    email: "",
    phone: "",
    city: "",
    country: "",
    reference: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateField = (field: string, value: string) => {
    switch (field) {
    case "name":
      if (!value) return "El nombre es requerido";
      if (value.length < 2) return "Mínimo 2 caracteres";
      return "";
    case "lastname":
      if (!value) return "El apellido es requerido";
      if (value.length < 2) return "Mínimo 2 caracteres";
      return "";
    case "email": {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value) return "El correo es requerido";
      if (!emailRegex.test(value)) return "Ingresa un correo válido";
      return "";
    }
    case "phone":
      if (!value) return "El teléfono es requerido";
      if (value.length < 8) return "Número inválido";
      return "";
    case "city":
      if (!value) return "La ciudad es requerida";
      return "";
    case "country":
      if (!value) return "El país es requerido";
      return "";
    case "password":
      if (!value) return "La contraseña es requerida";
      if (value.length < 8) return "Mínimo 8 caracteres";
      if (!/[A-Z]/.test(value)) return "Al menos una mayúscula";
      if (!/[0-9]/.test(value)) return "Al menos un número";
      return "";
    case "confirmPassword":
      if (!value) return "Confirma tu contraseña";
      if (value !== formData.password) return "Las contraseñas no coinciden";
      return "";
    case "reference":
      if (!value) return "Selecciona una opción";
      return "";
    default:
      return "";
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));

    if (field === "password" && formData.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validateField(
          "confirmPassword",
          formData.confirmPassword,
        ),
      }));
    }
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
    router.push("/auth/pending");
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 0, label: "", color: "" };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const labels = ["Muy débil", "Débil", "Regular", "Fuerte", "Muy fuerte"];
    const colors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-green-500",
      "bg-emerald-500",
    ];

    return {
      strength,
      label: labels[strength - 1] || "",
      color: colors[strength - 1] || "",
    };
  };

  const passwordStrength = getPasswordStrength();

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
          Crear Cuenta
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Únete y comienza tu aprendizaje hoy mismo
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField
            id="name"
            label="Nombre"
            value={formData.name}
            onChange={(v) => handleChange("name", v)}
            error={errors.name}
            placeholder="Juan"
          />
          <InputField
            id="lastname"
            label="Apellido"
            value={formData.lastname}
            onChange={(v) => handleChange("lastname", v)}
            error={errors.lastname}
            placeholder="Pérez"
          />
        </div>

        <InputField
          id="email"
          label="Correo electrónico"
          type="email"
          value={formData.email}
          onChange={(v) => handleChange("email", v)}
          error={errors.email}
          placeholder="tu@email.com"
        />

        <InputField
          id="phone"
          label="Teléfono (WhatsApp)"
          type="tel"
          value={formData.phone}
          onChange={(v) => handleChange("phone", v)}
          error={errors.phone}
          placeholder="+54 9 11 ..."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField
            id="city"
            label="Ciudad"
            value={formData.city}
            onChange={(v) => handleChange("city", v)}
            error={errors.city}
            placeholder="Buenos Aires"
          />
          <div className="flex flex-col">
            <label
              htmlFor="country"
              className="mb-1.5 font-display text-sm font-bold text-gray-700"
            >
              País
            </label>
            <div className="relative">
              <input
                id="country"
                list="countries"
                value={formData.country}
                onChange={(e) => handleChange("country", e.target.value)}
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all placeholder:text-gray-400 ${
                  errors.country
                    ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    : "border-gray-200 focus:border-brand-cyan-dark focus:ring-4 focus:ring-brand-cyan-dark/10 hover:border-brand-cyan-dark/50"
                } bg-gray-50/50`}
                placeholder="Selecciona o escribe..."
              />
              <datalist id="countries">
                <option value="Argentina" />
                <option value="Chile" />
                <option value="Colombia" />
                <option value="México" />
                <option value="Perú" />
                <option value="España" />
                <option value="Estados Unidos" />
                <option value="Uruguay" />
              </datalist>
            </div>
            {errors.country && (
              <p className="mt-1 text-xs font-medium text-red-500">
                {errors.country}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <label
            htmlFor="reference"
            className="mb-1.5 font-display text-sm font-bold text-gray-700"
          >
            ¿Cómo nos conociste?
          </label>
          <select
            id="reference"
            value={formData.reference}
            onChange={(e) => handleChange("reference", e.target.value)}
            className={`w-full appearance-none rounded-xl border px-4 py-3 text-sm outline-none transition-all ${
              errors.reference
                ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                : "border-gray-200 focus:border-brand-cyan-dark focus:ring-4 focus:ring-brand-cyan-dark/10 hover:border-brand-cyan-dark/50"
            } bg-gray-50/50 ${
              formData.reference ? "text-gray-900" : "text-gray-500"
            }`}
          >
            <option value="" disabled>
              Selecciona una opción
            </option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="linkedin">LinkedIn</option>
            <option value="youtube">YouTube</option>
            <option value="friend">Recomendación de amigo</option>
            <option value="other">Otro</option>
          </select>
          {errors.reference && (
            <p className="mt-1 text-xs font-medium text-red-500">
              {errors.reference}
            </p>
          )}
        </div>

        <div className="space-y-4 pt-2">
          <PasswordField
            id="password"
            label="Contraseña"
            value={formData.password}
            onChange={(v) => handleChange("password", v)}
            show={showPassword}
            onToggle={() => setShowPassword(!showPassword)}
            error={errors.password}
          />
          {formData.password && passwordStrength.strength > 0 && (
            <div className="mt-1">
              <div className="flex h-1 gap-1">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={`strength-bar-${i}`}
                    className={`flex-1 rounded-full transition-all duration-300 ${
                      i < passwordStrength.strength
                        ? passwordStrength.color
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-1 text-right text-xs font-medium text-gray-500">
                {passwordStrength.label}
              </p>
            </div>
          )}

          <PasswordField
            id="confirmPassword"
            label="Confirmar Contraseña"
            value={formData.confirmPassword}
            onChange={(v) => handleChange("confirmPassword", v)}
            show={showConfirmPassword}
            onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
            error={errors.confirmPassword}
          />
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
                <span>Creando cuenta...</span>
              </>
            ) : (
              <>
                <span>Registrarse</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </div>
        </button>

        <p className="mt-8 text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-bold text-brand-cyan-dark transition-colors hover:text-[#2892a5] hover:underline"
          >
            Inicia Sesión aquí
          </Link>
        </p>
      </form>
    </motion.div>
  );
}

