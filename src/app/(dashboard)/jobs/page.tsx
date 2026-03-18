"use client";

import { motion } from "framer-motion";
import {
  Briefcase,
  DollarSign,
  MapPin,
  Building,
  Search,
  CheckCircle,
  Upload,
  Loader2,
  AlertCircle,
  Trash2,
  Plus,
  Pencil,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";

import { CreateJobModal } from "@/components/jobs/CreateJobModal";
import { EditJobModal } from "@/components/jobs/EditJobModal";
import { UploadJobsModal } from "@/components/jobs/UploadJobsModal";
import { Pagination } from "@/components/ui/Pagination";
import { useAuthStore } from "@/store/auth";
import { useJobsStore, type JobOffer } from "@/store/jobs";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

const formatSalary = (job: JobOffer): string => {
  if (job.salaryRange) return job.salaryRange;
  if (job.oteMin && job.oteMax) {
    return `$${job.oteMin.toLocaleString()} - $${job.oteMax.toLocaleString()}`;
  }
  if (job.oteMin) return `$${job.oteMin.toLocaleString()}`;
  if (job.oteMax) return `$${job.oteMax.toLocaleString()}`;
  return "No especificado";
};

export default function JobsPage() {
  const { user } = useAuthStore();
  const { 
    jobs, 
    isLoading, 
    isSaving, 
    error, 
    total,
    page: currentPage,
    totalPages,
    fetchJobs, 
    deleteJob, 
  } = useJobsStore();
  
  const [selectedJob, setSelectedJob] = useState<JobOffer | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [knownTypes, setKnownTypes] = useState<Set<string>>(new Set());
  const itemsPerPage = 12;
  
  const isSuperAdmin = user?.role === "SUPERADMIN";

  // Accumulate unique job types as jobs are loaded
  useEffect(() => {
    if (jobs.length > 0) {
      const newTypes = jobs.map(j => j.type).filter(Boolean);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setKnownTypes(prev => {
        const updated = new Set(prev);
        newTypes.forEach(t => updated.add(t));
        return updated.size !== prev.size ? updated : prev;
      });
    }
  }, [jobs]);

  // Build dynamic type filter options
  const typeOptions = useMemo(() => {
    const sorted = [...knownTypes].sort((a, b) => a.localeCompare(b));
    return [
      { value: "", label: "All Types" },
      ...sorted.map(t => ({ value: t, label: t })),
    ];
  }, [knownTypes]);

  const loadJobs = useCallback(() => {
    const params: Record<string, string | boolean | number> = {
      page,
      limit: itemsPerPage,
    };
    if (searchTerm) params.search = searchTerm;
    if (filterType) params.type = filterType;
    if (filterStatus !== "") params.isActive = filterStatus === "true";
    fetchJobs(params);
  }, [fetchJobs, searchTerm, filterType, filterStatus, page, itemsPerPage]);
  
  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Reset to page 1 when filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [searchTerm, filterType, filterStatus]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedJob(null);
  };
  
  useEffect(() => {
    if (jobs.length > 0 && !selectedJob) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedJob(jobs[0]);
    }
  }, [jobs, selectedJob]);

  // Keep selectedJob in sync with store data after edits
  useEffect(() => {
    if (selectedJob) {
      const updated = jobs.find(j => j.id === selectedJob.id);
      if (updated && updated !== selectedJob) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedJob(updated);
      }
    }
  }, [jobs, selectedJob]);
  
  const filteredJobs = jobs;
  
  const handleDeleteJob = async (jobId: number) => {
    if (!isSuperAdmin) return;
    
    if (confirm("¿Estás seguro de eliminar esta oferta de trabajo?")) {
      await deleteJob(jobId);
      if (selectedJob?.id === jobId) {
        setSelectedJob(jobs[0] || null);
      }
    }
  };

  const handleEditJob = (job: JobOffer) => {
    setSelectedJob(job);
    setIsEditModalOpen(true);
  };
  
  if (isLoading && jobs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-primary">
            Job Board Management
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Manage job postings and applications
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition-all hover:border-brand-primary/20 hover:bg-brand-primary/5 hover:text-brand-primary"
          >
            <Upload className="h-4 w-4" />
            Upload Offers
          </button>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-brand-primary/90 hover:shadow-lg hover:shadow-brand-primary/20"
          >
            <Plus className="h-4 w-4" />
            Post New Job
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Active Job Posts
              </p>
              <p className="mt-1 font-display text-3xl font-bold text-brand-primary">
                {total}
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-cyan-dark/10">
              <Briefcase className="h-7 w-7 text-brand-cyan-dark" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Applicants
              </p>
              <p className="mt-1 font-display text-3xl font-bold text-brand-primary">
                {jobs.reduce((acc, job) => acc + (job.applicationsCount || 0), 0)}
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-100">
              <CheckCircle className="h-7 w-7 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                New this Week
              </p>
              <p className="mt-1 font-display text-3xl font-bold text-brand-primary">
                {jobs.filter(j => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(j.createdAt) > weekAgo;
                }).length}
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-100">
              <Building className="h-7 w-7 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 outline-none transition-all focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20"
        >
          {typeOptions.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 outline-none transition-all focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-200">
          <Briefcase className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No hay ofertas de trabajo</h3>
          <p className="text-sm text-gray-500 mt-1">Crea o sube ofertas para comenzar</p>
        </div>
      ) : (
        <>
          {/* Job Board */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Job List */}
            <div className="space-y-4 lg:col-span-1">
              {filteredJobs.map((job) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedJob(job)}
                  className={`cursor-pointer rounded-2xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${
                    selectedJob?.id === job.id
                      ? "border-brand-cyan-dark"
                      : "border-gray-200"
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <h3 className="flex-1 font-bold text-brand-primary">
                      {job.title}
                    </h3>
                  </div>
                  <p className="mb-2 text-sm font-semibold text-gray-700">
                    {job.company}
                  </p>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5" />
                      {formatSalary(job)}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      {job.type}
                    </span>
                    <span className={`text-xs font-medium ${job.isActive ? "text-green-600" : "text-gray-400"}`}>
                      {job.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Job Detail */}
            {selectedJob && (
              <div className="lg:col-span-2">
                <motion.div
                  key={selectedJob.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        <h2 className="font-display text-2xl font-bold text-brand-primary">
                          {selectedJob.title}
                        </h2>
                        <p className="mt-1 text-lg font-semibold text-gray-700">
                          {selectedJob.company}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        selectedJob.isActive 
                          ? "bg-green-100 text-green-700" 
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {selectedJob.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{selectedJob.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span>{formatSalary(selectedJob)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        <span>{selectedJob.type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="mb-3 font-display text-lg font-bold text-brand-primary">
                Job Description
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedJob.description}
                    </p>

                    {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                      <div className="mt-6">
                        <h4 className="mb-2 font-bold text-brand-primary">
                  Requirements:
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-700">
                          {selectedJob.requirements.map((req) => (
                            <li key={req} className="flex items-start gap-2">
                              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleEditJob(selectedJob)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary/90"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit Listing
                    </button>
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleDeleteJob(selectedJob.id)}
                        disabled={isSaving}
                        className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-6 py-3 text-sm font-bold text-red-600 transition-all hover:bg-red-100 disabled:opacity-50"
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Delete
                      </button>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          totalItems={total}
        />
      )}

      <UploadJobsModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
      <CreateJobModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      <EditJobModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        job={selectedJob}
      />
    </div>
  );
}
