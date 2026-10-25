package com.mirador.hotel.saga;

/** Receives the progress of a saga (persisted by the payment service for traceability). */
@FunctionalInterface
public interface SagaListener {

    void onStep(String stepName, StepStatus status, String detail);

    SagaListener NOOP = (stepName, status, detail) -> { };
}
