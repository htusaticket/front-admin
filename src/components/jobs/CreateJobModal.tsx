"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Loader2, Briefcase, Trash2 } from "lucide-react";
import { useState, useId } from "react";

import { useModalLock } from "@/hooks/useModalLock";
import { useJobsStore } from "@/store/jobs";

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export function CreateJobModal({ isOpen, onClose }: CreateJobModalProps) {
  useModalLock(isOpen, onClose);
  const { createJob, isSaving } = useJobsStore();
  const uniqueId = useId();

  const [requirementIdCounter, setRequirementIdCounter] = useState(1);
  const [requirements, setRequirements] = useState<RequirementItem[]>([
    { id: `${uniqueId}-req-0`, value: "" },
  ]);

  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    oteMin: "",
    oteMax: "",
    revenue: "",
    type: "Setter",
    description: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
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
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const jobData = {
      title: formData.title.trim(),
      company: formData.company.trim(),
      location: formData.location.trim(),
      oteMin: formData.oteMin ? parseInt(formData.oteMin) : undefined,
      oteMax: formData.oteMax ? parseInt(formData.oteMax) : undefined,
      revenue: formData.revenue ? parseInt(formData.revenue) : undefined,
      type: formData.type,
      description: formData.description.trim(),
      requirements: requirements.map((r) => r.value).filter((r) => r.trim()),
      isActive: true,
    };

    const result = await createJob(jobData);
    if (result.success) {
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      company: "",
      location: "",
      oteMin: "",
      oteMax: "",
      revenue: "",
      type: "Full-time",
      description: "",
    });
    setRequirements([{ id: `${uniqueId}-req-reset-${Date.now()}`, value: "" }]);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
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
                  <Briefcase className="h-5 w-5 text-brand-primary" />
                </div>
                <h2 className="font-display text-lg font-bold text-gray-900">
                    Post New Job
                </h2>
              </div>
              <button
                onClick={handleClose}
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

              {/* Company & Location */}
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Location *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="e.g. Remote - Worldwide"
                    className={`w-full rounded-xl border p-3 text-sm outline-none transition-colors ${
                      errors.location
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 focus:border-brand-primary"
                    }`}
                  />
                  {errors.location && (
                    <p className="mt-1 text-xs text-red-500">{errors.location}</p>
                  )}
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
                      OTE Min ($)
                  </label>
                  <input
                    type="number"
                    value={formData.oteMin}
                    onChange={(e) => handleInputChange("oteMin", e.target.value)}
                    placeholder="45000"
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none transition-colors focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      OTE Max ($)
                  </label>
                  <input
                    type="number"
                    value={formData.oteMax}
                    onChange={(e) => handleInputChange("oteMax", e.target.value)}
                    placeholder="60000"
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none transition-colors focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Revenue ($)
                  </label>
                  <input
                    type="number"
                    value={formData.revenue}
                    onChange={(e) => handleInputChange("revenue", e.target.value)}
                    placeholder="1000000"
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none transition-colors focus:border-brand-primary"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Job Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe the job responsibilities and what makes this opportunity unique..."
                  rows={4}
                  className={`w-full rounded-xl border p-3 text-sm outline-none transition-colors resize-none ${
                    errors.description
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-200 focus:border-brand-primary"
                  }`}
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-500">{errors.description}</p>
                )}
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
                onClick={handleClose}
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
                      Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                      Create Job
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
