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
  
  // Get API URL from environment or window configuration
  const apiUrl = import.meta.env.VITE_API_URL || window.__API_URL__ || '';
  
  // Load tasks on mount
  onMount(async () => {
    await loadTasks();
  });
  
  async function loadTasks() {
    try {
      const response = await fetch(`${apiUrl}/api/tasks`);
      const data = await response.json();
      
      // Transform the data to use camelCase
      Object.keys(data).forEach(state => {
        tasks[state] = data[state].map(task => ({
          id: task.id,
          title: task.title,
          priority: task.priority,
          category: task.category,
          estimatedHours: task.estimated_hours,
          completedDate: task.completed_date,
          description: task.description,
          filename: task.filename
        }));
      });
      
      tasks = tasks;
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  }
  
  function handleDragStart(event, task, fromColumn) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/json', JSON.stringify({ task, fromColumn }));
  }
  
  function handleDrop(event, toColumn) {
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
  
  function handleDragOver(event) {
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
        <div class="text-sm text-gray-500">
          Kanban board for swarm task management
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