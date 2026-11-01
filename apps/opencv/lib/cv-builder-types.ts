/**
 * The document model now lives in @brionmario/opencv-core, so that anything
 * outside the browser works against the same definitions the editor does.
 *
 * This file stays as the app's import path for them: every component reaches
 * the model through "@/lib/cv-builder-types", and pointing that at the
 * package is cheaper and less error-prone than rewriting the imports.
 */
export * from "@brionmario/opencv-core";

/**
 * What an inline edit can write into the document.
 *
 * A field edit carries text; a repeated field, such as an experience entry's
 * highlights, carries the whole replacement array; the language proficiency
 * dots carry a rating. `undefined` clears an optional field, which is how
 * "remove photo" is written. Nothing else reaches updateField.
 */
export type FieldValue = string | number | boolean | string[] | undefined;
