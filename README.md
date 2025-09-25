# 🎤 Funny Notes

A comedy material management platform for stand-up comedians to capture, organize, and perform their best material.

## Features

- **Instant Capture**: Quickly capture ideas via text, voice, or image
- **Smart Organization**: Tag and search your material effortlessly  
- **Set Building**: Create and manage performance set lists
- **Rehearsal Mode**: Practice your sets with built-in timing tools
- **Venue & Contact Management**: Track performances and industry connections
- **Cross-Platform**: PWA that works on mobile, tablet, and desktop

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with Comedy Club theme
- **Storage**: IndexedDB with Dexie.js for offline-first experience
- **PWA**: Service Worker with Workbox for offline functionality
- **Future**: React Native for native mobile apps

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── core/           # Platform-agnostic business logic
│   ├── models/     # Data models and types
│   ├── services/   # Business logic services
│   └── storage/    # Storage abstraction layer
├── components/     # React UI components
├── pages/          # Page components
├── hooks/          # Custom React hooks
└── utils/          # Utility functions
```

## Architecture

The app follows a layered architecture with platform-agnostic core logic that can be reused across web and native platforms:

- **Core Layer**: Pure TypeScript business logic
- **Storage Layer**: Abstracted storage interface with IndexedDB implementation
- **UI Layer**: React components consuming core services
- **PWA Layer**: Service worker and offline capabilities

This design enables future expansion to React Native or native apps while reusing 80% of the codebase.