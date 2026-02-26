"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Send,
} from "lucide-react";
import { useState } from "react";

import { AddModuleModal } from "@/components/academy/AddModuleModal";
import { SuggestCourseModal } from "@/components/academy/SuggestCourseModal";

// Type definitions
type Lesson = {
  id: number;
  title: string;
  duration: string;
  completed: boolean;
  isActive?: boolean;
  locked?: boolean;
};

type Module = {
  id: number;
  title: string;
  description: string;
  image: string;
  progress: number;
  lessons: Lesson[];
};

// Mock data
const modules: Module[] = [
  {
    id: 1,
    title: "Foundations & Goals",
    description: "Start your journey by setting clear objectives and understanding the core principles of effective language learning. This module covers the essential mindset changes required for success.",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1000&auto=format&fit=crop",
    progress: 100,
    lessons: [
      { id: 1, title: "Introduction", duration: "10 min", completed: true },
      { id: 2, title: "Setting Goals", duration: "15 min", completed: true },
      { id: 3, title: "Vocabulary", duration: "20 min", completed: true },
    ],
  },
  {
    id: 2,
    title: "Conversation Basics",
    description: "Master the art of small talk and introductions. Learn how to confidently start conversations in professional settings and keep them going with active listening techniques.",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1000&auto=format&fit=crop",
    progress: 66,
    lessons: [
      { id: 4, title: "Greetings", duration: "12 min", completed: true },
      { id: 5, title: "Small Talk", duration: "18 min", completed: true },
      { id: 6, title: "Active Listening", duration: "22 min", completed: false, isActive: true },
    ],
  },
  {
    id: 3,
    title: "Business English",
    description: "Dive into the world of corporate communication. From writing professional emails to delivering impactful presentations, this module equips you with the tools for the office.",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1000&auto=format&fit=crop",
    progress: 40,
    lessons: [
      { id: 7, title: "Email Writing", duration: "25 min", completed: true },
      { id: 8, title: "Meeting Vocab", duration: "20 min", completed: true },
      { id: 9, title: "Presentations", duration: "30 min", completed: false },
    ],
  },
  {
    id: 4,
    title: "Advanced Topics",
    description: "Refine your skills with complex idioms, cultural nuances, and advanced negotiation tactics. Perfect for those looking to reach near-native fluency levels.",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000&auto=format&fit=crop",
    progress: 0,
    lessons: [
      { id: 10, title: "Idioms", duration: "18 min", completed: false, locked: true },
      { id: 11, title: "Cultural Nuances", duration: "25 min", completed: false, locked: true },
    ],
  },
];

export default function AcademyPage() {
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  
  // Suggestion State
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [suggestingModule, setSuggestingModule] = useState<Module | null>(null);

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setIsAddModuleOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModuleOpen(false);
    setEditingModule(null);
  };

  const handleSuggest = (module: Module) => {
    setSuggestingModule(module);
    setIsSuggestOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">
            Academy Modules
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage course content and lessons
          </p>
        </div>
        <button
          onClick={() => setIsAddModuleOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary/90 active:scale-95"
        >
          <BookOpen className="h-5 w-5" />
          Create Module
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module, index) => (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg"
          >
            <div className="relative h-48 w-full overflow-hidden bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={module.image}
                alt={module.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/0" />
              <div className="absolute top-4 right-4 flex gap-2">
                <button 
                  onClick={() => handleSuggest(module)}
                  className="rounded-lg bg-white/90 p-2 text-gray-700 shadow-sm hover:text-brand-primary"
                  title="Suggest to Student"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-start justify-between">
                <h4 className="font-display text-lg font-bold text-brand-primary">
                  {module.title}
                </h4>
                <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-600">
                  {module.lessons.length} Lessons
                </span>
              </div>
              
              <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                {module.description}
              </p>

              <div className="mt-6 flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleEditModule(module)}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:border-brand-primary hover:text-brand-primary transition-colors"
                >
                  Edit Content
                </button>
                <button className="flex-1 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <AddModuleModal
        isOpen={isAddModuleOpen}
        onClose={handleCloseModal}
        initialData={editingModule}
      />
      
      <SuggestCourseModal
        isOpen={isSuggestOpen}
        onClose={() => setIsSuggestOpen(false)}
        moduleTitle={suggestingModule?.title || ""}
      />
    </div>
  );
}
