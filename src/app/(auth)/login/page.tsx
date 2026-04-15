"use client";

import { motion } from "framer-motion";
import Cookies from "js-cookie";
import { ArrowRight, Loader2, ShieldAlert } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { InputField, PasswordField } from "@/components/auth/FormInputs";
import { useAppLogo } from "@/hooks/useAppLogo";
import { useAuthStore } from "@/store/auth";

export default function Login() {
  const router = useRouter();
  const { login, isLoading, error, errorCode, clearError } = useAuthStore();
  const logoUrl = useAppLogo();

  // Redirigir si ya está autenticado
  useEffect(() => {
    const token = Cookies.get("accessToken");
    const role = Cookies.get("userRole");
    const status = Cookies.get("userStatus");
    
    if (token && (role === "ADMIN" || role === "SUPERADMIN" || role === "JOB_UPLOADER") && status === "ACTIVE") {
      router.replace(role === "JOB_UPLOADER" ? "/jobs" : "/dashboard");
    }
  }, [router]);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateField = (field: string, value: string) => {
    switch (field) {
    case "email": {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value) return "Email is required";
      if (!emailRegex.test(value)) return "Enter a valid email";
      return "";
    }
    case "password":
      if (!value) return "Password is required";
      return "";
    default:
      return "";
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    const fieldError = validateField(field, value);
    setValidationErrors((prev) => ({ ...prev, [field]: fieldError }));
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach((key) => {
      const fieldError = validateField(key, formData[key as keyof typeof formData]);
      if (fieldError) newErrors[key] = fieldError;
    });

    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      return;
    }

    const result = await login({
      email: formData.email,
      password: formData.password,
    });

    if (result.success) {
      const role = Cookies.get("userRole");
      router.push(role === "JOB_UPLOADER" ? "/jobs" : "/dashboard");
    }
  };

  const getErrorMessage = () => {
    if (errorCode === "FORBIDDEN") {
      return "You don't have admin permissions. This panel is only for administrators.";
    }
    if (errorCode === "ACCOUNT_SUSPENDED") {
      return "Your account has been suspended. Contact support.";
    }
    if (errorCode === "ACCOUNT_PENDING") {
      return "Your account is pending approval.";
    }
    if (errorCode === "INVALID_CREDENTIALS") {
      return "Invalid email or password.";
    }
    return error;
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
          src={logoUrl}
          alt="JFalcon Admin"
          width={100}
          height={100}
          className="mb-4"
          priority
        />
        <h2 className="font-display text-3xl font-bold text-gray-900">
          Admin Login
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          JFalcon Administration Panel
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
        >
          <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Authentication Error</p>
            <p className="text-sm text-red-700">{getErrorMessage()}</p>
          </div>
        </motion.div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <InputField
          id="email"
          label="Email"
          type="email"
          value={formData.email}
          onChange={(v) => handleChange("email", v)}
          error={validationErrors.email}
          placeholder="admin@jfalcon.com"
        />

        <div className="flex flex-col">
          <PasswordField
            id="password"
            label="Password"
            value={formData.password}
            onChange={(v) => handleChange("password", v)}
            show={showPassword}
            onToggle={() => setShowPassword(!showPassword)}
            error={validationErrors.password}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="group relative mt-6 flex w-full items-center justify-center overflow-hidden rounded-xl bg-brand-cyan-dark py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-cyan-dark/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-cyan-dark/30 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:opacity-70"
        >
          <div className="relative flex items-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </div>
        </button>

        <p className="mt-8 text-center text-xs text-gray-400">
          Only administrators can access this panel.
        </p>
      </form>
    </motion.div>
  );
}
