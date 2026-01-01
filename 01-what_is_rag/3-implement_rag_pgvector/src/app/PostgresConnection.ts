import postgres from "postgres";

export class PostgresConnection {
	public readonly sql: postgres.Sql;

	constructor(
		host: string,
		port: number,
		user: string,
		password: string,
		database: string,
	) {
		this.sql = postgres({
			host,
			port,
			user,
			password,
			database,
			onnotice: () => {},
		});
	}

	async end(): Promise<void> {
		await this.sql.end();
	}
}
