'use client';

/**
 * CNCPT's tours use the shared far-cms tour code (same tours, plus Customers), so they take the admin's skin, a closed
 * tour does not start again, and finishing one no longer calls itself in a loop. This file kept an older copy with
 * fixed white and blue styles that overrode the shared ones (2026-11-23).
 */
export { WizardProvider, useWizard } from '@far-cms/cms/src/contexts/WizardContext';
