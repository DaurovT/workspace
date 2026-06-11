import { Project } from 'ts-morph';
const project = new Project();
project.addSourceFilesAtPaths("src/modules/finance/components/FinanceHeader.tsx");
const sourceFile = project.getSourceFiles()[0];
const imports = sourceFile.getImportDeclarations();
if (!imports.some(i => i.getModuleSpecifierValue().includes('LanguageSwitcher'))) {
  sourceFile.addImportDeclaration({
    namedImports: ['LanguageSwitcher'],
    moduleSpecifier: '../../../components/LanguageSwitcher'
  });
}
const text = sourceFile.getFullText();
if (!text.includes('<LanguageSwitcher />')) {
  const updatedText = text.replace(
    '<GlobalNotificationDropdown />',
    '<LanguageSwitcher />\n      {/* Уведомления */}\n      <GlobalNotificationDropdown />'
  );
  sourceFile.replaceWithText(updatedText);
  sourceFile.saveSync();
}
