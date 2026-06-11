import { Project, SyntaxKind } from 'ts-morph';

const project = new Project();
project.addSourceFilesAtPaths("src/modules/finance/**/*.tsx");

const files = [
  'FinanceApp.tsx',
  'ReferencesContractorsPage.tsx',
  'DealsInvoicesPage.tsx',
  'LiabilitiesPage.tsx',
  'ReferencesCategoriesPage.tsx',
  'AssetsPage.tsx',
  'BudgetPlanningPage.tsx',
  'ReferencesAccountsPage.tsx',
  'SettingsPage.tsx',
  'DocumentsPage.tsx',
  'ProjectsPage.tsx',
  'DealsSalesPage.tsx',
  'ReferencesEntitiesPage.tsx',
  'PaymentApprovalsPage.tsx',
  'ReferencesProductsPage.tsx',
  'DealsPurchasePage.tsx',
  'PayLoanModal.tsx',
  'LiabilitiesTable.tsx',
  'LoanModal.tsx',
  'DocumentViewerModal.tsx',
  'PurchaseDealDetailsView.tsx',
  'DealDetailsModal.tsx',
  'DataImportWizard.tsx',
  'BudgetBdrDetail.tsx',
  'AccountsTable.tsx',
  'ProductFormModal.tsx',
  'ProjectFormModal.tsx',
  'CategoriesTreeTable.tsx',
  'DealsTable.tsx',
  'BudgetBddsList.tsx',
  'PaymentCalendarTable.tsx',
  'QuickExpenseModal.tsx'
];

const hasCyrillic = (str) => /[А-Яа-яЁё]/.test(str);

for (const fileName of files) {
  const sourceFile = project.getSourceFile(f => f.getFilePath().endsWith('/' + fileName));
  if (!sourceFile) {
    console.log(`Could not find ${fileName} in project`);
    continue;
  }

  let modified = false;

  const jsxTexts = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText);
  for (const jsxText of jsxTexts) {
    const text = jsxText.getText();
    if (hasCyrillic(text)) {
      const parent = jsxText.getParent();
      if (parent && (parent.getKind() === SyntaxKind.JsxElement || parent.getKind() === SyntaxKind.JsxFragment)) {
        const trimmed = text.trim();
        if (trimmed) {
          const leftSpace = text.slice(0, text.indexOf(trimmed[0]));
          const rightSpace = text.slice(text.lastIndexOf(trimmed[trimmed.length-1]) + 1);
          const escaped = trimmed.replace(/"/g, '&quot;');
          jsxText.replaceWithText(`${leftSpace}<TranslatableText text="${escaped}" />${rightSpace}`);
          modified = true;
        }
      }
    }
  }

  if (modified) {
    const imports = sourceFile.getImportDeclarations();
    const hasTranslatableText = imports.some(i => i.getModuleSpecifierValue().includes('TranslatableText'));
    if (!hasTranslatableText) {
      const filePath = sourceFile.getFilePath();
      const importPath = filePath.includes('components') 
        ? '../../../components/TranslatableText'
        : '../../../components/TranslatableText';
      sourceFile.addImportDeclaration({
        namedImports: ['TranslatableText'],
        moduleSpecifier: importPath,
      });
    }
    sourceFile.saveSync();
    console.log(`Updated ${fileName}`);
  }
}
