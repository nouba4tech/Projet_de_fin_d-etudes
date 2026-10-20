package com.mirador.hotel.saga;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

/**
 * Orchestration-based saga: runs the steps in order; when a critical step fails, the steps that already
 * completed are compensated in reverse order, and the failure is reported.
 */
public final class SagaOrchestrator<C> {

    private final List<SagaStep<C>> steps;

    public SagaOrchestrator(List<SagaStep<C>> steps) {
        this.steps = List.copyOf(steps);
    }

    public SagaResult run(C context, SagaListener listener) {
        Deque<SagaStep<C>> completed = new ArrayDeque<>();
        for (SagaStep<C> step : steps) {
            listener.onStep(step.name(), StepStatus.STARTED, null);
            try {
                step.execute(context);
                listener.onStep(step.name(), StepStatus.DONE, null);
                completed.push(step);
            } catch (Exception ex) {
                String reason = describe(ex);
                listener.onStep(step.name(), StepStatus.FAILED, reason);
                if (!step.critical()) {
                    continue;
                }
                return compensate(completed, context, listener, step.name(), reason);
            }
        }
        return SagaResult.ok();
    }

    private SagaResult compensate(Deque<SagaStep<C>> completed, C context, SagaListener listener,
                                  String failedStep, String reason) {
        List<String> compensated = new ArrayList<>();
        List<String> failures = new ArrayList<>();
        while (!completed.isEmpty()) {
            SagaStep<C> step = completed.pop();
            if (!step.hasCompensation()) {
                continue;
            }
            try {
                step.compensate(context);
                listener.onStep(step.name(), StepStatus.COMPENSATED, null);
                compensated.add(step.name());
            } catch (Exception ex) {
                listener.onStep(step.name(), StepStatus.COMPENSATION_FAILED, describe(ex));
                failures.add(step.name());
            }
        }
        return new SagaResult(false, failedStep, reason, List.copyOf(compensated), List.copyOf(failures));
    }

    private static String describe(Exception ex) {
        String message = ex.getMessage();
        String text = message == null || message.isBlank() ? ex.getClass().getSimpleName() : message;
        return text.length() > 480 ? text.substring(0, 480) : text;
    }
}
