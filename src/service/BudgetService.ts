import { RepoClient } from "../data/RepoClient.js";
import { RepoError } from "../data/RepoError.js";
import { RepoFactory } from "../data/RepoFactory.js";
import { BudgetPolicy, BudgetPolicyErrorCode } from "./BudgetPolicy.js";
import { AddCategoryDto, AddExpenseDto, AddParticipantDto, CreateBudgetDto, DeleteBudgetDto,
     DeleteCategoryDto, DeleteExpenseDto, EditBudgetDto, EditCategoryDto, EditExpenseDto, 
     RemoveParticipantDto, EventDto,
     BudgetDto,
     CategoryDto,
     ExpenseDto,
     ParticipantDto} from "./Dtos.js";
import { EventBuilder, toEventDto, toParticipant,
     toCategory, toExpense, toBudget, 
     toBudgetDto,
     toCategoryDto,
     toExpenseDto} from "./Mappers.js";
import { AppError } from "../core/AppError.js";
import { HttpError } from "../core/HttpError.js";
import { EventType, PagedResult } from "../core/Types.js";
import { BudgetRepo } from "../data/BudgetRepo.js";
import { ParticipantUser, UserPublicInfo } from "../data/Models.js";
import { isDevEnvironment } from "../core/Environment.js";
import { logDebug, logError } from "../core/Logger.js";

const MAX_RESULTS = 100;

export class BudgetService {

    private readonly policy: BudgetPolicy;

    private readonly budgetRepo: BudgetRepo;

    constructor(private readonly client: RepoClient) {
        const factory = client.getRepoFactory();
        this.policy = new BudgetPolicy(factory);
        this.budgetRepo = factory.createBudgetRepo();
    }

    async canGetSnapShotOrThrow(budgetId: string, userId: string): Promise<void> {
        await this.policy.canGetSnapShort(budgetId,userId);
    }

    /**
     * CREATE_BUDGET
     *
     * Creates a new budget and implicitly adds the creator
     * as the first participant.
     *
     * Required conditions:
     * - Budget id must not already exist
     *
     * Resulting state:
     * - New budget row
     * - Creator added as participant (joinedAt = now)
     * - Sync event recorded
     */
    async createBudget(dto: CreateBudgetDto): Promise<EventDto> {
        try {
            await this.policy.canAddBudget(dto.id);

            if (isDevEnvironment()) {
                logDebug("budgetservice.createbudget.dto",dto)
            }

            return await this.client.runInTransaction(async (factory) => {
                const budgetRepo = factory.createBudgetRepo();
                const eventRepo = factory.createEventRepo();

                // insert budget
                const budget = await budgetRepo.insertBudget(toBudget(dto));

                // insert create budget event
                await eventRepo.insertEvent(EventBuilder.createBudget(dto.eventId,budget));

                // insert participant 
                const { participant } = await this.insertParticipant(factory, {
                    budgetId: budget.id,
                    actorUserId: budget.createdBy,
                    userId: budget.createdBy,
                    joinedAt: dto.when
                });

                // return event
                return {
                    eventId: dto.eventId,
                    event: EventType.CREATE_BUDGET,
                    budgetId: budget.id,
                    version: budget.version,
                    participant,
                };
            });
        }
        catch(err: any) {
            if (isDevEnvironment()) {
                logError("budgetservice.createbudget.err",{err})
            }

            if (this.isBudgetPolicyError(err,BudgetPolicyErrorCode.BUDGET_EXISTS)) {
                const oldEvent = await this.getEventById(dto.eventId);
                if (oldEvent !== null) {
                    const { eventId, event, budgetId, actorId, version } = oldEvent;
                    const participant = await this.client.getRepoFactory().createParticipantRepo().findParticipantById(actorId, budgetId);
                    return {
                        eventId,
                        event,
                        budgetId,
                        version,
                        participant,
                    };
                }
            }
            throw this.mapError(err);
        }
    }

    async getBudget(budgetId: string): Promise<BudgetDto> {
        const budgetRepo = this.client.getRepoFactory().createBudgetRepo();
        const budget = await budgetRepo.getBudgetById(budgetId);
        if (null === budget) {
            throw new HttpError.NotFound();
        }

        return toBudgetDto(budget);
    }

