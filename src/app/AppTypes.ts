export type EventResponseModel = { event: string, id: string, version?: number, errors?: string[] } | { [key: string]: any, errors?: string[] };

export type SyncResponseModel = { 
    budgetId: string, 
    actorUserId: string,
    sequence: number, 
    type: string,
    when: number,
    [key: string]: any,
    errors?: string[],
}

export type SnapShotResponseModel = {
    [key: string]: any,
    errors?: string[],
};