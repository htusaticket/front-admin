"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Shield,
  Calendar,
  Edit2,
  Save,
  X,
  Lock,
  Loader2,
} from "lucide-react";
import { useState, useEffect, ChangeEvent } from "react";
import { toast } from "sonner";

import api from "@/lib/api";
import { useAuthStore } from "@/store";

interface ProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  avatar: string | null;
  role: string;
  status: string;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  SUPERADMIN: "Super Administrador",
  ADMIN: "Administrador",
  USER: "Usuario",
};

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"personal" | "security">("personal");
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    country: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      // Usar el endpoint de admin profile
      const response = await api.get<{ data: ProfileData }>("/api/admin/profile");
      const data = response.data.data;
      setProfileData(data);
      setFormData({
        firstName: data?.firstName || "",
        lastName: data?.lastName || "",
        email: data?.email || "",
        phone: data?.phone || "",
        city: data?.city || "",
        country: data?.country || "",
      });
    } catch (error) {
      toast.error("Error al cargar el perfil");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const response = await api.put<{ data: ProfileData }>("/api/admin/profile", formData);
      setProfileData(response.data.data);
      setUser({
        ...user!,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      setIsEditing(false);
      toast.success("Perfil actualizado correctamente");
    } catch (error) {
      toast.error("Error al actualizar el perfil");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      setSaving(true);
      await api.put("/api/admin/profile/password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Contraseña actualizada correctamente");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Error al cambiar la contraseña");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (profileData) {
      setFormData({
        firstName: profileData.firstName || "",
        lastName: profileData.lastName || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
        city: profileData.city || "",
        country: profileData.country || "",
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">
          No se pudo cargar el perfil. Por favor, intente de nuevo.
        </p>
      </div>
    );
  }

  const getInitials = () => {
    return `${profileData.firstName?.[0] || ""}${profileData.lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-500">
            Gestiona tu información personal y seguridad
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Summary Card */}
        <div className="md:col-span-1 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col items-center text-center">
            <div className="h-24 w-24 mb-4 rounded-full bg-brand-primary flex items-center justify-center text-white text-2xl font-bold">
              {profileData.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileData.avatar}
                  alt={profileData.firstName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                getInitials()
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {profileData.firstName} {profileData.lastName}
            </h2>
            <p className="text-sm text-gray-500 mb-2">
              {profileData.email}
            </p>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-brand-primary/10 text-brand-primary mb-4">
              <Shield className="w-3 h-3" />
              {roleLabels[profileData.role] || profileData.role}
            </span>
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="w-4 h-4 mr-1" />
              <span>
                Miembro desde{" "}
                {profileData.createdAt
                  ? format(new Date(profileData.createdAt), "MMMM yyyy", {
                    locale: es,
                  })
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Details Card */}
        <div className="md:col-span-2 bg-white rounded-xl border border-gray-200">
          {/* Tabs */}
          <div className="border-b border-gray-200 px-6 pt-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Información de la Cuenta</h3>
                <p className="text-sm text-gray-500">
                  Actualiza tu información personal y preferencias
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("personal")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === "personal"
                      ? "bg-brand-primary text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Personal
                </button>
                <button
                  onClick={() => setActiveTab("security")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === "security"
                      ? "bg-brand-primary text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Seguridad
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Personal Tab */}
            {activeTab === "personal" && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                      Editar
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                      >
                        <X className="h-4 w-4" />
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 disabled:opacity-50"
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Guardar
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <User className="w-4 h-4 mr-2" />
                      Nombre
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                      />
                    ) : (
                      <p className="text-sm py-2.5 px-4 bg-gray-50 rounded-xl text-gray-900">
                        {profileData.firstName || "-"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <User className="w-4 h-4 mr-2" />
                      Apellido
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                      />
                    ) : (
                      <p className="text-sm py-2.5 px-4 bg-gray-50 rounded-xl text-gray-900">
                        {profileData.lastName || "-"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                      {profileData.role === "SUPERADMIN" && isEditing && (
                        <span className="ml-2 text-xs text-brand-primary">(editable)</span>
                      )}
                    </label>
                    {isEditing && profileData.role === "SUPERADMIN" ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                      />
                    ) : (
                      <p className="text-sm py-2.5 px-4 bg-gray-50 rounded-xl text-gray-900">
                        {profileData.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <Phone className="w-4 h-4 mr-2" />
                      Teléfono
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                      />
                    ) : (
                      <p className="text-sm py-2.5 px-4 bg-gray-50 rounded-xl text-gray-900">
                        {profileData.phone || "-"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <MapPin className="w-4 h-4 mr-2" />
                      Ciudad
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                      />
                    ) : (
                      <p className="text-sm py-2.5 px-4 bg-gray-50 rounded-xl text-gray-900">
                        {profileData.city || "-"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <Globe className="w-4 h-4 mr-2" />
                      País
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setFormData({ ...formData, country: e.target.value })
                        }
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                      />
                    ) : (
                      <p className="text-sm py-2.5 px-4 bg-gray-50 rounded-xl text-gray-900">
                        {profileData.country || "-"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Lock className="w-4 h-4 mr-2" />
                    Contraseña Actual
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Lock className="w-4 h-4 mr-2" />
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Lock className="w-4 h-4 mr-2" />
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
                  />
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={
                    saving ||
                    !passwordData.currentPassword ||
                    !passwordData.newPassword ||
                    !passwordData.confirmPassword
                  }
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-brand-primary text-white rounded-xl hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  Cambiar Contraseña
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
