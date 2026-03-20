"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Loader2, Pencil, Trash2, Save } from "lucide-react";
import { useState, useEffect, useId } from "react";

import { useModalLock } from "@/hooks/useModalLock";
import { useJobsStore, type JobOffer } from "@/store/jobs";

interface EditJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobOffer | null;
}

interface RequirementItem {
  id: string;
  value: string;
}

const JOB_TYPES = [
  { value: "Setter", label: "Setter" },
  { value: "Closer", label: "Closer" },
  { value: "DM & Phone Setter", label: "DM & Phone Setter" },
  { value: "Full-time", label: "Full-time" },
  { value: "Part-time", label: "Part-time" },
  { value: "Contract", label: "Contract" },
];

export function EditJobModal({ isOpen, onClose, job }: EditJobModalProps) {
  useModalLock(isOpen, onClose);
  const { updateJob, isSaving } = useJobsStore();
  const uniqueId = useId();

  const [requirementIdCounter, setRequirementIdCounter] = useState(0);
  const [requirements, setRequirements] = useState<RequirementItem[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    company: "",
    oteMin: "",
    oteMax: "",
    revenue: "",
    type: "Setter",
    description: "",
    isActive: true,
    social: "",
    website: "",
    email: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when job changes - this is an intentional pattern
  // to sync external props with internal state for controlled form inputs
  useEffect(() => {
    if (job && isOpen) {
      // eslint-disable-next-line
      setFormData({
        title: job.title || "",
        company: job.company || "",
        oteMin: job.oteMin ? String(job.oteMin) : "",
        oteMax: job.oteMax ? String(job.oteMax) : "",
        revenue: job.revenue ? String(job.revenue) : "",
        type: job.type || "Setter",
        description: job.description || "",
        isActive: job.isActive ?? true,
        social: job.social || "",
        website: job.website || "",
        email: job.email || "",
      });

      const reqs = (job.requirements && job.requirements.length > 0)
        ? job.requirements.map((r, i) => ({ id: `${uniqueId}-req-${i}`, value: r }))
        : [{ id: `${uniqueId}-req-0`, value: "" }];
      setRequirements(reqs);
      setRequirementIdCounter(reqs.length);
      setErrors({});
    }
  }, [job, isOpen, uniqueId]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleRequirementChange = (id: string, value: string) => {
    setRequirements((prev) =>
      prev.map((req) => (req.id === id ? { ...req, value } : req)),
    );
  };

  const addRequirement = () => {
    setRequirements((prev) => [
      ...prev,
      { id: `${uniqueId}-req-${requirementIdCounter}`, value: "" },
    ]);
    setRequirementIdCounter((prev) => prev + 1);
  };

  const removeRequirement = (id: string) => {
    if (requirements.length > 1) {
      setRequirements((prev) => prev.filter((req) => req.id !== id));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.company.trim()) newErrors.company = "Company is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !job) return;

    const jobData = {
      title: formData.title.trim(),
      company: formData.company.trim(),
      oteMin: formData.oteMin ? parseInt(formData.oteMin) : undefined,
      oteMax: formData.oteMax ? parseInt(formData.oteMax) : undefined,
      revenue: formData.revenue ? parseInt(formData.revenue) : undefined,
      type: formData.type,
      description: formData.description.trim() || undefined,
      requirements: requirements.map((r) => r.value).filter((r) => r.trim()),
      isActive: formData.isActive,
      social: formData.social.trim() || undefined,
      website: formData.website.trim() || undefined,
      email: formData.email.trim() || undefined,
    };

    const result = await updateJob(job.id, jobData);
    if (result.success) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-brand-primary/10 p-2">
                  <Pencil className="h-5 w-5 text-brand-primary" />
                </div>
                <h2 className="font-display text-lg font-bold text-gray-900">
                    Edit Job Listing
                </h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Job Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="e.g. Marketing Coordinator"
                  className={`w-full rounded-xl border p-3 text-sm outline-none transition-colors ${
                    errors.title
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-200 focus:border-brand-primary"
                  }`}
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-red-500">{errors.title}</p>
                )}
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Company *
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  placeholder="e.g. Digital Agency Plus"
                  className={`w-full rounded-xl border p-3 text-sm outline-none transition-colors ${
                    errors.company
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-200 focus:border-brand-primary"
                  }`}
                />
                {errors.company && (
                  <p className="mt-1 text-xs text-red-500">{errors.company}</p>
                )}
              </div>

              {/* Social / Website / Email */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Social Link
                  </label>
                  <input
                    type="text"
                    value={formData.social}
                    onChange={(e) => handleInputChange("social", e.target.value)}
                    placeholder="LinkedIn / Instagram URL"
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none transition-colors focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Website
                  </label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    placeholder="https://example.com"
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none transition-colors focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="contact@company.com"
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none transition-colors focus:border-brand-primary"
                  />
                </div>
              </div>

              {/* Job Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Job Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange("type", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none transition-colors focus:border-brand-primary"
                >
                  {JOB_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* OTE & Revenue */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      OTE Min
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.oteMin}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, "");
                        handleInputChange("oteMin", v);
                      }}
                      placeholder="45,000"
                      className="w-full rounded-xl border border-gray-200 p-3 pl-7 text-sm outline-none transition-colors focus:border-brand-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      OTE Max
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.oteMax}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, "");
                        handleInputChange("oteMax", v);
                      }}
                      placeholder="60,000"
                      className="w-full rounded-xl border border-gray-200 p-3 pl-7 text-sm outline-none transition-colors focus:border-brand-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Revenue
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.revenue}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, "");
                        handleInputChange("revenue", v);
                      }}
                      placeholder="1,000,000"
                      className="w-full rounded-xl border border-gray-200 p-3 pl-7 text-sm outline-none transition-colors focus:border-brand-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange("isActive", e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-primary peer-checked:after:translate-x-full peer-checked:after:border-white" />
                </label>
                <span className="text-sm font-semibold text-gray-700">
                    Active listing
                </span>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Job Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe the job responsibilities..."
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none transition-colors resize-none focus:border-brand-primary"
                />
              </div>

              {/* Requirements */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-gray-700">
                      Requirements
                  </label>
                  <button
                    type="button"
                    onClick={addRequirement}
                    className="flex items-center gap-1 text-xs font-semibold text-brand-primary hover:text-brand-primary/80"
                  >
                    <Plus className="h-3.5 w-3.5" />
                      Add Requirement
                  </button>
                </div>
                <div className="space-y-2">
                  {requirements.map((req, index) => (
                    <div key={req.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={req.value}
                        onChange={(e) => handleRequirementChange(req.id, e.target.value)}
                        placeholder={`Requirement ${index + 1}`}
                        className="flex-1 rounded-xl border border-gray-200 p-3 text-sm outline-none transition-colors focus:border-brand-primary"
                      />
                      {requirements.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRequirement(req.id)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                onClick={onClose}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                  Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-brand-primary/90 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                      Save Changes
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
