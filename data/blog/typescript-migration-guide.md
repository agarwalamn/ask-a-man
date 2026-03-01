---
title: "Migrating 200k Lines of JavaScript to TypeScript: A Practical Guide"
date: "2022-09-20"
slug: "typescript-migration-guide"
tags: ["TypeScript", "JavaScript", "Migration", "Engineering"]
excerpt: "How we migrated StartupXYZ's entire codebase from JavaScript to TypeScript without halting feature development."
---

# Migrating 200k Lines of JavaScript to TypeScript: A Practical Guide

At StartupXYZ, we had a growing JavaScript codebase that was becoming increasingly difficult to maintain. Runtime type errors were our #1 source of production bugs. Here's how we migrated to TypeScript without stopping feature work.

## The Strategy: Gradual, Not Big Bang

We rejected the "rewrite everything" approach. Instead, we adopted a gradual migration:

1. **Configure TypeScript in "loose" mode** — set `strict: false`, `allowJs: true`, and `noImplicitAny: false`. This lets `.ts` and `.js` files coexist.
2. **Rename files one module at a time** — starting with leaf modules (utilities, helpers) that have no dependencies.
3. **Add types incrementally** — each PR that touches a file must add types to the functions it modifies.
4. **Tighten the config over time** — once a module is fully typed, enable `strict` for that directory.

## The Results

After 6 months of gradual migration:

- 95% of files converted to TypeScript
- Runtime type errors dropped by 73%
- Developer onboarding time decreased by 40% (types serve as documentation)
- IDE autocomplete and refactoring became dramatically more reliable

## Key Lessons

**Start with your data models.** Defining interfaces for your API responses and database models gives you the biggest bang for your buck. Once your data shapes are typed, type errors propagate naturally through the codebase.

**Don't use `any` as an escape hatch.** It's tempting, but each `any` is a hole in your type safety net. Use `unknown` instead and narrow with type guards.

**Invest in shared type packages.** We created a `@company/types` package shared between frontend and backend. This eliminated an entire class of API contract bugs.

## Conclusion

TypeScript migration doesn't have to be all-or-nothing. The gradual approach let us maintain velocity while systematically improving code quality. The investment paid for itself within 3 months through reduced bug rates alone.
