import http from 'k6/http';
import { check } from 'k6';

export let options = {
	stages: [{ duration: '2m', target: 1 }],
	thresholds: {
		http_req_duration: ['p(95)<500']
	}
};

export default function () {
	let res = http.get('https://metros.noahsiegel.dev');
	check(res, { 'status is 200': (r) => r.status === 200 });
}
