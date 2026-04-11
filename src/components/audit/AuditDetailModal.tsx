"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, ShieldAlert, Monitor, Globe } from "lucide-react";

import { useModalLock } from "@/hooks/useModalLock";

interface AuditDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: {
    id: number;
    adminName: string;
    action: string;
    target: string;
    timestamp: string;
    type: string;
  } | null;
}

export function AuditDetailModal({ isOpen, onClose, log }: AuditDetailModalProps) {
  useModalLock(isOpen, onClose);
  if (!log) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="font-display text-lg font-bold text-gray-900">
                  Audit Log Details
              </h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                  {log.adminName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{log.adminName}</h3>
                  <p className="text-sm text-gray-500">Administrator</p>
                </div>
                <div className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${
                  log.type === "Delete" ? "bg-red-100 text-red-700" :
                    log.type === "Create" ? "bg-green-100 text-green-700" :
                      "bg-gray-100 text-gray-700"
                }`}>
                  {log.type}
                </div>
              </div>

              {/* Action Details */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Action</p>
                    <p className="font-medium text-gray-900">{log.action}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Target</p>
                    <p className="font-medium text-gray-900">{log.target}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Timestamp</p>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {log.timestamp}
                  </div>
                </div>
              </div>

              {/* Technical Details (Mock) */}
              <div>
                <h4 className="font-bold text-sm text-gray-900 mb-3">Technical Details</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-500">
                      <Monitor className="h-4 w-4" />
                                IP Address
                    </span>
                    <span className="font-mono text-gray-700">192.168.1.1</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-500">
                      <Globe className="h-4 w-4" />
                                Location
                    </span>
                    <span className="text-gray-700">New York, USA</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-500">
                      <ShieldAlert className="h-4 w-4" />
                                Session ID
                    </span>
                    <span className="font-mono text-gray-700">sess_8f92k3...</span>
                  </div>
                </div>
              </div>
            </div>
              
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button 
                onClick={onClose}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                      Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
