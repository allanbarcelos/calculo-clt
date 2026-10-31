import { useEffect, useMemo, useRef, useState } from 'react';
import { useFormText } from '../../hooks/useFormText.js';
import { usePersistentState } from '../../hooks/usePersistentState.js';
import { useServices } from '../../hooks/useServices.js';
import LiveSummary from './LiveSummary.jsx';
import StepNav from './StepNav.jsx';
import Stepper from './Stepper.jsx';
import { STEPS } from './steps.js';

const STORAGE_KEY = 'custo-claro:v3';
const START_INDEX = STEPS.findIndex((s) => s.startsCalculation);

export default function Wizard() {
  const { calculator, formDefaults, wageFloors } = useServices();
  const t = useFormText();
  const steps = STEPS.map((s) => ({ ...s, ...t.step(s.id) }));
  const defaults = useMemo(() => formDefaults.defaults(), [formDefaults]);
  const [data, setData] = usePersistentState(STORAGE_KEY, defaults);
  const [step, setStep] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const headingRef = useRef(null);
  const firstRender = useRef(true);

  const set = (patch) => setData((d) => ({ ...d, ...patch }));
  const result = useMemo(() => calculator.calculate(data), [calculator, data]);
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
    setStep(0);
  };

  const current = steps[step];
  const { Component } = current;
  const errors = showErrors && current.startsCalculation && salaryError ? { salary: salaryError } : {};

  return (
    <section id="calculadora" className="container calculator" aria-labelledby="step-heading">
      <Stepper steps={steps} current={step} onSelect={goTo} />
      <div className={`calculator__body${current.isResult ? ' calculator__body--full' : ''}`}>
        <form className="card step" noValidate onSubmit={(e) => { e.preventDefault(); goTo(Math.min(step + 1, STEPS.length - 1)); }}>
          <header className="step__header">
            <p className="step__count">Etapa {step + 1} de {STEPS.length}</p>
            <h2 id="step-heading" ref={headingRef} tabIndex={-1}>{current.heading}</h2>
            <p className="step__intro">{current.intro}</p>
          </header>
          <div className="step__content">
            <Component data={data} set={set} result={result} errors={errors} />
          </div>
          <StepNav
            canGoBack={step > 0}
            isLast={step === STEPS.length - 1}
            isBeforeLast={step === STEPS.length - 2}
            onBack={() => goTo(step - 1)}
            onReset={reset}
          />
        </form>
        {!current.isResult && <LiveSummary started={data.salary > 0} result={result} />}
      </div>
    </section>
  );
}
