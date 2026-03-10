const fs = require('fs');
const path = require('path');

const backups = JSON.parse(fs.readFileSync('all_history.json', 'utf8'));

let restoredCount = 0;
for (const b of backups) {
    const backupFilePath = path.join(b.historyDir, b.bestEntryId);
    if (fs.existsSync(backupFilePath)) {
        try {
            const content = fs.readFileSync(backupFilePath);
            // Ensure directory exists
            const dir = path.dirname(b.file);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(b.file, content);
            restoredCount++;
        } catch (e) {
            console.error("Failed to restore " + b.file, e);
        }
    }
}
console.log("Successfully restored " + restoredCount + " files in frontend/src.");
