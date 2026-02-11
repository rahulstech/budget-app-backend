-- Custom SQL migration file, put your code below! --

-- Create sync event sequence counter table
CREATE TABLE IF NOT EXISTS "event_sequences"(
    "budget_id" UUID NOT NULL PRIMARY KEY REFERENCES "budgets"("id"),
    "sequence_no" BIGINT NOT NULL
);

-- Create procedure to obtain and update the event sequence for the budget
create function get_next_event_sequence(p_budget_id uuid) returns bigint
language plpgsql
as
$$
DECLARE
    next_sequence bigint;
BEGIN
    -- Try update first
    UPDATE event_sequences
    SET sequence_no = sequence_no + 1
    WHERE budget_id = p_budget_id
    RETURNING sequence_no INTO next_sequence;

    -- If no row existed, insert
    IF NOT FOUND THEN
        INSERT INTO event_sequences (budget_id, sequence_no)
        VALUES (p_budget_id, 1)
        RETURNING sequence_no INTO next_sequence;
    END IF;

    RETURN next_sequence;
END;
$$;