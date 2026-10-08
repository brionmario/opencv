"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { CVData, CVTheme } from "@/lib/cv-builder-types";
import type { LayoutType } from "@/lib/cv-layouts";
import { ProfessionalTemplate } from "./templates/professional";
import { ModernWysiwygTemplate } from "./templates/modern";
import { ClassicWysiwygTemplate } from "./templates/classic";
import { MinimalWysiwygTemplate } from "./templates/minimal";

const noop = () => {};

/** The templates are editors: they take a full set of mutation handlers. A
 *  preview supplies inert ones and blocks pointer events, so the same
 *  components that render the canvas also render the gallery — the preview
 *  can never drift from what you actually get. */
const INERT = {
  onUpdate: noop,
  onAddExperience: noop,
  onDeleteExperience: noop,
  onAddEducation: noop,
  onDeleteEducation: noop,
  onAddSkill: noop,
  onDeleteSkill: noop,
  onAddAward: noop,
  onDeleteAward: noop,
  onAddPublication: noop,
  onDeletePublication: noop,
  onAddReference: noop,
  onDeleteReference: noop,
  onAddSocialLink: noop,
  onDeleteSocialLink: noop,
  onAddLanguage: noop,
  onDeleteLanguage: noop,
  onPhotoUpload: noop,
  onDeleteCustomSection: noop,
  onUpdateCustomSectionTitle: noop,
  onAddCustomSectionItem: noop,
  onUpdateCustomSectionItem: noop,
  onDeleteCustomSectionItem: noop,
};

const A4_W = 210; // mm — the paper width every template is built against

function renderFor(layout: LayoutType, data: CVData, theme: CVTheme) {
  const props = { data, theme, ...INERT };
  switch (layout) {
    case "modern":  return <ModernWysiwygTemplate {...props} />;
    case "classic": return <ClassicWysiwygTemplate {...props} />;
    case "minimal": return <MinimalWysiwygTemplate {...props} />;
    default:        return <ProfessionalTemplate {...props} />;
  }
}

/**
 * Renders a template at full A4 width and scales it down to whatever space it
 * is given, so the proportions stay true to the printed page at any size.
 */
export function TemplatePreview({
  layout,
  data,
  theme,
  className,
}: {
  layout: LayoutType;
  data: CVData;
  theme: CVTheme;
  className?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const paper = paperRef.current;
    if (!box || !paper) return;

    const fit = () => {
      const available = box.clientWidth;
      const natural = paper.scrollWidth || 1;
      const s = available / natural;
      setScale(s);
      setHeight(paper.scrollHeight * s);
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    ro.observe(paper);
    return () => ro.disconnect();
  }, [layout, data, theme]);

  return (
    <div ref={boxRef} className={className} style={{ width: "100%", overflow: "hidden" }}>
      <div style={{ height: height ?? undefined, position: "relative" }}>
        <div
          ref={paperRef}
          aria-hidden="true"
          style={{
            width: `${A4_W}mm`,
            background: theme.backgroundColor,
            color: theme.bodyColor,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "absolute",
            top: 0,
            left: 0,
            // Inert: the gallery is for looking, not editing.
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {renderFor(layout, data, theme)}
        </div>
      </div>
    </div>
  );
}
