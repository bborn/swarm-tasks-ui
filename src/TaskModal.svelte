<script>
  import { createEventDispatcher } from 'svelte';
  
  export let task = null;
  
  const dispatch = createEventDispatcher();
  
  let formData = {
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    category: task?.category || 'features',
    estimatedHours: task?.estimatedHours || ''
  };
  
  function handleSubmit() {
    dispatch('save', formData);
  }
  
  function handleClose() {
    dispatch('close');
  }
</script>

<div class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
  <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
    <div class="border-b px-6 py-4">
      <h2 class="text-xl font-semibold text-gray-900">
        {task ? 'Edit Task' : 'New Task'}
      </h2>
    </div>
    
    <form on:submit|preventDefault={handleSubmit} class="p-6 space-y-4">
      <div>
        <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          id="title"
          type="text"
          bind:value={formData.title}
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          bind:value={formData.description}
          rows="4"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div class="grid grid-cols-3 gap-4">
        <div>
          <label for="priority" class="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            id="priority"
            bind:value={formData.priority}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        
        <div>
          <label for="category" class="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            bind:value={formData.category}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ai-features">AI Features</option>
            <option value="features">Features</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="ui-ux">UI/UX</option>
            <option value="analytics">Analytics</option>
            <option value="integrations">Integrations</option>
            <option value="setup">Setup</option>
          </select>
        </div>
        
        <div>
          <label for="hours" class="block text-sm font-medium text-gray-700 mb-1">
            Estimated Hours
          </label>
          <input
            id="hours"
            type="number"
            bind:value={formData.estimatedHours}
            min="0"
            step="0.5"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div class="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          on:click={handleClose}
          class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          {task ? 'Update' : 'Create'} Task
        </button>
      </div>
    </form>
  </div>
</div>