    async getBudgetsOfParticipant(userId: string, key: number, count: number): Promise<PagedResult<number, BudgetDto>> {
        const limit = Math.min(count, 100); // hard cap
        const offset = (key-1)*limit;
        const items = await this.budgetRepo.getBudgetsOfParticipant(userId, limit, offset);
        return { key, items: items.map(b => toBudgetDto(b as any)) };
    }

    /**
     * EDIT_BUDGET
     *
     * Updates mutable fields of a budget.
     *
     * Required conditions:
     * - Budget must exist
     * - Actor must be a participant at event time
     * - Version must match (optimistic locking)
     *
     * Resulting state:
     * - Budget updated
     * - Sync event recorded
     */
    async editBudget(dto: EditBudgetDto): Promise<EventDto> {

        const { eventId, id, actorUserId, version, when, title, details } = dto;

        // check if event already exists (idempotency)
        const oldEvent = await this.getEventById(eventId);
        if (oldEvent) return oldEvent;

        // check edit allowed
        await this.policy.canEditBudget(id, actorUserId, when);

        // perform edit
        try {
            return await this.client.runInTransaction(async (factory) => {
                const budgetRepo = factory.createBudgetRepo();
                const eventRepo = factory.createEventRepo();

                // update budget
                const budget = await budgetRepo.updateBudget(
                    id,
                    { title, details }, 
                    version,
                    when
                );

                // insert event
                const event = await eventRepo.insertEvent(EventBuilder.editBudget(dto, budget.version));

                return toEventDto(event);
            });
        }
        catch(err: any) {
            if (this.isVersionMisMatchError(err)) {
                return {
                    eventId,
                    event: EventType.EDIT_BUDGET,
                    budgetId: id,
                    currentRecord: toBudgetDto(err.context)
                }
            }
            throw this.mapError(err);
        }
        
    }

    /**
     * DELETE_BUDGET
     *
     * Deletes a budget.
     *
     * Required conditions:
     * - Budget must exist
     * - Actor must be the creator of the budget
     *
     * Resulting state:
     * - Budget removed (or soft-deleted)
     * - Sync event recorded
     */
    async deleteBudget(dto: DeleteBudgetDto): Promise<EventDto> {

        const { eventId, id, actorUserId, version, when } = dto;

        const oldEvent = await this.getEventById(dto.eventId);
        if (oldEvent) return oldEvent;

        // check policy
        await this.policy.canDeleteBudget(dto.id, dto.actorUserId);

        try {
            // mark delete
            return await this.client.runInTransaction(async (factory) => {
                const budgetRepo = factory.createBudgetRepo();
                const eventRepo = factory.createEventRepo();

                // mark the budget deleted
                const budget = await budgetRepo.updateBudget(id, { isDeleted: true }, version, when);

                // record sync event (intent + authority)
                const event = await eventRepo.insertEvent(EventBuilder.deleteBudget({
                    ...dto,
                    version: budget.version
                }));

                return toEventDto(event);
            });
        }
        catch(err: any) {
            if (this.isVersionMisMatchError(err)) {
                return {
                    eventId,
                    event: EventType.DELETE_BUDGET,
                    budgetId: id,
                    currentRecord: toBudgetDto(err.context)
                };
            }
            throw this.mapError(err); 
        }
    }


    /* =========================================================
       Participant events
       ========================================================= */

    /**
     * ADD_PARTICIPANT
     *
     * Adds a user as a participant to a budget.
     *
     * Required conditions:
     * - Budget must exist
     * - Actor must be a participant at event time
     * - Target user must not already be an active participant
     *
     * Resulting state:
     * - Participant row inserted
     * - Sync event recorded
     */
    async addParticipant(dto: AddParticipantDto): Promise<EventDto> {

        await this.policy.canAddParticipant(dto.budgetId, dto.userId);

        const { event } = await this.client.runInTransaction(async (factory) => {
            return this.insertParticipant(factory, dto);
        });
        return event;
    }

    async getParticipantsOfBudget(budgetId: string): Promise<ParticipantDto[]> {
        const repo = this.client.getRepoFactory().createParticipantRepo();
        const results = await repo.getParticipantsOfBudget(budgetId);
        return results;
    }

