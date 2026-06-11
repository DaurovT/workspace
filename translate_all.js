const { Project, SyntaxKind, ts } = require('ts-morph');
const fs = require('fs');

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
});

const files = [
  'src/modules/finance/FinanceApp.tsx',
  'src/modules/finance/pages/ReferencesContractorsPage.tsx',
  'src/modules/finance/pages/DealsInvoicesPage.tsx',
  'src/modules/finance/pages/LiabilitiesPage.tsx',
  'src/modules/finance/pages/ReferencesCategoriesPage.tsx',
  'src/modules/finance/pages/AssetsPage.tsx',
  'src/modules/finance/pages/BudgetPlanningPage.tsx',
  'src/modules/finance/pages/ReferencesAccountsPage.tsx',
  'src/modules/finance/pages/SettingsPage.tsx',
  'src/modules/finance/pages/DocumentsPage.tsx',
  'src/modules/finance/pages/ProjectsPage.tsx',
  'src/modules/finance/pages/DealsSalesPage.tsx',
  'src/modules/finance/pages/ReferencesEntitiesPage.tsx',
  'src/modules/finance/pages/PaymentApprovalsPage.tsx',
  'src/modules/finance/pages/ReferencesProductsPage.tsx',
  'src/modules/finance/pages/DealsPurchasePage.tsx',
  'src/modules/finance/components/PayLoanModal.tsx',
  'src/modules/finance/components/LiabilitiesTable.tsx',
  'src/modules/finance/components/LoanModal.tsx',
  'src/modules/finance/components/DocumentViewerModal.tsx',
  'src/modules/finance/components/PurchaseDealDetailsView.tsx',
  'src/modules/finance/components/DealDetailsModal.tsx',
  'src/modules/finance/components/DataImportWizard.tsx',
  'src/modules/finance/components/BudgetBdrDetail.tsx',
  'src/modules/finance/components/AccountsTable.tsx',
  'src/modules/finance/components/ProductFormModal.tsx',
  'src/modules/finance/components/ProjectFormModal.tsx',
  'src/modules/finance/components/CategoriesTreeTable.tsx',
  'src/modules/finance/components/DealsTable.tsx',
  'src/modules/finance/components/BudgetBddsList.tsx',
  'src/modules/finance/components/PaymentCalendarTable.tsx',
  'src/modules/finance/components/QuickExpenseModal.tsx'
];

function hasRussianChars(str) {
  return /[А-Яа-яЁё]/.test(str);
}

for (const filePath of files) {
  const sourceFile = project.getSourceFile(filePath);
  if (!sourceFile) {
    console.log(`Could not find ${filePath}`);
    continue;
  }

  let modified = false;
  
  // Add import if not present
  const imports = sourceFile.getImportDeclarations();
  const hasTranslatableText = imports.some(i => i.getModuleSpecifierValue().includes('TranslatableText'));
  if (!hasTranslatableText) {
    const importPath = filePath.includes('components') 
      ? '../../../components/TranslatableText'
      : '../../../components/TranslatableText';
    sourceFile.addImportDeclaration({
      namedImports: ['TranslatableText'],
      moduleSpecifier: importPath,
    });
    modified = true;
  }

  // Find all JsxText nodes
  const jsxTexts = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText);
  for (const jsxText of jsxTexts) {
    const text = jsxText.getText();
    if (hasRussianChars(text)) {
      const trimmed = text.trim();
      if (trimmed) {
        // if the text contains newlines, replace it as a block? 
        // we'll replace only if it's mostly a single continuous string to be safe.
        if (!text.includes('\n') || text.trim().length > 0) {
            // It's safer to just wrap it if it's inside an element
            const parent = jsxText.getParent();
            if (parent && (parent.getKind() === SyntaxKind.JsxElement || parent.getKind() === SyntaxKind.JsxFragment)) {
                // Actually it's easier to replace text using string manipulation because ts-morph JSX replacement can be tricky, 
                // but let's try replacing with <TranslatableText text="..." />
                // Note: we just replace the text node
            }
        }
      }
    }
  }

  if (modified) {
    // sourceFile.saveSync();
  }
}

