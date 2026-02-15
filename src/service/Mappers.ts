import { Budget, Category, Expense, Participant, Event } from "../data/Models.js";
import { CreateBudgetDto, AddCategoryDto, AddExpenseDto, EventDto, EditExpenseDto, 
    DeleteExpenseDto, EditCategoryDto, EditBudgetDto, DeleteCategoryDto, DeleteBudgetDto,
     AddParticipantDto, RemoveParticipantDto, 
     BudgetDto,
     CategoryDto,
     ExpenseDto,
     UserDto} from "./Dtos.js";
import { EventType } from "../core/Types.js";
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

export function toBudgetDto(budget: any): BudgetDto {
    const { id, createdBy, title, details, version, offlineLastModified: lastModified } = budget;
    return {
        id, 
        createdBy, 
        title,
        details: details ?? undefined, 
        version,
        lastModified,
    }
}

export function toCategoryDto(category: any): CategoryDto {
    const { id, budgetId, createdBy, name, allocate, version, offlineLastModified: lastModified } = category;
    return {
        id, budgetId, createdBy, name, allocate, version, lastModified
    };
}

export function toExpenseDto(expense: any): ExpenseDto {
    const { id, budgetId, categoryId, createdBy, date, amount, note, version, offlineLastModified: lastModified} = expense;
    return {
        id, budgetId, categoryId, createdBy, date, amount, 
        note: note ?? undefined, 
        version, lastModified 
    };
}

export function toEventDto(event: any): EventDto {
    const { budgetId, type, userId: actorUserId, recordId, data } = event;
    return {
        type: type as EventType,
        budgetId,
        actorUserId,
        recordId,
        data: data as Record<string,any>
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
        const { id: budgetId, title, details, createdBy: userId, version, offlineLastModified } = budget;
        return {
            ...this.base(budgetId,userId),
            type: EventType.CREATE_BUDGET,
            recordId: budgetId,
            data: { title, details, version, offlineLastModified }
        };
    }

    static editBudget(dto: EditBudgetDto, newVersion: number): Event {
        const { id, title, details, actorUserId, lastModified: offlineLastModified } = dto;
        return {
            ...this.base(id, actorUserId),
            type: EventType.EDIT_BUDGET,
            recordId: id,
            data: { title, details, version: newVersion, offlineLastModified }
        };
    }

    static deleteBudget(dto: DeleteBudgetDto): Event {
        const { id: budgetId, actorUserId: userId } = dto;
        return {
            ...this.base(budgetId,userId),
            type: EventType.DELETE_BUDGET,
            recordId: budgetId,
        };
    }


    static addCategory(category: Category): Event {
        const { id, budgetId, name, allocate, version, createdBy: userId, offlineLastModified } = category;
        return {
            ...this.base(budgetId,userId),
            type: EventType.ADD_CATEGORY,
            recordId: id,
            data: { name, allocate, version, offlineLastModified }
        };
    }

    static editCategory(dto: EditCategoryDto, newVersion: number): Event {
        const { id: recordId, budgetId, actorUserId: userId, name, allocate, lastModified: offlineLastModified } = dto;
        return {
            ...this.base(budgetId,userId),
            type: EventType.ADD_CATEGORY,
            recordId,
            data: { name, allocate, version: newVersion, offlineLastModified }
        };
    }

    static deleteCategory(dto: DeleteCategoryDto): Event {
        const { id: recordId, budgetId, actorUserId: userId, version, lastModified: offlineLastModified } = dto;
        return {
            ...this.base(budgetId,userId),
            type: EventType.ADD_CATEGORY,
            recordId,
            data: { version, offlineLastModified }
        };
    }

    static addExpense(expense: Expense): Event {
        const { id, budgetId, categoryId, createdBy: userId, date, note, amount, version, offlineLastModified } = expense;
        return {
            ...this.base(budgetId,userId),
            type: EventType.ADD_EXPENSE,
            recordId: id,
            data: { categoryId, date, note, amount, version, offlineLastModified }
        };
    }

    static editExpense(dto: EditExpenseDto, newVersion: number): Event {
        const { id: recordId, budgetId, actorUserId: userId, date, amount, note, lastModified: offlineLastModified } = dto;
        return {
            ...this.base(budgetId,userId),
            type: EventType.EDIT_EXPENSE,
            recordId,
            data: { date, note, amount, version: newVersion, offlineLastModified }
        };
    }

    static deleteExpense(dto: DeleteExpenseDto): Event {
        const { id: recordId, budgetId, actorUserId: userId, version, lastModified: offlineLastModified } = dto;
        return {
            ...this.base(budgetId,userId),
            type: EventType.DELETE_EXPENSE,
            recordId,
            data: { version, offlineLastModified }
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