    /**
     * REMOVE_PARTICIPANT
     *
     * Removes a participant from a budget.
     *
     * Required conditions:
     * - Target user must be an active participant at event time
     * - Actor must be a participant at event time
     *
     * Resulting state:
     * - Participant leftAtMillis set
     * - Sync event recorded
     */
    async removeParticipant(dto: RemoveParticipantDto): Promise<EventDto> {
        const { budgetId, userId, actorUserId } = dto;

        await this.policy.canRemoveParticipant(budgetId, actorUserId, userId);

        return this.client.runInTransaction(async (factory) => {
            const participantRepo = factory.createParticipantRepo();
            const eventRepo = factory.createEventRepo();
        
            try {
                // mark participant left
                await participantRepo.deleteParticipant(budgetId, userId);

                // record event
                const event = await eventRepo.insertEvent(EventBuilder.removeParticipant(dto));

                return toEventDto(event);
            }
            catch (error: any) {
                throw this.mapError(error);
            }
        });
    }

    /* =========================================================
       Category events
       ========================================================= */

    /**
     * ADD_CATEGORY
     *
     * Adds a new category to a budget.
     *
     * Required conditions:
     * - Category id must not already exist
     * - Actor must be a participant at event time
     *
     * Resulting state:
     * - Category row inserted
     * - Sync event recorded
     */
    async addCategory(dto: AddCategoryDto): Promise<EventDto> { 
        try {
            await this.policy.canAddCategory(dto.budgetId, dto.actorUserId, dto.when, dto.id);

            return this.client.runInTransaction(async (factory) => {
                const categoryRepo = factory.createCategoryRepo();
                const eventRepo = factory.createEventRepo();

                // insert category
                const category = await categoryRepo.insertCategory(toCategory(dto));

                // insert sync event
                const event = await eventRepo.insertEvent(EventBuilder.addCategory(dto.eventId,category));

                // return categorydto
                return toEventDto(event);
            })
        }
        catch(err: any) {
            if (this.isBudgetPolicyError(err,BudgetPolicyErrorCode.CATEGORY_EXISTS)) {
                return (await this.getEventById(dto.eventId))!!;
            }

            throw this.mapError(err);
        }
        
    }

    async getCategoriesOfBudget(budgetId: string): Promise<CategoryDto[]> {
        const categoryRepo = this.client.getRepoFactory().createCategoryRepo();
        const result = await categoryRepo.getBudgetCategories(budgetId);
        return result.map(c => toCategoryDto(c as any));
    }

    /**
     * EDIT_CATEGORY
     *
     * Updates mutable fields of a category.
     *
     * Required conditions:
     * - Category must exist
     * - Category must belong to the given budget
     * - Actor must be a participant at event time
     * - Version must match
     *
     * Resulting state:
     * - Category updated
     * - Sync event recorded
     */
    async editCategory(dto: EditCategoryDto): Promise<EventDto> {

        const { id, budgetId, name, allocate, actorUserId, version: expectedVersion, when } = dto

        // check if event already exists (idempotency)
        const oldEvent = await this.getEventById(dto.eventId);
        if (oldEvent) return oldEvent;
        
        // check edit policy
        await this.policy.canEditCategory(budgetId, actorUserId, when, id);

        try {
            return this.client.runInTransaction(async (factory) => {
                const categoryRepo = factory.createCategoryRepo();
                const eventRepo = factory.createEventRepo();
                
                // update category
                const category = await categoryRepo.updateCategory(id, {name,allocate}, expectedVersion, when);

                // insert sync event
                const event = await eventRepo.insertEvent(EventBuilder.editCategory(dto, category.version));

                // return sync event
                return toEventDto(event);
            });
        }
        catch(err: any) {
            if (this.isVersionMisMatchError(err)) {
                return {
                    eventId: dto.eventId,
                    event: EventType.EDIT_CATEGORY,
                    budgetId: dto.budgetId,
                    currentRecord: toCategoryDto(err.context)
                };
            }
            throw this.mapError(err);
        }
    }

