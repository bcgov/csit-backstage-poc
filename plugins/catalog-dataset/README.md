# catalog-dataset

This package is part of the BC Data Catalogue Backstage integration.

👉 **Please refer to the main project README at the root of this repository for installation and usage instructions.**

This plugin is one part of a multi-package integration and is not intended to be used independently.

---

## Purpose

The `@bcgov/catalog-dataset` package provides the frontend UI for rendering `Dataset` entities in Backstage.

It is intended to be used from the Backstage **entity page**, not as a standalone route.

---

## How It Is Accessed

This plugin uses the Backstage entity context and is expected to be rendered through an entity page configuration such as:

```tsx
<EntitySwitch.Case if={isKind('dataset')} children={<CatalogDatasetPage />} />
```

In normal usage, users access this page by opening a `Dataset` entity from the Backstage catalog.

A direct route such as `/catalog-dataset` does **not** provide entity context and will fail unless additional context wiring is added.

---

## Local Development

This plugin can still be developed locally, but the standard Backstage usage is through a dataset entity in the catalog.

See the `./dev` directory for local plugin development setup.

---

## Notes

- This plugin depends on:
  - `@bcgov/plugin-catalog-common-bc-data-catalogue`
  - `@bcgov/plugin-catalog-backend-module-bc-data-catalogue`
- Always follow the main project README when adding this to a Backstage instance
- Do not document `/catalog-dataset` as the normal access path unless you intentionally add entity context for that route