// Update HTML files to use type="module" for ES module scripts
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let count = 0;
for (const file of htmlFiles) {
    const fp = path.join(dir, file);
    let content = fs.readFileSync(fp, 'utf8');
    const original = content;

    // Replace script tags for module-based JS files
    content = content.replace(/<script src="js\/auth\.js"><\/script>/g, '<script type="module" src="js/auth.js"></script>');
    content = content.replace(/<script src="js\/tutors\.js"><\/script>/g, '<script type="module" src="js/tutors.js"></script>');
    content = content.replace(/<script src="js\/admin\.js"><\/script>/g, '<script type="module" src="js/admin.js"></script>');

    // Remove older tutors.js comment variant
    content = content.replace(/<script src="js\/tutors\.js"><\/script> <!-- Reusing tutors\.js for Booking\/Review Modals -->/g, '<script type="module" src="js/tutors.js"></script>');

    if (content !== original) {
        fs.writeFileSync(fp, content, 'utf8');
        console.log('Updated:', file);
        count++;
    } else {
        console.log('No change:', file);
    }
}
console.log(`\nDone. ${count} files updated.`);
