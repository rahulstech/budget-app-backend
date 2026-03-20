import { eq, sql } from "drizzle-orm";
import { CategoryRepo } from "../CategoryRepo.js";
import { categories } from "../schema/Tables.js";
import { Category, Database, UpdateCategoryModel } from "../Models.js";
import { RecordNotFound, RepoError, UniqueConstraintError, VersionMismatchError } from "../RepoError.js";

export class CategoryRepoImpl implements CategoryRepo {
    
    constructor(private readonly db: Database) {}

    async insertCategory(category: Category): Promise<Category> {
        try {
            const [newCategory] = await this.db.insert(categories)
                                .values(category)
                                .returning()
                                .onConflictDoNothing();

            if (!newCategory) {
                throw new UniqueConstraintError({ id: category.id });
            }

            return newCategory;
        }
        catch (error: any) {
            throw RepoError.create({
                error,
                context: { budgetId: category.budgetId, id: category.id },
                message: "insert category failed"
            });
        }
    }

    async getCategoryById(id: string): Promise<Category | null> {
        try {
            const [row] = await this.db.select().from(categories).where(eq(categories.id, id));
            return row || null;
        }
        catch (error: any) {
            throw RepoError.create({
                error,
                context: { id },
                message: "get category by id failed"
            });
        }
    }

    async getBudgetCategories(budgetId: string): Promise<Omit<Category,"serverCreatedAt">[]> {
        try {
            return await this.db.select({
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
        catch (error: any) {
            throw RepoError.create({
                error,
                context: { budgetId },
                message: "get budget categories failed"
            });
        }
    }

    async updateCategory(id: string, updates: UpdateCategoryModel, expectedVersion: number, newLastModified: number): Promise<Category> {
        try {
            const [row] = await this.db.update(categories)
            .set({
                ...updates,
                version: sql<number>`version + 1`,
                offlineLastModified: newLastModified,
            })
            .where(eq(categories.id,id))
            .returning();

            if (!row) {
                throw new RecordNotFound( { id }, "no cateogry found, update category failed",);
            }
            else if (row.version !== expectedVersion+1) {
                throw new VersionMismatchError(
                    { id, expectedVersion, actualVersion: row.version-1 },
                    "version mismatch, update category failed"
                );
            }

            return row;
        }
        catch (error: any) {
            throw RepoError.create({
                error,
                context: { id },
                message: "update category failed"
            });
        }
    }

    async deleteCategory(id: string, expectedVersion: number): Promise<boolean> {
        try {
            const [deletedCategory] = await this.db
                .delete(categories)
                .where(eq(categories.id, id))
                .returning();

            if (deletedCategory && deletedCategory.version !== expectedVersion) {
                throw new VersionMismatchError( 
                    { id, expectedVersion, atualVersion: deletedCategory.version },
                     "version mismatch, update category failed"
                );
            }

            return typeof deletedCategory !== undefined;
        }
        catch (error: any) {
            throw RepoError.create({
                error,
                context: { id },
                message: "delete category failed"
            });
        }
    }
}