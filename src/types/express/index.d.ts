declare namespace Express {
	interface Request {
		auth: {
			id: string;
			organisationId: string | undefined;
		};
	}
}