    /**
     * DELETE_CATEGORY
     *
     * Deletes a category from a budget.
     *
     * Required conditions:
     * - Category must exist
     * - Category must belong to the budget
     * - Actor must be a participant at event time
     *
     * Resulting state:
     * - Category removed
     * - Sync event recorded
     */
    async deleteCategory(dto: DeleteCategoryDto): Promise<EventDto> {

        const { eventId, id, budgetId, actorUserId, version, when } = dto;

        const oldEvent = await this.getEventById(dto.eventId);
        if (oldEvent) return oldEvent;

        // is event allowed?
        await this.policy.canDeleteCategory(budgetId, actorUserId, when);

        try {
            return await this.client.runInTransaction(async (factory) => {
                const categoryRepo = factory.createCategoryRepo();
                const eventRepo = factory.createEventRepo();
                // delete category
                const deleted = await categoryRepo.deleteCategory(id,version);

                // add event if category was exist
                if (deleted) {
                    // insert sync event
                    const event = await eventRepo.insertEvent(EventBuilder.deleteCategory(dto));

                    // return sync event
                    return toEventDto(event);
                }

                return {
                    eventId,
                    event: EventType.DELETE_CATEGORY,
                    budgetId,
                    recordId: id,
                    version,
                    when
                };
            });
        }
        catch(err: any) {
            this.logErrorIfDev("budgetservice.deletecategory.err",err);

            if (this.isVersionMisMatchError(err)) {
                return {
                    eventId: dto.eventId,
                    event: EventType.DELETE_CATEGORY,
                    budgetId: dto.budgetId,
                    currentRecord: toCategoryDto(err.context)
                };
            }

            throw this.mapError(err);
        }
    }

    /* =========================================================
       Expense events
       ========================================================= */

    /**
     * ADD_EXPENSE
     *
     * Adds a new expense under a category.
     *
     * Required conditions:
     * - Expense id must not already exist
     * - Category must belong to the budget
     * - Actor must be a participant at event time
     *
     * Resulting state:
     * - Expense row inserted
     * - Sync event recorded
     */
    async addExpense(dto: AddExpenseDto): Promise<EventDto> {
        try {
            // check policy
            await this.policy.canAddExpense(dto.budgetId, dto.actorUserId, dto.when,  dto.id, dto.categoryId);

            return this.client.runInTransaction(async (factory) => {
                const expenseRepo = factory.createExpenseRepo();
                const eventRepo = factory.createEventRepo();

                // insert expense 
                const expense = await expenseRepo.insertExpense(toExpense(dto));

                // insert event
                const event = await eventRepo.insertEvent(EventBuilder.addExpense(dto.eventId,expense));

                return toEventDto(event);
            });
        }
        catch(err: any) {
            if (this.isBudgetPolicyError(err,BudgetPolicyErrorCode.EXPENSE_EXISTS)) {
                return (await this.getEventById(dto.eventId))!!;
            }
            throw this.mapError(err);
        }
    }

    async getExpensesOfBudget(budgetId: string, key: number, count: number): Promise<PagedResult<number,ExpenseDto>> {
        const limit = Math.min(count, MAX_RESULTS);
        const offset = (key-1)*limit;
        const expenseRepo = this.client.getRepoFactory().createExpenseRepo();
        const items = await expenseRepo.getExpenses(budgetId,limit,offset);
        return { key, items: items.map(e => toExpenseDto(e as any)) };
    }

    /**
     * EDIT_EXPENSE
     *
     * Updates mutable fields of an expense.
     *
     * Required conditions:
     * - Expense must exist
     * - Actor must be the creator of the expense
     * - Version must match
     *
     * Resulting state:
     * - Expense updated
     * - Sync event recorded
     */
    async editExpense(dto: EditExpenseDto): Promise<EventDto> {

        // check if event already exists (idempotency)
        const oldEvent = await this.getEventById(dto.eventId);
        if (oldEvent) return oldEvent;

        // policy check
        await this.policy.canEditExpense(dto.budgetId, dto.actorUserId, dto.when, dto.id);

        // perform edit
        try {
        return await this.client.runInTransaction(async (factory) => {
            const expenseRepo = factory.createExpenseRepo();
            const eventRepo = factory.createEventRepo();

            // optimistic update handled by repo
            const expense = await expenseRepo.updateExpense(
                dto.id, 
                { 
                    date: dto.date, 
                    amount: dto.amount, 
                    note: dto.note
                },
                dto.version,
                dto.when
            );

            // record event
            const event = await eventRepo.insertEvent(EventBuilder.editExpense(dto, expense.version));

            // return event
            return toEventDto(event);
        });
        }
        catch(err: any) {
            if (this.isVersionMisMatchError(err)) {
                return {
                    eventId: dto.eventId,
                    event: EventType.EDIT_EXPENSE,
                    budgetId: dto.budgetId,
                    currentRecord: toExpenseDto(err.context)
                };
            }
            throw this.mapError(err);
        }
    }

