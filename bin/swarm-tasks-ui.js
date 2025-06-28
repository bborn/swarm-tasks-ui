#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import open from 'open';
import chalk from 'chalk';
import { program } from 'commander';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageDir = path.join(__dirname, '..');

// Parse command line options
program
  .name('swarm-tasks-ui')
  .description('A kanban UI for swarm_tasks')
  .option('-p, --port <port>', 'server port', '3001')
  .option('-u, --ui-port <port>', 'UI port', '5173')
  .option('--no-open', 'do not open browser automatically')
  .option('-d, --dir <path>', 'tasks directory', './tasks')
  .parse();

const options = program.opts();

async function checkTasksDirectory() {
  const tasksDir = path.resolve(options.dir);
  
  try {
    const stats = await fs.stat(tasksDir);
    if (!stats.isDirectory()) {
      console.error(chalk.red(`Error: ${tasksDir} is not a directory`));
      process.exit(1);
    }
    
    // Check for .swarm_tasks.yml
    const configPath = path.join(path.dirname(tasksDir), '.swarm_tasks.yml');
    try {
      await fs.access(configPath);
    } catch {
      console.warn(chalk.yellow('Warning: .swarm_tasks.yml not found in parent directory'));
      console.warn(chalk.yellow('Creating default configuration...'));
      
      const defaultConfig = `tasks_dir: "tasks"
states:
  - backlog
  - active
  - completed
  - blocked
`;
      await fs.writeFile(configPath, defaultConfig);
    }
    
    // Ensure state directories exist
    const states = ['backlog', 'active', 'completed', 'blocked'];
    for (const state of states) {
      const statePath = path.join(tasksDir, state);
      try {
        await fs.mkdir(statePath, { recursive: true });
      } catch (err) {
        // Directory might already exist
      }
    }
    
    return tasksDir;
  } catch (err) {
    console.error(chalk.red(`Error: Tasks directory "${tasksDir}" not found`));
    console.log(chalk.yellow('Creating tasks directory structure...'));
    
    // Create the directory structure
    const states = ['backlog', 'active', 'completed', 'blocked'];
    for (const state of states) {
      await fs.mkdir(path.join(tasksDir, state), { recursive: true });
    }
    
    return tasksDir;
  }
}

async function startServer(tasksDir) {
  const serverPath = path.join(packageDir, 'server.js');
  
  // Set environment variables for the server
  const env = {
    ...process.env,
    TASKS_DIR: tasksDir,
    PORT: options.port
  };
  
  const server = spawn('node', [serverPath], {
    env,
    stdio: 'inherit'
  });
  
  server.on('error', (err) => {
    console.error(chalk.red('Failed to start server:'), err);
    process.exit(1);
  });
  
  return server;
}

async function serveUI() {
  const distPath = path.join(packageDir, 'dist');
  
  // Check if dist exists, if not run in dev mode
  try {
    await fs.access(distPath);
    return await serveBuiltUI(distPath);
  } catch {
    console.log(chalk.yellow('Warning: Built UI not found. Starting in development mode...'));
    return await serveDevelopmentUI();
  }
}

async function serveBuiltUI(distPath) {
  // Use express to serve the static files
  const { default: express } = await import('express');
  const app = express();
  
  // Inject API URL configuration into HTML
  app.use(async (req, res, next) => {
    if (req.path === '/' || req.path === '/index.html') {
      const htmlPath = path.join(distPath, 'index.html');
      let html = await fs.readFile(htmlPath, 'utf8');
      
      // Inject the API URL configuration
      const configScript = `<script>window.__API_URL__ = '';</script>`;
      html = html.replace('</head>', `${configScript}\n</head>`);
      
      res.send(html);
    } else {
      next();
    }
  });
  
  app.use(express.static(distPath));
  
  // Proxy API requests to the backend
  app.use('/api', (req, res) => {
    const target = `http://localhost:${options.port}`;
    const url = new URL(req.url, target);
    
    fetch(url, {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined
    })
      .then(response => response.text())
      .then(body => res.send(body))
      .catch(err => res.status(500).send(err.message));
  });
  
  const uiServer = app.listen(options.uiPort, () => {
    console.log(chalk.green(`✓ UI server running on http://localhost:${options.uiPort}`));
    
    if (options.open) {
      setTimeout(() => {
        open(`http://localhost:${options.uiPort}`);
      }, 1000);
    }
  });
  
  return uiServer;
}

async function serveDevelopmentUI() {
  // Run vite dev server with the API URL configured
  const env = {
    ...process.env,
    VITE_API_PORT: options.port
  };
  
  const vite = spawn('npx', ['vite', '--port', options.uiPort, '--host'], {
    cwd: packageDir,
    env,
    stdio: 'inherit'
  });
  
  vite.on('error', (err) => {
    console.error(chalk.red('Failed to start vite dev server:'), err);
    process.exit(1);
  });
  
  // Wait for vite to start
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  if (options.open) {
    open(`http://localhost:${options.uiPort}`);
  }
  
  return vite;
}

async function main() {
  console.log(chalk.bold.blue('Starting swarm-tasks-ui...'));
  
  // Check and prepare tasks directory
  const tasksDir = await checkTasksDirectory();
  console.log(chalk.green(`✓ Using tasks directory: ${tasksDir}`));
  
  // Start the backend server
  console.log(chalk.cyan(`Starting backend server on port ${options.port}...`));
  const server = await startServer(tasksDir);
  
  // Wait a bit for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Start serving the UI
  console.log(chalk.cyan(`Starting UI server on port ${options.uiPort}...`));
  const uiServer = await serveUI();
  
  console.log(chalk.bold.green('\n✨ swarm-tasks-ui is ready!'));
  console.log(chalk.gray(`   Backend API: http://localhost:${options.port}`));
  console.log(chalk.gray(`   UI: http://localhost:${options.uiPort}`));
  console.log(chalk.gray('\nPress Ctrl+C to stop\n'));
  
  // Handle cleanup
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\nShutting down...'));
    server.kill();
    if (uiServer.close) {
      uiServer.close();
    } else {
      uiServer.kill();
    }
    process.exit(0);
  });
}

main().catch(err => {
  console.error(chalk.red('Error:'), err);
  process.exit(1);
});