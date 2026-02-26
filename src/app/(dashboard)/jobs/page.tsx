"use client";

import { motion } from "framer-motion";
import {
  Briefcase,
  DollarSign,
  MapPin,
  Building,
  Filter,
  Search,
  ExternalLink,
  CheckCircle,
  Upload,
} from "lucide-react";
import { useState } from "react";

import { UploadJobsModal } from "@/components/jobs/UploadJobsModal";
// Mock data
const jobOffers = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    company: "TechCorp Inc.",
    location: "Remote",
    salary: "$80k - $120k/year",
    type: "Full-time",
    description:
      "We're looking for an experienced Frontend Developer to join our team...",
  },
  {
    id: 2,
    title: "Customer Success Manager",
    company: "SaaS Solutions",
    location: "Hybrid - Buenos Aires",
    salary: "$50k - $70k/year",
    type: "Full-time",
    description:
      "Join our growing customer success team and help clients achieve their goals...",
  },
  {
    id: 3,
    title: "English Teacher (Online)",
    company: "Global Education",
    location: "Remote",
    salary: "$25 - $40/hour",
    type: "Part-time",
    applied: false,
    description: "Teach English to students worldwide from the comfort of your home...",
  },
  {
    id: 4,
    title: "Sales Representative",
    company: "Marketing Plus",
    location: "Remote",
    salary: "$60k - $90k/year",
    type: "Full-time",
    applied: false,
    description: "Drive sales growth and build relationships with key clients...",
  },
];

export default function JobsPage() {
  const [selectedJob, setSelectedJob] = useState(jobOffers[0]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

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
          <button className="flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-brand-primary/90 hover:shadow-lg hover:shadow-brand-primary/20">
            <Briefcase className="h-4 w-4" />
            Post New Job
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Active Job Posts
              </p>
              <p className="mt-1 font-display text-3xl font-bold text-brand-primary">
                4
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
                128
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
                5
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
            className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-brand-cyan-dark focus:ring-2 focus:ring-brand-cyan-dark/20"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex h-12 items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 text-sm font-semibold text-gray-700 transition-all hover:border-brand-cyan-dark hover:bg-gray-50"
        >
          <Filter className="h-4 w-4" />
          Filters
        </motion.button>
      </div>

      {/* Job Board */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Job List */}
        <div className="space-y-4 lg:col-span-1">
          {jobOffers.map((job) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedJob(job)}
              className={`cursor-pointer rounded-2xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${
                selectedJob.id === job.id
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
                  {job.salary}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  {job.type}
                </span>
                <span className="text-xs font-medium text-gray-500">
                  Active
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Job Detail */}
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
                <button className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors">
                  <ExternalLink className="h-4 w-4" />
                    View Public Page
                </button>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{selectedJob.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span>{selectedJob.salary}</span>
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

              <div className="mt-6">
                <h4 className="mb-2 font-bold text-brand-primary">
                  Requirements:
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    <span>Fluent English (C1 or higher)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    <span>2+ years of prior experience</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    <span>Exceptional communication skills</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                className="flex-1 rounded-xl bg-brand-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary/90"
              >
                Edit Listing
              </button>
              <button
                className="flex-1 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
              >
                Manage Applications (12)
              </button>
              <button
                className="rounded-xl border border-red-100 bg-red-50 px-6 py-3 text-sm font-bold text-red-600 transition-all hover:bg-red-100"
              >
                Close Job
              </button>
            </div>
          </motion.div>
        </div>
      </div>
      <UploadJobsModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
}
