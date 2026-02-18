import { Budget, Category, Expense, Participant, Event } from "../data/Models.js";
import { CreateBudgetDto, AddCategoryDto, AddExpenseDto, EventDto, EditExpenseDto, 
    DeleteExpenseDto, EditCategoryDto, EditBudgetDto, DeleteCategoryDto, DeleteBudgetDto,
     AddParticipantDto, RemoveParticipantDto, 
     BudgetDto,
     CategoryDto,
     ExpenseDto,
     UserDto,
     ParticipantDto} from "./Dtos.js";
import { EventType } from "../core/Types.js";
import { generateUUID } from "../core/Helpers.js";

// dto -> model

export function toBudget(dto: CreateBudgetDto): Budget {
    const { id, title, details, when, actorUserId } = dto;
    return {
        id,
        createdBy: actorUserId,
        title,
        details: details ?? null,
        version: 1,
        offlineLastModified: when,
        serverCreatedAt: Date.now(),
        isDeleted: false,
    };
}

export function toCategory(dto: AddCategoryDto): Category {
    const { id, budgetId, name, allocate, actorUserId, when } = dto;
    return {
        id,
        budgetId,
        createdBy: actorUserId,
        name,
        allocate,
        version: 1,
        offlineLastModified: when,
        serverCreatedAt: Date.now()
    };
}

export function toExpense(dto: AddExpenseDto): Expense {
    const { id, budgetId, categoryId, date, amount, note, when, actorUserId } = dto;
    return {
        id, 
        budgetId, 
        categoryId, 
        createdBy: actorUserId,
        date, 
        amount, 
        note: note ?? null,
        version: 1,
        offlineLastModified: when,
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

export function toBudgetDto(budget: any, participant?: ParticipantDto): BudgetDto {
    const { id, createdBy, title, details, version, offlineLastModified } = budget;
    return {
        id, createdBy, title,details, version, offlineLastModified, participant
    }
}

export function toCategoryDto(category: any): CategoryDto {
    const { id, budgetId, createdBy, name, allocate, version, offlineLastModified } = category;
    return {
        id, budgetId, createdBy, name, allocate, version, offlineLastModified
    };
}

export function toExpenseDto(expense: any): ExpenseDto {
    const { id, budgetId, categoryId, createdBy, date, amount, note, version, offlineLastModified } = expense;
    return {
        id, budgetId, categoryId, createdBy, date, amount, note, version, offlineLastModified 
    };
}

export function toEventDto(value: any): EventDto {
    const { type: event, sequence, budgetId, userId: actorUserId, recordId, when, data } = value;
    return {
        event,
        sequence,
        budgetId,
        actorUserId,
        recordId,
        when,
        ...(data ?? {})
    };
}

export function toUserDto(user: any): UserDto {
    const { id, firstName, lastName } = user;
    return {
        id,
        firstName,
        lastName: lastName === null ? undefined : lastName
    };
}


export class EventBuilder {
    private static base(budgetId: string, userId: string): any {
        const now = Date.now();
        return {
            id: generateUUID(),
            budgetId,
            userId,
            sequence: 0,
            serverCreatedAt: now,
            when: now,
            data: {}
        };
    }

    static createBudget(budget: Budget): Event {
        const { id: budgetId, title, details, createdBy: userId, version, offlineLastModified: when } = budget;
        return {
            ...this.base(budgetId,userId),
            type: EventType.CREATE_BUDGET,
            recordId: budgetId,
            when,
            data: { title, details, version }
        };
    }

    static editBudget(dto: EditBudgetDto, newVersion: number): Event {
        const { id, title, details, actorUserId, when } = dto;
        return {
            ...this.base(id, actorUserId),
            type: EventType.EDIT_BUDGET,
            recordId: id,
            when,
            data: { title, details, version: newVersion }
        };
    }

    static deleteBudget(dto: DeleteBudgetDto): Event {
        const { id: budgetId, actorUserId: userId, when } = dto;
        return {
            ...this.base(budgetId,userId),
            type: EventType.DELETE_BUDGET,
            recordId: budgetId,
            when,
        };
    }


    static addCategory(category: Category): Event {
        const { id, budgetId, name, allocate, version, createdBy: userId, offlineLastModified: when } = category;
        return {
            ...this.base(budgetId,userId),
            type: EventType.ADD_CATEGORY,
            recordId: id,
            when,
            data: { name, allocate, version }
        };
    }

    static editCategory(dto: EditCategoryDto, newVersion: number): Event {
        const { id: recordId, budgetId, actorUserId: userId, name, allocate, when } = dto;
        return {
            ...this.base(budgetId,userId),
            type: EventType.ADD_CATEGORY,
            recordId,
            when,
            data: { name, allocate, version: newVersion }
        };
    }

    static deleteCategory(dto: DeleteCategoryDto): Event {
        const { id: recordId, budgetId, actorUserId: userId, version, when } = dto;
        return {
            ...this.base(budgetId,userId),
            type: EventType.ADD_CATEGORY,
            recordId,
            when,
            data: { version }
        };
    }

    static addExpense(expense: Expense): Event {
        const { id, budgetId, categoryId, createdBy: userId, date, note, amount, version, offlineLastModified: when } = expense;
        return {
            ...this.base(budgetId,userId),
            type: EventType.ADD_EXPENSE,
            recordId: id,
            when,
            data: { categoryId, date, note, amount, version }
        };
    }

    static editExpense(dto: EditExpenseDto, newVersion: number): Event {
        const { id: recordId, budgetId, actorUserId: userId, date, amount, note, when } = dto;
        return {
            ...this.base(budgetId,userId),
            type: EventType.EDIT_EXPENSE,
            recordId,
            when,
            data: { date, note, amount, version: newVersion }
        };
    }

    static deleteExpense(dto: DeleteExpenseDto): Event {
        const { id: recordId, budgetId, actorUserId: userId, version, when } = dto;
        return {
            ...this.base(budgetId,userId),
            type: EventType.DELETE_EXPENSE,
            recordId,
            when,
            data: { version }
        };
    }

    static addParticipant(actorUserId: string, participant: Participant): Event {
        const { budgetId, userId } = participant;
        return {
            ...this.base(budgetId, actorUserId),
            type: EventType.ADD_PARTICIPANT,
            recordId: userId,
        };
    }

    static removeParticipant(dto: RemoveParticipantDto): Event {
        const { budgetId, actorUserId, userId } = dto;
        return {
            ...this.base(budgetId, actorUserId),
            type: EventType.REMOVE_PARTICIPANT,
            recordId: userId,
        };
    }
}