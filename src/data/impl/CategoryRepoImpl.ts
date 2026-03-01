import { and, eq, sql } from "drizzle-orm";
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

    async getCategoryById(id: string): Promise<Category | null> {
        const [row] = await this.db.select().from(categories).where(eq(categories.id, id));
        return row || null;
    }

    async getBudgetCategories(budgetId: string): Promise<Omit<Category,"serverCreatedAt">[]> {
        return this.db.select({
            id: categories.id,
            budgetId: categories.budgetId,
            createdBy: categories.createdBy,
            name: categories.name,
            allocate: categories.allocate,
            version: categories.version,
            offlineLastModified: categories.offlineLastModified
        })
            .from(categories)
            .where(eq(categories.budgetId,budgetId));
    }

    async updateCategory(id: string, updates: UpdateCategoryModel, expectedVersion: number, newLastModified: number): Promise<Category> {
        const [row] = await this.db.update(categories)
        .set({
            ...updates,
            version: sql`version + 1`,
            offlineLastModified: newLastModified,
        })
        .where(eq(categories.id,id))
        .returning();

        if (row && row.version !== expectedVersion+1) {
            throw new RepoError("VERSION_MISMATCH", { ...row, version: row.version-1 });
        }

        return row;
    }

    async deleteCategory(id: string, expectedVersion: number): Promise<boolean> {
        const [deletedCategory] = await this.db
            .delete(categories)
            .where(eq(categories.id, id))
            .returning();

        if (deletedCategory && deletedCategory.version !== expectedVersion) {
            throw new RepoError("VERSION_MISMATCH");
        }

        return typeof deletedCategory !== undefined;
    }

}