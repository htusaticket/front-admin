"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Users,
  Loader2,
  Video,
  Pencil,
  Trash2,
  Link as LinkIcon,
  X,
  Check,
  Upload,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { AddClassModal } from "@/components/classes/AddClassModal";
import { AttendanceModal } from "@/components/classes/AttendanceModal";
import { UploadClassesModal } from "@/components/classes/UploadClassesModal";
import { useModalLock } from "@/hooks/useModalLock";
import { useClassesStore } from "@/store/classes";
import type { AdminClass, CreateClassPayload } from "@/types/admin";

const formatDateTime = (dateStr: string): { date: string; time: string; day: string } => {
  const date = new Date(dateStr);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  let day: string;
  if (date.toDateString() === now.toDateString()) {
    day = "Today";
  } else if (date.toDateString() === tomorrow.toDateString()) {
    day = "Tomorrow";
  } else {
    day = date.toLocaleDateString("en-US", { weekday: "long" });
  }
  
  return {
    date: date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }),
    time: `${date.getUTCHours().toString().padStart(2, "0")}:${date.getUTCMinutes().toString().padStart(2, "0")}`,
    day,
  };
};

const formatTimeRange = (start: string, end: string): string => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startTime = `${startDate.getUTCHours().toString().padStart(2, "0")}:${startDate.getUTCMinutes().toString().padStart(2, "0")}`;
  const endTime = `${endDate.getUTCHours().toString().padStart(2, "0")}:${endDate.getUTCMinutes().toString().padStart(2, "0")}`;
  return `${startTime} - ${endTime}`;
};

const hasClassStarted = (startTimeStr: string): boolean => {
  return new Date(startTimeStr) <= new Date();
};

