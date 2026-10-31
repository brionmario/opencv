/**
 * The document model now lives in @brionmario/opencv-core, so that anything
 * outside the browser works against the same definitions the editor does.
 *
 * This file stays as the app's import path for them: every component reaches
 * the model through "@/lib/cv-builder-types", and pointing that at the
 * package is cheaper and less error-prone than rewriting the imports.
 */
export * from "@brionmario/opencv-core";
