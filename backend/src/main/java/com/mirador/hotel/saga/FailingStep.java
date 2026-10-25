package com.mirador.hotel.saga;

/**
 * Fault injection for demos and tests: behaves like the wrapped step but fails when executed, which triggers the
 * compensation of the steps that already completed. Only used when paiements.saga.fault-injection=true.
 */
public final class FailingStep<C> implements SagaStep<C> {

    private final SagaStep<C> delegate;

    public FailingStep(SagaStep<C> delegate) {
        this.delegate = delegate;
    }

    @Override
    public String name() {
        return delegate.name();
    }

    @Override
    public void execute(C context) {
        throw new IllegalStateException("Echec simule de l'etape " + delegate.name() + " (injection de panne)");
    }

    @Override
    public boolean hasCompensation() {
        return delegate.hasCompensation();
    }

    @Override
    public void compensate(C context) throws Exception {
        delegate.compensate(context);
    }

    @Override
    public boolean critical() {
        return delegate.critical();
    }
}
