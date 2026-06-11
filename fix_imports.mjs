import { Project } from 'ts-morph';
const project = new Project();
project.addSourceFilesAtPaths("src/modules/finance/components/FinanceSidebar.tsx");
project.addSourceFilesAtPaths("src/modules/finance/components/FinanceHeader.tsx");
for (const sourceFile of project.getSourceFiles()) {
  const imports = sourceFile.getImportDeclarations();
  if (!imports.some(i => i.getModuleSpecifierValue().includes('TranslatableText'))) {
    sourceFile.addImportDeclaration({
      namedImports: ['TranslatableText'],
      moduleSpecifier: '../../../components/TranslatableText'
    });
    sourceFile.saveSync();
  }
}
