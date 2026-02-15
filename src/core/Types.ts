export enum EventType {
  CREATE_BUDGET = "budget.create",
  EDIT_BUDGET = "budget.edit",
  DELETE_BUDGET = "budget.delete",

  ADD_PARTICIPANT = "participant.add",
  REMOVE_PARTICIPANT = "participant.remove",

  ADD_CATEGORY = "category.add",
  EDIT_CATEGORY = "category.edit",
  DELETE_CATEGORY = "category.delete",

  ADD_EXPENSE = "expense.add",
  EDIT_EXPENSE = "expense.edit",
  DELETE_EXPENSE = "expense.delete",
}

export type PagedResult<K,T> = {
  key: K,
  items: T[],
}

export type Nullable<T> = {
  [k in keyof T]: T[k] | null;
}
