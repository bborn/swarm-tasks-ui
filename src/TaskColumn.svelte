<script>
  import { createEventDispatcher } from 'svelte';
  import TaskCard from './TaskCard.svelte';
  
  export let title;
  export let tasks = [];
  export let column;
  export let color = 'gray';
  
  const dispatch = createEventDispatcher();
  
  function handleDragStart(event, task) {
    dispatch('dragstart', event, task, column);
  }
  
  function handleDrop(event) {
    dispatch('drop', event, column);
  }
  
  function handleDragOver(event) {
    dispatch('dragover', event);
  }
  
  const colorClasses = {
    gray: 'bg-gray-50 border-gray-200',
    blue: 'bg-blue-50 border-blue-200',
    red: 'bg-red-50 border-red-200',
    green: 'bg-green-50 border-green-200'
  };
  
  const headerColorClasses = {
    gray: 'text-gray-700',
    blue: 'text-blue-700',
    red: 'text-red-700',
    green: 'text-green-700'
  };
</script>

<div 
  class="flex flex-col h-full {colorClasses[color]} rounded-lg border-2 border-dashed p-4"
  on:drop={handleDrop}
  on:dragover={handleDragOver}
  role="region"
  aria-label="{title} tasks"
>
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-lg font-semibold {headerColorClasses[color]}">
      {title}
      <span class="ml-2 text-sm font-normal text-gray-500">({tasks.length})</span>
    </h2>
    <button 
      on:click={() => dispatch('newtask')}
      class="text-gray-400 hover:text-gray-600 transition-colors"
      title="Add new task"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
      </svg>
    </button>
  </div>
  
  <div class="flex-1 space-y-3 overflow-y-auto">
    {#each tasks as task (task.id)}
      <TaskCard 
        {task} 
        on:dragstart={(e) => handleDragStart(e, task)}
        on:edit={() => dispatch('edit', { task })}
        on:delete={() => dispatch('delete', { taskId: task.id })}
      />
    {/each}
    
    {#if tasks.length === 0}
      <div class="text-center py-8 text-gray-400">
        <p class="text-sm">No tasks</p>
        <p class="text-xs mt-1">Drop tasks here or click + to create</p>
      </div>
    {/if}
  </div>
</div>