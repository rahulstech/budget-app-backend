import { and, eq } from "drizzle-orm";
import { CategoryRepo } from "../CategoryRepo.js";
import { categories } from "../schema/Tables.js";
import { Category, Database, UpdateCategoryModel } from "../Models.js";
import { RepoError } from "../RepoError.js";

export class CategoryRepoImpl implements CategoryRepo {
    
    constructor(private readonly db: Database) {}

    async insertCategory(category: Category): Promise<Category> {
        const [newCategory] = await this.db.insert(categories).values(category).returning();
        return newCategory;
    }

    async getBudgetCategories(budgetId: string): Promise<Category[]> {
        return this.db.select()
            .from(categories)
            .where(eq(categories.budgetId,budgetId));
    }

    async updateCategory(id: string, updates: UpdateCategoryModel, expectedVersion: number, newLastModified: number): Promise<Category> {
        const [row] = await this.db.update(categories)
        .set({
            ...updates,
            version: expectedVersion + 1,
            offlineLastModified: newLastModified,
        })
        .where(and(
            eq(categories.id,id),
            eq(categories.version,expectedVersion)
        ))
        .returning();

        if (!row) {
            throw new RepoError("VERSION_MISMATCH");
        }

        return row;
    }

    async deleteCategory(id: string, expectedVersion: number): Promise<void> {
        const [deletedCategory] = await this.db
            .delete(categories)
            .where(and(
                eq(categories.id, id),
            ))
            .returning();

        if (deletedCategory && deletedCategory.version !== expectedVersion) {
            throw new RepoError("VERSION_MISMATCH");
        }
    }

}