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

	async function paymentSucess(message) {
		const response = await fetch('/api/payment-complete', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				rawDataResponse: message,
				checkoutToken: data.checkoutToken
			})
		});

		if (!response.ok) {
			throw new Error('Payment validation failed');
		}

		const user = await response.json();

		console.log(user);
		const { error } = await supabase.auth.signInWithPassword({
			email: user.email,

			password: user.password
		});

		if (!error) {
			window.location.href = '/watch';
		}
	}

</script>

<svelte:window
	onmessage={(event) => {
		const helcimPayJsIdentifierKey = 'helcim-pay-js-' + data.checkoutToken;

		if (event.data.eventName === helcimPayJsIdentifierKey) {
			if (event.data.eventStatus === 'ABORTED') {
				console.error('Transaction failed!', event.data.eventMessage);
			}

			if (event.data.eventStatus === 'SUCCESS') {
				console.log(JSON.parse(event.data.eventMessage));
				paymentSucess(event.data.eventMessage)
					.then((response) => console.log(response))
					.catch((err) => console.error(err));
			}

			if (event.data.eventStatus === 'HIDE') {
				console.log('Modal or confirmation screen closed.');
			}
		}
	}}
/>

<div
	class="flex h-screen flex-col items-center justify-between py-32 sm:py-16"
	style="background-image: url({bg}); background-size: cover"
>
	<img
		src="https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=1920,h=359,fit=crop/x1MQP53DI5u8ojA3/metroawards-gigapixel-cgi-6x-hNCmiXZgi6QtJzYb.png"
		alt=""
		class="m-4 w-2/3"
	/>
	<div>
		<button
			onclick={pay}
			class="m-4 rounded bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-400 text-2xl">Buy Livestream Ticket</button
		>
		<button
			onclick={pay}
			class="m-4 rounded bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-400 text-2xl">Already Bought a Ticket?</button
		>
	</div>
</div>
