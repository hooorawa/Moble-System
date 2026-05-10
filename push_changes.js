const { execSync } = require('child_process');

try {
    console.log('Adding files...');
    execSync('git add .', { stdio: 'inherit' });
    
    console.log('Commiting...');
    execSync('git commit -m "Final production fixes: Resolved syntax corruption and URL construction"', { stdio: 'inherit' });
    
    console.log('Pushing...');
    execSync('git push origin main', { stdio: 'inherit' });
    
    console.log('Done!');
} catch (error) {
    console.error('Failed to execute git command:', error.message);
    process.exit(1);
}
