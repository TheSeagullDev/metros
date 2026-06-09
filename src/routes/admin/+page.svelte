<script>
	let { form } = $props();
</script>

<div class="bg-gray-800 text-gray-50 h-screen p-4">
    <h1 class="text-2xl">Super Secret Admin Page</h1>
    
    <form method="POST" action="?/generateCode">
        <button class="p-4 bg-gray-600 rounded-md m-4 hover:bg-gray-500">
            Generate Guest Pass
        </button>
    </form>
    
    {#if form?.code}
        <h2 class="p-2 bg-green-800">
            Support Code:
            {form.code}
        </h2>
    {/if}
</div>