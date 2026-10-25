package com.mirador.hotel.saga;

/**
 * One local transaction of a saga. {@link #compensate} must semantically undo {@link #execute} and be idempotent.
 */
public interface SagaStep<C> {

    String name();

    void execute(C context) throws Exception;

    /** Whether {@link #compensate} does something; steps without side effects keep the default. */
    default boolean hasCompensation() {
        return false;
    }

    default void compensate(C context) throws Exception {
    }

    /**
     * A non-critical step (e.g. sending a receipt) may fail without cancelling the saga:
     * the failure is logged and the saga carries on.
     */
    default boolean critical() {
        return true;
    }
}
