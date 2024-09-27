// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: magic;
// riepilogo.js
let fileManager = FileManager.iCloud();
let path = fileManager.joinPath(fileManager.documentsDirectory(), "badge-log.json");

// Leggi il file JSON
if (!fileManager.fileExists(path)) {
    console.error("Il file badge-log.json non esiste.");
    return;
}

let data = JSON.parse(fileManager.readString(path));

// Ottieni l'ultima settimana
let lastWeekKey = Object.keys(data).pop();
let lastWeek = data[lastWeekKey];

// Prepara l'output
let output = `Riepilogo crediti per ${lastWeekKey}:\n\n`;

// Elenca i crediti giornalieri
lastWeek.giornate.forEach(giornata => {
    let giorno = giornata.giorno.charAt(0).toUpperCase() + giornata.giorno.slice(1); // Capitalizza il giorno
    let credito = giornata.credito;
    
    // Converti il credito in ore e minuti
    let hours = Math.floor(credito / 60);
    let minutes = credito % 60;
    
    // Formatta l'output per ogni giornata
    let creditoFormatted = `${hours}h`;
    if (minutes !== 0) {
        creditoFormatted += ` ${Math.abs(minutes)}m`;
    }
    
    // Aggiungi orari di ingresso e uscita per le giornate di presenza nel formato (9:00 - 17:00)
    if (giornata.tipologia === "p") {
        if (giornata.ingresso && giornata.uscita) {
            output += `${giorno}: ${creditoFormatted} (${giornata.ingresso} - ${giornata.uscita})\n`;
        } else {
            output += `${giorno}: ${creditoFormatted} (Orari non disponibili)\n`;
        }
    } 
    // Aggiungi la dicitura "smart" per le giornate di smart working
    else if (giornata.tipologia === "s") {
        output += `${giorno}: ${creditoFormatted} (smart)\n`;
    }
});

// Totale minutiCredito della settimana
let totalMinutiCredito = lastWeek.minutiCredito;

// Converti minuti in ore e minuti
let totalHours = Math.floor(totalMinutiCredito / 60);
let totalMinutes = totalMinutiCredito % 60;

// Formatta l'output totale
let totalFormatted = `${totalHours}h`;
if (totalMinutes !== 0) {
    totalFormatted += ` ${Math.abs(totalMinutes)}m`;
}

output += `\nTotale crediti della settimana: ${totalFormatted}`;

// Mostra l'output sull'iPhone
Script.setShortcutOutput(output);