import { useEffect, useMemo, useRef, useState } from 'react';
import { useFormText } from '../../hooks/useFormText.js';
import { usePersistentState } from '../../hooks/usePersistentState.js';
import { useServices } from '../../hooks/useServices.js';
import LiveSummary from './LiveSummary.jsx';
import StepNav from './StepNav.jsx';
import Stepper from './Stepper.jsx';
import { STEPS, visibleSteps } from './steps.js';

const STORAGE_KEY = 'custo-claro:v3';
// The steps before the salary step are never hidden, so its index is the same in every list.
const START_INDEX = STEPS.findIndex((s) => s.startsCalculation);

export default function Wizard() {
  const services = useServices();
  const { calculator, contract, formDefaults, formState, wageFloors } = services;
  const t = useFormText();
  const defaults = useMemo(() => formDefaults.defaults(), [formDefaults]);
  const [data, setData] = usePersistentState(STORAGE_KEY, defaults, (stored) => formState.restore(stored));
  const steps = visibleSteps(data, services).map((s) => ({ ...s, ...t.step(s.id) }));
  const started = contract.isDayWorker(data) ? data.dayRate > 0 : data.salary > 0;
  const [step, setStep] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const headingRef = useRef(null);
  const firstRender = useRef(true);

  const set = (patch) => setData((d) => ({ ...d, ...patch }));
  const result = useMemo(() => calculator.calculate(data), [calculator, data]);
  // Nothing to reset while every field still has its initial value.
  const pristine = Object.keys(defaults).every((key) => data[key] === defaults[key]);
  const floor = wageFloors.resolve(data);
  const salaryError = data.salary < floor.value ? t.text('salary', 'error', { floor: floor.value }) : null;

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const goTo = (target) => {
    if (target >= START_INDEX && data.salary === 0) {
      // Reaching the salary step starts the calculation from the legal floor.
      set({ salary: floor.value, salaryAuto: true });
      setShowErrors(false);
      setStep(target);
      return;
    }
    if (target > START_INDEX && salaryError) {
      setShowErrors(true);
      setStep(START_INDEX);
      return;
    }
    setShowErrors(false);
    setStep(target);
  };

  const reset = () => {
    setData(defaults);
    setShowErrors(false);
    setStep(0);
  };

  const current = steps[Math.min(step, steps.length - 1)];
  const { Component } = current;
  const errors = showErrors && current.startsCalculation && salaryError ? { salary: salaryError } : {};

  return (
    <section id="calculadora" className="container calculator" aria-labelledby="step-heading">
      <Stepper steps={steps} current={step} onSelect={goTo} />
      <div className={`calculator__body${current.isResult ? ' calculator__body--full' : ''}`}>
        <form className="card step" noValidate onSubmit={(e) => { e.preventDefault(); goTo(Math.min(step + 1, steps.length - 1)); }}>
          <header className="step__header">
            <p className="step__count">Etapa {step + 1} de {steps.length}</p>
            <h2 id="step-heading" ref={headingRef} tabIndex={-1}>{current.heading}</h2>
            <p className="step__intro">{current.intro}</p>
          </header>
          <div className="step__content">
            <Component data={data} set={set} result={result} errors={errors} />
          </div>
          <StepNav
            canGoBack={step > 0}
            isLast={step === steps.length - 1}
            isBeforeLast={step === steps.length - 2}
            onBack={() => goTo(step - 1)}
            onReset={reset}
          />
        </form>
        {!current.isResult && <LiveSummary started={started} result={result} onReset={pristine ? null : reset} />}
      </div>
    </section>
  );
}
