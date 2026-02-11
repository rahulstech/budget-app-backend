import { HttpError } from "../core/HttpError.js";
import { BudgetRepo } from "../data/BudgetRepo.js";
import { LookupRepo } from "../data/LookupRepo.js";
import { ParticipantRepo } from "../data/ParticipantRepo.js";
import { RepoFactory } from "../data/RepoFactory.js";

const MAX_PARTICIPANT_PER_BUDGET = 10;

export enum BudgetPolicyErrorCode {
    BUDGET_EXISTS = "BUDGET_EXISTS",
    BUDGET_NOT_EXISTS = "BUDGET_NOT_EXISTS",
    CATEGORY_EXISTS = "CATEGORY_EXISTS",
    CATEGORY_NOT_EXISTS = "CATEGORY_NOT_EXISTS",
    NOT_CATEGORY_OF_BUDGET = "NOT_CATEGORY_OF_BUDGET",
    EXPENSE_EXISTS = "EXPENSE_EXISTS",
    EXPENSE_NOT_EXISTS = "EXPENSE_NOT_EXISTS",
    PARTICIPANT_EXISTS = "PARTICIPANT_EXISTS",
    NOT_PARTICIPANT = "NOT_PARTICIPANT",
    PARTICIPANT_LIMIT_REACHED = "PARTICIPANT_LIMIT_REACHED",
    NOT_CREATOR = "NOT_CREATOR",
}

export class BudgetPolicy {

    private readonly lookup: LookupRepo;

    constructor(repos: RepoFactory) {
        this.lookup = repos.createLookupRepo();
    }

    /* =========================================================
       Budget policies
       ========================================================= */


    private async budgetExistsOrThrow(budgetId: string) {
        if (!await this.lookup.budgetExists(budgetId)) {
            throw new HttpError.NotFound(BudgetPolicyErrorCode.BUDGET_NOT_EXISTS)
        }
    }

    private async isBudgetCreatoryOrThrow(budgetId: string, userId: string) {
        if (!await this.lookup.isCategoryOfBudget(budgetId,userId)) {
            throw new HttpError.Forbidden(BudgetPolicyErrorCode.NOT_CATEGORY_OF_BUDGET);
        }
    }

    private async wasParticipantOrThrow(budgetId: string, userId: string, atTime: number) {
        if (!await this.lookup.wasParticipantAtTime(budgetId, userId, atTime)) {
            throw new HttpError(403, BudgetPolicyErrorCode.NOT_PARTICIPANT);
        }
    }

    /**
     * Authorizes creation of a budget.
     * Fails if a budget with the same id already exists.
     */
    async canAddBudget(budgetId: string) {
        if (await this.lookup.budgetExists(budgetId)) {
            throw new HttpError.Conflict(BudgetPolicyErrorCode.BUDGET_EXISTS)
        }
    }

    /**
     * Authorizes editing of a budget.
     * Requires the budget to exist and the actor to be
     * a participant at the time the edit occurred.
     */
    async canEditBudget(budgetId: string, actorId: string, atTime: number) {
        // must exist
        await this.budgetExistsOrThrow(budgetId);

        // must be a participant
        await this.wasParticipantOrThrow(budgetId,actorId,atTime);
    }

    /**
     * Authorizes deletion of a budget.
     * Only the original creator of the budget may delete it.
     */
    async canDeleteBudget(budgetId: string, actorId: string) {

        // must exist
        await this.budgetExistsOrThrow(budgetId);

        // only creator can delete
        if (!await this.lookup.isCreatorOfBudget(budgetId, actorId)) {
            throw new HttpError(403, BudgetPolicyErrorCode.NOT_CREATOR)
        }
    }

    /* =========================================================
       Category policies
       ========================================================= */

    /**
     * Authorizes adding a participant to a budget.
     * Fails if the target user is already an active participant.
     */
    async canAddParticipant(budgetId: string, userId: string) {

        // budget must exist
        await this.budgetExistsOrThrow(budgetId);

        // current total participants < total allowed participants
        if ((await this.lookup.countBudgetParticipants(budgetId)) === MAX_PARTICIPANT_PER_BUDGET) {
            throw new HttpError.Forbidden(BudgetPolicyErrorCode.PARTICIPANT_LIMIT_REACHED);
        }

        // must not be a participant
        if (await this.lookup.isParticipantOfBudget(budgetId,userId)) {
            throw new HttpError.Conflict(BudgetPolicyErrorCode.PARTICIPANT_EXISTS);
        }
    }

