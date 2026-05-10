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

            // 1. Replace Template Literals with /api
            content = content.replace(/`http:\/\/localhost:4000\/api/g, "`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'}");
            
            // 2. Replace Template Literals without /api
            content = content.replace(/`http:\/\/localhost:4000/g, "`${import.meta.env.VITE_SERVER_URL || 'http://localhost:4000'}");

            // 3. Replace quoted strings with /api
            content = content.replace(/['"]http:\/\/localhost:4000\/api['"]/g, "(import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api')");
            
            // 4. Replace quoted strings without /api
            content = content.replace(/['"]http:\/\/localhost:4000['"]/g, "(import.meta.env.VITE_SERVER_URL || 'http://localhost:4000')");

            // 5. Handle cases like 'http://localhost:4000/api/...' (partial string)
            // This is trickier. We'll only do it if it's followed by a slash or is the end of the string.
            content = content.replace(/['"]http:\/\/localhost:4000\/api\//g, "(import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api') + '");
            content = content.replace(/['"]http:\/\/localhost:4000\//g, "(import.meta.env.VITE_SERVER_URL || 'http://localhost:4000') + '");

            if (content !== originalContent) {
                console.log(`Updated ${fullPath}`);
                fs.writeFileSync(fullPath, content, 'utf8');
            }
        }
    }
}

walkDir(srcDir);
console.log('Finished fixing all URLs.');
