import { Budget, Category, Expense, Participant, Event } from "../data/Models.js";
import { CreateBudgetDto, AddCategoryDto, AddExpenseDto, EventDto, EditExpenseDto, DeleteExpenseDto, EditCategoryDto, EditBudgetDto, DeleteCategoryDto, DeleteBudgetDto, AddParticipantDto, RemoveParticipantDto } from "./Dtos.js";
import { EventType } from "../core/CoreTypes.js";
import { generateUUID } from "../core/Helpers.js";

// dto -> model

export function toBudget(dto: CreateBudgetDto): Budget {
    const { id, title, details, lastModified, actorUserId } = dto;
    return {
        id,
        createdBy: actorUserId,
        title,
        details: details ?? null,
        version: 1,
        offlineLastModified: lastModified,
        serverCreatedAt: Date.now(),
    };
}

export function toCategory(dto: AddCategoryDto): Category {
    const { id, budgetId, name, allocate, actorUserId, lastModified } = dto;
    return {
        id,
        budgetId,
        createdBy: actorUserId,
        name,
        allocate,
        version: 1,
        offlineLastModified: lastModified,
        serverCreatedAt: Date.now()
    };
}

export function toExpense(dto: AddExpenseDto): Expense {
    const { id, budgetId, categoryId, date, amount, note, lastModified, actorUserId } = dto;
    return {
        id, 
        budgetId, 
        categoryId, 
        createdBy: actorUserId,
        date, 
        amount, 
        note: note ?? null,
        version: 1,
        offlineLastModified: lastModified,
        serverCreatedAt: Date.now()
    };
}

export function toParticipant(dto: AddParticipantDto): Participant {
    return {
        budgetId: dto.budgetId,
        userId: dto.userId
    };
}

// model -> dto

export function toEventDto(event: Event): EventDto {
    const { budgetId, sequence, type, when, userId: actorUserId, recordId, data } = event;
    return {
        budgetId,
        sequence,
        actorUserId,
        type: type as EventType,
        when,
        recordId,
        data: data as Record<string,any>
    };
}


export class EventBuilder {
    private static base(budgetId: string, userId: string): Pick<Event, "id"|"budgetId"|"userId"|"sequence"|"serverCreatedAt"|"data"> {
        return {
            id: generateUUID(),
            budgetId,
            userId,
            sequence: 0,
            serverCreatedAt: Date.now(),
            data: {}
        };
    }

    static createBudget(budget: Budget): Event {
        const { id: budgetId, title, details, createdBy: userId, version, offlineLastModified: when } = budget;
        return {
            ...this.base(budgetId,userId),
            type: EventType.CREATE_BUDGET,
            when,
            recordId: budgetId,
            data: { title, details, version }
        };
    }

    static editBudget(dto: EditBudgetDto, newVersion: number): Event {
        const { id, title, details, actorUserId, lastModified: when } = dto;
        return {
            ...this.base(id, actorUserId),
            type: EventType.EDIT_BUDGET,
            when,
            recordId: id,
            data: { title, details, version: newVersion }
        };
    }

    static deleteBudget(dto: DeleteBudgetDto): Event {
        const { id: budgetId, actorUserId: userId } = dto;
        return {
            ...this.base(budgetId,userId),
            type: EventType.DELETE_BUDGET,
            when: Date.now(),
            recordId: budgetId,
        };
    }


    static addCategory(category: Category): Event {
        const { id, budgetId, name, allocate, version, createdBy: userId, offlineLastModified: when } = category;
        return {
            ...this.base(budgetId,userId),
            type: EventType.ADD_CATEGORY,
            when,
            recordId: id,
            data: { name, allocate, version }
        };
    }

    static editCategory(dto: EditCategoryDto, newVersion: number): Event {
        const { id: recordId, budgetId, actorUserId: userId, name, allocate, lastModified: when } = dto;
        return {
            ...this.base(budgetId,userId),
            type: EventType.ADD_CATEGORY,
            when,
            recordId,
            data: { name, allocate, version: newVersion }
        };
    }

    static addExpense(expense: Expense): Event {
        const { id, budgetId, categoryId, createdBy: userId, date, note, amount, version, offlineLastModified: when } = expense;
        return {
            ...this.base(budgetId,userId),
            type: EventType.ADD_EXPENSE,
            when,
            recordId: id,
            data: { categoryId, date, note, amount, version }
        };
    }

    static editExpense(dto: EditExpenseDto, newVersion: number): Event {
        const { id: recordId, budgetId, actorUserId: userId, date, amount, note, lastModified: when} = dto;
        return {
            ...this.base(budgetId,userId),
            type: EventType.EDIT_EXPENSE,
            when,
            recordId,
            data: { date, note, amount, version: newVersion }
        };
    }

    static deleteExpense(dto: DeleteExpenseDto): Event {
        const { id: recordId, budgetId, actorUserId: userId, lastModified: when } = dto;
        return {
            ...this.base(budgetId,userId),
            type: EventType.DELETE_EXPENSE,
            when,
            recordId,
        };
    }

    static addParticipant(actorUserId: string, participant: Participant): Event {
        const { budgetId, userId } = participant;
        return {
            ...this.base(budgetId, actorUserId),
            type: EventType.ADD_PARTICIPANT,
            when: Date.now(),
            recordId: userId,
        };
    }

    static removeParticipant(dto: RemoveParticipantDto): Event {
        const { budgetId, actorUserId, userId } = dto;
        return {
            ...this.base(budgetId, actorUserId),
            type: EventType.REMOVE_PARTICIPANT,
            when: Date.now(),
            recordId: userId,
        };
    }
}