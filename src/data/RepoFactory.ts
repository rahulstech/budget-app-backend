import { BudgetRepo } from "./BudgetRepo.js"
import { CategoryRepo } from "./CategoryRepo.js"
import { EventRepo } from "./EventRepo.js"
import { ExpenseRepo } from "./ExpenseRepo.js"
import { LookupRepo } from "./LookupRepo.js"
import { ParticipantRepo } from "./ParticipantRepo.js"
import { UserRepo } from "./UserRepo.js"

export interface RepoFactory {
    
    createBudgetRepo(): BudgetRepo

    createParticipantRepo(): ParticipantRepo

    createCategoryRepo(): CategoryRepo

    createExpenseRepo(): ExpenseRepo

    createEventRepo(): EventRepo

    createLookupRepo(): LookupRepo

    createUserRepo(): UserRepo
}