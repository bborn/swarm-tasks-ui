<script>
  import { createEventDispatcher } from 'svelte';
  
  export let task;
  
  const dispatch = createEventDispatcher();
  
  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200'
  };
  
  const categoryIcons = {
    'ai-features': '🤖',
    'features': '⚡',
    'infrastructure': '🏗️',
    'ui-ux': '🎨',
    'analytics': '📊',
    'integrations': '🔗',
    'setup': '🚀'
  };
</script>

<div 
  draggable="true"
  on:dragstart
  class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-move hover:shadow-md transition-shadow"
  role="article"
  aria-label="Task: {task.title}"
>
  <div class="flex items-start justify-between mb-2">
    <h3 class="text-sm font-medium text-gray-900 flex-1 pr-2">
      {task.title}
    </h3>
    <div class="flex items-center space-x-1">
      <button 
        on:click={() => dispatch('edit')}
        class="text-gray-400 hover:text-gray-600 transition-colors"
        title="Edit task"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
      </button>
      <button 
        on:click={() => dispatch('delete')}
        class="text-gray-400 hover:text-red-600 transition-colors"
        title="Delete task"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
    </div>
  </div>
  
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-2">
      {#if task.priority}
        <span class="text-xs px-2 py-0.5 rounded-full border {priorityColors[task.priority]}">
          {task.priority}
        </span>
      {/if}
      
      {#if task.category}
        <span class="text-xs text-gray-500" title={task.category}>
          {categoryIcons[task.category] || '📌'} {task.category}
        </span>
      {/if}
    </div>
    
    {#if task.estimatedHours}
      <span class="text-xs text-gray-400">
        {task.estimatedHours}h
      </span>
    {/if}
  </div>
  
  {#if task.id}
    <div class="mt-2 text-xs text-gray-400">
      {task.id}
    </div>
  {/if}
</div>