import { Project, SyntaxKind } from 'ts-morph';
import * as fs from 'fs';

const project = new Project();
project.addSourceFilesAtPaths("src/modules/finance/**/*.tsx");

for (const sourceFile of project.getSourceFiles()) {
  const filePath = sourceFile.getFilePath();
  let content = sourceFile.getFullText();
  let replacements: { start: number, end: number, text: string }[] = [];

  let needsT = false;
  const sls = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);
  const jts = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText);
  for (const sl of sls) { if (/[А-Яа-яЁё]/.test(sl.getLiteralText())) needsT = true; }
  for (const jt of jts) { if (/[А-Яа-яЁё]/.test(jt.getLiteralText().trim())) needsT = true; }
  if (!needsT) continue;

  const funcs = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration)
    .filter(d => d.getInitializer() && (d.getInitializer()!.getKind() === SyntaxKind.ArrowFunction || d.getInitializer()!.getKind() === SyntaxKind.FunctionExpression));
  const funcDecls = sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration);
  const allComps = [...funcs.map(f => f.getInitializer()), ...funcDecls];

  for (const comp of allComps) {
    if (!comp) continue;
    
    let isReactComp = false;
    if (comp.getKind() === SyntaxKind.FunctionDeclaration) {
        const name = (comp as any).getName();
        if (name && name[0] === name[0].toUpperCase()) isReactComp = true;
    } else {
        const parentVar = comp.getParent();
        if (parentVar && parentVar.getKind() === SyntaxKind.VariableDeclaration) {
            const name = (parentVar as any).getName();
            if (name && name[0] === name[0].toUpperCase()) isReactComp = true;
        }
    }

    if (!isReactComp) continue;

    const hasJsx = comp.getDescendantsOfKind(SyntaxKind.JsxElement).length > 0 || comp.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement).length > 0 || comp.getDescendantsOfKind(SyntaxKind.JsxFragment).length > 0;
    
    let block: any = null;
    if (comp.getKind() === SyntaxKind.ArrowFunction || comp.getKind() === SyntaxKind.FunctionExpression) {
      block = (comp as any).getBody();
    } else if (comp.getKind() === SyntaxKind.FunctionDeclaration) {
      block = (comp as any).getBody();
    }

    if (hasJsx && block && block.getKind() === SyntaxKind.Block) {
      const blockText = block.getText();
      if (!blockText.includes('useTranslation()')) {
        const firstStmt = block.getStatements()[0];
        if (firstStmt) {
           replacements.push({ start: firstStmt.getStart(), end: firstStmt.getStart(), text: 'const { t } = useTranslation();\n    ' });
        } else {
           replacements.push({ start: block.getStart() + 1, end: block.getStart() + 1, text: '\nconst { t } = useTranslation();\n' });
        }
      }
    }
  }

  replacements.sort((a, b) => b.start - a.start);
  
  let validReplacements = [];
  let lastStart = Infinity;
  for (const r of replacements) {
     if (r.end <= lastStart) {
        validReplacements.push(r);
        lastStart = r.start;
     }
  }

  for (const r of validReplacements) {
    content = content.slice(0, r.start) + r.text + content.slice(r.end);
  }

  if (replacements.length > 0) {
      fs.writeFileSync(filePath, content);
  }
}

console.log("AST Hooks Inserted!");
