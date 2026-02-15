import { Participant } from "./Models.js";

export interface ParticipantRepo {

    insertParticipant(participant: Participant): Promise<Participant>
    
    deleteParticipant(budgetId: string, userId: string): Promise<void>
}