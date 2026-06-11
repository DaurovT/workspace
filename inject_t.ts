import { Project, SyntaxKind } from 'ts-morph';

const project = new Project();
project.addSourceFilesAtPaths("src/modules/finance/**/*.tsx");
project.addSourceFilesAtPaths("src/modules/finance/**/*.ts");

for (const sourceFile of project.getSourceFiles()) {
  const text = sourceFile.getFullText();
  if (!text.includes('t("')) continue;

  let changed = false;

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
    .filter(d => {
       const name = d.getName();
       if (!name || name[0] !== name[0].toUpperCase()) return false;
       const init = d.getInitializer();
       return init && (init.getKind() === SyntaxKind.ArrowFunction || init.getKind() === SyntaxKind.FunctionExpression);
    });
    
  const funcDecls = sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration)
    .filter(d => {
       const name = d.getName();
       return name && name[0] === name[0].toUpperCase();
    });

  const allComps = [...funcs.map(f => f.getInitializer()), ...funcDecls];

  for (const comp of allComps) {
    if (!comp) continue;
    let block = null;
    
    if (comp.getKind() === SyntaxKind.ArrowFunction || comp.getKind() === SyntaxKind.FunctionExpression) {
      block = (comp as any).getBody();
    } else if (comp.getKind() === SyntaxKind.FunctionDeclaration) {
      block = (comp as any).getBody();
    }

    if (block && block.getKind() === SyntaxKind.Block) {
      const hasHook = block.getStatements().some((s: any) => s.getText().includes('useTranslation()'));
      if (!hasHook) {
        block.insertStatements(0, 'const { t } = useTranslation();');
        changed = true;
      }
    }
  }

  if (changed) {
    console.log(`Injected in ${sourceFile.getFilePath()}`);
  }
}

project.saveSync();
