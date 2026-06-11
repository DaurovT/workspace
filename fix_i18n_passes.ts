import { Project, SyntaxKind, JsxAttribute } from 'ts-morph';

const project = new Project();
project.addSourceFilesAtPaths("src/modules/finance/**/*.tsx");

console.log("PASS 1: Imports and hooks...");
for (const sourceFile of project.getSourceFiles()) {
  let needsT = false;
  const sls = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);
  const jts = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText);
  for (const sl of sls) { if (/[А-Яа-яЁё]/.test(sl.getLiteralText())) needsT = true; }
  for (const jt of jts) { if (/[А-Яа-яЁё]/.test(jt.getLiteralText().trim())) needsT = true; }
  
  if (!needsT) continue;

  let hasI18nImport = sourceFile.getImportDeclarations().some(d => d.getModuleSpecifierValue() === 'react-i18next');
  if (!hasI18nImport) {
    sourceFile.addImportDeclaration({ moduleSpecifier: 'react-i18next', namedImports: ['useTranslation'] });
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
      if (!hasHook) block.insertStatements(0, 'const { t } = useTranslation();');
    }
  }
}
project.saveSync();

console.log("PASS 2: JsxText...");
for (const sourceFile of project.getSourceFiles()) {
  let jts = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText);
  // Iterate in reverse to avoid invalidating previous nodes
  for (let i = jts.length - 1; i >= 0; i--) {
    const jt = jts[i];
    if (jt.wasForgotten()) continue;
    const text = jt.getLiteralText();
    const trimmed = text.trim();
    if (/[А-Яа-яЁё]/.test(trimmed)) {
      const escapedStr = JSON.stringify(trimmed);
      // We need to keep leading/trailing whitespaces around the replacement if needed, 
      // but usually `{t(...)}` works fine inside JSX.
      jt.replaceWithText(`{t(${escapedStr}, ${escapedStr})}`);
    }
  }
}
project.saveSync();

console.log("PASS 3: StringLiteral...");
for (const sourceFile of project.getSourceFiles()) {
  let sls = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);
  for (let i = sls.length - 1; i >= 0; i--) {
    const sl = sls[i];
    if (sl.wasForgotten()) continue;
    const text = sl.getLiteralText();
    if (/[А-Яа-яЁё]/.test(text)) {
      const parent = sl.getParent();
      if (!parent || parent.getKind() === SyntaxKind.ImportDeclaration) continue;
      
      const escapedStr = JSON.stringify(text);
      if (parent.getKind() === SyntaxKind.JsxAttribute) {
        const attr = parent as JsxAttribute;
        if (attr.getNameNode().getText() === 'className') continue;
        sl.replaceWithText(`{t(${escapedStr}, ${escapedStr})}`);
      } else if (parent.getKind() === SyntaxKind.PropertyAssignment) {
        const prop = parent as any;
        if (prop.getNameNode && prop.getNameNode() === sl) {
          const initText = prop.getInitializer() ? prop.getInitializer().getText() : 'undefined';
          parent.replaceWithText(`[t(${escapedStr}, ${escapedStr})]: ${initText}`);
        } else {
          sl.replaceWithText(`t(${escapedStr}, ${escapedStr})`);
        }
      } else if (parent.getKind() === SyntaxKind.CallExpression) {
         const callExpr = parent as any;
         if (callExpr.getChildAtIndex(0).getText().endsWith('t')) continue;
         sl.replaceWithText(`t(${escapedStr}, ${escapedStr})`);
      } else {
         sl.replaceWithText(`t(${escapedStr}, ${escapedStr})`);
      }
    }
  }
}
project.saveSync();

console.log("Done.");