    /**
     * DELETE_EXPENSE
     *
     * Deletes an expense.
     *
     * Required conditions:
     * - Expense must exist
     * - Actor must be the creator of the expense
     *
     * Resulting state:
     * - Expense removed
     * - Sync event recorded
     */
    async deleteExpense(dto: DeleteExpenseDto): Promise<EventDto> {

        // check if event already exists (idempotency)
        const oldEvent = await this.getEventById(dto.eventId);
        if (oldEvent) return oldEvent;
        
        // check delete allowed
        await this.policy.canDeleteExpense(dto.budgetId, dto.actorUserId, dto.when);

        try {
            // perform delete
            return await this.client.runInTransaction(async (factory) => {
                const expenseRepo = factory.createExpenseRepo();
                const eventRepo = factory.createEventRepo();

                // delete
                const deleted = await expenseRepo.deleteExpense(dto.id, dto.version);

                // add event if expense was exist
                if (deleted) {
                    // record event using pre-delete snapshot
                    const event = await eventRepo.insertEvent(EventBuilder.deleteExpense(dto));

                    return toEventDto(event);
                }
                return {
                    eventId: dto.eventId,
                    event: EventType.DELETE_EXPENSE,
                    budgetId: dto.budgetId,
                    recordId: dto.id,
                    version: dto.version,
                    when: dto.when,
                };
            });
        }
        catch(err: any) {
            console.log(err);
            if (this.isVersionMisMatchError(err)) {
                return {
                    eventId: dto.eventId,
                    event: EventType.DELETE_CATEGORY,
                    budgetId: dto.budgetId,
                    currentRecord: toExpenseDto(err.context)
                };
            }
            throw this.mapError(err);
        }
    }

    /* =========================================================
       Events
       ========================================================= */

    /**
     * GET_SYNC_EVENTS
     *
     * Fetches a page of sync events for a budget after a given sequence.
     *
     * Inputs:
     * - budgetId: the budget to fetch events for
     * - lastSequence: only return events with sequence > lastSequence
     * - itemCount: maximum number of events to return
     *
     * Returns an array of EventDto
     */
    async getEvents(budgetId: string, userId: string, key: number = 0, count: number = MAX_RESULTS): Promise<EventDto[]> {

        await this.policy.canSyncEvents(budgetId,userId);
        
        return this.client.runInTransaction(async (factory) => {
            const eventRepo = factory.createEventRepo();

            const lastSequence = Math.max(0,key);
            const itemCount = Math.min(MAX_RESULTS, count);

            // retrieve events from repo (exclude events generated by requesting user)
            const events = await eventRepo.getBudgetEvents(budgetId, userId, lastSequence, itemCount);

            return events.map(toEventDto);
        });
    }

    // helper methods

    private async getEventById(id: string): Promise<EventDto|null> {
        const event = await this.client.getRepoFactory().createEventRepo().getEventById(id);
        if (event) {
            return toEventDto(event);
        }
        return null;
    }

    private async insertParticipant(factory: RepoFactory, dto: AddParticipantDto): Promise<{ event: EventDto, participant: ParticipantDto}> {
        // insert participant
        const participantRepo = factory.createParticipantRepo();

        const newParticipant = await participantRepo.insertParticipant(toParticipant(dto));

        const participant = (await participantRepo.findParticipantById(dto.userId,dto.budgetId))!;
        
        // insert event
        const event = await factory.createEventRepo()
                            .insertEvent(EventBuilder.addParticipant(
                                dto.actorUserId, { ...newParticipant, ...participant, joinedAt: dto.joinedAt })
                            );

        return { event: toEventDto(event), participant };
    }
    

    private isBudgetPolicyError(err: any, code: BudgetPolicyErrorCode): boolean {
        return err instanceof HttpError && err.issues !== undefined && err.issues[0] === code;
    }

    private logErrorIfDev(tag: string, err: any) {
        if (isDevEnvironment()) {
                logError(tag,{err})
            }
    }

    private isVersionMisMatchError(error: any): boolean {
        return error instanceof RepoError && error.code === "VERSION_MISMATCH";
    }

    private mapError(error: any): AppError {
        if (error instanceof RepoError) {
            return error;
        }
        else if (error instanceof AppError) {
            return error;
        }
        return new AppError("BudgetService", true, error);
    }
}
