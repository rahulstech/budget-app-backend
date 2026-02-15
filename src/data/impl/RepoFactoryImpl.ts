import { Database } from "../Models.js";
import { BudgetRepo } from "../BudgetRepo.js";
import { CategoryRepo } from "../CategoryRepo.js";
import { EventRepo } from "../EventRepo.js";
import { ExpenseRepo } from "../ExpenseRepo.js";
import { LookupRepo } from "../LookupRepo.js";
import { ParticipantRepo } from "../ParticipantRepo.js";
import { RepoFactory } from "../RepoFactory.js";
import { BudgetRepoImpl } from "./BudgetRepoImpl.js";
import { CategoryRepoImpl } from "./CategoryRepoImpl.js";
import { EventRepoImpl } from "./EventRepoImpl.js";
import { ExpenseRepoImpl } from "./ExpenseRepoImpl.js";
import { LookupRepoImpl } from "./LookupRepoImpl.js";
import { ParticipantRepoImpl } from "./ParticipantRepoImpl.js";
import { UserRepo } from "../UserRepo.js";
import { UserRepoImpl } from "./UserRepoImpl.js";

export class RepoFactoryImpl implements RepoFactory {

    private budgetRepo?: BudgetRepo;
    private participantRepo?: ParticipantRepo;
    private categoryRepo?: CategoryRepo;
    private expenseRepo?: ExpenseRepo;
    private eventRepo?: EventRepo;
    private lookupRepo?: LookupRepo;
    private userRepo?: UserRepo;

    constructor(private readonly db: Database) {}

    createBudgetRepo(): BudgetRepo {
        if (!this.budgetRepo) {
            this.budgetRepo = new BudgetRepoImpl(this.db);
        }
        return this.budgetRepo;
    }

    createParticipantRepo(): ParticipantRepo {
        if (!this.participantRepo) {
            this.participantRepo = new ParticipantRepoImpl(this.db);
        }
        return this.participantRepo;
    }

    createCategoryRepo(): CategoryRepo {
        if (!this.categoryRepo) {
            this.categoryRepo = new CategoryRepoImpl(this.db);
        }
        return this.categoryRepo;
    }

    createExpenseRepo(): ExpenseRepo {
        if (!this.expenseRepo) {
            this.expenseRepo = new ExpenseRepoImpl(this.db);
        } 
        return this.expenseRepo;
    }

    createEventRepo(): EventRepo {
        if (!this.eventRepo) {
            this.eventRepo = new EventRepoImpl(this.db);
        }
        return this.eventRepo;
    }

    createLookupRepo(): LookupRepo {
        if (!this.lookupRepo) {
            this.lookupRepo = new LookupRepoImpl(this.db);
        }
        return this.lookupRepo;
    }

    createUserRepo(): UserRepo {
        if (!this.userRepo) {
            this.userRepo = new UserRepoImpl(this.db);
        }
        return this.userRepo;
    }
}
