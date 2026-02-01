import express from "express";

// stores the events logs
const events: Record<string,Array<any>> = {
    "budget-1": [
        {
            event: "create",
            eventmillis: 11,
            entity: "budget",
            budgetid: "budget-1",
            recordid: "budget-1",
            data: {
                version: 1,
                tsmillis: 10,
                title: "first budget",
                details: "this is my first budget",
                createdby: "participant-1"
            },
            
        },
        {
            event: "create",
            eventmillis: 11,
            entity: "participants",
            budgetid: "budget-1",
            recordid: "participant-1",
        },
        {
            event: "create",
            eventmillis: 11,
            entity: "participants",
            budgetid: "budget-1",
            recordid: "participant-2",
        },
        {
            event: "create",
            eventmillis: 11,
            entity: "participants",
            budgetid: "budget-1",
            recordid: "participant-3",
        },
        {
            event: "create",
            eventmillis: 13,
            entity: "category",
            budgetid: "budget-1",
            recordid: "category-1",
            data: {
                version: 1,
                tsmillis: 12,
                name: "first category",
                allocate: 1500,
                createdby: "participant-3"
            }
        },
        {
            event: "create",
            eventmillis: 14,
            entity: "expense",
            budgetid: "budget-1",
            recordid: "expense-1",
            data: {
                version: 1,
                tsmillis: 13,
                categoryid: "category-1",
                amount: 150,
                date: "2026-01-05",
                note: "first expense of first cateogory",
                createdby: "participant-2"
            }
        },
    ]
};

// stores the snapshot of the budget, category and expense
const budgets: Record<string, any> = {
    "budget-1": {
        "budget": {
            id: "budget-1",
            title: "first budget",
            details: "this is my first budget",
            version: 1,
            last_modified: 10,
            createdby: "participant-1",
        },
        "category": {
            "category-1": {
                id: "category-1",
                budgetid: "budget-1",
                name: "first category",
                allocate: 1500,
                version: 1,
                last_modifier: 12,
                createdby: "participant-3"
            }
        },
        "expense": {
            "expense-1": {
                id: "expense-1",
                budgetid: "budget-1",
                categoryid: "category-1",
                date: "2026-01-05",
                amount: 150,
                note: "first expense of first category",
                version: 1,
                last_modified: 13,
                createdby: "participant-2"
            }
        },

        // like a members in a chatgroup participants are the members of the budget 
        "participants": [
            "participant-1","participant-2","participant-3"
        ], 
    }
};

// stores data of budget,category and expense for quick retrival
// for example: conflict resolution, existance check etc.
const lookups: Record<string,any> = {
    "budget-1": {
        "budget-1": {
            entity: "budget",
            version: 1,
            last_modified: 10,
            createdby: "participant-1"
        },
        "category-1": {
            entity: "category",
            version: 1,
            last_modifier: 12,
            createdby: "participant-3"
        },
        "expense-1": {
            entity: "expense",
            version: 1,
            last_modifier: 13,
            createdby: "participant-2"
        },
    }
};

let currentUserId: string = ""; // for the purpose of PoC i simply stored the userId like this


const app = express();

app.use(express.json());

app.use((req, res, next)=> {
    const userId = req.headers["authorization"];
    if (!userId) {
        return res.status(401).json({ error: ["you are not loggein"]});
    }
    currentUserId = userId;
    next();
})


function saveEvent(budgetid: string, values: Record<string,any>) {
    const event: Record<string, any> = {
        ...values,
        budgetid,
    };

    if (!events[budgetid]) {
        events[budgetid] = [];
    }
    events[budgetid].push(event);
}

function getEventsSince(budgetid: string, since: number, limit: number = 20): Record<string,any> {
    return events[budgetid].filter(event => event.eventmillis >= since).slice(0, limit);
}


// lookup

function saveLookup(budgetid: string, entity: string, recordid: string, values: Record<string,any>) {
    const { last_modifed, version }  = values;
    const lookup = { id: recordid, entity, last_modifed, version };
    if (entity == "budget") {
        lookups[budgetid] = {}
    }
    lookups[budgetid][recordid] = lookup;
}

function checkInLookup(budgetid: string, recordid: string): boolean {
    return lookups[budgetid] && lookups[budgetid][recordid] ? true : false;
}

function getLookup(budgetid: string, recordid: string): Record<string,any> | null {
    if (checkInLookup(budgetid,recordid)) {
        return lookups[budgetid][recordid];
    }
    return null;
}

// budget 

function getBudgetById(budgetid: string): Record<string,any> | null {
    return budgets[budgetid] ? budgets[budgetid]["budget"] : null;;
}

