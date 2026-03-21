import { RepoClient } from "../../data/RepoClient.js";
import { ForeignKeyError, RecordNotFound, RepoError, UniqueConstraintError, VersionMismatchError } from "../../data/RepoError.js";
import { RepoFactory } from "../../data/RepoFactory.js";
import { BudgetPolicy } from "./BudgetPolicy.js";
import { AddCategoryDto, AddExpenseDto, AddParticipantDto, CreateBudgetDto, DeleteBudgetDto,
     DeleteCategoryDto, DeleteExpenseDto, EditBudgetDto, EditCategoryDto, EditExpenseDto, 
     RemoveParticipantDto, EventDto,
     BudgetDto,
     CategoryDto,
     ExpenseDto,
     ParticipantDto} from "../Dtos.js";
import { EventBuilder, toEventDto, toParticipant,
     toCategory, toExpense, toBudget, 
     toBudgetDto,
     toCategoryDto,
     toExpenseDto,
     ParticipantMappers,
     ParticipantUserMapper} from "../Mappers.js";
import { AppError } from "../../core/AppError.js";
import { HttpError } from "../../core/HttpError.js";
import { EventType, HttpResponseError, PagedResult } from "../../core/Types.js";
import { Event, ParticipantUser } from "../../data/Models.js";
import { BudgetPolicyError, BudgetPolicyErrorCode } from "./BudgtPolicyError.js";

const MAX_RESULTS = 100;

export class BudgetService {

    private readonly policy: BudgetPolicy;

    constructor(private readonly client: RepoClient) {
        this.policy = new BudgetPolicy();
    }

    private getRepoFactory(): RepoFactory {
        return this.client.getRepoFactory();
    }

    async canGetSnapShotOrThrow(budgetId: string, userId: string): Promise<void> {
        try {
            const factory = this.getRepoFactory();
            await this.policy.canGetSnapShort(factory, budgetId,userId);
        }
        catch(err: any) {
            throw this.mapError(err);
        }
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
        
        const createBudgetEventDto = (createBudgetEvent: Event, participantUser: ParticipantUser)=> {
            const { id, type, budgetId, data } = createBudgetEvent;
            return {
                eventId: id,
                event: type as EventType,
                budgetId,
                version: (data as any).version,
                participant: participantUser
            };
        }
        
        try {
            return await this.client.runInTransaction(async (factory) => {

                const budgetRepo = factory.createBudgetRepo();
                const participantRepo = factory.createParticipantRepo();
                const eventRepo = factory.createEventRepo();
                const userRepo = factory.createUserRepo();

                // inser budget
                const newBudget = await budgetRepo.insertBudget(toBudget(dto));

                // insert participant
                const newParticipant = await participantRepo.insertParticipant(ParticipantMappers.toParticipant(newBudget));

                // insert events
                const [createBudgetEvent] =  await eventRepo.insertEvents([
                    EventBuilder.createBudget(dto.eventId, newBudget),
                    EventBuilder.addParticipant(dto.actorUserId, newParticipant)
                ]);

                // get user public info
                const userInfo = await userRepo.getUserPublicInfo(newParticipant.userId);

                // create participant user
                const participantUser = ParticipantUserMapper.toParticipantUser(createBudgetEvent, userInfo);

                return createBudgetEventDto(
                    createBudgetEvent,
                    participantUser
                );
            })
        }
        catch(err: any) {
            if (err instanceof UniqueConstraintError) {
                const eventDto = await this.client.runInTransaction(async (factory) => {
                    const eventRepo = factory.createEventRepo();
                    const userRepo = factory.createUserRepo();

                    const oldEvent = await eventRepo.getEventById(dto.eventId);

                    // when budget was created but new event sent to create the same budget 
                    // then this old event will be null. since app stores the events in db 
                    // then syncs, therefore this sitution likely to happend. this edge case
                    // currently skipped and will be handled later.
                    if (null != oldEvent) {
                        const userInfo = await userRepo.getUserPublicInfo(oldEvent.userId);
                        const participantUser = ParticipantUserMapper.toParticipantUser(oldEvent, userInfo);
                        
                        return createBudgetEventDto(
                            oldEvent,
                            participantUser
                        );
                    }
                    else {
                        return {
                            eventId: dto.eventId,
                            event: EventType.CREATE_BUDGET,
                            budgetId: dto.id,
                            error: {
                                statusCode: 409,
                                message: BudgetPolicyErrorCode.BUDGET_EXISTS
                            }
                        };
                    }
                });

                if (eventDto) {
                    return eventDto;
                }
            }

            throw this.mapError(err);
        }
    }

