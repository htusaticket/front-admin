"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Mail } from "lucide-react";

export default function Suspended() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto flex w-full max-w-md flex-col items-center text-center"
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-500">
        <AlertTriangle className="h-10 w-10" />
      </div>

      <h1 className="mb-4 font-display text-3xl font-bold text-gray-900">
        Cuenta Suspendida
      </h1>

      <p className="mb-8 text-gray-500 leading-relaxed">
        Lamentamos informarte que tu cuenta ha sido suspendida temporalmente
        debido a un incumplimiento de nuestros términos de servicio o falta de
        pago.
      </p>

      <div className="w-full rounded-2xl bg-gray-50 p-6 text-left">
        <h3 className="mb-2 font-bold text-gray-900">¿Crees que es un error?</h3>
        <p className="mb-4 text-sm text-gray-500">
          Ponte en contacto con nuestro equipo de soporte para revisar tu caso.
        </p>
        <a
          href="mailto:soporte@jfalcon.com"
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-cyan-dark py-3 text-sm font-bold text-white transition-colors hover:bg-[#2eaa c2]"
        >
          <Mail className="h-4 w-4" />
          Contactar Soporte
        </a>
      </div>
    </motion.div>
  );
}
