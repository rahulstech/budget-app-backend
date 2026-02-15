// Budget DTOs

import { EventType } from "../core/Types.js"

export type CreateBudgetDto = {
    id: string,
    actorUserId: string,
    title: string,
    details?: string,
    lastModified: number,
}

export type EditBudgetDto = {
    id: string,
    actorUserId: string,
    title?: string,
    details?: string,
    version: number,
    lastModified: number,
}

export type DeleteBudgetDto = {
    id: string,
    actorUserId: string,
    version: number,
    lastModified: number,
}

export type BudgetDto = {
    id: string,
    createdBy: string,
    title: string,
    details?: string,
    version: number,
    lastModified: number,
}

// Category DTOs

export type AddCategoryDto = {
    id: string,
    budgetId: string,
    actorUserId: string,
    name: string,
    allocate: string,
    lastModified: number,
}

export type EditCategoryDto = {
    id: string,
    budgetId: string,
    actorUserId: string,
    name?: string,
    allocate?: string,
    version: number,
    lastModified: number,
}

export type DeleteCategoryDto = {
    id: string,
    budgetId: string,
    actorUserId: string,
    version: number,
    lastModified: number,
}

export type CategoryDto = {
    id: string,
    budgetId: string,
    name: string,
    allocate: string,
    version: number,
    lastModified: number,
    createdBy: string,
}

// expense DTOs

export type AddExpenseDto = {
    id: string,
    budgetId: string,
    categoryId: string,
    actorUserId: string,
    date: string,
    amount: string,
    note?: string,
    lastModified: number,
}

export type EditExpenseDto = {
    id: string,
    budgetId: string,
    actorUserId: string,
    date?: string,
    amount?: string,
    note?: string,
    version: number,
    lastModified: number,
}

export type DeleteExpenseDto = {
    id: string,
    budgetId: string,
    categoryId?: string,
    actorUserId: string,
    version: number,
    lastModified: number,
}

export type ExpenseDto = {
    id: string,
    budgetId: string,
    categoryId: string,
    createdBy: string,
    date: string,
    amount: string,
    note?: string,
    version: number,
    lastModified: number,
}

// Participant DTOs

export type AddParticipantDto = {
    budgetId: string,
    actorUserId: string,
    userId: string,             // participant beging added
}

export type RemoveParticipantDto = {
    budgetId: string,
    actorUserId: string,
    userId: string,           // participant being removed
}

export type ParticipantDto = {
    id: string,
    budgetId?: string,
    firstName: string | null,
    lastName: string | null,
};

// Event DTOs

export type EventDto = {
    type: EventType,
    budgetId: string,
    recordId: string,
    actorUserId: string,
    data?: Record<string,any>,
}

// UserDto
export type UserDto = {
    id: string,
    firstName: string,
    lastName?: string,
}