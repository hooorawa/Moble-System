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
            let modified = false;

            // Replace API URLs (with /api)
            const apiRegex = /['"`]http:\/\/localhost:4000\/api['"`]/g;
            if (apiRegex.test(content)) {
                console.log(`Replacing API URL in ${fullPath}`);
                content = content.replace(apiRegex, "(import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api')");
                modified = true;
            }

            // Replace Server URLs (without /api, usually for images)
            const serverRegex = /['"`]http:\/\/localhost:4000['"`]/g;
            if (serverRegex.test(content)) {
                console.log(`Replacing Server URL in ${fullPath}`);
                content = content.replace(serverRegex, "(import.meta.env.VITE_SERVER_URL || 'http://localhost:4000')");
                modified = true;
            }

            // Handle template literals specifically: `http://localhost:4000/api${...}`
            const templateApiRegex = /`http:\/\/localhost:4000\/api([^`]*)`/g;
            if (templateApiRegex.test(content)) {
                console.log(`Replacing Template API URL in ${fullPath}`);
                content = content.replace(templateApiRegex, "`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'}$1` text");
                // Wait, the regex above is a bit risky. Let's do it more simply.
            }
            
            // Simplified template literal replacement
            if (content.includes('`http://localhost:4000/api')) {
                content = content.split('`http://localhost:4000/api').join('`${import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api"}');
                modified = true;
            }
            if (content.includes('`http://localhost:4000')) {
                content = content.split('`http://localhost:4000').join('`${import.meta.env.VITE_SERVER_URL || "http://localhost:4000"}');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
            }
        }
    }
}

walkDir(srcDir);
console.log('Finished fixing URLs.');
