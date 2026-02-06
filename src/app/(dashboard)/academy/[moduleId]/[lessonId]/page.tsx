"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  ChevronRight,
  Download,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LessonPage({
  params,
}: {
  params: { moduleId: string; lessonId: string };
}) {
  const [isCompleted, setIsCompleted] = useState(false);

  const lesson = {
    id: params.lessonId,
    title: "Small Talk Techniques",
    moduleTitle: "Module 2: Conversation Basics",
    duration: "18 min",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    description:
      "Learn effective techniques to start and maintain casual conversations in English. This lesson covers common expressions, useful questions, and how to respond appropriately in different social contexts.",
    resources: [
      { name: "Lesson Transcript.pdf", size: "245 KB" },
      { name: "Small Talk Phrases.pdf", size: "180 KB" },
      { name: "Practice Exercises.pdf", size: "320 KB" },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link
          href="/academy"
          className="font-semibold text-brand-cyan-dark hover:underline"
        >
          Academy
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900">{lesson.moduleTitle}</span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900">{lesson.title}</span>
      </div>

      {/* Video Player */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
      >
        <div className="aspect-video w-full bg-black">
          <iframe
            src={lesson.videoUrl}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-brand-primary">
                {lesson.title}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {lesson.moduleTitle} • {lesson.duration}
              </p>
            </div>
            <button
              onClick={() => setIsCompleted(!isCompleted)}
              className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all ${
                isCompleted
                  ? "bg-green-100 text-green-700"
                  : "bg-brand-cyan-dark text-white shadow-lg shadow-brand-cyan-dark/20 hover:bg-brand-cyan"
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              {isCompleted ? "Completed" : "Mark as Viewed"}
            </button>
          </div>

          <div className="mt-6">
            <h2 className="font-display text-lg font-bold text-brand-primary">
              Description
            </h2>
            <p className="mt-2 text-gray-700 leading-relaxed">
              {lesson.description}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Resources */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-brand-cyan-dark" />
          <h2 className="font-display text-lg font-bold text-brand-primary">
            Downloadable Resources
          </h2>
        </div>
        <div className="space-y-3">
          {lesson.resources.map((resource, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all hover:border-brand-cyan-dark hover:bg-white"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                  <FileText className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-bold text-brand-primary">
                    {resource.name}
                  </p>
                  <p className="text-xs text-gray-500">{resource.size}</p>
                </div>
              </div>
              <button className="flex items-center gap-2 rounded-lg bg-brand-cyan-dark px-4 py-2 text-sm font-bold text-white transition-all hover:bg-brand-cyan">
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/academy"
          className="flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-5 py-3 text-sm font-bold text-brand-primary transition-all hover:border-gray-300 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous Lesson
        </Link>
        <Link
          href="/academy"
          className="flex items-center gap-2 rounded-xl bg-brand-cyan-dark px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-cyan-dark/20 transition-all hover:bg-brand-cyan"
        >
          Next Lesson
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
