<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	const supabase = $derived(page.data.supabase);

	let email = $state('');
	let password = $state('');

	async function signup() {
		const { error } = await supabase.auth.signUp({
			email,
			password
		});
        if (!error) {
            await goto("/watch");
        }
		console.log(error);
	}

	async function login() {
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

        if (!error) {
            await goto("/watch");
        }

		console.log(error);
	}
</script>

<input bind:value={email} placeholder="email" />

<input bind:value={password} type="password" />

<button onclick={signup}>
	Sign Up
</button>

<button onclick={login}>
	Login
</button>