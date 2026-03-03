import { Participant, ParticipantUser } from "./Models.js";

export interface ParticipantRepo {

    insertParticipant(participant: Participant): Promise<Participant>
    
    deleteParticipant(budgetId: string, userId: string): Promise<void>

    getParticipantsOfBudget(budgetId: string): Promise<ParticipantUser[]>

    findParticipantById(userId: string, budgetId: string): Promise<ParticipantUser | null>
}