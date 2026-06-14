import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
	stages: [
		{ duration: '2m', target: 100 }, // Ramp to 50 users
		{ duration: '3m', target: 200 }, // Ramp to 100 users
		{ duration: '3m', target: 400 }, // Ramp to 200 users
		{ duration: '3m', target: 1000 }, // Ramp to 500 users (halfway to target)
		{ duration: '2m', target: 1000 }, // Hold at 500
		{ duration: '2m', target: 0 } // Ramp down
	],
	thresholds: {
		http_req_duration: ['p(95)<500']
	}
};

export default function () {
	let res = http.get('https://metros.noahsiegel.dev');
	sleep(300);
	check(res, { 'status is 200': (r) => r.status === 200 });
}
