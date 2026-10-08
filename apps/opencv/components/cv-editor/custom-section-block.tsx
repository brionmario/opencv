"use client";

import { X as XIcon, Trash2 } from "lucide-react";
import type { CustomSection } from "@/lib/cv-builder-types";
import { InlineEditor } from "./inline-editor";
import { EditableCard, AddItemButton } from "./editable-card";

interface CustomSectionBlockProps {
  section: CustomSection;
  onUpdateTitle: (title: string) => void;
  onAddItem: () => void;
  onUpdateItem: (itemId: string, field: "title" | "subtitle" | "meta" | "description", value: string) => void;
  onDeleteItem: (itemId: string) => void;
  onDeleteSection: () => void;
  /** Outer wrapper — matches each template's section spacing convention. */
  wrapClassName?: string;
  /** Wraps the heading (usually carries the bottom-border/divider). */
  headingWrapClassName?: string;
  headingClassName?: string;
  itemListClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  metaClassName?: string;
  descClassName?: string;
  addLabel?: string;
}

/**
 * Renders a user-defined section — title/subtitle/meta/description entries,
 * the same shape every built-in list section (education, awards,
 * publications, ...) already uses. Shared across all four templates so a
 * custom section looks native to whichever template it's rendered in, via
 * the className tokens each template passes in.
 */
export function CustomSectionBlock({
  section,
  onUpdateTitle,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onDeleteSection,
  wrapClassName = "relative group/section",
  headingWrapClassName = "mb-2 pb-1 border-b-2 border-pink-600",
  headingClassName = "font-bold text-gray-900 uppercase tracking-wide",
  itemListClassName = "space-y-3 mt-2",
  titleClassName = "font-bold text-gray-900 text-sm",
  subtitleClassName = "text-pink-600 font-medium text-sm",
  metaClassName = "text-xs text-gray-500 mt-0.5",
  descClassName = "text-xs text-gray-600 mt-1",
  addLabel = "item",
}: CustomSectionBlockProps) {
  return (
    <div className={wrapClassName}>
      <div className={`${headingWrapClassName} flex items-center justify-between group/heading`}>
        <InlineEditor
          value={section.title}
          onChange={onUpdateTitle}
          placeholder="Section Title"
          className={headingClassName}
        />
        <button
          onClick={onDeleteSection}
          title="Remove section"
          className="text-red-400 hover:text-red-600 opacity-0 group-hover/heading:opacity-100 transition-opacity print:hidden shrink-0 ml-2"
        >
          <Trash2 size={13} />
        </button>
      </div>
      <div className={itemListClassName}>
        {section.items.map((item) => (
          <EditableCard key={item.id} onDelete={() => onDeleteItem(item.id)}>
            <h3 className={titleClassName}>
              <InlineEditor
                value={item.title}
                onChange={(v) => onUpdateItem(item.id, "title", v)}
                placeholder="Title"
                className={titleClassName}
              />
            </h3>
            <div className={subtitleClassName}>
              <InlineEditor
                value={item.subtitle || ""}
                onChange={(v) => onUpdateItem(item.id, "subtitle", v)}
                placeholder="Subtitle"
                className={subtitleClassName}
              />
            </div>
            <div className={metaClassName}>
              <InlineEditor
                value={item.meta || ""}
                onChange={(v) => onUpdateItem(item.id, "meta", v)}
                placeholder="Date / location"
                className={metaClassName}
              />
            </div>
            <div className={descClassName}>
              <InlineEditor
                value={item.description || ""}
                onChange={(v) => onUpdateItem(item.id, "description", v)}
                placeholder="Description..."
                richText
                className={descClassName}
              />
            </div>
          </EditableCard>
        ))}
      </div>
      <AddItemButton onAdd={onAddItem} label={addLabel} />
    </div>
  );
}
