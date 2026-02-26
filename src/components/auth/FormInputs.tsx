"use client";

import { Eye, EyeOff } from "lucide-react";

interface InputFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
}

export const InputField = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
}: InputFieldProps) => (
  <div className="flex flex-col">
    <label
      htmlFor={id}
      className="mb-1.5 font-display text-sm font-bold text-gray-700"
    >
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-xl border px-4 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 ${
        error
          ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
          : "border-gray-200 focus:border-brand-cyan-dark focus:ring-4 focus:ring-brand-cyan-dark/10 hover:border-brand-cyan-dark/50"
      } bg-gray-50/50`}
    />
    {error && <p className="mt-1 text-xs font-medium text-red-500">{error}</p>}
  </div>
);

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  error?: string;
}

export const PasswordField = ({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  error,
}: PasswordFieldProps) => (
  <div className="flex flex-col">
    <label
      htmlFor={id}
      className="mb-1.5 font-display text-sm font-bold text-gray-700"
    >
      {label}
    </label>
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="••••••••"
        className={`w-full rounded-xl border px-4 py-3 pr-12 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 ${
          error
            ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
            : "border-gray-200 focus:border-brand-cyan-dark focus:ring-4 focus:ring-brand-cyan-dark/10 hover:border-brand-cyan-dark/50"
        } bg-gray-50/50`}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-brand-cyan-dark"
      >
        {show ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
    {error && <p className="mt-1 text-xs font-medium text-red-500">{error}</p>}
  </div>
);
