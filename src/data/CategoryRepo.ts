import { Category, UpdateCategoryModel } from "./Models.js";

export interface CategoryRepo {
    
    insertCategory(category: Category): Promise<Category>;

    getBudgetCategories(budgetId: string): Promise<Category[]>;

    updateCategory(id: string, updates: UpdateCategoryModel, expectedVersion: number, newLastModified: number): Promise<Category>;

    deleteCategory(id: string, expectedVersion: number): Promise<void>;
}