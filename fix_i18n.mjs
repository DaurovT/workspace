import { Project } from 'ts-morph';
const project = new Project();
project.addSourceFilesAtPaths("src/modules/finance/components/FinanceSidebar.tsx");
project.addSourceFilesAtPaths("src/modules/finance/components/FinanceHeader.tsx");
for (const sourceFile of project.getSourceFiles()) {
  const imports = sourceFile.getImportDeclarations();
  if (!imports.some(i => i.getModuleSpecifierValue() === 'react-i18next')) {
    sourceFile.addImportDeclaration({
      namedImports: ['useTranslation'],
      moduleSpecifier: 'react-i18next'
    });
    sourceFile.saveSync();
  }
}
