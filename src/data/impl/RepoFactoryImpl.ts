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

    constructor(private readonly db: Database) {}

    createBudgetRepo(): BudgetRepo {
        return new BudgetRepoImpl(this.db);
    }

    createParticipantRepo(): ParticipantRepo {
        return new ParticipantRepoImpl(this.db);
    }

    createCategoryRepo(): CategoryRepo {
        return  new CategoryRepoImpl(this.db);
    }

    createExpenseRepo(): ExpenseRepo {
        return  new ExpenseRepoImpl(this.db);
    }

    createEventRepo(): EventRepo {
        return new EventRepoImpl(this.db);
    }

    createLookupRepo(): LookupRepo {
        return new LookupRepoImpl(this.db);
    }

    createUserRepo(): UserRepo {
        return new UserRepoImpl(this.db);
    }
}
