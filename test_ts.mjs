import { Project, SyntaxKind } from 'ts-morph';
const project = new Project();
project.addSourceFilesAtPaths("src/modules/finance/**/*.tsx");

const sourceFile = project.getSourceFile(f => f.getFilePath().endsWith('/FinanceApp.tsx'));
if (sourceFile) {
  const jsxTexts = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText);
  console.log(`Found ${jsxTexts.length} JsxText nodes in FinanceApp.tsx`);
  for (const t of jsxTexts) {
    console.log(t.getText(), /[А-Яа-яЁё]/.test(t.getText()));
  }
} else {
  console.log("Not found");
}
