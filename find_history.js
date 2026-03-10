const fs = require('fs');
const path = require('path');

const historyDir = path.join(process.env.APPDATA, 'Code', 'User', 'History');
const targetStr = 'SMS-Aksh'.toLowerCase();
const backupLog = [];

const cutoffMs = new Date('2026-03-10T16:00:00.000Z').getTime();

if (fs.existsSync(historyDir)) {
    const dirs = fs.readdirSync(historyDir);
    for (const dir of dirs) {
        const entriesPath = path.join(historyDir, dir, 'entries.json');
        if (fs.existsSync(entriesPath)) {
            try {
                const data = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));
                if (data.resource && data.resource.toLowerCase().includes(targetStr)) {
                    let filePath = decodeURIComponent(data.resource.replace('file:///', '').replace('file://', ''));
                    filePath = filePath.replace(/\//g, '\\');

                    const entries = data.entries || [];
                    const validEntries = entries.filter(e => e.timestamp < cutoffMs);

                    if (validEntries.length > 0) {
                        const latest = validEntries.reduce((prev, current) => {
                            return (prev.timestamp > current.timestamp) ? prev : current;
                        });

                        backupLog.push({
                            file: filePath,
                            historyDir: path.join(historyDir, dir),
                            bestEntryId: latest.id,
                            bestEntryTime: new Date(latest.timestamp).toISOString()
                        });
                    }
                }
            } catch (e) {
            }
        }
    }
}

fs.writeFileSync('all_history.json', JSON.stringify(backupLog, null, 2));
console.log('Found ' + backupLog.length + ' files with backups before 16:00 UTC.');
