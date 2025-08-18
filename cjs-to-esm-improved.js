const fs = require('fs');
const path = require('path');

/**
 * jscodeshift transform to convert CommonJS to ES Modules
 * Handles:
 * 1. require() -> import statements
 * 2. module.exports -> export statements  
 * 3. Reports files changed
 */
module.exports = function transformer(fileInfo, api, options) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  let hasChanges = false;
  
  // Track imports and exports to avoid duplicates
  const addedImports = new Set();
  const existingImports = new Set();
  
  // First, collect existing imports to avoid duplicates
  root.find(j.ImportDeclaration).forEach(path => {
    const source = path.value.source.value;
    existingImports.add(source);
  });

  // 1. Convert require() statements to import statements
  
  // Handle: const X = require("pkg") -> import X from "pkg"
  // Handle: const { a, b } = require("pkg") -> import { a, b } from "pkg"
  root.find(j.VariableDeclaration).forEach(path => {
    const declaration = path.value;
    
    // Only process const declarations with require calls
    if (declaration.kind !== 'const') return;
    
    declaration.declarations.forEach(declarator => {
      if (!declarator.init || declarator.init.type !== 'CallExpression') return;
      if (!declarator.init.callee || declarator.init.callee.name !== 'require') return;
      
      const requireSource = declarator.init.arguments[0];
      if (!requireSource || requireSource.type !== 'Literal') return;
      
      const moduleName = requireSource.value;
      
      // Skip if we already added this import
      if (addedImports.has(moduleName) || existingImports.has(moduleName)) return;
      
      let importDeclaration;
      
      if (declarator.id.type === 'Identifier') {
        // const X = require("pkg") -> import X from "pkg"
        importDeclaration = j.importDeclaration(
          [j.importDefaultSpecifier(j.identifier(declarator.id.name))],
          j.literal(moduleName)
        );
      } else if (declarator.id.type === 'ObjectPattern') {
        // const { a, b } = require("pkg") -> import { a, b } from "pkg"
        const specifiers = declarator.id.properties.map(prop => {
          if (prop.type === 'Property' && prop.key && prop.key.name) {
            return j.importSpecifier(j.identifier(prop.key.name));
          }
          return null;
        }).filter(Boolean);
        
        importDeclaration = j.importDeclaration(specifiers, j.literal(moduleName));
      }
      
      if (importDeclaration) {
        // Add import at the top of the file
        const body = root.get().node.body;
        body.unshift(importDeclaration);
        addedImports.add(moduleName);
        hasChanges = true;
      }
    });
  });
  
  // Remove the original require variable declarations that we've converted
  root.find(j.VariableDeclaration).forEach(path => {
    const declaration = path.value;
    
    if (declaration.kind !== 'const') return;
    
    const shouldRemove = declaration.declarations.every(declarator => {
      if (!declarator.init || declarator.init.type !== 'CallExpression') return false;
      if (!declarator.init.callee || declarator.init.callee.name !== 'require') return false;
      
      const requireSource = declarator.init.arguments[0];
      if (!requireSource || requireSource.type !== 'Literal') return false;
      
      return addedImports.has(requireSource.value);
    });
    
    if (shouldRemove) {
      j(path).remove();
      hasChanges = true;
    }
  });

  // Handle standalone require calls: require("pkg") -> import "pkg"
  root.find(j.ExpressionStatement).forEach(path => {
    const expression = path.value.expression;
    if (expression.type === 'CallExpression' && 
        expression.callee && 
        expression.callee.name === 'require') {
      
      const requireSource = expression.arguments[0];
      if (requireSource && requireSource.type === 'Literal') {
        const moduleName = requireSource.value;
        
        if (!addedImports.has(moduleName) && !existingImports.has(moduleName)) {
          const importDeclaration = j.importDeclaration([], j.literal(moduleName));
          const body = root.get().node.body;
          body.unshift(importDeclaration);
          addedImports.add(moduleName);
          
          j(path).remove();
          hasChanges = true;
        }
      }
    }
  });

  // 2. Convert module.exports to export statements
  
  // Handle: module.exports = value -> export default value
  root.find(j.AssignmentExpression).forEach(path => {
    const assignment = path.value;
    
    if (assignment.left.type === 'MemberExpression' &&
        assignment.left.object && assignment.left.object.name === 'module' &&
        assignment.left.property && assignment.left.property.name === 'exports') {
      
      let exportDeclaration;
      
      try {
        if (assignment.right.type === 'ClassExpression') {
          // Handle class expression specially - just use export default for the whole expression
          exportDeclaration = j.exportDefaultDeclaration(assignment.right);
        } else if (assignment.right.type === 'FunctionExpression') {
          // module.exports = function name() {} -> export default function name() {}
          exportDeclaration = j.exportDefaultDeclaration(assignment.right);
        } else {
          // module.exports = value -> export default value
          exportDeclaration = j.exportDefaultDeclaration(assignment.right);
        }
      } catch (error) {
        console.log(`Error processing export in ${fileInfo.path}:`, error.message);
        // Fallback: just export the right-hand side as default
        exportDeclaration = j.exportDefaultDeclaration(assignment.right);
      }
      
      if (exportDeclaration) {
        j(path.parent).replaceWith(exportDeclaration);
        hasChanges = true;
      }
    }
  });
  
  // Handle: module.exports.prop = value -> export const prop = value
  root.find(j.AssignmentExpression).forEach(path => {
    const assignment = path.value;
    
    if (assignment.left.type === 'MemberExpression' &&
        assignment.left.object && 
        assignment.left.object.type === 'MemberExpression' &&
        assignment.left.object.object && assignment.left.object.object.name === 'module' &&
        assignment.left.object.property && assignment.left.object.property.name === 'exports') {
      
      const propName = assignment.left.property.name || assignment.left.property.value;
      
      if (propName) {
        let exportDeclaration;
        
        try {
          if (assignment.right.type === 'ClassExpression') {
            exportDeclaration = j.exportNamedDeclaration(
              j.variableDeclaration('const', [
                j.variableDeclarator(j.identifier(propName), assignment.right)
              ])
            );
          } else if (assignment.right.type === 'FunctionExpression') {
            exportDeclaration = j.exportNamedDeclaration(
              j.variableDeclaration('const', [
                j.variableDeclarator(j.identifier(propName), assignment.right)
              ])
            );
          } else {
            exportDeclaration = j.exportNamedDeclaration(
              j.variableDeclaration('const', [
                j.variableDeclarator(j.identifier(propName), assignment.right)
              ])
            );
          }
        } catch (error) {
          console.log(`Error processing named export in ${fileInfo.path}:`, error.message);
          // Fallback
          exportDeclaration = j.exportNamedDeclaration(
            j.variableDeclaration('const', [
              j.variableDeclarator(j.identifier(propName), assignment.right)
            ])
          );
        }
        
        if (exportDeclaration) {
          j(path.parent).replaceWith(exportDeclaration);
          hasChanges = true;
        }
      }
    }
  });

  // Track changes for reporting
  if (hasChanges) {
    // Write to a report file
    const reportPath = path.join(process.cwd(), 'codemod-report.txt');
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp}: Transformed ${fileInfo.path}\n`;
    
    try {
      fs.appendFileSync(reportPath, logEntry);
    } catch (err) {
      console.warn(`Could not write to report file: ${err.message}`);
    }
  }

  return hasChanges ? root.toSource({ quote: 'single' }) : null;
};

// Export metadata for jscodeshift
module.exports.parser = 'babylon';
