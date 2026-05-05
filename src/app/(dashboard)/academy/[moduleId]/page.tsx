"use client";

import {
  DndContext,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  Video,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  Clock,
  ChevronRight,
  ExternalLink,
  Eye,
  GripVertical,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";

import { AddLessonModal } from "@/components/academy/AddLessonModal";
import { AddSectionModal } from "@/components/academy/AddSectionModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAcademyStore, type Lesson, type Section } from "@/store/academy";
import { useAuthStore } from "@/store/auth";

interface SectionGroup {
  id: number | null; // null = virtual "Sin sección" bucket
  title: string | null;
  order: number;
  lessons: Lesson[];
}

const sectionKeyOf = (id: number | null) => (id === null ? "section:null" : `section:${id}`);
const lessonKey = (id: number) => `lesson:${id}`;

export default function ModuleDetailPage() {
  const params = useParams();
  const moduleId = Number(params.moduleId);

  const { user } = useAuthStore();
  const {
    selectedModule,
    isLoading,
    isSaving,
    error,
    fetchModuleById,
    updateLesson,
    deleteLesson,
    deleteSection,
    reorderLessons,
    reorderSections,
    clearSelectedModule,
  } = useAcademyStore();

  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [defaultSectionId, setDefaultSectionId] = useState<number | null>(null);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingSectionId, setDeletingSectionId] = useState<number | null>(null);
  const [confirmDeleteLesson, setConfirmDeleteLesson] = useState<Lesson | null>(null);
  const [confirmDeleteSection, setConfirmDeleteSection] = useState<Section | null>(null);

  // Local mirror used to apply optimistic moves on drop (kept in sync with
  // selectedModule via useEffect below). Ref mirror lets the drag handler
  // read the latest state without closure issues.
  const [localGroups, setLocalGroups] = useState<SectionGroup[]>([]);
  const localGroupsRef = useRef<SectionGroup[]>([]);

  // Source sectionId captured at drag-start. We can't trust
  // activeData.lesson.sectionId in handleDragEnd because handleDragOver
  // mutates the lesson object's sectionId for the optimistic visual move,
  // and useSortable's `data` reflects that mutated value.
  const dragSourceSectionIdRef = useRef<number | null | undefined>(undefined);

  // Track whether *something* is being dragged so we can highlight drop zones.
  const [draggingType, setDraggingType] = useState<"lesson" | "section" | null>(null);

  const isSuperAdmin = user?.role === "SUPERADMIN";

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (moduleId) fetchModuleById(moduleId);
    return () => clearSelectedModule();
  }, [moduleId, fetchModuleById, clearSelectedModule]);

  // Derive section groups from selectedModule. Real sections come from
  // selectedModule.sections; the virtual "No section" bucket (id=null) is
  // ALWAYS appended, even when empty, so the admin can drop lessons there
  // to detach them from any real section.
  const derivedGroups = useMemo<SectionGroup[]>(() => {
    if (!selectedModule) return [];
    const realSections: SectionGroup[] = (selectedModule.sections || []).map(s => ({
      id: s.id,
      title: s.title,
      order: s.order,
      lessons: [...(s.lessons || [])].sort((a, b) => a.order - b.order),
    }));
    const sorted = realSections.sort((a, b) => a.order - b.order);
    const orphans = (selectedModule.unsectionedLessons || [])
      .slice()
      .sort((a, b) => a.order - b.order);
    const maxOrder = sorted.reduce((max, s) => Math.max(max, s.order), 0);
    sorted.push({ id: null, title: null, order: maxOrder + 1, lessons: orphans });
    return sorted;
  }, [selectedModule]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalGroups(derivedGroups);
    localGroupsRef.current = derivedGroups;
  }, [derivedGroups]);

  // ------- DnD handlers -------

  const handleDragStart = useCallback((event: { active: { data: { current: unknown } } }) => {
    const data = event.active.data.current as
      | { type: "lesson"; lesson: Lesson }
      | { type: "section" }
      | undefined;
    if (data?.type === "lesson") {
      setDraggingType("lesson");
      // Snapshot the original sectionId so handleDragEnd can detect
      // cross-section moves regardless of optimistic mutations.
      dragSourceSectionIdRef.current = data.lesson.sectionId ?? null;
    } else if (data?.type === "section") {
      setDraggingType("section");
      dragSourceSectionIdRef.current = undefined;
    }
  }, []);

  const handleDragCancel = useCallback(() => {
    setDraggingType(null);
    dragSourceSectionIdRef.current = undefined;
    setLocalGroups(derivedGroups);
    localGroupsRef.current = derivedGroups;
  }, [derivedGroups]);

  // While dragging a lesson, mirror the move into the destination section so
  // the user can SEE the card sit in the new section before dropping. Only
  // moves cross-section; intra-section reorder happens on drop.
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeData = active.data.current as
        | { type: "lesson"; lesson: Lesson }
        | { type: "section" }
        | undefined;
      const overData = over.data.current as
        | { type: "lesson"; lesson: Lesson }
        | { type: "section"; sectionId: number | null }
        | undefined;

      if (!activeData || activeData.type !== "lesson" || !overData) return;

      const activeLessonId = activeData.lesson.id;
      const groups = localGroupsRef.current;
      const currentGroup = groups.find(g => g.lessons.some(l => l.id === activeLessonId));
      if (!currentGroup) return;

      let destSectionId: number | null;
      let destIndex: number;
      if (overData.type === "lesson") {
        const destGroup = groups.find(g => g.lessons.some(l => l.id === overData.lesson.id));
        if (!destGroup) return;
        destSectionId = destGroup.id;
        destIndex = destGroup.lessons.findIndex(l => l.id === overData.lesson.id);
      } else {
        destSectionId = overData.sectionId;
        const destGroup = groups.find(g => g.id === destSectionId);
        destIndex = destGroup ? destGroup.lessons.length : 0;
      }

      // Already in the destination — let SortableContext handle in-section reorder visuals.
      if (currentGroup.id === destSectionId) return;

      const next = groups.map(g => ({ ...g, lessons: [...g.lessons] }));
      const fromGroup = next.find(g => g.id === currentGroup.id);
      const toGroup = next.find(g => g.id === destSectionId);
      if (!fromGroup || !toGroup) return;

      const fromIdx = fromGroup.lessons.findIndex(l => l.id === activeLessonId);
      if (fromIdx === -1) return;
      const [moved] = fromGroup.lessons.splice(fromIdx, 1);
      if (!moved) return;

      const insertAt = Math.min(destIndex, toGroup.lessons.length);
      toGroup.lessons.splice(insertAt, 0, { ...moved, sectionId: destSectionId });

      setLocalGroups(next);
      localGroupsRef.current = next;
    },
    [],
  );

  // Resolve the section id and the index within that section's lessons for
  // a given drop target, reading from the canonical groups (not from any
  // optimistic state).
  const resolveDestination = useCallback(
    (
      groups: SectionGroup[],
      overData:
        | { type: "lesson"; lesson: Lesson }
        | { type: "section"; sectionId: number | null }
        | undefined,
    ): { sectionId: number | null; index: number } | null => {
      if (!overData) return null;
      if (overData.type === "section") {
        const dest = groups.find(g => g.id === overData.sectionId);
        return { sectionId: overData.sectionId, index: dest ? dest.lessons.length : 0 };
      }
      // overData.type === 'lesson' — find the group that contains the over lesson.
      const dest = groups.find(g => g.lessons.some(l => l.id === overData.lesson.id));
      if (!dest) return null;
      const idx = dest.lessons.findIndex(l => l.id === overData.lesson.id);
      return { sectionId: dest.id, index: idx };
    },
    [],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setDraggingType(null);
      const { active, over } = event;
      if (!over) return;

      const activeData = active.data.current as
        | { type: "lesson"; lesson: Lesson }
        | { type: "section" }
        | undefined;
      const overData = over.data.current as
        | { type: "lesson"; lesson: Lesson }
        | { type: "section"; sectionId: number | null }
        | undefined;

      if (!activeData) return;

      const groups = localGroupsRef.current;

      // ---- Section reorder ----
      if (activeData.type === "section") {
        if (!overData || overData.type !== "section") return;
        if (active.id === over.id) return;

        const realSectionIds = groups.filter(g => g.id !== null).map(g => g.id as number);
        const activeId = Number(String(active.id).replace("section:", ""));
        const overId = Number(String(over.id).replace("section:", ""));
        if (Number.isNaN(activeId) || Number.isNaN(overId)) return;

        const fromIdx = realSectionIds.indexOf(activeId);
        const toIdx = realSectionIds.indexOf(overId);
        if (fromIdx === -1 || toIdx === -1) return;

        const reorderedIds = arrayMove(realSectionIds, fromIdx, toIdx);
        // Optimistic: reorder visually before the round-trip.
        const reorderedGroups = reorderedIds
          .map(id => groups.find(g => g.id === id))
          .filter((g): g is SectionGroup => Boolean(g));
        const virtual = groups.find(g => g.id === null);
        const next = virtual ? [...reorderedGroups, virtual] : reorderedGroups;
        setLocalGroups(next);
        localGroupsRef.current = next;

        await reorderSections(moduleId, reorderedIds);
        return;
      }

      // ---- Lesson reorder / move ----
      if (activeData.type !== "lesson") return;

      const activeLesson = activeData.lesson;
      // Use the snapshot taken at drag-start. activeLesson.sectionId is
      // unreliable here because handleDragOver mutates it during cross-section
      // optimistic moves, and useSortable's `data.current` reflects that.
      const sourceSectionId =
        dragSourceSectionIdRef.current === undefined
          ? activeLesson.sectionId ?? null
          : dragSourceSectionIdRef.current;

      // Destination is taken from `over.data` resolved against the current
      // (possibly already-optimistic) groups so we get the right insertion idx.
      const dest = resolveDestination(groups, overData);
      if (!dest) return;

      const destGroupNow = groups.find(g => g.id === dest.sectionId);
      if (!destGroupNow) return;

      // ---- Same-section reorder ----
      if (dest.sectionId === sourceSectionId) {
        const ids = destGroupNow.lessons.map(l => l.id);
        const fromIdx = ids.indexOf(activeLesson.id);
        if (fromIdx === -1) return;
        const toIdx = overData?.type === "lesson" ? dest.index : ids.length - 1;
        if (fromIdx === toIdx) return;

        const reordered = arrayMove(ids, fromIdx, toIdx);
        const next = groups.map(g =>
          g.id === dest.sectionId
            ? {
              ...g,
              lessons: reordered
                .map(id => g.lessons.find(l => l.id === id))
                .filter((l): l is Lesson => Boolean(l)),
            }
            : g,
        );
        setLocalGroups(next);
        localGroupsRef.current = next;

        await reorderLessons(moduleId, reordered);
        return;
      }

      // ---- Cross-section move ----
      // handleDragOver already moved the lesson into destGroupNow optimistically,
      // so destGroupNow.lessons already contains activeLesson at the right idx.
      const destOrderedIds = destGroupNow.lessons.some(l => l.id === activeLesson.id)
        ? destGroupNow.lessons.map(l => l.id)
        : (() => {
          const arr = destGroupNow.lessons.map(l => l.id);
          arr.splice(Math.min(dest.index, arr.length), 0, activeLesson.id);
          return arr;
        })();

      const updateResult = await updateLesson(activeLesson.id, {
        sectionId: dest.sectionId,
      });
      if (!updateResult.success) return;

      if (destOrderedIds.length > 1) {
        await reorderLessons(moduleId, destOrderedIds);
      }

      dragSourceSectionIdRef.current = undefined;
    },
    [moduleId, reorderLessons, reorderSections, resolveDestination, updateLesson],
  );

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setDefaultSectionId(null);
    setIsAddLessonOpen(true);
  };

  const handleAddLessonInSection = (sectionId: number | null) => {
    setEditingLesson(null);
    setDefaultSectionId(sectionId);
    setIsAddLessonOpen(true);
  };

  const handleCloseLessonModal = () => {
    setIsAddLessonOpen(false);
    setEditingLesson(null);
    setDefaultSectionId(null);
  };

  const handleEditSection = (section: Section) => {
    setEditingSection(section);
    setIsAddSectionOpen(true);
  };

  const handleCloseSectionModal = () => {
    setIsAddSectionOpen(false);
    setEditingSection(null);
  };

  const handleDeleteLesson = (lesson: Lesson) => {
    if (!isSuperAdmin) return;
    setConfirmDeleteLesson(lesson);
  };

  const performDeleteLesson = async () => {
    if (!confirmDeleteLesson) return;
    setDeletingId(confirmDeleteLesson.id);
    await deleteLesson(confirmDeleteLesson.id);
    setDeletingId(null);
    setConfirmDeleteLesson(null);
  };

  const handleDeleteSection = (section: Section) => {
    if (!isSuperAdmin) return;
    setConfirmDeleteSection(section);
  };

  const performDeleteSection = async () => {
    if (!confirmDeleteSection) return;
    setDeletingSectionId(confirmDeleteSection.id);
    await deleteSection(confirmDeleteSection.id);
    setDeletingSectionId(null);
    setConfirmDeleteSection(null);
  };

  if (isLoading && !selectedModule) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (error && !selectedModule) {
    return (
      <div className="space-y-6">
        <Link
          href="/academy"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Academy
        </Link>

        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-red-200">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">Failed to load module</h3>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
          <button
            onClick={() => fetchModuleById(moduleId)}
            className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-brand-primary rounded-lg hover:bg-brand-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!selectedModule) {
    return (
      <div className="space-y-6">
        <Link
          href="/academy"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Academy
        </Link>

        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-200">
          <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">Module not found</h3>
          <p className="text-sm text-gray-500 mt-1">The module you&apos;re looking for doesn&apos;t exist</p>
        </div>
      </div>
    );
  }

  const totalLessons = (selectedModule.lessons || []).length;
  const sectionSortableIds = localGroups.map(g => sectionKeyOf(g.id));

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link href="/academy" className="font-semibold text-brand-cyan-dark hover:underline">
          Academy
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900">{selectedModule.title}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {selectedModule.image && (
            <div className="hidden sm:block h-20 w-32 rounded-xl overflow-hidden bg-gray-100 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedModule.image}
                alt={selectedModule.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">
              {selectedModule.title}
            </h1>
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{selectedModule.description}</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-500">
                {totalLessons} {totalLessons === 1 ? "lesson" : "lessons"}
              </span>
              {selectedModule.visibleForSkillBuilder && (
                <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                  Skill Builder
                </span>
              )}
              {selectedModule.visibleForSkillBuilderLive && (
                <span className="flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700">
                  SB Live
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/academy/${moduleId}/preview`}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Eye className="h-5 w-5" />
            Preview
          </Link>
          <button
            onClick={() => {
              setEditingSection(null);
              setIsAddSectionOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl border border-brand-primary/40 bg-brand-primary/10 px-4 py-2.5 text-sm font-bold text-brand-primary hover:bg-brand-primary/15 transition-colors"
          >
            <Layers className="h-5 w-5" />
            New Section
          </button>
          <button
            onClick={() => handleAddLessonInSection(null)}
            className="flex items-center gap-2 rounded-xl bg-brand-cyan-dark px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-cyan-dark/20 transition-all hover:bg-brand-cyan active:scale-95 shrink-0"
          >
            <Plus className="h-5 w-5" />
            New Lesson
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Sections / Lessons */}
      {localGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-200">
          <Video className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No lessons yet</h3>
          <p className="text-sm text-gray-500 mt-1">
            Create the first section or lesson for this module
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                setEditingSection(null);
                setIsAddSectionOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-primary border border-brand-primary rounded-lg hover:bg-brand-primary/5"
            >
              <Layers className="h-4 w-4" />
              Create Section
            </button>
            <button
              onClick={() => handleAddLessonInSection(null)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-cyan-dark border border-brand-cyan-dark rounded-lg hover:bg-brand-cyan-dark/5"
            >
              <Plus className="h-4 w-4" />
              Create Lesson
            </button>
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={sectionSortableIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {localGroups.map(group => (
                <SectionGroupBlock
                  key={sectionKeyOf(group.id)}
                  group={group}
                  isSuperAdmin={isSuperAdmin}
                  isSaving={isSaving}
                  deletingSectionId={deletingSectionId}
                  onEditSection={handleEditSection}
                  onDeleteSection={handleDeleteSection}
                  onAddLesson={handleAddLessonInSection}
                  isLessonDragging={draggingType === "lesson"}
                >
                  <SortableContext
                    items={group.lessons.map(l => lessonKey(l.id))}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {group.lessons.map((lesson, index) => (
                        <SortableLessonRow
                          key={lesson.id}
                          lesson={lesson}
                          index={index}
                          isSuperAdmin={isSuperAdmin}
                          isSaving={isSaving}
                          deletingId={deletingId}
                          onEdit={handleEditLesson}
                          onDelete={handleDeleteLesson}
                        />
                      ))}
                      {group.lessons.length === 0 && (
                        <p className="text-center text-sm text-gray-400 py-6 italic border border-dashed border-gray-200 rounded-xl">
                          Drag a lesson here to move it to this section.
                        </p>
                      )}
                    </div>
                  </SortableContext>
                </SectionGroupBlock>
              ))}
            </div>
          </SortableContext>

        </DndContext>
      )}

      <AddLessonModal
        isOpen={isAddLessonOpen}
        onClose={handleCloseLessonModal}
        moduleId={moduleId}
        initialData={editingLesson}
        defaultSectionId={defaultSectionId}
      />

      <AddSectionModal
        isOpen={isAddSectionOpen}
        onClose={handleCloseSectionModal}
        moduleId={moduleId}
        initialData={editingSection}
      />

      <ConfirmModal
        isOpen={Boolean(confirmDeleteLesson)}
        title="Delete lesson"
        description={
          confirmDeleteLesson
            ? `Are you sure you want to delete "${confirmDeleteLesson.title}"? This action can't be undone.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        isLoading={deletingId !== null}
        onConfirm={performDeleteLesson}
        onClose={() => setConfirmDeleteLesson(null)}
      />

      <ConfirmModal
        isOpen={Boolean(confirmDeleteSection)}
        title="Delete section"
        description={
          confirmDeleteSection
            ? `Delete section "${confirmDeleteSection.title}"? Its lessons will become unsectioned (they won't be deleted).`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        isLoading={deletingSectionId !== null}
        onConfirm={performDeleteSection}
        onClose={() => setConfirmDeleteSection(null)}
      />
    </div>
  );
}

interface SectionGroupBlockProps {
  group: SectionGroup;
  isSuperAdmin: boolean;
  isSaving: boolean;
  deletingSectionId: number | null;
  onEditSection: (section: Section) => void;
  onDeleteSection: (section: Section) => void;
  onAddLesson: (sectionId: number | null) => void;
  isLessonDragging: boolean;
  children: React.ReactNode;
}

function SectionGroupBlock({
  group,
  isSuperAdmin,
  isSaving,
  deletingSectionId,
  onEditSection,
  onDeleteSection,
  onAddLesson,
  isLessonDragging,
  children,
}: SectionGroupBlockProps) {
  const isVirtual = group.id === null;
  const sortableId = sectionKeyOf(group.id);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sortableId,
    disabled: isVirtual,
    data: { type: "section", sectionId: group.id },
  });

  // Droppable target for the body so lessons can be dropped on an empty section.
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `${sortableId}:body`,
    data: { type: "section", sectionId: group.id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  // Highlight the section when a lesson is being dragged so the user sees it as a drop target.
  const wrapperBorder = isOver
    ? "border-brand-cyan-dark ring-2 ring-brand-cyan-dark/30 bg-brand-cyan-dark/5"
    : isLessonDragging
      ? "border-brand-cyan-dark/40 bg-brand-cyan-dark/[0.02]"
      : isVirtual
        ? "border-dashed border-gray-300"
        : "border-gray-200";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border bg-white p-4 transition-all duration-150 ${wrapperBorder} ${
        isLessonDragging ? "shadow-sm" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {!isVirtual && (
            <button
              {...attributes}
              {...listeners}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing transition-colors shrink-0"
              title="Drag to reorder section"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <Layers
            className={`h-5 w-5 shrink-0 ${isVirtual ? "text-gray-300" : "text-brand-primary"}`}
          />
          <div className="min-w-0">
            <h3 className="font-display text-base font-bold text-gray-900 truncate">
              {isVirtual ? "No section" : group.title}
            </h3>
            <p className="text-xs text-gray-500">
              {group.lessons.length} {group.lessons.length === 1 ? "lesson" : "lessons"}
              {isVirtual && " · ungrouped lessons"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onAddLesson(group.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-cyan-dark border border-brand-cyan-dark/30 rounded-lg hover:bg-brand-cyan-dark/5 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Lesson
          </button>
          {!isVirtual && (
            <>
              <button
                onClick={() =>
                  onEditSection({
                    id: group.id as number,
                    moduleId: 0, // not used by edit (modal only updates title)
                    title: group.title || "",
                    order: group.order,
                    lessonsCount: group.lessons.length,
                    createdAt: "",
                    updatedAt: "",
                  })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg hover:border-brand-primary hover:text-brand-primary transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Edit
              </button>
              {isSuperAdmin && (
                <button
                  onClick={() =>
                    onDeleteSection({
                      id: group.id as number,
                      moduleId: 0,
                      title: group.title || "",
                      order: group.order,
                      lessonsCount: group.lessons.length,
                      createdAt: "",
                      updatedAt: "",
                    })
                  }
                  disabled={isSaving && deletingSectionId === group.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {isSaving && deletingSectionId === group.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Delete
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div ref={setDroppableRef} className="min-h-[60px]">
        {children}
      </div>
    </div>
  );
}

interface SortableLessonRowProps {
  lesson: Lesson;
  index: number;
  isSuperAdmin: boolean;
  isSaving: boolean;
  deletingId: number | null;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
}

function SortableLessonRow({
  lesson,
  index,
  isSuperAdmin,
  isSaving,
  deletingId,
  onEdit,
  onDelete,
}: SortableLessonRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lessonKey(lesson.id),
    data: { type: "lesson", lesson },
  });

  // dnd-kit drives transform/transition while dragging; avoid framer-motion
  // here because its `animate` prop overrides the `transform` style and the
  // card stays glued to its original position.
  void index;
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border ${
        isDragging
          ? "border-brand-cyan-dark ring-2 ring-brand-cyan-dark/30 shadow-2xl shadow-brand-cyan-dark/30 cursor-grabbing"
          : "border-gray-200 hover:border-brand-cyan-dark/30 hover:shadow-md transition-all"
      }`}
    >
      <div className="flex items-start gap-4">
        <button
          {...attributes}
          {...listeners}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing shrink-0 transition-colors"
          title="Drag to reorder or move between sections"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600 font-bold shrink-0">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 truncate">{lesson.title}</h4>
            {lesson.status === "DRAFT" && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                Draft
              </span>
            )}
            {lesson.status === "ARCHIVED" && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                Archived
              </span>
            )}
            {lesson.contentUrl && (
              <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                <Video className="h-3 w-3" />
                Video
              </span>
            )}
          </div>

          {lesson.description && (
            <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{lesson.description}</p>
          )}

          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              {lesson.duration}
              {!lesson.duration?.toString().includes("min") && " min"}
            </span>

            {lesson.resources && lesson.resources.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <FileText className="h-3 w-3" />
                {lesson.resources.length}{" "}
                {lesson.resources.length === 1 ? "resource" : "resources"}
              </span>
            )}

            {lesson.contentUrl && (
              <a
                href={lesson.contentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-brand-cyan-dark hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Watch video
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(lesson)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg hover:border-brand-primary hover:text-brand-primary transition-colors"
        >
          <Edit2 className="h-4 w-4" />
          Edit
        </button>
        {isSuperAdmin && (
          <button
            onClick={() => onDelete(lesson)}
            disabled={isSaving && deletingId === lesson.id}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {isSaving && deletingId === lesson.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

