"use client";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import Link from "next/link";

export default function Pending() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto flex w-full max-w-md flex-col items-center text-center"
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-orange-500">
        <Clock className="h-10 w-10" />
      </div>

      <h1 className="mb-4 font-display text-3xl font-bold text-gray-900">
        Cuenta en Revisión
      </h1>

      <p className="mb-8 text-gray-500 leading-relaxed">
        Tu solicitud de registro ha sido recibida y está siendo procesada por
        nuestro equipo. Te notificaremos por correo electrónico una vez que tu
        cuenta haya sido aprobada.
      </p>

      <div className="space-y-4 w-full">
        <Link
          href="/"
          className="block w-full rounded-xl bg-gray-100 py-3.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200"
        >
          Volver al Inicio
        </Link>
      </div>
    </motion.div>
  );
}
