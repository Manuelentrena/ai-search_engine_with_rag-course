/* eslint-disable no-console */
import "dotenv/config";
import "reflect-metadata";

import { PostgresConnection } from "../PostgresConnection";

import jsonCourses from "./courses.json";

async function main(pgConnection: PostgresConnection): Promise<void> {
	await Promise.all(
		jsonCourses.map(async (jsonCourse) => {
			await pgConnection.sql`
				INSERT INTO mooc.courses (id, name, summary, categories)
				VALUES (
					${jsonCourse.id},
					${jsonCourse.name},
					${jsonCourse.summary},
					${jsonCourse.categories}
				);
			`;
		}),
	);
}

const pgConnection = new PostgresConnection(
	process.env.POSTGRES_HOST ?? "localhost",
	Number(process.env.POSTGRES_PORT ?? 5432),
	process.env.POSTGRES_USER ?? "codely",
	process.env.POSTGRES_PASSWORD ?? "c0d3ly7v",
	process.env.POSTGRES_DB ?? "postgres",
);

main(pgConnection)
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await pgConnection.end();
		console.log("Done!");

		process.exit(0);
	});
