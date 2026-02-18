# 💻 Udagram Frontend

A modern, high-performance Single Page Application (SPA) built with **React 19**, **Vite**, and **Material UI**, designed for a premium user experience and seamless microservice integration.

---

## 🚀 Overview

The **Udagram Frontend** serves as the primary interface for the platform, providing a responsive and intuitive user journey. It is engineered with a focus on type safety, state management, and modern architectural patterns.

### 🌐 Live Application

- **URL**: [http://udagram.jandir.site](http://udagram.jandir.site)

### Key Features

- **Type-Safe Routing**: Implemented using **TanStack Router**, ensuring end-to-end type safety for routes and search parameters.
- **Robust State Management**: Powered by **React Query** for efficient server-state synchronization and **Zustand** for lightweight client-state management.
- **Modern UI/UX**: Built with **Material UI (MUI)**, featuring a glassmorphism design approach, smooth transitions, and a mobile-first responsive layout.
- **Secure Auth Flow**: Seamless integration with the User Microservice, handling JWT lifecycle and protected route logic.

---

## 🛠 Tech Stack & Technical Choices

| Technology          | Purpose          | Rationale                                                                                |
| :------------------ | :--------------- | :--------------------------------------------------------------------------------------- |
| **React 19**        | UI Library       | Leverages the latest concurrent features and improved hooks for a modern UI foundation.  |
| **Material UI**     | Component System | Industry-standard design system for consistent, accessible, and themeable UI components. |
| **TanStack Router** | Routing          | Provides 100% type safety, nested routing, and built-in data loading patterns.           |
| **React Query**     | Server State     | Handles caching, optimistic updates, and loading/error states for API requests.          |
| **Vite (Rolldown)** | Build Tool       | Extreme performance during development and optimized, tree-shaken production bundles.    |
| **Zod & Yup**       | Validation       | Strict schema validation for forms and API responses.                                    |

---

## 🏗 Client-Side Architecture

The application follows a **Clean Architecture** approach tailored for React:

- **Components**: Atomic and reusable UI elements (MUI-based).
- **Hooks**: Logic encapsulation for API calls (React Query) and local state.
- **Services/DataSources**: Specialized classes responsible for communicating with the Unified API Gateway (Reverse Proxy).
- **Context/Providers**: Global application state (Auth, Theme).

---

## 🎨 Design System

Udagram uses a custom-themed **Material UI** implementation:

- **Primary Palette**: Professional blue/indigo tones.
- **Typography**: Optimized for clarity across all device sizes.
- **Feedback**: Interactive loading states and toast notifications via **Sonner**.

---

## 🧪 Development & Quality Assurance

Quality is a core pillar of the project, enforced through linting rules and a comprehensive test suite.

```bash
# Start local development server
npm run dev

# Build for production
npm run build

# Run unit and component tests
npm test

# Preview production build
npm run preview
```

---

## ☁️ Deployment

The frontend is deployed as a Dockerized **Nginx** server, specifically configured for SPA support.

- **SPA Routing**: Nginx is configured with `try_files` to ensure client-side routes are correctly handled by `index.html`.
- **Environment Injection**: API URLs are injected at build-time using Docker build arguments.
- **Multi-stage Build**: Optimized Docker images using Alpine Linux for a minimal footprint.
