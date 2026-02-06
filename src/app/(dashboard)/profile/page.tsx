"use client";

import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  AlertTriangle,
  Crown,
  Edit,
  Save,
} from "lucide-react";
import { useState } from "react";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "Eugenia",
    lastName: "Rodríguez",
    email: "eugenia@example.com",
    phone: "+54 11 1234-5678",
    city: "Buenos Aires",
    country: "Argentina",
  });

  const userStats = {
    subscription: "High Ticket",
    memberSince: "January 2026",
    strikes: 1,
    maxStrikes: 3,
    strikeResetDate: "Feb 15, 2026",
    completedClasses: 24,
    completedLessons: 7,
    challengesCompleted: 15,
  };

  const handleSave = () => {
    setIsEditing(false);
    // Save logic here
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-brand-primary">
          My Profile
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Manage your personal information and account settings
        </p>
      </div>

      {/* Subscription & Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-gray-200 bg-linear-to-br from-brand-cyan-dark to-brand-cyan p-6 text-white shadow-lg"
        >
          <div className="mb-3 flex items-center justify-between">
            <Crown className="h-8 w-8" />
          </div>
          <p className="text-sm font-medium opacity-90">Subscription</p>
          <p className="mt-1 font-display text-2xl font-bold">
            {userStats.subscription}
          </p>
          <p className="mt-2 text-xs opacity-75">
            Member since {userStats.memberSince}
          </p>
        </motion.div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Classes Completed
              </p>
              <p className="mt-1 font-display text-3xl font-bold text-brand-primary">
                {userStats.completedClasses}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Lessons Viewed
              </p>
              <p className="mt-1 font-display text-3xl font-bold text-brand-primary">
                {userStats.completedLessons}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Challenges Completed
              </p>
              <p className="mt-1 font-display text-3xl font-bold text-brand-primary">
                {userStats.challengesCompleted}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Strikes Warning */}
      {userStats.strikes > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border-2 border-amber-200 bg-amber-50 shadow-sm"
        >
          <div className="bg-amber-100 px-6 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-700" />
              <span className="text-sm font-bold uppercase tracking-wider text-amber-900">
                Penalty Status
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-amber-900">
                  Accumulated Strikes
                </span>
                <span className="font-display text-lg font-bold text-amber-900">
                  {userStats.strikes} / {userStats.maxStrikes}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-amber-200">
                <div
                  className="h-full rounded-full bg-amber-600 transition-all"
                  style={{
                    width: `${(userStats.strikes / userStats.maxStrikes) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-white p-4">
              <Calendar className="h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-bold text-amber-900">
                  Strikes reset on: {userStats.strikeResetDate}
                </p>
                <p className="mt-1 text-xs text-amber-800">
                  If you accumulate {userStats.maxStrikes} strikes, your account will be
                  temporarily suspended. Cancel classes more than 24 hours in
                  advance to avoid penalties.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Personal Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-brand-primary">
            Personal Information
          </h2>
          {!isEditing ? (
            <motion.button
              onClick={() => setIsEditing(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 rounded-xl border-2 border-brand-cyan-dark bg-white px-4 py-2 text-sm font-bold text-brand-cyan-dark transition-all hover:bg-brand-cyan-dark hover:text-white"
            >
              <Edit className="h-4 w-4" />
              Edit
            </motion.button>
          ) : (
            <motion.button
              onClick={handleSave}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 rounded-xl bg-brand-cyan-dark px-4 py-2 text-sm font-bold text-white shadow-lg shadow-brand-cyan-dark/20 transition-all hover:bg-brand-cyan"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </motion.button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* First Name */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
              <User className="h-4 w-4 text-brand-cyan-dark" />
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              disabled={!isEditing}
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${
                isEditing
                  ? "border-gray-200 bg-white focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20"
                  : "border-gray-100 bg-gray-50 text-gray-700"
              }`}
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
              <User className="h-4 w-4 text-brand-cyan-dark" />
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              disabled={!isEditing}
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${
                isEditing
                  ? "border-gray-200 bg-white focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20"
                  : "border-gray-100 bg-gray-50 text-gray-700"
              }`}
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
              <Mail className="h-4 w-4 text-brand-cyan-dark" />
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              disabled={!isEditing}
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${
                isEditing
                  ? "border-gray-200 bg-white focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20"
                  : "border-gray-100 bg-gray-50 text-gray-700"
              }`}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
              <Phone className="h-4 w-4 text-brand-cyan-dark" />
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              disabled={!isEditing}
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${
                isEditing
                  ? "border-gray-200 bg-white focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20"
                  : "border-gray-100 bg-gray-50 text-gray-700"
              }`}
            />
          </div>

          {/* City */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
              <MapPin className="h-4 w-4 text-brand-cyan-dark" />
              City
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              disabled={!isEditing}
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${
                isEditing
                  ? "border-gray-200 bg-white focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20"
                  : "border-gray-100 bg-gray-50 text-gray-700"
              }`}
            />
          </div>

          {/* Country */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
              <Globe className="h-4 w-4 text-brand-cyan-dark" />
              Country
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) =>
                setFormData({ ...formData, country: e.target.value })
              }
              disabled={!isEditing}
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${
                isEditing
                  ? "border-gray-200 bg-white focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20"
                  : "border-gray-100 bg-gray-50 text-gray-700"
              }`}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
