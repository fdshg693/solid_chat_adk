---
trigger: always_on
glob: "*"
description: "Project overview of Ultraviolet AI Chat - SolidJS + TypeScript ADK MVP"
---

# Ultraviolet AI Chat — SolidJS + TypeScript ADK MVP Overview

## Core System Architecture

This project is an AI Chat application built with a dual-process architecture:
1. **Frontend**: Built with **SolidJS** and **TypeScript** (using Vite).
   - Designed using custom **Obsidian Dark & Ultraviolet styling** (translucent glassmorphism, glowing borders, custom scrollbar tracks, floating input wrappers, bouncing typing indicators).
   - Manages conversational state using SolidJS signals.
   - Persists the user's Gemini API key and active chat histories/session IDs inside the browser's `LocalStorage`.
2. **Backend**: A lightweight **Node/Express** server (`server.ts`) running the server-side **Google Agent Development Kit (`@google/adk`)**.
   - Vite is configured to proxy all `/api/*` requests to this backend (running on port `3001`).
   - Uses `LlmAgent` and `InMemoryRunner` for conversational intelligence.
   - The user-supplied API key is sent dynamically with request payloads to authenticate API calls server-side.

## Directory Structure

- `dist/` - Built static client assets for production delivery.
- `public/` - Static public assets.
- `src/`
  - `assets/` - App asset directories.
  - `App.tsx` - Primary SolidJS frontend client.
  - `index.css` - Obsidian & Ultraviolet CSS design system.
  - `index.tsx` - SolidJS client mounter.
- `server.ts` - Express + TS backend instantiating the `@google/adk` agent.
- `package.json` - Unified scripts and dependencies.
- `tsconfig.json` - Main TypeScript configurations.
- `vite.config.ts` - Vite config with SolidJS plugin and API server proxy.
- `README.md` - Technical and setup documentation.

## Running the Application

1. **Installation**: Run `npm install` from the root directory.
2. **Launch Dev Servers**: Start both Vite frontend (`5173`) and Express backend (`3001`) concurrently using `npm run dev`.
3. **Build Client Assets**: Package optimized static serving using `npm run build`.

## State and API Integration

- **Dual-Process Motivation**: `@google/adk` is server-side and depends on Node APIs. Running a local Express backend avoids exposing API keys or relying on client-side polyfills.
- **Active Session Reset**: Sessions can be started fresh with a settings option in the UI, which resets the state and session IDs.
- **Customizable System Instructions**: Custom system instructions can be adjusted via a drawer settings interface in the client UI.
