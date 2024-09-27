// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: magic;
let tools = importModule("tools");
let fileManager = FileManager.iCloud();
let path = fileManager.joinPath(fileManager.documentsDirectory(), "badge-log.json");

async function checkAndAddSmartWorking() {
    let now = new Date();
    let today = tools.formatDate(now);  // Usa la funzione formatDate per formattare la data

    let data = tools.initializeOrFixJsonFile(fileManager, path);
    tools.checkAndCreateNewWeek(data);

    let lastWeekKey = Object.keys(data).pop();
    let week = data[lastWeekKey];

    let todayEntry = week.giornate.find(g => g.data === today);

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
        
        let outputMessage = `Non hai registrato alcuna giornata oggi. È stata inserita automaticamente una giornata di Smart Working per il ${today}.`;
        Script.setShortcutOutput(outputMessage);
    } else {
        Script.setShortcutOutput("Esiste già una registrazione per oggi. Nessuna azione necessaria.");
    }
}

checkAndAddSmartWorking();