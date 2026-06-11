import { Project, SyntaxKind, JsxAttribute } from 'ts-morph';

const project = new Project();
project.addSourceFilesAtPaths("src/modules/finance/**/*.tsx");

for (const sourceFile of project.getSourceFiles()) {
  let changed = false;

  const stringLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);
  const jsxTexts = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText);
  
  let needsT = false;
  for (const sl of stringLiterals) {
    if (/[А-Яа-яЁё]/.test(sl.getLiteralText())) needsT = true;
  }
  for (const jt of jsxTexts) {
    if (/[А-Яа-яЁё]/.test(jt.getLiteralText().trim())) needsT = true;
  }

  if (!needsT) continue;

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
    changed = true;
  }

  const funcs = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration)
    .filter(d => d.getInitializer() && (d.getInitializer()!.getKind() === SyntaxKind.ArrowFunction || d.getInitializer()!.getKind() === SyntaxKind.FunctionExpression));
  const funcDecls = sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration);
  const allComps = [...funcs.map(f => f.getInitializer()), ...funcDecls];

  for (const comp of allComps) {
    if (!comp) continue;
    const hasJsx = comp.getDescendantsOfKind(SyntaxKind.JsxElement).length > 0 || comp.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement).length > 0 || comp.getDescendantsOfKind(SyntaxKind.JsxFragment).length > 0;
    
    let block: any = null;
    if (comp.getKind() === SyntaxKind.ArrowFunction || comp.getKind() === SyntaxKind.FunctionExpression) {
      block = (comp as any).getBody();
    } else if (comp.getKind() === SyntaxKind.FunctionDeclaration) {
      block = (comp as any).getBody();
    }

    if (hasJsx && block && block.getKind() === SyntaxKind.Block) {
      const hasHook = block.getStatements().some((s: any) => s.getText().includes('useTranslation()'));
      if (!hasHook) {
        block.insertStatements(0, 'const { t } = useTranslation();');
        changed = true;
      }
    }
  }

  // Before replacing text, process JsxText elements
  for (const jt of sourceFile.getDescendantsOfKind(SyntaxKind.JsxText)) {
    if (jt.wasForgotten()) continue;
    const text = jt.getLiteralText().trim();
    if (/[А-Яа-яЁё]/.test(text)) {
      const escapedStr = JSON.stringify(text);
      jt.replaceWithText(`{t(${escapedStr}, ${escapedStr})}`);
      changed = true;
    }
  }

  // Process StringLiterals
  for (const sl of sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral)) {
    if (sl.wasForgotten()) continue;
    const text = sl.getLiteralText();
    if (/[А-Яа-яЁё]/.test(text)) {
      const parent = sl.getParent();
      if (!parent) continue;
      if (parent.getKind() === SyntaxKind.ImportDeclaration) continue;
      
      const escapedStr = JSON.stringify(text);
      
      if (parent.getKind() === SyntaxKind.JsxAttribute) {
        const attr = parent as JsxAttribute;
        if (attr.getNameNode().getText() === 'className') continue;
        sl.replaceWithText(`{t(${escapedStr}, ${escapedStr})}`);
        changed = true;
      } else if (parent.getKind() === SyntaxKind.PropertyAssignment) {
        const prop = parent as any;
        if (prop.getNameNode && prop.getNameNode() === sl) {
          const initText = prop.getInitializer() ? prop.getInitializer().getText() : 'undefined';
          parent.replaceWithText(`[t(${escapedStr}, ${escapedStr})]: ${initText}`);
        } else {
          sl.replaceWithText(`t(${escapedStr}, ${escapedStr})`);
        }
        changed = true;
      } else if (parent.getKind() === SyntaxKind.CallExpression) {
         const callExpr = parent as any;
         if (callExpr.getChildAtIndex(0).getText().endsWith('t')) continue;
         sl.replaceWithText(`t(${escapedStr}, ${escapedStr})`);
         changed = true;
      } else {
         sl.replaceWithText(`t(${escapedStr}, ${escapedStr})`);
         changed = true;
      }
    }
  }
}

project.saveSync();
console.log('All files updated');
