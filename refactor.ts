import { Project, SyntaxKind, VariableDeclaration } from 'ts-morph';

const project = new Project();
project.addSourceFilesAtPaths('src/**/*.tsx');
project.addSourceFilesAtPaths('src/**/*.ts');

const files = project.getSourceFiles();

files.forEach(sourceFile => {
  let changed = false;

  // Find variable declarations like `const { a, b } = useStore()`
  const varDecls = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
  
  varDecls.forEach(decl => {
    const initializer = decl.getInitializer();
    if (!initializer) return;
    
    // Check if it's `useStore()`
    if (initializer.getKind() === SyntaxKind.CallExpression) {
      const callExpr = initializer.asKind(SyntaxKind.CallExpression);
      if (callExpr && callExpr.getExpression().getText() === 'useStore') {
        const nameNode = decl.getNameNode();
        
        // Ensure it's an object binding pattern: `{ a, b }`
        if (nameNode.getKind() === SyntaxKind.ObjectBindingPattern) {
          const bindingPattern = nameNode.asKind(SyntaxKind.ObjectBindingPattern);
          if (bindingPattern) {
            const elements = bindingPattern.getElements();
            
            // Generate replacement strings: `const a = useStore(s => s.a);`
            const newStatements = elements.map(el => {
              const propName = el.getPropertyNameNode() ? el.getPropertyNameNode()!.getText() : el.getName();
              const varName = el.getName();
              return `const ${varName} = useStore(state => state.${propName});`;
            });
            
            // Replace the entire VariableStatement if possible
            const varStatement = decl.getFirstAncestorByKind(SyntaxKind.VariableStatement);
            if (varStatement) {
               varStatement.replaceWithText(newStatements.join('\n  '));
               changed = true;
            }
          }
        }
      }
    }
  });

  if (changed) {
    sourceFile.saveSync();
    console.log(`Refactored ${sourceFile.getBaseName()}`);
  }
});
