import { Project, SyntaxKind } from 'ts-morph';
import fs from 'fs';

const project = new Project();
project.addSourceFilesAtPaths("src/modules/finance/components/FinanceSidebar.tsx");
project.addSourceFilesAtPaths("src/modules/finance/components/FinanceHeader.tsx");

const hasCyrillic = (str) => /[А-Яа-яЁё]/.test(str);

for (const sourceFile of project.getSourceFiles()) {
  let modified = false;

  const stringLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);
  for (const literal of stringLiterals) {
    const text = literal.getLiteralValue();
    if (hasCyrillic(text)) {
      const parent = literal.getParent();
      // Only wrap if it's not inside a t() call already
      if (parent && parent.getKind() === SyntaxKind.PropertyAssignment) {
        // e.g. label: 'Показатели' -> label: t('Показатели', 'Показатели')
        literal.replaceWithText(`t('${text}', '${text}')`);
        modified = true;
      }
    }
  }
  
  // also handle JsxText which I might have missed if I didn't run the script on them?
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
    sourceFile.saveSync();
    console.log(`Updated ${sourceFile.getFilePath()}`);
  }
}
