// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-brown; icon-glyph: magic;
// Importa il modulo tools
let tools = importModule("tools");

let fileManager = FileManager.iCloud();
let path = fileManager.joinPath(fileManager.documentsDirectory(), "badge-log.json");

async function updateSmart() {
    let now = new Date();
    let today = tools.formatDate(now);  // Usa la funzione formatDate per formattare la data

    let data = tools.initializeOrFixJsonFile(fileManager, path);
    tools.checkAndCreateNewWeek(data);

    let lastWeekKey = Object.keys(data).pop();
    let week = data[lastWeekKey];

    try {
        tools.checkMutualExclusivity(week, today, "s");
    } catch (error) {
        Script.setShortcutOutput(`Errore: ${error.message}`);
        return;
    }

    let todayEntry = week.giornate.find(g => g.data === today && g.tipologia === "s");

    if (!todayEntry) {
        let newEntry = {
            "data": today,
            "giorno": now.toLocaleDateString('it-IT', { weekday: 'short' }),
            "tipologia": "s",
            "minutiLavorati": (now.getDay() === 5) ? 360 : 480,
            "credito": 0
        };

        let target = now.getDay() === 5 ? 360 : 480;
        newEntry.credito = Math.max(newEntry.minutiLavorati - target, -480);

        week.giornate.push(newEntry);
        week.minutiCredito += newEntry.credito;

        fileManager.writeString(path, JSON.stringify(data));
        fileManager.downloadFileFromiCloud(path);
        
        Script.setShortcutOutput(`Smart Working registrato per oggi con ${newEntry.minutiLavorati} minuti.`);
    } else {
        Script.setShortcutOutput("Errore: La giornata di oggi è già stata registrata come Smart Working.");
    }
}

updateSmart();