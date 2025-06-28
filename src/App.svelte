<script>
  import { onMount } from 'svelte';
  import TaskColumn from './TaskColumn.svelte';
  import TaskModal from './TaskModal.svelte';
  
  let tasks = {
    backlog: [],
    active: [],
    completed: [],
    blocked: []
  };
  
  let showModal = false;
  let editingTask = null;
  let selectedColumn = 'backlog';
  let lastUpdated = null;
  let isSyncing = false;
  let autoSyncEnabled = true;
  
  // Get API URL from environment or window configuration
  // In development, leave empty to use Vite's proxy
  const apiUrl = import.meta.env.PROD 
    ? (window.__API_URL__ || '') 
    : '';
  
  let pollingInterval;
  const POLLING_INTERVAL = 2000; // Poll every 2 seconds
  
  // Load tasks on mount and start polling
  onMount(async () => {
    await loadTasks();
    
    // Start polling for updates
    pollingInterval = setInterval(async () => {
      if (autoSyncEnabled) {
        await loadTasks();
      }
    }, POLLING_INTERVAL);
    
    // Cleanup on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  });
  
  async function loadTasks() {
    isSyncing = true;
    try {
      const response = await fetch(`${apiUrl}/api/tasks`);
      const data = await response.json();
      
      // Transform the data and check for changes
      let hasChanges = false;
      const newTasks = {};
      
      Object.keys(data).forEach(state => {
        newTasks[state] = data[state].map(task => ({
          id: task.id,
          title: task.title,
          priority: task.priority,
          category: task.category,
          estimatedHours: task.estimated_hours,
          completedDate: task.completed_date,
          description: task.description,
          filename: task.filename
        }));
        
        // Check if this state has changed
        if (JSON.stringify(tasks[state]) !== JSON.stringify(newTasks[state])) {
          hasChanges = true;
        }
      });
      
      // Only update if there are actual changes
      if (hasChanges) {
        tasks = newTasks;
        lastUpdated = new Date();
        console.log('Tasks updated from file system');
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      isSyncing = false;
    }
  }
  
  function handleDragStart(e) {
    const { event, task, column } = e.detail;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/json', JSON.stringify({ task, fromColumn: column }));
  }
  
  function handleDrop(e) {
    const { event, column: toColumn } = e.detail;
    event.preventDefault();
    const data = JSON.parse(event.dataTransfer.getData('text/json'));
    const { task, fromColumn } = data;
    
    if (fromColumn !== toColumn) {
      // Remove from old column
      tasks[fromColumn] = tasks[fromColumn].filter(t => t.id !== task.id);
      
      // Add to new column
      tasks[toColumn] = [...tasks[toColumn], task];
      
      // Save the change
      saveTaskMove(task.id, toColumn);
    }
  }
  
  function handleDragOver(e) {
    const { event } = e.detail;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }
  
  async function saveTaskMove(taskId, newState) {
    try {
      const response = await fetch(`${apiUrl}/api/tasks/${taskId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toState: newState })
      });
      
      if (!response.ok) throw new Error('Failed to move task');
      
      // Update local state
      tasks = tasks;
    } catch (error) {
      console.error('Error moving task:', error);
      // Revert the change
      await loadTasks();
    }
  }
  
  function openNewTaskModal(column) {
    selectedColumn = column;
    editingTask = null;
    showModal = true;
  }
  
  function openEditModal(task, column) {
    selectedColumn = column;
    editingTask = task;
    showModal = true;
  }
  
  async function handleSaveTask(event) {
    const taskData = event.detail;
    
    try {
      if (editingTask) {
        // Update existing task
        const response = await fetch(`${apiUrl}/api/tasks/${editingTask.id}?state=${selectedColumn}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...taskData,
            estimated_hours: taskData.estimatedHours
          })
        });
        
        if (!response.ok) throw new Error('Failed to update task');
        
        tasks[selectedColumn] = tasks[selectedColumn].map(t => 
          t.id === editingTask.id ? { ...taskData, id: editingTask.id } : t
        );
      } else {
        // Create new task
        const response = await fetch(`${apiUrl}/api/tasks?state=${selectedColumn}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...taskData,
            estimated_hours: taskData.estimatedHours
          })
        });
        
        if (!response.ok) throw new Error('Failed to create task');
        
        const { id } = await response.json();
        const newTask = { ...taskData, id };
        tasks[selectedColumn] = [...tasks[selectedColumn], newTask];
      }
      
      tasks = tasks;
      showModal = false;
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Failed to save task. Please try again.');
    }
  }
  
  async function deleteTask(taskId, column) {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        const response = await fetch(`${apiUrl}/api/tasks/${taskId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete task');
        
        tasks[column] = tasks[column].filter(t => t.id !== taskId);
        tasks = tasks;
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task. Please try again.');
      }
    }
  }
</script>

<div class="min-h-screen bg-gray-100">
  <header class="bg-white border-b shadow-sm">
    <div class="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <h1 class="text-2xl font-bold text-gray-900">Swarm Tasks UI</h1>
        <div class="flex items-center space-x-4">
          <div class="text-sm text-gray-500">
            Kanban board for swarm task management
          </div>
          <div class="flex items-center space-x-2 text-xs text-gray-400">
            <button 
              on:click={() => autoSyncEnabled = !autoSyncEnabled}
              class="flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
              title="{autoSyncEnabled ? 'Pause' : 'Resume'} auto-sync"
            >
              {#if autoSyncEnabled}
                {#if isSyncing}
                  <svg class="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Syncing...</span>
                {:else if lastUpdated}
                  <svg class="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Auto-sync active</span>
                {:else}
                  <span>Waiting for changes...</span>
                {/if}
              {:else}
                <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>Auto-sync paused</span>
              {/if}
            </button>
            <button
              on:click={loadTasks}
              class="p-1 rounded hover:bg-gray-100 transition-colors"
              title="Refresh now"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
  
  <main class="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <TaskColumn 
        title="Backlog" 
        tasks={tasks.backlog} 
        column="backlog"
        color="gray"
        on:dragstart={handleDragStart}
        on:drop={handleDrop}
        on:dragover={handleDragOver}
        on:newtask={() => openNewTaskModal('backlog')}
        on:edit={(e) => openEditModal(e.detail.task, 'backlog')}
        on:delete={(e) => deleteTask(e.detail.taskId, 'backlog')}
      />
      
      <TaskColumn 
        title="Active" 
        tasks={tasks.active} 
        column="active"
        color="blue"
        on:dragstart={handleDragStart}
        on:drop={handleDrop}
        on:dragover={handleDragOver}
        on:newtask={() => openNewTaskModal('active')}
        on:edit={(e) => openEditModal(e.detail.task, 'active')}
        on:delete={(e) => deleteTask(e.detail.taskId, 'active')}
      />
      
      <TaskColumn 
        title="Blocked" 
        tasks={tasks.blocked} 
        column="blocked"
        color="red"
        on:dragstart={handleDragStart}
        on:drop={handleDrop}
        on:dragover={handleDragOver}
        on:newtask={() => openNewTaskModal('blocked')}
        on:edit={(e) => openEditModal(e.detail.task, 'blocked')}
        on:delete={(e) => deleteTask(e.detail.taskId, 'blocked')}
      />
      
      <TaskColumn 
        title="Completed" 
        tasks={tasks.completed} 
        column="completed"
        color="green"
        on:dragstart={handleDragStart}
        on:drop={handleDrop}
        on:dragover={handleDragOver}
        on:newtask={() => openNewTaskModal('completed')}
        on:edit={(e) => openEditModal(e.detail.task, 'completed')}
        on:delete={(e) => deleteTask(e.detail.taskId, 'completed')}
      />
    </div>
  </main>
  
  {#if showModal}
    <TaskModal 
      task={editingTask}
      on:save={handleSaveTask}
      on:close={() => showModal = false}
    />
  {/if}
</div>