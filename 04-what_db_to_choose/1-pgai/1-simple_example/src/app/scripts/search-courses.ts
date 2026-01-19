/* eslint-disable no-console */
import "dotenv/config";
import "reflect-metadata";

import { PostgresConnection } from "../PostgresConnection";

async function main(
	query: string,
	pgConnection: PostgresConnection,
): Promise<void> {
	const results = await pgConnection.sql`
		SELECT
			name,
			summary,
			categories,
			embedding <=>  ai.openai_embed('text-embedding-3-small', ${query}, dimensions=>768) as distance
		FROM mooc.courses_embedding
		ORDER BY distance
		LIMIT 3;
	`;

	console.log(`For the query "${query}" the results are:`, results);
}

const pgConnection = new PostgresConnection(
	process.env.POSTGRES_HOST ?? "localhost",
	Number(process.env.POSTGRES_PORT ?? 5432),
	process.env.POSTGRES_USER ?? "codely",
	process.env.POSTGRES_PASSWORD ?? "c0d3ly7v",
	process.env.POSTGRES_DB ?? "postgres",
);

main(process.argv[2], pgConnection)
	.catch(console.error)
	.finally(async () => {
		await pgConnection.end();
		console.log("Done!");

		process.exit(0);
	});
