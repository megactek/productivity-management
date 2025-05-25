# TaskFlow

A super lightweight, performant React/Next.js todo and project management application that runs as a service on macOS. Zero authentication, JSON-based storage, maximum simplicity with powerful features.

## Features

- **Todo Management**: Create, edit, and track tasks with ease
- **Project Organization**: Group related tasks into projects
- **Note Taking**: Capture important information alongside your tasks
- **Notification System**: Stay on top of due dates and important tasks

## Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/taskflow.git
cd taskflow
```

2. Install dependencies:

```bash
npm install
# or
yarn
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
src/
├── components/          # UI Components (modular, reusable)
│   ├── todo/           # Todo-specific components
│   ├── project/        # Project-specific components
│   ├── notes/          # Notes-specific components
│   └── shared/         # Shared UI components
├── hooks/              # Custom React hooks (data management)
├── services/           # Business logic layer
├── types/              # TypeScript definitions
├── utils/              # Helper functions
├── stores/             # JSON data management
└── data/               # JSON storage files
```

## Built With

- [Next.js](https://nextjs.org/) - The React framework
- [Tailwind CSS](https://tailwindcss.com/) - For styling
- [Headless UI](https://headlessui.com/) - Unstyled UI components
- [TypeScript](https://www.typescriptlang.org/) - Type safety

## License

This project is licensed under the MIT License - see the LICENSE file for details.