    async getBudget(budgetId: string): Promise<BudgetDto> {
        try {
            const budgetRepo = this.client.getRepoFactory().createBudgetRepo();
            const budget = await budgetRepo.getBudgetById(budgetId);
            if (null === budget) {
                throw new HttpError.NotFound(BudgetPolicyErrorCode.BUDGET_NOT_EXISTS);
            }

            return toBudgetDto(budget);
        }
        catch(err: any) {
            throw this.mapError(err);
        }
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
    
        try {
            return await this.client.runInTransaction(async (factory) => {
                const budgetRepo = factory.createBudgetRepo();
                const eventRepo = factory.createEventRepo();

                await this.policy.canEditBudget(factory, id, actorUserId, when);

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
            if (err instanceof RecordNotFound) {
                return this.onBudgetNotFound(eventId, id, EventType.EDIT_BUDGET);
            }
            else if (err instanceof VersionMismatchError) {
                return await this.onBudgetVersionMismatch(eventId,id,EventType.EDIT_BUDGET);
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

        const { eventId, id, version, when } = dto;

        const oldEvent = await this.getEventById(eventId);
        if (oldEvent) return oldEvent;

        try {
            // mark delete
            return await this.client.runInTransaction(async (factory) => {

                const budgetRepo = factory.createBudgetRepo();
                const eventRepo = factory.createEventRepo();

                // mark the budget deleted
                const budget = await budgetRepo.updateBudget(id, { isDeleted: true }, version, when);

                // ensure only creator deleted the budget
                if (budget.createdBy !== dto.actorUserId) {
                    throw new HttpError.Forbidden(BudgetPolicyErrorCode.NOT_CREATOR_OF_BUDGET);
                }

                // insert delete budget event
                const event = await eventRepo.insertEvent(EventBuilder.deleteBudget({ ...dto, version: budget.version }));

                return toEventDto(event);
            });
        }
        catch(err: any) {
            if (err instanceof VersionMismatchError) {
                return await this.onBudgetVersionMismatch(eventId,id,EventType.DELETE_BUDGET);
            }

            throw this.mapError(err); 
        }
    }

    private onBudgetNotFound(eventId: string, budgetId: string, event: EventType): EventDto {
        return {
            eventId,
            event,
            budgetId,
            error: {
                statusCode: 404,
                message: BudgetPolicyErrorCode.BUDGET_NOT_EXISTS
            }
        };
    }

    private async onBudgetVersionMismatch(eventId: string, budgetId: string, event: EventType): Promise<EventDto> {
        return await this.client.runInTransaction(async (factory) => {
                    const budgetRepo = factory.createBudgetRepo();

                    const budget = budgetRepo.getBudgetById(budgetId);

                    return {
                        eventId,
                        event,
                        budgetId,
                        currentRecord: toBudgetDto(budget)
                    };
                })
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
    async addParticipant(dto: AddParticipantDto): Promise<{ budget?: BudgetDto, participant?: ParticipantUser, error?: HttpResponseError }> {
        try {
             await this.policy.canAddParticipant(this.getRepoFactory(), dto.budgetId, dto.userId);

            return await this.client.runInTransaction(async (factory) => {
                const { participant } = await this.insertParticipant(factory, dto);
                const budget = await factory.createBudgetRepo().getBudgetById(dto.budgetId);
                return {
                    budget: toBudgetDto(budget),
                    participant
                }
            });
        }
        catch(err: any) {
            if (err instanceof ForeignKeyError) {
                return {
                   error: {
                    statusCode: 404,
                    message: BudgetPolicyErrorCode.BUDGET_NOT_EXISTS
                   }
                }
            }
            throw this.mapError(err);
        }
    }

    async getParticipantsOfBudget(budgetId: string): Promise<ParticipantDto[]> {
        try {
            const factory = this.client.getRepoFactory()
            const repo = factory.createParticipantRepo();
            const results = await repo.getParticipantsOfBudget(budgetId);
            return results;
        }
        catch(err: any) {
            throw this.mapError(err);
        }
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

        try {
             await this.policy.canRemoveParticipant(this.getRepoFactory(), budgetId, actorUserId, userId);

            return this.client.runInTransaction(async (factory) => {
                const participantRepo = factory.createParticipantRepo();
                const eventRepo = factory.createEventRepo();

                // delete participant
                await participantRepo.deleteParticipant(budgetId, userId);

                // record event
                const event = await eventRepo.insertEvent(EventBuilder.removeParticipant(dto));

                return toEventDto(event);
            });
        }
        catch(err: any) {
            throw this.mapError(err);
        }
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
        const { eventId, id, budgetId, actorUserId, when } = dto;

        try {
            await this.policy.canAddCategory(this.getRepoFactory(), budgetId, actorUserId, when, id);

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
            if (err instanceof ForeignKeyError) {
                return {
                    eventId,
                    event: EventType.ADD_CATEGORY,
                    budgetId,
                    recordId: id,
                    error: {
                        statusCode: 404,
                        message: BudgetPolicyErrorCode.BUDGET_NOT_EXISTS
                    }
                };
            }
            if (err instanceof UniqueConstraintError) {
                return (await this.getEventById(dto.eventId))!!;
            }

            throw this.mapError(err);
        }
        
    }

    async getCategoriesOfBudget(budgetId: string): Promise<CategoryDto[]> {
        try {
            const categoryRepo = this.client.getRepoFactory().createCategoryRepo();
            const result = await categoryRepo.getBudgetCategories(budgetId);
            return result.map(c => toCategoryDto(c as any));
        }
        catch(err: any) {
            throw this.mapError(err);
        }
    }

    async getCategory(categoryId: string): Promise<CategoryDto> {
        try {
            const categoryRepo = this.client.getRepoFactory().createCategoryRepo();
            const category = await categoryRepo.getCategoryById(categoryId);
            if (null == category) {
                throw new HttpError.NotFound(BudgetPolicyErrorCode.CATEGORY_NOT_EXISTS);
            }
            return toCategoryDto(category);
        }
        catch(err: any) {
            throw this.mapError(err);
        }
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

        const { eventId, id, budgetId, name, allocate, actorUserId, version: expectedVersion, when } = dto

        // check if event already exists (idempotency)
        const oldEvent = await this.getEventById(dto.eventId);
        if (oldEvent) return oldEvent;
        
        try {
            await this.policy.canEditCategory(this.getRepoFactory(), budgetId, actorUserId, when, id);

            return await this.client.runInTransaction(async (factory) => {
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
            if (err instanceof RecordNotFound) {
                return this.onCategoryNotExists(eventId, budgetId, id, EventType.EDIT_CATEGORY);
            }
            if (err instanceof VersionMismatchError) {
                return this.onCategoryVersionMismatch(eventId, budgetId, id, EventType.EDIT_CATEGORY);
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

        try {
            await this.policy.canDeleteCategory(this.getRepoFactory(), budgetId, actorUserId, when);

            return await this.client.runInTransaction(async (factory) => {
                const categoryRepo = factory.createCategoryRepo();
                const eventRepo = factory.createEventRepo();

                // delete category
                const deleted = await categoryRepo.deleteCategory(id,version);

                // add event if category was exist
                if (deleted) {
                    // insert sync event
                    const event = await eventRepo.insertEvent(EventBuilder.deleteCategory(dto));

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
            if (err instanceof VersionMismatchError) {
                return this.onCategoryVersionMismatch(eventId, budgetId, id, EventType.DELETE_BUDGET);
            }

            throw this.mapError(err);
        }
    }

    private onCategoryNotExists(eventId: string, budgetId: string, id: string, event: EventType): EventDto {
        return {
            eventId,
            event,
            budgetId,
            recordId: id,
            error: {
                statusCode: 404,
                message: BudgetPolicyErrorCode.CATEGORY_NOT_EXISTS
            }
        }
    }

    private async onCategoryVersionMismatch(eventId: string, budgetId: string, id: string, event: EventType): Promise<EventDto> {
        const repo = this.client.getRepoFactory().createCategoryRepo();
        const category = await repo.getCategoryById(id);

        return {
            eventId,
            event,
            budgetId,
            currentRecord: toCategoryDto(category!)
        };
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
            await this.policy.canAddExpense(
                this.getRepoFactory(),
                dto.budgetId, dto.actorUserId, dto.when,  dto.id, dto.categoryId
            );

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
            if (err instanceof ForeignKeyError) {
                return {
                    eventId: dto.eventId,
                    event: EventType.ADD_EXPENSE,
                    budgetId: dto.budgetId,
                    recordId: dto.id,
                    categoryId: dto.categoryId,
                    error: {
                        statusCode: 404,
                        message: "BUDGET_OR_CATEGORY_NOT_EXISTS"
                    }
                }
            }
            if (err instanceof UniqueConstraintError) {
                return (await this.getEventById(dto.eventId))!;
            }
            throw this.mapError(err);
        }
    }

    async getExpensesOfBudget(budgetId: string, key: number, count: number): Promise<PagedResult<number,ExpenseDto>> {
        const limit = Math.min(count, MAX_RESULTS);
        const offset = (key-1)*limit;

        try {
            const expenseRepo = this.getRepoFactory().createExpenseRepo();
            const items = await expenseRepo.getExpenses(budgetId,limit,offset);
            return { key, items: items.map(e => toExpenseDto(e as any)) };
        }
        catch(err: any) {
            throw this.mapError(err);
        }
    }

    async getExpense(expenseId: string): Promise<ExpenseDto> {
        try {
            const categoryRepo = this.client.getRepoFactory().createExpenseRepo();
            const expense = await categoryRepo.getExpenseById(expenseId);
            if (null === expense) {
                throw new HttpError.NotFound(BudgetPolicyErrorCode.EXPENSE_NOT_EXISTS);
            }
            return toExpenseDto(expense);
        }
        catch(err: any) {
            throw this.mapError(err);
        }
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

        try {
            await this.policy.canEditExpense(this.getRepoFactory(), dto.budgetId, dto.actorUserId, dto.when, dto.id);

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
            if (err instanceof RecordNotFound) {
                return this.onExpenseNotFound(dto.eventId, dto.budgetId, dto.id, EventType.EDIT_EXPENSE);
            }
            if (err instanceof VersionMismatchError) {
                return this.onExpenseVersionMismatch(dto.eventId, dto.budgetId, dto.id, EventType.EDIT_EXPENSE);
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
        
        try {
            return await this.client.runInTransaction(async (factory) => {

                await this.policy.canDeleteExpense(factory, dto.budgetId, dto.actorUserId, dto.when);

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
            if (err instanceof VersionMismatchError) {
                return this.onExpenseVersionMismatch(dto.eventId, dto.budgetId, dto.id, EventType.DELETE_EXPENSE);
            }
            throw this.mapError(err);
        }
    }

    private onExpenseNotFound(eventId: string, budgetId: string, id: string, event: EventType) {
        return {
            eventId,
            event,
            budgetId,
            recordId: id,
            error: {
                statusCode: 404,
                message: BudgetPolicyErrorCode.EXPENSE_NOT_EXISTS
            }
        };
    }

    private async onExpenseVersionMismatch(eventId: string, budgetId: string, id: string, event: EventType) {
        const factory = this.getRepoFactory();
        const repo = factory.createExpenseRepo();
        const expense = await repo.getExpenseById(id);
        return {
            eventId,
            event,
            budgetId,
            recordId: id,
            currentRecord: toExpenseDto(expense!)
        };  
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

        try {
            await this.policy.canSyncEvents(this.getRepoFactory(), budgetId,userId);
            
            return await this.client.runInTransaction(async (factory) => {
                const eventRepo = factory.createEventRepo();

                const lastSequence = Math.max(0,key);
                const itemCount = Math.min(MAX_RESULTS, count);

                // retrieve events from repo (exclude events generated by requesting user)
                const events = await eventRepo.getBudgetEvents(budgetId, userId, lastSequence, itemCount);

                const dtos: EventDto[] = []

                for(const event of events) {
                    if (event.type === EventType.ADD_PARTICIPANT) {
                        const participant = await this.getParticipantById(factory,event.userId,event.budgetId);
                        dtos.push({
                            ...toEventDto(event),
                            participant
                        });
                    }
                    else {
                        dtos.push(toEventDto(event));
                    }
                }
                return dtos;
            });
        }
        catch(err: any) {
            throw this.mapError(err);
        }
    }

    /* =========================================================
       Helper Methods
       ========================================================= */

    private async getEventById(id: string): Promise<EventDto|null> {
        const factory = this.getRepoFactory();
        const eventRepo = factory.createEventRepo();
        const event = await eventRepo.getEventById(id);
        if (event) {
            return toEventDto(event);
        }
        return null;
    }

    private async getParticipantById(factory: RepoFactory, userId: string, budgetId: string): Promise<ParticipantUser|null> {
        const repo = factory.createParticipantRepo()
        return repo.findParticipantById(userId,budgetId)
    }

    private async insertParticipant(factory: RepoFactory, dto: AddParticipantDto): Promise<{event: EventDto, participant: ParticipantUser  }> {
        // insert participant
        const participantRepo = factory.createParticipantRepo();

        const participant = await participantRepo.insertParticipant(toParticipant(dto));

        const participantUser = (await this.getParticipantById(factory,dto.userId, dto.budgetId))!;
        
        // insert event
        const event = await factory.createEventRepo()
                            .insertEvent(EventBuilder.addParticipant(dto.actorUserId, participant));

        return { event: toEventDto(event), participant: participantUser };
    }

    private mapError(error: any): AppError {
        if (error instanceof BudgetPolicyError) {
            return error.toHttpError();
        }
        if (error instanceof AppError) {
            return error;
        }
        return new HttpError.ServerError();
    }
}
