# @bcgov/plugin-catalog-backend-module-bc-data-catalogue

This package is part of the BC Data Catalogue Backstage integration.

👉 **Refer to the main project README at the root of this repository for installation and configuration instructions.**

---

## Purpose

The `@bcgov/plugin-catalog-backend-module-bc-data-catalogue` package provides the backend integration with the BC Data Catalogue.

It is responsible for:

- fetching datasets from the BC Data Catalogue
- transforming them into Backstage entities
- registering entities such as:
  - `Dataset`
  - `API`
  - `System`
  - `Group`
  - `User`

---

## Usage

This package is intended to be registered as a backend module in Backstage:

```ts
backend.add(import('@bcgov/plugin-catalog-backend-module-bc-data-catalogue'));
```

---

## Notes

- This package is **not intended to be used in isolation**
- It depends on:
  - `@bcgov/plugin-catalog-common-bc-data-catalogue`
- It is designed to be used together with:
  - `@bcgov/catalog-dataset` (frontend UI)
- All setup, configuration, and environment details are documented in the root project README