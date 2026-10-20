package com.mirador.hotel.saga;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SagaOrchestratorTest {

    /** Records every call so the tests can assert on the exact order. */
    static final class Recorder implements SagaListener {
        final List<String> events = new ArrayList<>();

        @Override
        public void onStep(String stepName, StepStatus status, String detail) {
            events.add(stepName + ":" + status);
        }
    }

    static SagaStep<List<String>> step(String name, boolean compensable, boolean fails, boolean critical,
                                       boolean compensationFails) {
        return new SagaStep<>() {
            public String name() {
                return name;
            }

            public void execute(List<String> log) throws Exception {
                log.add("do " + name);
                if (fails) {
                    throw new IllegalStateException(name + " a echoue");
                }
            }

            public boolean hasCompensation() {
                return compensable;
            }

            public void compensate(List<String> log) throws Exception {
                if (compensationFails) {
                    throw new IllegalStateException("undo " + name + " impossible");
                }
                log.add("undo " + name);
            }

            public boolean critical() {
                return critical;
            }
        };
    }

    @Test
    void runsAllStepsInOrderWhenEverythingSucceeds() {
        List<String> log = new ArrayList<>();
        Recorder recorder = new Recorder();
        SagaResult result = new SagaOrchestrator<>(List.of(
                step("A", true, false, true, false), step("B", true, false, true, false), step("C", false, false, true, false)))
                .run(log, recorder);

        assertTrue(result.success());
        assertEquals(List.of("do A", "do B", "do C"), log);
        assertEquals(List.of("A:STARTED", "A:DONE", "B:STARTED", "B:DONE", "C:STARTED", "C:DONE"), recorder.events);
    }

    @Test
    void compensatesCompletedStepsInReverseOrderWhenACriticalStepFails() {
        List<String> log = new ArrayList<>();
        Recorder recorder = new Recorder();
        SagaResult result = new SagaOrchestrator<>(List.of(
                step("A", true, false, true, false), step("B", true, false, true, false),
                step("C", true, true, true, false), step("D", true, false, true, false)))
                .run(log, recorder);

        assertFalse(result.success());
        assertEquals("C", result.failedStep());
        assertEquals("C a echoue", result.failureReason());
        // D never ran, C (the failing step) is not compensated, B then A are undone in reverse order
        assertEquals(List.of("do A", "do B", "do C", "undo B", "undo A"), log);
        assertEquals(List.of("B", "A"), result.compensatedSteps());
        assertTrue(result.compensationFailures().isEmpty());
        assertTrue(recorder.events.containsAll(List.of("C:FAILED", "B:COMPENSATED", "A:COMPENSATED")));
    }

    @Test
    void stepsWithoutCompensationAreSkippedDuringRollback() {
        List<String> log = new ArrayList<>();
        SagaResult result = new SagaOrchestrator<>(List.of(
                step("READ", false, false, true, false), step("WRITE", true, false, true, false),
                step("BOOM", true, true, true, false)))
                .run(log, SagaListener.NOOP);

        assertFalse(result.success());
        assertEquals(List.of("do READ", "do WRITE", "do BOOM", "undo WRITE"), log);
        assertEquals(List.of("WRITE"), result.compensatedSteps());
    }

    @Test
    void aNonCriticalFailureDoesNotCancelTheSaga() {
        List<String> log = new ArrayList<>();
        Recorder recorder = new Recorder();
        SagaResult result = new SagaOrchestrator<>(List.of(
                step("A", true, false, true, false), step("NOTIFY", false, true, false, false),
                step("C", true, false, true, false)))
                .run(log, recorder);

        assertTrue(result.success());
        assertEquals(List.of("do A", "do NOTIFY", "do C"), log);
        assertTrue(recorder.events.contains("NOTIFY:FAILED"));
    }

    @Test
    void aFailingCompensationIsReportedAndTheOthersStillRun() {
        List<String> log = new ArrayList<>();
        SagaResult result = new SagaOrchestrator<>(List.of(
                step("A", true, false, true, false), step("B", true, false, true, true),
                step("C", true, true, true, false)))
                .run(log, SagaListener.NOOP);

        assertFalse(result.success());
        assertTrue(result.compensationFailed());
        assertEquals(List.of("B"), result.compensationFailures());
        assertEquals(List.of("A"), result.compensatedSteps());
        assertEquals(List.of("do A", "do B", "do C", "undo A"), log);
    }
}
