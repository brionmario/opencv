/**
 * @brionmario/opencv-core
 *
 * The parts of opencv that do not need a browser: the document model, the
 * section rules, the share-link codec and the interchange formats.
 *
 * The app imports these rather than keeping its own copies, so an agent
 * reading or writing a résumé outside the editor works against exactly the
 * same rules the editor enforces.
 */

export * from "./types.js";
export * from "./layouts.js";
export * from "./sections.js";
export * from "./starter-templates.js";
export * from "./share.js";
export * from "./json-resume.js";
