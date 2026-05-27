export async function load({ locals: { safeGetSession }, cookies }) {
	const { session, user } = await safeGetSession();

	return {
		session,
		user,
		cookies: cookies.getAll()
	};
}
