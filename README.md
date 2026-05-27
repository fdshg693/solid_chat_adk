# Ultraviolet AI Chat — SolidJS + TypeScript ADK MVP

This is a premium AI Chat application built with **SolidJS** and **TypeScript** as a client-side frontend, connected to a lightweight **Node/Express** backend running the server-side **Google Agent Development Kit (`@google/adk`)**.

## Features

- **Obsidian Dark & Ultraviolet styling**: A high-fidelity CSS design featuring beautiful translucent glassmorphism elements, glowing borders, custom scrollbar tracks, floating input wrappers, and smooth bouncing typing indicators.
- **Agent Development Kit (`@google/adk`) integration**: Runs a server-side `LlmAgent` and `InMemoryRunner` for conversational intelligence.
- **LocalStorage API Key Persistence**: The Gemini API key is securely entered by the user in the browser and stored locally. It is sent as a payload in every query to dynamically authenticate requests on the Express server.
- **Customizable System Instructions**: Fine-tune the agent's persona directly from the settings drawer in the UI!
- **Active Session Reset**: Start a clean session thread instantly with the `New Session` button.

## Directory Structure

```text
solid_chat_adk/
├── dist/               # Built static client assets for production delivery
├── public/             # Static public assets
├── src/
│   ├── assets/         # App asset directories
│   ├── App.tsx         # Primary SolidJS frontend client
│   ├── index.css       # Obsidian & Ultraviolet CSS design system
│   └── index.tsx       # SolidJS client mounter
├── server.ts           # Express + TS backend instantiating the @google/adk agent
├── package.json        # Unified scripts and project dependencies
├── tsconfig.json       # Main TypeScript configurations
├── vite.config.ts      # Vite config with SolidJS plugin and API server proxy
└── README.md           # This document
```

## Running the Application

### 1. Installation

From the root repository directory, navigate into this app folder and install all required node modules:

```powershell
cd apps/solid_chat_adk
npm install
```

### 2. Launch Development Servers

Start both the Vite frontend server (port `5173`) and Express TypeScript backend (port `3001`) concurrently:

```powershell
npm run dev
```

Open `http://localhost:5173` in your browser.

### 3. Build Client Assets (Optional)

To bundle the frontend application for optimized static serving:

```powershell
npm run build
```

This will run TypeScript type checking and outputs the bundled files inside the `dist/` directory.

## Architectural Notes

- **Why a dual-process design?** The `@google/adk` SDK is server-side and depends on Node APIs. To safely execute it without exposing API keys or relying on client-side polyfills, we run a small local Express backend on port `3001`. Vite is configured to proxy all `/api/*` calls from the browser to the Express server.
- **State Management**: Conversational state is handled dynamically by SolidJS signals. Chat histories are cached in the browser's `LocalStorage` corresponding to unique active `Session IDs`, allowing persistent context across browser refreshes.
