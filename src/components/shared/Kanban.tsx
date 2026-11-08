import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type Announcements,
  type CollisionDetection,
} from "@dnd-kit/core";

/** Prefer the column under the pointer; fall back to overlap (keyboard dragging). */
export const pointerFirst: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length ? hits : rectIntersection(args);
};
import { cn } from "@/lib/utils";

export interface KanbanColumn {
  id: string;
  title: string;
  dot?: string;
  meta?: React.ReactNode;
  footer?: React.ReactNode;
}

export function useBoardSensors() {
  return useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] } }),
  );
}

export function Draggable({ id, children, className, label, onActivate }: { id: string; children: React.ReactNode; className?: string; label: string; onActivate?: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onActivate) {
          e.preventDefault();
          onActivate();
          return;
        }
        listeners?.onKeyDown?.(e);
      }}
      aria-roledescription="draggable card"
      aria-label={label}
      className={cn("touch-manipulation outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-ring/60", isDragging && "opacity-30", className)}
    >
      {children}
    </div>
  );
}

export function Droppable({ id, children, className, activeClassName }: { id: string; children: React.ReactNode; className?: string; activeClassName?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={cn(className, isOver && activeClassName)}>
      {children}
    </div>
  );
}

export function KanbanBoard<T extends { id: string }>({
  columns,
  items,
  getColumn,
  renderCard,
  onMove,
  itemLabel,
  onOpen,
  emptyText = "Drop here",
  columnWidth = 280,
}: {
  columns: KanbanColumn[];
  items: T[];
  getColumn: (item: T) => string;
  renderCard: (item: T, overlay?: boolean) => React.ReactNode;
  onMove: (itemId: string, columnId: string) => void;
  itemLabel: (item: T) => string;
  onOpen?: (item: T) => void;
  emptyText?: string;
  columnWidth?: number;
}) {
  const sensors = useBoardSensors();
  const [active, setActive] = useState<T | null>(null);
  const colName = (id: string | number | undefined) => columns.find((c) => c.id === id)?.title ?? "";
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${itemLabel(items.find((i) => i.id === active.id)!)}.`,
    onDragOver: ({ over }) => (over ? `Over ${colName(over.id)}.` : "Not over a column."),
    onDragEnd: ({ over }) => (over ? `Dropped in ${colName(over.id)}.` : "Dropped."),
    onDragCancel: () => "Cancelled.",
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerFirst}
      accessibility={{ announcements }}
      onDragStart={(e: DragStartEvent) => setActive(items.find((i) => i.id === e.active.id) ?? null)}
      onDragCancel={() => setActive(null)}
      onDragEnd={(e: DragEndEvent) => {
        setActive(null);
        if (e.over) onMove(String(e.active.id), String(e.over.id));
      }}
    >
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 scrollbar-thin md:-mx-8 md:px-8">
        {columns.map((col) => {
          const colItems = items.filter((i) => getColumn(i) === col.id);
          return (
            <section key={col.id} aria-label={col.title} className="flex shrink-0 flex-col" style={{ width: columnWidth }}>
              <header className="mb-2 flex items-center gap-2 px-1">
                {col.dot && <span className={cn("size-2 rounded-full", col.dot)} />}
                <h2 className="text-sm font-medium">{col.title}</h2>
                <span className="text-xs tabular text-muted-foreground">{colItems.length}</span>
                {col.meta && <span className="ml-auto text-xs tabular text-muted-foreground">{col.meta}</span>}
              </header>
              <Droppable
                id={col.id}
                className="flex min-h-[140px] flex-1 flex-col gap-2 rounded-lg border border-transparent bg-muted/40 p-1.5 transition-colors"
                activeClassName="border-primary/40 bg-primary/[0.06]"
              >
                {colItems.map((item) => (
                  <Draggable key={item.id} id={item.id} label={itemLabel(item)} onActivate={onOpen ? () => onOpen(item) : undefined}>
                    {renderCard(item)}
                  </Draggable>
                ))}
                {colItems.length === 0 && <p className="grid flex-1 place-items-center py-6 text-xs text-muted-foreground/70">{emptyText}</p>}
                {col.footer}
              </Droppable>
            </section>
          );
        })}
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
        {active ? <div className="rotate-[1.5deg] scale-[1.02] cursor-grabbing shadow-pop">{renderCard(active, true)}</div> : null}
      </DragOverlay>
    </DndContext>
  );
}
