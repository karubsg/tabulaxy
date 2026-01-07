const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\burak\\Desktop\\Tabulaxy Web App Version\\services\\geminiService.ts';
console.log("CWD:", process.cwd());

try {
    if (!fs.existsSync(filePath)) {
        console.error("File not found:", filePath);
        process.exit(1);
    }
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split('\n');

    console.log("File read stats:", lines.length, "lines");

    const result = {
        CLASSIC: { sections: {}, total: 0, duplicates: [] },
        SILENT: { sections: {}, total: 0, duplicates: [] },
        MARATHON: { sections: {}, total: 0, duplicates: [] }
    };

    let currentMode = null;
    let currentSection = 'Başlangıç';
    let poolSets = {
        CLASSIC: new Set(),
        SILENT: new Set(),
        MARATHON: new Set()
    };

    const classicStart = /const CLASSIC_POOL: TabuCard\[\] = \[/;
    const silentStart = /const SILENT_POOL_STRINGS: string\[\] = \[/;
    const marathonStart = /const MARATHON_POOL_STRINGS: string\[\] = \[/;
    const arrayEnd = /\];/;
    const sectionRegex = /\/\/ --- (.+) ---/;
    const classicItemRegex = /target:\s*"([^"]+)"/;

    // We will parse strings simpler

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (classicStart.test(line)) {
            currentMode = 'CLASSIC';
            currentSection = 'Başlangıç';
            continue;
        } else if (silentStart.test(line)) {
            currentMode = 'SILENT';
            currentSection = 'Başlangıç';
            continue;
        } else if (marathonStart.test(line)) {
            currentMode = 'MARATHON';
            currentSection = 'Başlangıç';
            continue;
        }

        if (currentMode && arrayEnd.test(line)) {
            currentMode = null;
            continue;
        }

        if (!currentMode) continue;

        const sectionMatch = line.match(sectionRegex);
        if (sectionMatch) {
            currentSection = sectionMatch[1].trim();
            // console.log("New section:", currentSection);
            continue;
        }

        if (currentMode === 'CLASSIC') {
            const match = line.match(classicItemRegex);
            if (match) {
                const word = match[1].toLocaleUpperCase('tr-TR');

                if (!result[currentMode].sections[currentSection]) result[currentMode].sections[currentSection] = 0;
                result[currentMode].sections[currentSection]++;
                result[currentMode].total++;

                if (poolSets.CLASSIC.has(word)) {
                    result[currentMode].duplicates.push(word);
                } else {
                    poolSets.CLASSIC.add(word);
                }
            }
        } else {
            // Manual parsing for string arrays to avoid regex complexity issues
            // Line looks like: "Word1", "Word2", "Word3",
            const parts = line.split('"');
            // Parts: [ , Word1, , , Word2, , , Word3, , ]
            // Odd indices are the words if split by "

            for (let j = 1; j < parts.length; j += 2) {
                const word = parts[j];
                // Check if it is a real word and not comma/whitespace (split check should help)
                if (!word || word.trim() === ',' || word.trim().length === 0) continue;

                const wordKey = word.toLocaleUpperCase('tr-TR');

                if (!result[currentMode].sections[currentSection]) result[currentMode].sections[currentSection] = 0;
                result[currentMode].sections[currentSection]++;
                result[currentMode].total++;

                if (poolSets[currentMode].has(wordKey)) {
                    result[currentMode].duplicates.push(word + ' (' + currentSection + ')');
                } else {
                    poolSets[currentMode].add(wordKey);
                }
            }
        }
    }

    console.log(JSON.stringify(result, null, 2));

} catch (err) {
    console.error("Error:", err);
}