function saveBudget(budgetid: string, values: Record<string,any>): Record<string, any> {
    const { title, details, last_modified, version, createdby } = values;
    const budget: Record<string,any> = { id: budgetid, title, details, last_modified, createdby, version: 1,  };

    // save in budgets
    const oldBudget = getBudgetById(budgetid);
    if (oldBudget) {
        // edit

        // accept if values version and oldBudget version is same
        if (version != oldBudget.version) {
            throw new Error(`version mismatch; expected ${oldBudget.version} found ${version}`);
        }

        budget.version = oldBudget.version+1;
        budget.createdby = oldBudget.createdby;
        budgets[budgetid]["budget"] = budget;
    }
    else {
        // create
        budgets[budgetid] = {
            "budget": budget,
            "category": {},
            "expense": {}
        };
    }
    
    // save in lookups
    const lookup = { version: budget.version, last_modified }
    saveLookup(budgetid, "budget", budgetid, lookup);

    return budget;
}

function deleteBudget(budgetid: string) {
    budgets[budgetid] = undefined;
    lookups[budgetid] = undefined;
}

// category 

function getCategoryById(budgetid: string, categoryid: string): Record<string,any> | null {
    const category = budgets[budgetid]["category"][categoryid];
    return category ?? null;
}

function saveCategory(budgetid: string, recordid: string, values: Record<string,any>): Record<string,any> {
    const { name, allocate, last_modifed, version, createdby } = values;
    const category: Record<string,any> = { id: recordid, budgetid, name, allocate, createdby, version: 1 };

    const oldCategory = getCategoryById(budgetid,recordid);
    if (oldCategory) {
        // edit
        // accept if values version and oldCategories version is same
        if (version != oldCategory.version) {
            throw new Error(`version mismatch expected ${oldCategory.version} found ${version}`);
        }

        category.version = oldCategory.version+1;
        category.name = name ?? oldCategory.name;
        category.allocate = allocate ?? oldCategory;
        category.createdby = oldCategory.createdby;
    }

    // save in budgets
    budgets[budgetid]["category"][recordid] = category;

    // save in lookups
    const lookup = { version: category.version, last_modifed };
    saveLookup(budgetid, "category", recordid, lookup);

    return category;
}

function deleteCategory(budgeid: string, recordid: string) {
    if (budgets[budgeid]) {
        budgets[budgeid]["category"][recordid] = undefined;
    }
    if (lookups[budgeid]) {
        lookups[budgeid][recordid] = undefined;
    }
}

// expense

function saveExpense(budgetid: string, recordid: string, values: Record<string,any>): Record<string,any> {
    const { categoryid, amount, date, note, last_modifed, version } = values;

    const expense: Record<string,any> = { id: recordid, budgetid, categoryid, amount, date, note, last_modifed, version: 1 };


    const oldExpense = budgets[budgetid]["expense"][recordid];
    if (oldExpense) {
        // edit
        if (version != oldExpense.version) {
            throw new Error(`version mismatch, expected ${oldExpense.version} found ${version}`);
        }
        expense.version = oldExpense.version+1;
        expense.data = date ?? oldExpense.data;
        expense.amount = amount ?? oldExpense.amount;
        expense.note = note ?? oldExpense.not;
    }

    // save in budgets
    budgets[budgetid]["expense"][recordid] = expense;

    // save in lookups
    const lookup = { last_modifed, version: expense.version };
    saveLookup(budgetid, "expense", recordid, lookup);

    return expense;
}

function deleteExpense(budgetid: string, recordid: string) {
    if (budgets[budgetid]) {
        budgets[budgetid]["expense"][recordid] = undefined;
    }
    if (lookups[budgetid]) {
        lookups[budgetid][recordid] = undefined;
    }
}

// participants

function isParticipant(budgetid: string, participantid: string): boolean {
    const budget = budgets[budgetid];
    if (budget) {
        return budget.participants.find((value: string) => value == participantid) !== undefined;
    }
    return false;
}

// routes

app.post("/budget", (req, res)=> {
    const { id, title, details, tsmillis } = req.body;
    const values = { id, last_modified: tsmillis, title, details };

    try {
        const result = handleBudgetEvents(currentUserId, id, "create", values);

        const event = {
            event: "create",
            entity: "budget",
            recordid: id,
            data: { 
                title, details, tsmillis,
                version: result.version,
                createdby: currentUserId,
             }
        };

        saveEvent(id, event);

        res.json(result);
    }
    catch(error: any) {
        res.status(400).json({ error: [error.message]});
    }
})

app.post("/budgets/:budgetid/event", (req,res)=> {
    const { budgetid } = req.params;
    const events = req.body;

    if (!isParticipant(budgetid, currentUserId)) {
        return res.status(401).json({ error: [`you are not an participant of budget ${budgetid}`]});
    }
    
    const results = [];
    for (let eventdata of events) {
        const { event, entity, recordid, data } = eventdata;

        try {
            switch(entity) {
                case "budget": {
                    const result = handleBudgetEvents(currentUserId, budgetid, event, data);
                    results.push(result);
                }
                break;
                case "category": {
                    const result = handleCategoryEvents(currentUserId, event, budgetid, recordid, data);
                    results.push(result);
                }
                break;
                case "expense": {
                    const result = handleExpenseEvents(currentUserId, event, budgetid, recordid, data);
                    results.push(result);
                }
                break;
                default: {
                    throw new Error(`unknown entity ${entity}`);
                }
            }

            saveEvent(budgetid, { ...eventdata, eventmillis: data.last_modified+1 }); // just faking the eventmillis
        }
        catch(error: unknown) {
            console.error(error);
            results.push({ event, budgetid, entity, recordid, error: [(error as Error).message]});
        }
    }
    
    res.json(results);
})

