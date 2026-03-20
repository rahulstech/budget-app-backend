import { RepoFactory } from "../../data/RepoFactory.js";
import { BudgetPolicyError, BudgetPolicyErrorCode } from "./BudgtPolicyError.js";

const MAX_PARTICIPANT_PER_BUDGET = 10;

export class BudgetPolicy {

    constructor() {}

    /* =========================================================
       Budget policies
       ========================================================= */

    private async budgetExistsOrThrow(factory: RepoFactory, budgetId: string, ignoreDeleted: boolean = false) {
        const lookup = factory.createLookupRepo();
        if (!await lookup.budgetExists(budgetId, ignoreDeleted)) {
            throw new BudgetPolicyError(BudgetPolicyErrorCode.BUDGET_NOT_EXISTS);
        }
    }

    private async wasParticipantOrThrow(factory: RepoFactory, budgetId: string, userId: string, atTime: number) {
        const lookup = factory.createLookupRepo();
        if (!await lookup.wasParticipantAtTime(budgetId, userId, atTime)) {
            throw new BudgetPolicyError(BudgetPolicyErrorCode.NOT_PARTICIPANT);
        }
    }

    private async isParticipantOrThrow(factory: RepoFactory, budgetId: string, userId: string) {
        const lookup = factory.createLookupRepo();
        if (!await lookup.isParticipantOfBudget(budgetId, userId)) {
            throw new BudgetPolicyError(BudgetPolicyErrorCode.NOT_PARTICIPANT);
        }
    }

    async canAddBudget(factory: RepoFactory, budgetId: string) {}

    async canEditBudget(factory: RepoFactory, budgetId: string, actorId: string, atTime: number) {
        await this.wasParticipantOrThrow(factory, budgetId, actorId, atTime);
    }

    async canDeleteBudget(factory: RepoFactory, budgetId: string, actorId: string) {
        await this.isParticipantOrThrow(factory, budgetId, actorId);
    }

    /* =========================================================
       Category policies
       ========================================================= */

    async canAddParticipant(factory: RepoFactory, budgetId: string, userId: string) {

        const lookup = factory.createLookupRepo();

        await this.budgetExistsOrThrow(factory, budgetId);

        if ((await lookup.countBudgetParticipants(budgetId)) === MAX_PARTICIPANT_PER_BUDGET) {
            throw new BudgetPolicyError(BudgetPolicyErrorCode.PARTICIPANT_LIMIT_REACHED);
        }
    }

    async canRemoveParticipant(factory: RepoFactory, budgetId: string, actorId: string, participantId: string) {
        const lookup = factory.createLookupRepo();

        if (!await lookup.isParticipantOfBudget(budgetId, actorId)) {
            throw new BudgetPolicyError(BudgetPolicyErrorCode.NOT_PARTICIPANT);
        }
    }

    async canAddCategory(factory: RepoFactory, budgetId: string, actoryId: string, atTime: number, categoryId: string,) {

        await this.budgetExistsOrThrow(factory, budgetId);

        await this.wasParticipantOrThrow(factory, budgetId, actoryId, atTime);
    }

    async canEditCategory(factory: RepoFactory, budgetId: string, actoryId: string, atTime: number, categoryId: string,) {
        await this.wasParticipantOrThrow(factory, budgetId, actoryId, atTime)
    }

    async canDeleteCategory(factory: RepoFactory, budgetId: string, actorId: string, atTime: number) {
        await this.wasParticipantOrThrow(factory, budgetId, actorId, atTime);
    }

    /* =========================================================
       Expense policies
       ========================================================= */

    async canAddExpense(factory: RepoFactory, budgetId: string, actorId: string, atTime: number, expenseId: string, categoryId: string) {
        await this.budgetExistsOrThrow(factory, budgetId);
        
        await this.wasParticipantOrThrow(factory, budgetId, actorId, atTime);
    }

    async canEditExpense(factory: RepoFactory, budgetId: string, actorId: string, atTime: number, expenseId: string) {
        await this.wasParticipantOrThrow(factory, budgetId, actorId, atTime);
    }

    async canDeleteExpense(factory: RepoFactory, budgetId: string, actorId: string, atTime: number) {
        await this.wasParticipantOrThrow(factory, budgetId, actorId, atTime);
    }

    async canGetSnapShort(factory: RepoFactory, budgetId: string, userId: string): Promise<void> {
        await this.budgetExistsOrThrow(factory, budgetId);
        await this.isParticipantOrThrow(factory, budgetId, userId);
    }

    async canSyncEvents(factory: RepoFactory, budgetId: string, userId: string): Promise<void> {
        await this.budgetExistsOrThrow(factory, budgetId, true);
    }
}