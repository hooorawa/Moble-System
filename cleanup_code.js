const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'Mobile-System-Front-End', 'src');

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // Clean up nested import.meta.env mess
            const messyPatterns = [
                /\(import\.meta\.env\.VITE_API_BASE_URL \|\| \(import\.meta\.env\.VITE_SERVER_URL \|\| 'http:\/\/localhost:4000'\) \+ 'api'\)/g,
                /`\$\{import\.meta\.env\.VITE_API_BASE_URL \|\| \(import\.meta\.env\.VITE_API_BASE_URL \|\| \(import\.meta\.env\.VITE_SERVER_URL \|\| 'http:\/\/localhost:4000'\) \+ 'api'\)\}/g,
                /\$\{import\.meta\.env\.VITE_SERVER_URL \|\| \(import\.meta\.env\.VITE_SERVER_URL \|\| 'http:\/\/localhost:4000'\)\}/g
            ];

            // Better: just replace the whole mess with API_BASE_URL or SERVER_URL
            // and ensure the import is present.
            
            let needsApiImport = false;
            let needsServerImport = false;

            if (content.includes('import.meta.env.VITE_API_BASE_URL')) {
                // If it's not the config file itself
                if (!fullPath.endsWith('config.js')) {
                    content = content.replace(/\$\{import\.meta\.env\.VITE_API_BASE_URL[^}]*\}/g, "${API_BASE_URL}");
                    content = content.replace(/\(import\.meta\.env\.VITE_API_BASE_URL[^)]*\)/g, "API_BASE_URL");
                    needsApiImport = true;
                }
            }

            if (content.includes('import.meta.env.VITE_SERVER_URL')) {
                if (!fullPath.endsWith('config.js')) {
                    content = content.replace(/\$\{import\.meta\.env\.VITE_SERVER_URL[^}]*\}/g, "${SERVER_URL}");
                    content = content.replace(/\(import\.meta\.env\.VITE_SERVER_URL[^)]*\)/g, "SERVER_URL");
                    needsServerImport = true;
                }
            }

            if (content !== originalContent) {
                // Add imports if needed
                if (needsApiImport || needsServerImport) {
                    const imports = [];
                    if (needsApiImport) imports.push('API_BASE_URL');
                    if (needsServerImport) imports.push('SERVER_URL');
                    
                    const importStatement = `import { ${imports.join(', ')} } from '${getRelativePathToConfig(fullPath)}';\n`;
                    
                    if (!content.includes('from \'./config\'') && !content.includes('from \'../../config\'')) {
                         content = importStatement + content;
                    }
                }
                console.log(`Cleaned up ${fullPath}`);
                fs.writeFileSync(fullPath, content, 'utf8');
            }
        }
    }
}

function getRelativePathToConfig(filePath) {
    const relative = path.relative(path.dirname(filePath), path.join(srcDir, 'config.js'));
    return './' + relative.replace(/\\/g, '/').replace('.js', '');
}

walkDir(srcDir);
console.log('Finished cleaning up code.');
