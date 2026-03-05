"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Search, Filter, Calendar, ShieldAlert, Loader2, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";

import { Pagination } from "@/components/ui/Pagination";
import api from "@/lib/api";

// Types
interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  adminName: string;
  action: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Action labels in Spanish
const actionLabels: Record<string, string> = {
  USER_CREATED: "Usuario creado",
  USER_APPROVED: "Usuario aprobado",
  USER_REJECTED: "Usuario rechazado",
  USER_SUSPENDED: "Usuario suspendido",
  USER_ACTIVATED: "Usuario activado",
  USER_DELETED: "Usuario eliminado",
  USER_UPDATED: "Usuario actualizado",
  USER_STRIKE_ISSUED: "Strike emitido",
  ADMIN_CREATED: "Admin creado",
  ADMIN_UPDATED: "Admin actualizado",
  ADMIN_DELETED: "Admin eliminado",
  SUBSCRIPTION_CREATED: "Suscripción creada",
  SUBSCRIPTION_UPDATED: "Suscripción actualizada",
  SUBSCRIPTION_CANCELLED: "Suscripción cancelada",
  SUBSCRIPTION_DELETED: "Suscripción eliminada",
  CLASS_CREATED: "Clase creada",
  CLASS_UPDATED: "Clase actualizada",
  CLASS_DELETED: "Clase eliminada",
  CLASS_ATTENDANCE_MARKED: "Asistencia marcada",
  MODULE_CREATED: "Módulo creado",
  MODULE_UPDATED: "Módulo actualizado",
  MODULE_DELETED: "Módulo eliminado",
  LESSON_CREATED: "Lección creada",
  LESSON_UPDATED: "Lección actualizada",
  LESSON_DELETED: "Lección eliminada",
  CHALLENGE_CREATED: "Desafío creado",
  CHALLENGE_UPDATED: "Desafío actualizado",
  CHALLENGE_DELETED: "Desafío eliminado",
  SUBMISSION_REVIEWED: "Envío revisado",
  JOB_CREATED: "Trabajo creado",
  JOB_UPDATED: "Trabajo actualizado",
  JOB_DELETED: "Trabajo eliminado",
  SYSTEM_CONFIG_UPDATED: "Configuración actualizada",
  LOGIN_SUCCESS: "Inicio de sesión",
  LOGIN_FAILED: "Login fallido",
};

// Action type categories
const actionTypes = [
  { value: "", label: "Todas las acciones" },
  { value: "USER_APPROVED", label: "Usuario aprobado" },
  { value: "USER_REJECTED", label: "Usuario rechazado" },
  { value: "USER_SUSPENDED", label: "Usuario suspendido" },
  { value: "USER_STRIKE_ISSUED", label: "Strike emitido" },
  { value: "SUBSCRIPTION_CREATED", label: "Suscripción creada" },
  { value: "CLASS_CREATED", label: "Clase creada" },
  { value: "MODULE_CREATED", label: "Módulo creado" },
  { value: "CHALLENGE_CREATED", label: "Desafío creado" },
  { value: "SUBMISSION_REVIEWED", label: "Envío revisado" },
];

// Action style based on type
const getActionStyle = (action: string) => {
  if (action.includes("DELETED") || action.includes("REJECTED") || action.includes("SUSPENDED") || action.includes("STRIKE")) {
    return "bg-red-50 text-red-700 border border-red-100";
  }
  if (action.includes("CREATED") || action.includes("APPROVED") || action.includes("ACTIVATED")) {
    return "bg-green-50 text-green-700 border border-green-100";
  }
  if (action.includes("UPDATED") || action.includes("REVIEWED")) {
    return "bg-blue-50 text-blue-700 border border-blue-100";
  }
  return "bg-gray-50 text-gray-700 border border-gray-100";
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 15;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, actionFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchLogs();
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      if (actionFilter) {
        params.append("action", actionFilter);
      }

      const response = await api.get<{ data: AuditLogsResponse }>(`/api/admin/audit-logs?${params.toString()}`);
      const data = response.data.data;
      
      setLogs(data?.logs || []);
      setTotalPages(data?.totalPages || 1);
      setTotalItems(data?.total || 0);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">
            Registro de Auditoría
          </h1>
          <p className="text-gray-500">
            Historial de acciones administrativas en el sistema.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por admin o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2 text-sm outline-none focus:border-brand-primary"
          />
        </div>

        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-100"
          >
            <Filter className="h-4 w-4" />
            <span>Filtrar</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
          
          {showFilters && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-gray-200 bg-white p-4 shadow-lg z-10">
              <label className="block text-xs font-bold text-gray-700 mb-2">Tipo de Acción</label>
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setShowFilters(false);
                }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-primary bg-white"
              >
                {actionTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {actionFilter && (
                <button
                  onClick={() => {
                    setActionFilter("");
                    setShowFilters(false);
                  }}
                  className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ShieldAlert className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500">No hay registros de auditoría</p>
            <p className="text-sm text-gray-400 mt-1">Los registros aparecerán cuando se realicen acciones en el sistema</p>
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Admin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Acción</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Objetivo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-xs">
                          {log.adminName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-900 block">{log.adminName}</span>
                          <span className="text-xs text-gray-500">{log.adminEmail}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${getActionStyle(log.action)}`}>
                        {(log.action.includes("DELETE") || log.action.includes("REJECT") || log.action.includes("SUSPEND") || log.action.includes("STRIKE")) && (
                          <ShieldAlert className="h-3 w-3" />
                        )}
                        {actionLabels[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.targetName || log.targetType || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(log.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.details && Object.keys(log.details).length > 0 ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-sm text-brand-primary font-medium hover:underline"
                        >
                          Ver detalles
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
            />
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div 
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Detalles del Registro</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Admin</label>
                <p className="text-sm text-gray-900">{selectedLog.adminName} ({selectedLog.adminEmail})</p>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Acción</label>
                <p className="text-sm text-gray-900">{actionLabels[selectedLog.action] || selectedLog.action}</p>
              </div>
              
              {selectedLog.targetName && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Objetivo</label>
                  <p className="text-sm text-gray-900">{selectedLog.targetName}</p>
                </div>
              )}
              
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Fecha</label>
                <p className="text-sm text-gray-900">
                  {format(new Date(selectedLog.createdAt), "dd 'de' MMMM yyyy 'a las' HH:mm:ss", { locale: es })}
                </p>
              </div>
              
              {selectedLog.ipAddress && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">IP</label>
                  <p className="text-sm text-gray-900">{selectedLog.ipAddress}</p>
                </div>
              )}
              
              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Datos adicionales</label>
                  <pre className="mt-1 text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-40 text-gray-700">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => setSelectedLog(null)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
