// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: magic;
let tools = importModule("tools");
let fileManager = FileManager.iCloud();
let path = fileManager.joinPath(fileManager.documentsDirectory(), "badge-log.json");

async function deleteEntry(dateToDelete) {
    let data = tools.initializeOrFixJsonFile(fileManager, path);
    tools.checkAndCreateNewWeek(data);

    let lastWeekKey = Object.keys(data).pop();
    let week = data[lastWeekKey];

    // Cerca l'entry con la data fornita
    let entryIndex = week.giornate.findIndex(g => g.data === dateToDelete);

    if (entryIndex !== -1) {
        // Rimuovi l'entry
        let removedEntry = week.giornate.splice(entryIndex, 1)[0];

        // Aggiorna i minutiCredito
        week.minutiCredito -= removedEntry.credito;

        // Salva il file aggiornato
        fileManager.writeString(path, JSON.stringify(data));
        fileManager.downloadFileFromiCloud(path);

        Script.setShortcutOutput(`Giornata del ${dateToDelete} eliminata correttamente.`);
    } else {
        Script.setShortcutOutput(`Errore: Non esiste alcuna registrazione per la data ${dateToDelete}.`);
    }
}

// Esegui la funzione, passando la data in formato "GG-MM-AAAA" come input
let dateToDelete = args.shortcutParameter;
deleteEntry(dateToDelete);