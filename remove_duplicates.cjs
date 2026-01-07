const fs = require('fs');

const filePath = 'c:\\Users\\burak\\Desktop\\Tabulaxy Web App Version\\services\\geminiService.ts';

try {
    let data = fs.readFileSync(filePath, 'utf8');

    // --- 1. CLASSIC POOL ---
    const classicStartMarker = 'const CLASSIC_POOL: TabuCard[] = [';
    const classicEndMarker = '];'; // First ]; after start

    let classicStartIndex = data.indexOf(classicStartMarker);
    let classicEndIndex = data.indexOf(classicEndMarker, classicStartIndex);

    if (classicStartIndex !== -1 && classicEndIndex !== -1) {
        const preBlock = data.substring(0, classicStartIndex + classicStartMarker.length);
        const postBlock = data.substring(classicEndIndex);
        const blockContent = data.substring(classicStartIndex + classicStartMarker.length, classicEndIndex);

        const lines = blockContent.split('\n');
        const seen = new Set();
        const newLines = [];

        for (const line of lines) {
            const match = line.match(/target:\s*"([^"]+)"/);
            if (match) {
                const word = match[1].toLocaleUpperCase('tr-TR');
                if (seen.has(word)) {
                    // Skip duplicate
                    continue;
                }
                seen.add(word);
            }
            newLines.push(line);
        }

        // Reconstruct data with cleaned Classic pool
        data = preBlock + newLines.join('\n') + postBlock;
    }

    // --- 2. SILENT POOL ---
    // Recalculate indices because data changed
    const silentStartMarker = 'const SILENT_POOL_STRINGS: string[] = [';
    let silentStartIndex = data.indexOf(silentStartMarker);
    let silentEndIndex = data.indexOf('];', silentStartIndex);

    if (silentStartIndex !== -1 && silentEndIndex !== -1) {
        // Extract the inner content
        const blockContent = data.substring(silentStartIndex + silentStartMarker.length, silentEndIndex);

        // Parse content to extract strings and comments/structure
        // This is tricky because of comments.
        // Strategy: Match all strings and rebuild. But we want to keep comments like "// --- SECTION ---"
        // Actually, simpler: Split by lines. If line has strings, parse and filter. If line is comment, keep.

        const lines = blockContent.split('\n');
        const seen = new Set();
        const newLines = [];

        for (const line of lines) {
            if (line.trim().startsWith('//') || line.trim() === '') {
                newLines.push(line);
                continue;
            }

            // Extract strings from line: "Word1", "Word2", ...
            const stringMatches = [...line.matchAll(/"([^"]+)"/g)];
            if (stringMatches.length > 0) {
                const filteredWords = [];
                for (const match of stringMatches) {
                    const word = match[1];
                    const key = word.toLocaleUpperCase('tr-TR');
                    if (!seen.has(key)) {
                        seen.add(key);
                        filteredWords.push(`"${word}"`);
                    }
                }

                if (filteredWords.length > 0) {
                    // Check if line ends with comma
                    const hasComma = line.trim().endsWith(',');
                    // Reconstruct line with original indentation
                    const indentation = line.match(/^\s*/)[0];
                    let newLine = indentation + filteredWords.join(', ');
                    if (hasComma || newLines.length < lines.length - 1) newLine += ',';
                    // Adding comma blindly might be safer if we ensure the last item in array doesn't matter (TS allows trailing comma)
                    if (!newLine.trim().endsWith(',')) newLine += ',';

                    newLines.push(newLine);
                }
            } else {
                // Unknown line type, keep it (e.g. closing brace of something else? Unlikely in string array)
                newLines.push(line);
            }
        }

        data = data.substring(0, silentStartIndex + silentStartMarker.length) +
            newLines.join('\n') +
            data.substring(silentEndIndex);
    }

    // --- 3. MARATHON POOL ---
    const marathonStartMarker = 'const MARATHON_POOL_STRINGS: string[] = [';
    let marathonStartIndex = data.indexOf(marathonStartMarker);
    let marathonEndIndex = data.indexOf('];', marathonStartIndex);

    if (marathonStartIndex !== -1 && marathonEndIndex !== -1) {
        const blockContent = data.substring(marathonStartIndex + marathonStartMarker.length, marathonEndIndex);
        const lines = blockContent.split('\n');
        const seen = new Set();
        const newLines = [];

        for (const line of lines) {
            if (line.trim().startsWith('//') || line.trim() === '') {
                newLines.push(line);
                continue;
            }

            const stringMatches = [...line.matchAll(/"([^"]+)"/g)];
            if (stringMatches.length > 0) {
                const filteredWords = [];
                for (const match of stringMatches) {
                    const word = match[1];
                    const key = word.toLocaleUpperCase('tr-TR');
                    if (!seen.has(key)) {
                        seen.add(key);
                        filteredWords.push(`"${word}"`);
                    }
                }

                if (filteredWords.length > 0) {
                    const indentation = line.match(/^\s*/)[0];
                    let newLine = indentation + filteredWords.join(', ');
                    if (!newLine.trim().endsWith(',')) newLine += ',';
                    newLines.push(newLine);
                }
            } else {
                newLines.push(line);
            }
        }

        data = data.substring(0, marathonStartIndex + marathonStartMarker.length) +
            newLines.join('\n') +
            data.substring(marathonEndIndex);
    }

    fs.writeFileSync(filePath, data, 'utf8');
    console.log("Duplicates removed successfully.");

} catch (err) {
    console.error("Error:", err);
}
