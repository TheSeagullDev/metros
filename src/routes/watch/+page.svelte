<script>
	import { redirect } from "@sveltejs/kit";
    import { page } from '$app/state';
	import { goto } from "$app/navigation";

	const supabase = $derived(page.data.supabase);
</script>

<h1>You're in!</h1>

<button
	onclick={async () => {
		await supabase.auth.signOut();
        await goto("/")
	}}
>Sign out</button>
