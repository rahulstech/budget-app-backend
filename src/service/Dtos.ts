// Budget DTOs

import { EventType } from "../core/Types.js"
import { Budget, Category, Expense, ParticipantUser } from "../data/Models.js"

export type CreateBudgetDto = {
    eventId: string,
    id: string,
    actorUserId: string,
    title: string,
    details?: string,
    when: number,
}

export type EditBudgetDto = {
    eventId: string,
    id: string,
    actorUserId: string,
    title?: string,
    details?: string,
    version: number,
    when: number,
}

export type DeleteBudgetDto = {
    eventId: string,
    id: string,
    actorUserId: string,
    version: number,
    when: number,
}

export type BudgetDto = Omit<Budget,"serverCreatedAt"|"isDeleted">;

// Category DTOs

export type AddCategoryDto = {
    eventId: string,
    id: string,
    budgetId: string,
    actorUserId: string,
    name: string,
    allocate: string,
    when: number,
}

export type EditCategoryDto = {
    eventId: string,
    id: string,
    budgetId: string,
    actorUserId: string,
    name?: string,
    allocate?: string,
    version: number,
    when: number,
}

export type DeleteCategoryDto = {
    eventId: string,
    id: string,
    budgetId: string,
    actorUserId: string,
    version: number,
    when: number,
}

export type CategoryDto = Omit<Category,"serverCreatedAt">;

// expense DTOs

export type AddExpenseDto = {
    eventId: string,
    id: string,
    budgetId: string,
    categoryId: string,
    actorUserId: string,
    date: string,
    amount: string,
    note?: string,
    when: number,
}

export type EditExpenseDto = {
    eventId: string,
    id: string,
    budgetId: string,
    actorUserId: string,
    date?: string,
    amount?: string,
    note?: string,
    version: number,
    when: number,
}

export type DeleteExpenseDto = {
    eventId: string,
    id: string,
    budgetId: string,
    categoryId?: string,
    actorUserId: string,
    version: number,
    when: number,
}

export type ExpenseDto = Omit<Expense,"serverCreatedAt">;

// Participant DTOs

export type AddParticipantDto = {
    // add participant is not an offline event
    // therefore client never sends eventId

    budgetId: string,
    actorUserId: string,
    userId: string,             // participant beging added
    joinedAt: number,
}

export type RemoveParticipantDto = {
    // remove participant is not an offline event
    // therefore client never sends eventId

    budgetId: string,
    actorUserId: string,
    userId: string,           // participant being removed
}

export type ParticipantDto = Omit<ParticipantUser,"lastModified">;

// Event DTOs

export type EventDto = {
    eventId: string,
    event: EventType,
    budgetId: string,
    recordId?: string,
    [k: string]: any,
}

// UserDto
export type UserDto = {
    id: string,
    firstName: string | null,
    lastName: string | null,
    email: string | null,
    photo: string | null
}