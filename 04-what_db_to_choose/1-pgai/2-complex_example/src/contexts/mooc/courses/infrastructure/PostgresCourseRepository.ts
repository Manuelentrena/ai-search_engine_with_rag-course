/* eslint-disable no-console */
import { Primitives } from "@codelytv/primitives-type";
import { Service } from "diod";

import { PostgresRepository } from "../../../shared/infrastructure/postgres/PostgresRepository";
import { Course } from "../domain/Course";
import { CourseId } from "../domain/CourseId";
import { CourseRepository } from "../domain/CourseRepository";

type DatabaseCourseRow = {
	id: string;
	name: string;
	summary: string;
	categories: string[];
	published_at: Date;
};

@Service()
export class PostgresCourseRepository
	extends PostgresRepository<Course>
	implements CourseRepository
{
	async save(course: Course): Promise<void> {
		const userPrimitives = course.toPrimitives();
		await this.execute`
			INSERT INTO mooc.courses (id, name, summary, categories, published_at, embedding)
			VALUES (
				${userPrimitives.id},
				${userPrimitives.name},
				${userPrimitives.summary},
				${userPrimitives.categories},
				${userPrimitives.publishedAt}
			)
			ON CONFLICT (id) DO UPDATE SET
				name = EXCLUDED.name,
				summary = EXCLUDED.summary,
				categories = EXCLUDED.categories,
				published_at = EXCLUDED.published_at;
		`;
	}

	async search(id: CourseId): Promise<Course | null> {
		return await this.searchOne`
			SELECT id, name, summary, categories, published_at
			FROM mooc.courses
			WHERE id = ${id.value};
		`;
	}

	async searchSimilar(ids: CourseId[]): Promise<Course[]> {
		const coursesToSearchSimilar = await this.searchByIds(ids);

		if (coursesToSearchSimilar.length === 0) {
			return [];
		}

		const query = coursesToSearchSimilar
			.map((course) =>
				this.serializeCourseForEmbedding(course.toPrimitives()),
			)
			.join("\n");

		const plainIds = ids.map((id) => id.value);
		const recencyWeight = 0.001;

		return await this.searchMany`
			SELECT 
				id,
				name,
				summary,
				categories,
				published_at,
				embedding <=>  ai.ollama_embed('nomic-embed-text', ${query}, host => 'http://host.docker.internal:11434') as distance
			FROM mooc.courses_embedding
			WHERE id != ALL(${plainIds}::text[])
			ORDER BY
				distance +
				${recencyWeight} * EXTRACT(EPOCH FROM NOW() - published_at) / 86400
			LIMIT 10;
		`;
	}

	async searchByIds(ids: CourseId[]): Promise<Course[]> {
		const plainIds = ids.map((id) => id.value);

		return await this.searchMany`
			SELECT id, name, summary, categories, published_at
			FROM mooc.courses
			WHERE id = ANY(${plainIds}::text[]);
		`;
	}

	protected toAggregate(row: DatabaseCourseRow): Course {
		return Course.fromPrimitives({
			id: row.id,
			name: row.name,
			summary: row.summary,
			categories: row.categories,
			publishedAt: row.published_at,
		});
	}

	private serializeCourseForEmbedding(course: Primitives<Course>): string {
		return [
			`Name: ${course.name}`,
			`Summary: ${course.summary}`,
			`Categories: ${course.categories.join(", ")}`,
		].join("|");
	}
}
