# swarm-tasks-ui

A simple kanban board UI for [swarm_tasks](https://github.com/todddickerson/swarm_tasks).

## Features

- 📋 **Kanban Board Interface** - Drag and drop tasks between backlog, active, completed, and blocked states
- 🔄 **Auto-refresh** - UI updates automatically when tasks are modified by AI agents or CLI
- 🤖 **swarm-tasks CLI Integration** - Uses the swarm-tasks Ruby gem for task operations when available
- 🎯 **Zero Configuration** - Works out of the box with standard swarm_tasks directory structure

## Quick Start

Run directly with npx (no installation required):

```bash
npx swarm-tasks-ui
```

This will:
1. Look for a `tasks` directory in the current folder
2. Start a backend server on port 3001
3. Start the UI on port 5173
4. Open your browser automatically

## Installation

Install globally:

```bash
npm install -g swarm-tasks-ui
```

Then run from any project:

```bash
swarm-tasks-ui
```

### Optional: Install swarm_tasks Ruby gem

For better integration, install the swarm_tasks Ruby gem:

```bash
gem install swarm_tasks
```

When available, swarm-tasks-ui will use the CLI commands for:
- Listing tasks with `swarm-tasks list --json`
- Moving tasks with `swarm-tasks move <task-id> <state>`

## Usage

### Basic Usage

In a directory with a `tasks` folder:

```bash
swarm-tasks-ui
```

### Options

```bash
swarm-tasks-ui [options]

Options:
  -p, --port <port>      Backend server port (default: 3001)
  -u, --ui-port <port>   UI server port (default: 5173)
  --no-open              Don't open browser automatically
  -d, --dir <path>       Tasks directory path (default: ./tasks)
  -h, --help             Display help
```

### Examples

Use a different tasks directory:
```bash
swarm-tasks-ui -d ../my-project/tasks
```

Use different ports:
```bash
swarm-tasks-ui -p 4000 -u 8080
```

Don't open browser:
```bash
swarm-tasks-ui --no-open
```

## Project Structure

The tool expects a tasks directory with subdirectories for each state:

```
tasks/
├── backlog/
│   ├── task-1.md
│   └── task-2.md
├── active/
│   └── task-3.md
├── blocked/
└── completed/
    └── task-4.md
```

Each task is a markdown file with YAML frontmatter:

```markdown
---
id: unique-task-id
title: Task Title
priority: high
category: features
estimated_hours: 8
---

Task description in markdown...
```

## Features

- 📋 **Kanban Board**: Visual task management with drag & drop
- 🔄 **Real-time Sync**: Changes are saved to your file system
- 🏷️ **Task Metadata**: Priority, category, time estimates
- 📝 **Markdown Support**: Task descriptions in markdown
- 🚀 **Zero Config**: Works out of the box

## Integration with swarm_tasks

This UI is designed to work seamlessly with the [swarm_tasks](https://github.com/todddickerson/swarm_tasks) CLI:

```bash
# CLI commands still work
swarm-tasks list
swarm-tasks move task-id active

# Or use the UI
swarm-tasks-ui
```

## Development

Clone and install dependencies:

```bash
git clone https://github.com/bborn/swarm-tasks-ui
cd swarm-tasks-ui
npm install
```

Run in development mode:

```bash
npm run dev     # Run UI dev server
npm run server  # Run backend server
```

Build for production:

```bash
npm run build
```

## License

MIT