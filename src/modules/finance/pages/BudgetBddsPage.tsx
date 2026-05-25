import React, { useState } from 'react';
import { BudgetBddsList, type BddsBudget } from '../components/BudgetBddsList';
import { BudgetBddsDetail } from '../components/BudgetBddsDetail';

const BudgetBddsPage: React.FC = () => {
  const [selected, setSelected] = useState<BddsBudget | null>(null);

  if (selected) {
    return <BudgetBddsDetail budget={selected} onBack={() => setSelected(null)} />;
  }
  return <BudgetBddsList onSelect={setSelected} />;
};

export default BudgetBddsPage;
