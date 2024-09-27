// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: magic;
let tools = importModule("tools");
let fileManager = FileManager.iCloud();
let path = fileManager.joinPath(fileManager.documentsDirectory(), "badge-log.json");

async function updatePresence() {
    let now = new Date();
    let today = tools.formatDate(now);  // Usa la funzione formatDate per formattare la data

    let data = tools.initializeOrFixJsonFile(fileManager, path);
    tools.checkAndCreateNewWeek(data);

    let lastWeekKey = Object.keys(data).pop();
    let week = data[lastWeekKey];

    try {
        tools.checkMutualExclusivity(week, today, "p");
    } catch (error) {
        Script.setShortcutOutput(`Errore: ${error.message}`);
        return;
    }

    let todayEntry = week.giornate.find(g => g.data === today && g.tipologia === "p");

    if (!todayEntry) {
        // Primo ingresso della giornata
        let newEntry = {
            "data": today,
            "giorno": now.toLocaleDateString('it-IT', { weekday: 'short' }),
            "tipologia": "p",
            "ingresso": tools.formatTime(now),  // Formatta l'orario di ingresso
            "minutiLavorati": 0,
            "credito": 0
        };
        week.giornate.push(newEntry);
        fileManager.writeString(path, JSON.stringify(data));
        fileManager.downloadFileFromiCloud(path);
        
        Script.setShortcutOutput(`Orario di ingresso registrato: ${newEntry.ingresso}`);
    } else if (!todayEntry.uscita) {
        todayEntry.uscita = tools.formatTime(now);  // Formatta l'orario di uscita
        let ingresso = new Date();
        let [ingressoOre, ingressoMinuti] = todayEntry.ingresso.split(':').map(Number);
        ingresso.setHours(ingressoOre);
        ingresso.setMinutes(ingressoMinuti);

        let diff = Math.floor((now - ingresso) / 60000);
        if (diff < 0) {
            diff = 0;  // Evita che i minuti lavorati siano negativi
        }

        todayEntry.minutiLavorati = diff;
        let target = todayEntry.giorno === "ven" ? 360 : 480;
        todayEntry.credito = Math.max(diff - target, -480);
        week.minutiCredito += todayEntry.credito;

        fileManager.writeString(path, JSON.stringify(data));
        fileManager.downloadFileFromiCloud(path);
        
        Script.setShortcutOutput(`Orario di uscita registrato: ${todayEntry.uscita}`);
    } else {
        Script.setShortcutOutput("Errore: La giornata di oggi è già stata registrata con ingresso e uscita.");
    }
}

updatePresence();