    async canRemoveParticipant(budgetId: string, participantId: string, actorId: string,) {

        // budget must exists 
        await this.budgetExistsOrThrow(budgetId);

        // must be a participant
        if (!await this.lookup.isParticipantOfBudget(budgetId,participantId)) {
            throw new HttpError.Forbidden(BudgetPolicyErrorCode.NOT_PARTICIPANT);
        }

        // either participant removes itself or the budget creator removes the participant
        if (actorId !== participantId) {
            await this.isBudgetCreatoryOrThrow(budgetId,actorId);
        }
    }

    /**
     * Authorizes adding a category to a budget.
     * Disallows duplicates and requires the actor to be
     * a participant at the event time.
     */
    async canAddCategory(budgetId: string, actoryId: string, atTime: number, categoryId: string,) {

        // must exist
        await this.budgetExistsOrThrow(budgetId);

        // must not exist
        if (await this.lookup.categoryExists(categoryId)) {
            throw new HttpError.Conflict(BudgetPolicyErrorCode.CATEGORY_EXISTS);
        }

        // must be a participant
        await this.wasParticipantOrThrow(budgetId,actoryId,atTime);
    }

    /**
     * Authorizes editing a category.
     * Requires the category to belong to the budget and
     * the actor to be a participant at the event time.
     */
    async canEditCategory(budgetId: string, actoryId: string, atTime: number, categoryId: string,) {

        // must exist
        await this.budgetExistsOrThrow(budgetId);

        // must exist
        if (!await this.lookup.categoryExists(categoryId)) {
            throw new HttpError.NotFound(BudgetPolicyErrorCode.BUDGET_NOT_EXISTS);
        }

        // must be a participant
        await this.wasParticipantOrThrow(budgetId, actoryId, atTime)
    }

    /**
     * Authorizes deletion of a category.
     * Any participant at the event time may delete it.
     */
    async canDeleteCategory(budgetId: string, actorId: string, atTime: number) {

        // must be a participant
        await this.wasParticipantOrThrow(budgetId, actorId, atTime);
    }

    /* =========================================================
       Expense policies
       ========================================================= */

    /**
     * Authorizes adding an expense.
     * Disallows duplicates, requires the category to belong
     * to the budget, and the actor to be a participant at
     * the event time.
     */
    async canAddExpense(budgetId: string, actorId: string, atTime: number, expenseId: string, categoryId: string) {

        // must exist
        await this.budgetExistsOrThrow(budgetId);
        
        // must be a participant
        await this.wasParticipantOrThrow(budgetId,actorId,atTime);

        // must be a category of budget
        if (!await this.lookup.isCategoryOfBudget(budgetId, categoryId)) {
            throw new HttpError.Forbidden(BudgetPolicyErrorCode.NOT_CATEGORY_OF_BUDGET);
        }

        // must not exist
        if (await this.lookup.expenseExists(expenseId)) {
            throw new HttpError.Conflict(BudgetPolicyErrorCode.EXPENSE_EXISTS);
        }
    }

    /**
     * Authorizes editing an expense.
     * Only the participant who originally created the expense
     * may edit it.
     */
    async canEditExpense(budgetId: string, actorId: string, atTime: number,  expenseId: string) {
        // must exist
        await this.budgetExistsOrThrow(budgetId);

        // expense must exist
        if (!await this.lookup.expenseExists(expenseId)) {
            throw new HttpError.NotFound(BudgetPolicyErrorCode.EXPENSE_NOT_EXISTS);
        }

        // must be a participant
        await this.wasParticipantOrThrow(budgetId,actorId,atTime);
    }

    /**
     * Authorizes deletion of an expense.
     * Only the participant who created the expense may delete it.
     */
    async canDeleteExpense(budgetId: string, actorId: string, atTime: number) {

        // must exist
        await this.budgetExistsOrThrow(budgetId);

        // must be a participant
        await this.wasParticipantOrThrow(budgetId,actorId,atTime);
    }
}

