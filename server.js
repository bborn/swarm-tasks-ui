import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const TASKS_DIR = process.env.TASKS_DIR || path.join(__dirname, '..', 'tasks');
const STATES = ['backlog', 'active', 'completed', 'blocked'];

// Parse a task file
async function parseTaskFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split('\n');
  
  let frontmatter = {};
  let description = '';
  let inFrontmatter = false;
  let frontmatterLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (i === 0 && line === '---') {
      inFrontmatter = true;
      continue;
    }
    
    if (inFrontmatter && line === '---') {
      inFrontmatter = false;
      // Parse the frontmatter
      frontmatter = yaml.load(frontmatterLines.join('\n')) || {};
      continue;
    }
    
    if (inFrontmatter) {
      frontmatterLines.push(line);
    } else {
      description += line + '\n';
    }
  }
  
  return {
    ...frontmatter,
    description: description.trim(),
    filename: path.basename(filePath)
  };
}

// Write a task file
async function writeTaskFile(state, task) {
  const filename = task.filename || `${task.id}.md`;
  const filePath = path.join(TASKS_DIR, state, filename);
  
  const frontmatter = yaml.dump({
    id: task.id,
    title: task.title,
    priority: task.priority,
    category: task.category,
    estimated_hours: task.estimatedHours,
    ...(task.completed_date && { completed_date: task.completed_date })
  });
  
  const content = `---\n${frontmatter}---\n\n${task.description || ''}`;
  
  await fs.writeFile(filePath, content, 'utf8');
}

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = {};
    
    for (const state of STATES) {
      const statePath = path.join(TASKS_DIR, state);
      const files = await fs.readdir(statePath);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      
      tasks[state] = await Promise.all(
        mdFiles.map(async (file) => {
          const filePath = path.join(statePath, file);
          return await parseTaskFile(filePath);
        })
      );
    }
    
    res.json(tasks);
  } catch (error) {
    console.error('Error reading tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Move a task to a different state
app.post('/api/tasks/:taskId/move', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { toState } = req.body;
    
    if (!STATES.includes(toState)) {
      return res.status(400).json({ error: 'Invalid state' });
    }
    
    // Find the task file
    let foundFile = null;
    let currentState = null;
    
    for (const state of STATES) {
      const statePath = path.join(TASKS_DIR, state);
      const files = await fs.readdir(statePath);
      const taskFile = files.find(f => f.includes(taskId));
      
      if (taskFile) {
        foundFile = taskFile;
        currentState = state;
        break;
      }
    }
    
    if (!foundFile) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Move the file
    const oldPath = path.join(TASKS_DIR, currentState, foundFile);
    const newPath = path.join(TASKS_DIR, toState, foundFile);
    
    await fs.rename(oldPath, newPath);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error moving task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a task
app.put('/api/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const taskData = req.body;
    const { state } = req.query;
    
    if (!state || !STATES.includes(state)) {
      return res.status(400).json({ error: 'Invalid or missing state' });
    }
    
    await writeTaskFile(state, { ...taskData, id: taskId });
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new task
app.post('/api/tasks', async (req, res) => {
  try {
    const taskData = req.body;
    const { state } = req.query;
    
    if (!state || !STATES.includes(state)) {
      return res.status(400).json({ error: 'Invalid or missing state' });
    }
    
    const taskId = `${Date.now()}-${taskData.title.toLowerCase().replace(/\s+/g, '-')}`;
    await writeTaskFile(state, { ...taskData, id: taskId });
    
    res.json({ id: taskId, success: true });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a task
app.delete('/api/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // Find and delete the task file
    for (const state of STATES) {
      const statePath = path.join(TASKS_DIR, state);
      const files = await fs.readdir(statePath);
      const taskFile = files.find(f => f.includes(taskId));
      
      if (taskFile) {
        await fs.unlink(path.join(statePath, taskFile));
        return res.json({ success: true });
      }
    }
    
    res.status(404).json({ error: 'Task not found' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Task API server running on http://localhost:${PORT}`);
});