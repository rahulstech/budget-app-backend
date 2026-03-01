import { Category, UpdateCategoryModel } from "./Models.js";

export interface CategoryRepo {
    
    insertCategory(category: Category): Promise<Category>;

    getCategoryById(id: string): Promise<Category | null>;

    getBudgetCategories(budgetId: string): Promise<Omit<Category,"serverCreatedAt">[]>;

    updateCategory(id: string, updates: UpdateCategoryModel, expectedVersion: number, newLastModified: number): Promise<Category>;

    deleteCategory(id: string, expectedVersion: number): Promise<boolean>;
}