app.get("/budgets/:budgetid/events",(req,res)=> {
    const { budgetid } = req.params; 
    if (!isParticipant(budgetid, currentUserId)) {
        return res.status(401).json({ error: [`use are not a participant of budget ${budgetid}`]});
    }
    const { since = 0, per_page = 20 } = req.query;
    const eventssince = getEventsSince(budgetid, Number(since), Number(per_page));
    res.json(eventssince);
})

// controllers 

function handleBudgetEvents(userId: string, budgetid: string, event: string, inputs: Record<string,any>): Record<string, any> {
    switch(event) {
        case "create": {
            // is budget already created?
            if (checkInLookup(budgetid,budgetid)) {
                throw new Error(`budget ${budgetid} already created`);
            }

            // save budget
            const budget = saveBudget(budgetid,{ ...inputs, createdby: userId });
            return { budgetid, entity: "budget", version: budget.version };
        }
        case "edit": {
            if (!checkInLookup(budgetid,budgetid)) {
                throw new Error(`budget ${budgetid} not found`);
            }

            // save budget
            const budget = saveBudget(budgetid,inputs);
            return { budgetid, entity: "budget", version: budget.version };
        }
        case "delete": {
            const budget = getBudgetById(budgetid);
            // only creator of the budget can delete the budget
            if (budget && budget.createdby != userId) {
                throw new Error(`user ${userId} can not delete the  bugdet as the user did not create the budget ${budgetid}`);
            }
            deleteBudget(budgetid);
            return { budgetid, entity: "budget", deleted: true };
        }
        default: {
            throw new Error(`unkown event ${event}`);
        }
    }
}

function handleCategoryEvents(userid: string, event: string, budgetid: string, recordid: string, inputs: Record<string,any>): Record<string,any> {
    // inputs = { version, last_modified, version, name, allocate }
    switch(event) {
        case "create": {
            // is it already created?
            if (checkInLookup(budgetid,recordid)) {
                throw new Error(`category with id ${recordid} already created`);
            }

            // save the category
            const category = saveCategory(budgetid, recordid, { ...inputs, createdby: userid });
            return { budgetid, entity: "category", recordid, version: category.version }
        }
        case "edit": {
            // does category exist?
            if (!checkInLookup(budgetid, recordid)) {
                throw new Error(`category ${recordid} of budget ${budgetid} not found`);
            }

            // save the category
            const category = saveCategory(budgetid, recordid, inputs);
            return { budgetid, entity: "category", recordid, version: category.version }
        }
        case "delete": {
            deleteCategory(budgetid,recordid);
            return { budgetid, entity: "category", recordid, deleted: true };
        }
        break;
        default: {
            throw new Error(`unknow event ${event}`);
        }
    }
}

function handleExpenseEvents(userid: string,event: string, budgetid: string, recordid: string, inputs: Record<string,any>): Record<string,any> {
    switch(event) {
        case "create": {
            // is it already created?
            if (checkInLookup(budgetid, recordid)) {
                throw new Error(`expense with id ${recordid} already created`);
            }

            // save the category
            const expense = saveExpense(budgetid, recordid, { ...inputs, createdby: userid });
            return { budgetid, entity: "expense", recordid, version: expense.version }
        }
        case "edit": {
            // does expense exist?
            const lookup = getLookup(budgetid,recordid);
            if (!lookup) {
                throw new Error(`expense ${recordid} of budget ${budgetid} not found`);
            }
            else if (userid != lookup.createdby) {
                // only creator can edit the expense
                throw new Error(`only creator can edit an expense; user ${userid} is not the creator of expense ${recordid} of budget ${budgetid}`);
            }

            // save the expense
            const expense = saveExpense(budgetid, recordid, inputs);
            return { budgetid, entity: "expense", recordid, version: expense.version }
        }
        case "delete": {
            const lookup = getLookup(budgetid,recordid);
            if (null != lookup && userid != lookup.createdby) {
                // only creator can delete the expense
                throw new Error(`only creator can delete an expense; user ${userid} is not the creator of expense ${recordid} of budget ${budgetid}`);
            }
            deleteExpense(budgetid,recordid);
            return { budgetid, entity: "expense", recordid, deleted: true };
        }
        default: {
            throw new Error(`unknown event ${event}`);
        }
    }
}

const server = app.listen(3000, ()=> {
    console.log("server started");
})