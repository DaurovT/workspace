import { Project, SyntaxKind } from 'ts-morph';

const project = new Project();
project.addSourceFilesAtPaths("src/modules/finance/pages/MainDashboard.tsx");
project.addSourceFilesAtPaths("src/modules/finance/pages/FinanceCfoDashboard.tsx");

for (const sourceFile of project.getSourceFiles()) {
  let hasI18nImport = false;
  for (const importDecl of sourceFile.getImportDeclarations()) {
    if (importDecl.getModuleSpecifierValue() === 'react-i18next') {
      hasI18nImport = true;
      break;
    }
  }

  if (!hasI18nImport) {
    sourceFile.addImportDeclaration({
      moduleSpecifier: 'react-i18next',
      namedImports: ['useTranslation']
    });
  }

  // Find all functional components
  const funcs = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration)
    .filter(d => d.getInitializer() && (d.getInitializer()!.getKind() === SyntaxKind.ArrowFunction || d.getInitializer()!.getKind() === SyntaxKind.FunctionExpression));
  
  const funcDecls = sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration);

  const allComps = [...funcs.map(f => f.getInitializer()), ...funcDecls];

  for (const comp of allComps) {
    // Check if it's a component (uppercase name or returns JSX)
    let isComp = false;
    let block = null;
    
    if (comp.getKind() === SyntaxKind.ArrowFunction || comp.getKind() === SyntaxKind.FunctionExpression) {
      block = comp.getBody();
      isComp = true; // simplifying
    } else if (comp.getKind() === SyntaxKind.FunctionDeclaration) {
      block = comp.getBody();
      isComp = comp.getName() && comp.getName()[0] === comp.getName()[0].toUpperCase();
    }

    if (isComp && block && block.getKind() === SyntaxKind.Block) {
      // Check if `const { t } = useTranslation();` exists
      const hasHook = block.getStatements().some(s => s.getText().includes('useTranslation()'));
      if (!hasHook) {
        block.insertStatements(0, 'const { t } = useTranslation();');
      }
    }
  }

  // Replace Cyrillic string literals with t('...', '...')
  const stringLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);
  for (const sl of stringLiterals) {
    const text = sl.getLiteralText();
    if (/[А-Яа-яЁё]/.test(text)) {
      // Ignore imports or classNames
      const parent = sl.getParent();
      if (parent.getKind() === SyntaxKind.ImportDeclaration) continue;
      if (parent.getKind() === SyntaxKind.JsxAttribute && parent.getName() === 'className') continue;
      
      sl.replaceWithText(`t("${text}", "${text}")`);
    }
  }

  // Also replace JsxText that wasn't wrapped
  const jsxTexts = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText);
  for (const jt of jsxTexts) {
    const text = jt.getLiteralText().trim();
    if (/[А-Яа-яЁё]/.test(text)) {
      jt.replaceWithText(`{t("${text}", "${text}")}`);
    }
  }

  // Find t("...", "...") and extract to update DB if needed.
}

project.saveSync();