export default function ClassesPage() {
  const { 
    classes, 
    isLoading, 
    error,
    fetchClasses,
    updateClass,
    deleteClass,
  } = useClassesStore();

  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [classTab, setClassTab] = useState<"upcoming" | "finished">("upcoming");
  const [attendanceClass, setAttendanceClass] = useState<{ id: number; title: string; date: string } | null>(null);
  const [editingClass, setEditingClass] = useState<AdminClass | null>(null);
  const [editForm, setEditForm] = useState({ title: "", meetLink: "", startTime: "", endTime: "", date: "", type: "REGULAR" as AdminClass["type"], capacityMax: "" as string, description: "", materialsLink: "" });
  const [recordingLinkClass, setRecordingLinkClass] = useState<number | null>(null);
  const [recordingLink, setRecordingLink] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Lock body scroll and escape for edit class modal
  useModalLock(!!editingClass, () => setEditingClass(null));

  useEffect(() => {
    fetchClasses({ limit: 50 });
  }, [fetchClasses]);

  const handleAttendanceClick = (classItem: typeof classes[0]) => {
    const { date } = formatDateTime(classItem.startTime);
    setAttendanceClass({ 
      id: classItem.id, 
      title: classItem.title, 
      date, 
    });
  };

  const handleEditClick = (session: AdminClass) => {
    const startDate = new Date(session.startTime);
    const endDate = new Date(session.endTime);
    setEditingClass(session);
    setEditForm({
      title: session.title,
      meetLink: session.meetLink || "",
      date: `${startDate.getUTCFullYear()}-${(startDate.getUTCMonth()+1).toString().padStart(2, "0")}-${startDate.getUTCDate().toString().padStart(2, "0")}`,
      startTime: `${startDate.getUTCHours().toString().padStart(2, "0")}:${startDate.getUTCMinutes().toString().padStart(2, "0")}`,
      endTime: `${endDate.getUTCHours().toString().padStart(2, "0")}:${endDate.getUTCMinutes().toString().padStart(2, "0")}`,
      type: session.type || "REGULAR",
      capacityMax: session.capacityMax != null ? String(session.capacityMax) : "",
      description: session.description && !session.description.startsWith("[RECORDING]") ? session.description : "",
      materialsLink: session.materialsLink || "",
    });
  };

  const handleEditSave = async () => {
    if (!editingClass) return;
    setIsSaving(true);
    const result = await updateClass(editingClass.id, {
      title: editForm.title,
      meetLink: editForm.meetLink || undefined,
      startTime: `${editForm.date}T${editForm.startTime}:00.000Z`,
      endTime: `${editForm.date}T${editForm.endTime}:00.000Z`,
      type: editForm.type,
      capacityMax: editForm.capacityMax ? parseInt(editForm.capacityMax) : undefined,
      description: editForm.description || undefined,
      materialsLink: editForm.materialsLink || undefined,
    } as Partial<CreateClassPayload>);
    setIsSaving(false);
    if (result.success) {
      toast.success("Class updated successfully");
      setEditingClass(null);
    } else {
      toast.error(result.message || "Error updating class");
    }
  };

  const handleCancelClass = async (session: AdminClass) => {
    if (!confirm(`Are you sure you want to delete "${session.title}"?`)) return;
    const result = await deleteClass(session.id);
    if (result.success) {
      toast.success("Class cancelled successfully");
    } else {
      toast.error(result.message || "Error cancelling class");
    }
  };

  const handleSaveRecordingLink = async (classId: number) => {
    setIsSaving(true);
    const result = await updateClass(classId, { description: `[RECORDING]${recordingLink}` } as never);
    setIsSaving(false);
    if (result.success) {
      toast.success("Recording link saved");
      setRecordingLinkClass(null);
      setRecordingLink("");
    } else {
      toast.error(result.message || "Error saving recording link");
    }
  };

  if (isLoading && classes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">
            Class Schedule
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage upcoming classes and workshops
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition-all hover:border-brand-primary/20 hover:bg-brand-primary/5 hover:text-brand-primary"
          >
            <Upload className="h-5 w-5" />
            Bulk Upload
          </button>
          <button
            onClick={() => setIsAddClassOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary/90 active:scale-95"
          >
            <Calendar className="h-5 w-5" />
            Schedule Class
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
        <button
          onClick={() => { setClassTab("upcoming"); setCurrentPage(1); }}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
            classTab === "upcoming"
              ? "bg-white text-brand-primary shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => { setClassTab("finished"); setCurrentPage(1); }}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
            classTab === "finished"
              ? "bg-white text-brand-primary shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Finished
        </button>
      </div>

      {/* Content */}
      {classes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No classes scheduled yet.</p>
          <button
            onClick={() => setIsAddClassOpen(true)}
            className="mt-4 text-brand-primary font-bold hover:underline"
          >
            Schedule your first class
          </button>
        </div>
      ) : (() => {
        const now = new Date();
        const filteredClasses = classes.filter((session) => {
          const endTime = new Date(session.endTime);
          return classTab === "finished" ? endTime < now : endTime >= now;
        });

        if (filteredClasses.length === 0) {
          return (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                {classTab === "finished" ? "No finished classes yet." : "No upcoming classes scheduled."}
              </p>
            </div>
          );
        }

        const totalPages = Math.ceil(filteredClasses.length / ITEMS_PER_PAGE);
        const paginatedClasses = filteredClasses.slice(
          (currentPage - 1) * ITEMS_PER_PAGE,
          currentPage * ITEMS_PER_PAGE,
        );

        return (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paginatedClasses.map((session, index) => {
                const { date, day } = formatDateTime(session.startTime);
                const timeRange = formatTimeRange(session.startTime, session.endTime);
                const isPast = new Date(session.endTime) < new Date();
                const classStarted = hasClassStarted(session.startTime);
            
                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-md border border-gray-100 ${
                      isPast ? "opacity-75" : ""
                    }`}
                  >
                    {/* Card Content */}
                    <div className="bg-brand-primary/5 p-5 pb-8">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`rounded-lg px-3 py-1 text-xs font-bold ${session.type === "WORKSHOP" ? "bg-purple-100 text-purple-700" : session.type === "WEBINAR" ? "bg-blue-100 text-blue-700" : session.type === "QA" ? "bg-amber-100 text-amber-700" : session.type === "MASTERCLASS" ? "bg-emerald-100 text-emerald-700" : "bg-brand-primary/10 text-brand-primary"}`}>
                          {session.type === "WORKSHOP" ? "Workshop" : session.type === "WEBINAR" ? "Webinar" : session.type === "QA" ? "Q&A" : session.type === "MASTERCLASS" ? "Masterclass" : "Class"}
                        </div>
                        {isPast && (
                          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">Finished</span>
                        )}
                      </div>
                      <h3 className="font-display text-lg font-bold text-gray-900 mb-1">
                        {session.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-medium text-brand-primary">{day}</span>
                        <span>•</span>
                        <span>{date}</span>
                      </div>
                    </div>

                    <div className="p-5 -mt-4 bg-white rounded-t-2xl relative">
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <Clock className="h-3 w-3" />
                        Time
                          </div>
                          <p className="font-semibold text-gray-700">{timeRange}</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <Users className="h-3 w-3" />
                        Capacity
                          </div>
                          <p className="font-semibold text-gray-700">
                            {session.enrolledCount}/{session.capacityMax || "∞"}
                          </p>
                        </div>
                      </div>

                      {session.meetLink && (
                        <a 
                          href={session.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mb-4 flex items-center gap-2 text-sm text-brand-primary hover:underline"
                        >
                          <Video className="h-4 w-4" />
                      Join Meeting
                        </a>
                      )}

                      {/* Card Actions */}
                      <div className="space-y-2">
                        {classStarted ? (
                          <button
                            onClick={() => handleAttendanceClick(session)}
                            className="w-full rounded-xl bg-gray-900 py-2.5 text-sm font-bold text-white transition-all hover:bg-gray-800"
                          >
                            {isPast ? "View Attendance" : "Take Attendance"}
                          </button>
                        ) : (
                          <div className="w-full rounded-xl bg-gray-100 py-2.5 text-sm font-bold text-gray-400 text-center cursor-not-allowed">
                        Attendance available when class starts
                          </div>
                        )}

                        {/* Recording Link */}
                        {isPast && (
                          recordingLinkClass === session.id ? (
                            <div className="flex gap-2">
                              <input
                                type="url"
                                placeholder="Paste recording URL..."
                                value={recordingLink}
                                onChange={(e) => setRecordingLink(e.target.value)}
                                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-primary"
                              />
                              <button onClick={() => handleSaveRecordingLink(session.id)} disabled={isSaving || !recordingLink} className="rounded-lg bg-green-600 p-2 text-white hover:bg-green-700 disabled:opacity-50">
                                <Check className="h-4 w-4" />
                              </button>
                              <button onClick={() => { setRecordingLinkClass(null); setRecordingLink(""); }} className="rounded-lg bg-gray-100 p-2 text-gray-500 hover:bg-gray-200">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setRecordingLinkClass(session.id);
                                // Pre-fill with existing recording URL if available
                                const existingRecording = session.description?.startsWith("[RECORDING]")
                                  ? session.description.replace("[RECORDING]", "")
                                  : "";
                                setRecordingLink(existingRecording);
                              }}
                              className={`w-full flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-bold transition-all ${
                                session.description?.startsWith("[RECORDING]")
                                  ? "border-green-200 bg-green-50 text-green-600 hover:border-green-400"
                                  : "border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:border-brand-primary hover:text-brand-primary"
                              }`}
                            >
                              <LinkIcon className="h-4 w-4" />
                              {session.description?.startsWith("[RECORDING]") ? "Edit Recording Link" : "Add Recording Link"}
                            </button>
                          )
                        )}

                        <div className="flex gap-3">
                          <button
                            onClick={() => handleEditClick(session)}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-bold text-gray-700 transition-all hover:border-brand-primary hover:text-brand-primary"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                        Edit
                          </button>
                          <button
                            onClick={() => handleCancelClass(session)}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 py-2.5 text-sm font-bold text-red-600 transition-all hover:bg-red-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                        Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                Previous
                </button>
                <span className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                Next
                </button>
              </div>
            )}
          </>
        );
      })()}
      
      <AddClassModal 
        isOpen={isAddClassOpen} 
        onClose={() => setIsAddClassOpen(false)} 
      />

      <UploadClassesModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
      
      <AttendanceModal 
        isOpen={!!attendanceClass} 
        onClose={() => setAttendanceClass(null)} 
        classId={attendanceClass?.id || 0}
        classTopic={attendanceClass?.title || ""}
        classDate={attendanceClass?.date || ""}
      />

      {/* Edit Class Modal */}
      {editingClass && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setEditingClass(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
              <h2 className="font-display text-lg font-bold text-gray-900">Edit Class</h2>
              <button onClick={() => setEditingClass(null)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Title</label>
                <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Type</label>
                  <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value as AdminClass["type"] })} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary">
                    <option value="REGULAR">Class</option>
                    <option value="WORKSHOP">Workshop</option>
                    <option value="WEBINAR">Webinar</option>
                    <option value="QA">Q&A</option>
                    <option value="MASTERCLASS">Masterclass</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Max Capacity</label>
                  <input type="number" min="0" placeholder="Unlimited" value={editForm.capacityMax} onChange={(e) => setEditForm({ ...editForm, capacityMax: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Date</label>
                <input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Start Time</label>
                  <input type="time" value={editForm.startTime} onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">End Time</label>
                  <input type="time" value={editForm.endTime} onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Meet Link</label>
                <input type="url" value={editForm.meetLink} onChange={(e) => setEditForm({ ...editForm, meetLink: e.target.value })} placeholder="https://meet.google.com/..." className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Materials Link</label>
                <input type="url" value={editForm.materialsLink} onChange={(e) => setEditForm({ ...editForm, materialsLink: e.target.value })} placeholder="https://drive.google.com/..." className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary" />
                <p className="mt-1 text-xs text-gray-400">Link to class materials (visible to students)</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Description</label>
                <textarea rows={3} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Optional class description..." className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-primary resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4 shrink-0">
              <button onClick={() => setEditingClass(null)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleEditSave} disabled={isSaving} className="flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-primary/90 disabled:opacity-50">
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Changes
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
