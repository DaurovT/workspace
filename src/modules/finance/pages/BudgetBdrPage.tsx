import React, { useState } from 'react';
import { BudgetBdrList, type BdrBudget } from '../components/BudgetBdrList';
import { BudgetBdrDetail } from '../components/BudgetBdrDetail';

const BudgetBdrPage: React.FC = () => {
  const [selected, setSelected] = useState<BdrBudget | null>(null);

  if (selected) {
    return <BudgetBdrDetail budget={selected} onBack={() => setSelected(null)} />;
  }
  return <BudgetBdrList onSelect={setSelected} />;
};

export default BudgetBdrPage;
