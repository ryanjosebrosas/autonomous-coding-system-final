# Product Requirements Document — Build Test Project

## Executive Summary

A minimal CLI utility that provides string transformation functions. Used solely to test the `/build` autonomous pipeline end-to-end.

## MVP Scope

Two capabilities:
1. A `reverse` function that reverses a string
2. A `capitalize` function that capitalizes the first letter of each word

## Tech Stack

- **Language**: TypeScript
- **Runtime**: Node.js
- **No package manager or test runner configured** — validation is manual

## Success Criteria

- Both functions exist in `src/strings.ts`
- Both functions have tests in `src/strings.test.ts`
