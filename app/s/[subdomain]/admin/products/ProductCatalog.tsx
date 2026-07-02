"use client";

/**
 * ProductCatalog — thin re-export of the shared Grainy products catalog.
 *
 * The implementation lives under components/cms/admin/catalog so the products,
 * collections, and inventory screens share one visual vocabulary (grainy.css +
 * grainy-ui primitives). Kept here so admin/products/page.tsx keeps its import.
 */

export { default } from "@/components/cms/admin/catalog/products-catalog";
