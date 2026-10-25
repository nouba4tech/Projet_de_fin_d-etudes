package com.mirador.hotel.saga;

import java.util.List;

public record SagaResult(
        boolean success,
        String failedStep,
        String failureReason,
        List<String> compensatedSteps,
        List<String> compensationFailures) {

    public static SagaResult ok() {
        return new SagaResult(true, null, null, List.of(), List.of());
    }

    public boolean compensationFailed() {
        return !compensationFailures.isEmpty();
    }
}
