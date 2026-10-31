"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { CVData, CVTheme } from "@/lib/cv-builder-types";
import type { LayoutType } from "@/lib/cv-layouts";
import { ProfessionalTemplate } from "./templates/professional";
import { ModernWysiwygTemplate } from "./templates/modern";
import { ClassicWysiwygTemplate } from "./templates/classic";
import { MinimalWysiwygTemplate } from "./templates/minimal";
import { ReadOnlyProvider } from "@/lib/cv-readonly";

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
 *
 * Two modes. The default is a thumbnail: inert, unselectable, hidden from
 * assistive tech, because the gallery shows four of them and they are
 * decoration for a choice made elsewhere. `asDocument` makes it the page's
 * actual content — the share view — where the text must be selectable,
 * copyable, reachable by a screen reader and crawlable, and links must work.
 */
export function TemplatePreview({
  layout,
  data,
  theme,
  className,
  asDocument = false,
}: {
  layout: LayoutType;
  data: CVData;
  theme: CVTheme;
  className?: string;
  asDocument?: boolean;
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
    <div
      ref={boxRef}
      className={[className, asDocument ? "cv-doc-fit" : null].filter(Boolean).join(" ")}
      style={{ width: "100%", overflow: "hidden" }}
    >
      <div className={asDocument ? "cv-doc-box" : undefined} style={{ height: height ?? undefined, position: "relative" }}>
        <div
          ref={paperRef}
          className={asDocument ? "cv-doc-page" : undefined}
          aria-hidden={asDocument ? undefined : "true"}
          data-cv-readonly="true"
          style={{
            width: `${A4_W}mm`,
            background: theme.backgroundColor,
            color: theme.bodyColor,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "absolute",
            top: 0,
            left: 0,
            // The gallery is for looking. A shared document is for reading,
            // so it keeps selection and lets its links be followed.
            pointerEvents: asDocument ? undefined : "none",
            userSelect: asDocument ? undefined : "none",
          }}
        >
          <ReadOnlyProvider>{renderFor(layout, data, theme)}</ReadOnlyProvider>
        </div>
      </div>
    </div>
  );
}
