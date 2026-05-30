<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import bg from '$lib/assets/background.png';

	const supabase = $derived(page.data.supabase);

	let email = 'test@test.com';

	let { data } = $props();

	function pay() {
		appendHelcimPayIframe(data.checkoutToken);
	}

	async function signup() {
		const { error } = await supabase.auth.signUp({
			email,
			password
		});
		if (!error) {
			await goto('/watch');
		}
		console.log(error);
	}

	async function login() {
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (!error) {
			await goto('/watch');
		}

		console.log(error);
	}

	async function paymentSucess() {
		const paymentId = 'abc123';
		const res = await fetch('/api/payment-complete', {
			method: 'POST',

			headers: {
				'Content-Type': 'application/json'
			},

			body: JSON.stringify({
				email,
				paymentId
			})
		});

		const data = await res.json();

		const { error } = await supabase.auth.signInWithPassword({
			email: data.email,

			password: data.password
		});

		if (!error) {
			goto('/watch');
		}
	}
</script>

<div
	class="flex h-screen flex-col items-center justify-between"
	style="background-image: url({bg}); background-size: cover"
>
	<img
		src="https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=1920,h=359,fit=crop/x1MQP53DI5u8ojA3/metroawards-gigapixel-cgi-6x-hNCmiXZgi6QtJzYb.png"
		alt=""
		class="m-4 w-2/3"
	/>
	<button
		onclick={pay}
		class="m-4 rounded bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-400">Pay</button
	>
</div>
