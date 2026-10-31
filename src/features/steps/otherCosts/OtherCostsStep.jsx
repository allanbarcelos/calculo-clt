import OperationalCostsSection from './OperationalCostsSection.jsx';
import TerminationSection from './TerminationSection.jsx';

export default function OtherCostsStep(props) {
  return (
    <>
      <TerminationSection {...props} />
      <OperationalCostsSection {...props} />
    </>
  );
}
