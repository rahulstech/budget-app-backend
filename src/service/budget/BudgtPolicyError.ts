import { AppError } from "../../core/AppError.js";
import { HttpError } from "../../core/HttpError.js";

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
    NOT_CREATOR_OF_BUDGET = "NOT_CREATOR_OF_BUDGET",
}

export class BudgetPolicyError extends Error {

    readonly name: string = "BudgetPolicyError"

    constructor(public readonly policyErrorCode: BudgetPolicyErrorCode) {
        super(policyErrorCode);
    }

    toHttpError(): HttpError {
        switch (this.policyErrorCode) {

            // ===== NOT FOUND =====
            case BudgetPolicyErrorCode.BUDGET_NOT_EXISTS:
            case BudgetPolicyErrorCode.CATEGORY_NOT_EXISTS:
            case BudgetPolicyErrorCode.EXPENSE_NOT_EXISTS:
                return new HttpError.NotFound(this.policyErrorCode);

            // ===== CONFLICT =====
            case BudgetPolicyErrorCode.BUDGET_EXISTS:
            case BudgetPolicyErrorCode.CATEGORY_EXISTS:
            case BudgetPolicyErrorCode.EXPENSE_EXISTS:
            case BudgetPolicyErrorCode.PARTICIPANT_EXISTS:
                return new HttpError.Conflict(this.policyErrorCode);

            // ===== FORBIDDEN =====
            case BudgetPolicyErrorCode.NOT_PARTICIPANT:
            case BudgetPolicyErrorCode.NOT_CREATOR:
            case BudgetPolicyErrorCode.NOT_CREATOR_OF_BUDGET:
            case BudgetPolicyErrorCode.PARTICIPANT_LIMIT_REACHED:
            case BudgetPolicyErrorCode.NOT_CATEGORY_OF_BUDGET:
                return new HttpError.Forbidden(this.policyErrorCode);

            default:
                return new HttpError.ServerError();
        }
    }
}