// Budget DTOs

import { EventType } from "../core/Types.js"

export type CreateBudgetDto = {
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

export type BudgetDto = {
    id: string,
    createdBy?: string,
    title?: string,
    details?: string | null,
    version: number,
    offlineLastModified?: number,
    participant?: ParticipantDto,
}

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

export type CategoryDto = {
    id: string,
    budgetId: string,
    createdBy: string,
    name: string,
    allocate: string,
    version: number,
    offlineLastModified: number,
}

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

export type ExpenseDto = {
    id: string,
    budgetId: string,
    categoryId: string,
    createdBy: string,
    date: string,
    amount: string,
    note: string | null,
    version: number,
    offlineLastModified: number,
}

// Participant DTOs

export type AddParticipantDto = {
    // add participant is not an offline event
    // therefore client never sends eventId

    budgetId: string,
    actorUserId: string,
    userId: string,             // participant beging added
}

export type RemoveParticipantDto = {
    // remove participant is not an offline event
    // therefore client never sends eventId

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
    event: EventType,
    sequence: number,
    budgetId: string,
    recordId: string,
    actorUserId: string,
    when: number,
    [k: string]: any,
}

// UserDto
export type UserDto = {
    id: string,
    firstName: string,
    lastName?: string,
}