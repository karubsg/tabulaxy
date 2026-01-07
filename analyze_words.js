const fs = require('fs');
const path = require('path');

const filePath = 'services/geminiService.ts';

try {
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split('\n');

    const result = {
        CLASSIC: { sections: {}, total: 0, duplicates: [] },
        SILENT: { sections: {}, total: 0, duplicates: [] },
        MARATHON: { sections: {}, total: 0, duplicates: [] }
    };

    let currentMode = null;
    let currentSection = 'Unknown';
    let poolSets = {
        CLASSIC: new Set(),
        SILENT: new Set(),
        MARATHON: new Set()
    };

    // Regex to match start of pools
    const classicStart = /const CLASSIC_POOL: TabuCard\[\] = \[/;
    const silentStart = /const SILENT_POOL_STRINGS: string\[\] = \[/;
    const marathonStart = /const MARATHON_POOL_STRINGS: string\[\] = \[/;
    const arrayEnd = /\];/;

    // Regex to detect comments indicating sections
    const sectionRegex = /\/\/ --- (.+) ---/;

    // Regex to extract targets
    const classicItemRegex = /target:\s*"([^"]+)"/;
    const stringItemRegex = /"([^"]+)"/g;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Detect Mode Start
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

        // Detect End of Array
        if (currentMode && arrayEnd.test(line)) {
            currentMode = null;
            continue;
        }

        if (!currentMode) continue;

        // Detect Section Change
        const sectionMatch = line.match(sectionRegex);
        if (sectionMatch) {
            currentSection = sectionMatch[1];
            if (!result[currentMode].sections[currentSection]) {
                result[currentMode].sections[currentSection] = 0;
            }
            continue;
        }

        // Process Lines
        if (currentMode === 'CLASSIC') {
            const match = line.match(classicItemRegex);
            if (match) {
                const word = match[1].toLocaleUpperCase('tr-TR');

                // Count
                if (!result[currentMode].sections[currentSection]) result[currentMode].sections[currentSection] = 0;
                result[currentMode].sections[currentSection]++;
                result[currentMode].total++;

                // Duplicate Check
                if (poolSets.CLASSIC.has(word)) {
                    result[currentMode].duplicates.push(word);
                } else {
                    poolSets.CLASSIC.add(word);
                }
            }
        } else {
            // SILENT or MARATHON (String arrays)
            let match;
            // Use regex with 'g' flag and exec loop for multiple strings on one line
            const regex = new RegExp(stringItemRegex);
            while ((match = regex.exec(line)) !== null) {
                // Skip keys if it looks like object property (shouldn't happen in string array but safety first)
                // Actually the regex is simple, it matches "Any String". 
                // In string arrays like "A", "B", it works.

                const word = match[1].trim();
                // Filter out keys or json-like noise if any, but properly formatted file should be fine.
                // Also filter out the forbidden words in Classic mode instructions if they appear? No, we are in Silent/Marathon.

                const wordKey = word.toLocaleUpperCase('tr-TR');

                if (!result[currentMode].sections[currentSection]) result[currentMode].sections[currentSection] = 0;
                result[currentMode].sections[currentSection]++;
                result[currentMode].total++;

                if (poolSets[currentMode].has(wordKey)) {
                    result[currentMode].duplicates.push(word + ` (${currentSection})`);
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
