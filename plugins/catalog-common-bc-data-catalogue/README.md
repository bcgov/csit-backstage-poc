# @bcgov/plugin-catalog-common-bc-data-catalogue

This package is part of the BC Data Catalogue Backstage integration.

👉 **Please refer to the main project README at the root of this repository for installation and usage instructions.**

This package is a shared library and is not intended to be used independently.

---

## Purpose

The `@bcgov/plugin-catalog-common-bc-data-catalogue` package provides shared types, utilities, and helpers used by the BC Data Catalogue Backstage integration.

It is used by:

- `@bcgov/plugin-catalog-backend-module-bc-data-catalogue` (backend ingestion)
- `@bcgov/catalog-dataset` (frontend dataset UI)

---

## What It Contains

This package includes:

- Dataset entity types and models
- Shared transformation logic
- OpenAPI parsing utilities
- Common helpers used across backend and frontend

---

## Usage

This package is consumed internally by the other BC Data Catalogue plugins and does not require direct configuration.

Install it only as part of the full integration.

---

## Notes

- Do not install or configure this package in isolation
- Always follow the main project README for setup instructions
- Changes to this package may impact both backend and frontend components