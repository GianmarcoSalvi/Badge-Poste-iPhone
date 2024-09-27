// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: brown; icon-glyph: magic;
// tools.js

// Funzione per calcolare il numero della settimana
module.exports.getWeekNumber = (d) => {
    console.log("Esecuzione di getWeekNumber");
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    let dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    let yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    let weekNumber = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    console.log(`Numero della settimana calcolato: ${weekNumber}`);
    return weekNumber;
}

// Funzione per controllare la mutua esclusività
module.exports.checkMutualExclusivity = (week, today, type) => {
    console.log(`Esecuzione di checkMutualExclusivity per la data: ${today} con tipo: ${type}`);
    let conflictingEntry = week.giornate.find(g => g.data === today && g.tipologia !== type);
    if (conflictingEntry) {
        console.log(`Conflitto trovato: ${conflictingEntry.tipologia} per la data ${today}`);
        throw new Error(`Esiste già una giornata con tipologia diversa (${conflictingEntry.tipologia}) per la data ${today}.`);
    }
    console.log("Nessun conflitto trovato per la data specificata.");
}

// Funzione per verificare se il file JSON esiste e inizializzarlo o correggerlo
module.exports.initializeOrFixJsonFile = (fileManager, path) => {
    console.log(`Esecuzione di initializeOrFixJsonFile per il path: ${path}`);
    let now = new Date();
    let currentWeekNumber = module.exports.getWeekNumber(now);

    // Creiamo la struttura predefinita per il file JSON
    let defaultStructure = {};
    defaultStructure[`settimana ${currentWeekNumber}`] = {
        "giornate": [],
        "minutiCredito": 0
    };

    if (!fileManager.fileExists(path)) {
        // Se il file non esiste, crealo con la struttura di default
        console.log(`File non trovato. Creazione di un nuovo file con struttura di default.`);
        fileManager.writeString(path, JSON.stringify(defaultStructure));
        fileManager.downloadFileFromiCloud(path);
        return defaultStructure;
    }

    // Se il file esiste, leggilo
    let data;
    try {
        console.log(`File trovato. Tentativo di leggere il file JSON.`);
        data = JSON.parse(fileManager.readString(path));
        // Verifica la struttura
        if (!data || typeof data !== "object" || !Object.keys(data).length) {
            console.log("Errore: Formato del file JSON scorretto.");
            throw new Error("Formato JSON scorretto");
        }
        console.log("File JSON letto correttamente.");
    } catch (error) {
        // Se c'è un problema con il file, sovrascrivilo con la struttura di default
        console.log(`Errore nella lettura del file JSON: ${error.message}. Sovrascrittura del file con la struttura di default.`);
        fileManager.writeString(path, JSON.stringify(defaultStructure));
        fileManager.downloadFileFromiCloud(path);
        return defaultStructure;
    }

    return data;
}

// Funzione per creare una nuova settimana se necessario
module.exports.checkAndCreateNewWeek = (data) => {
    console.log("Esecuzione di checkAndCreateNewWeek");
    let now = new Date();
    let currentWeekNumber = module.exports.getWeekNumber(now);
    let lastWeekKey = Object.keys(data).pop();
    let lastWeekNumber = parseInt(lastWeekKey.split(" ")[1]);

    console.log(`Ultima settimana nel file: ${lastWeekNumber}, settimana corrente: ${currentWeekNumber}`);

    if (currentWeekNumber > lastWeekNumber) {
        let newWeekKey = `settimana ${currentWeekNumber}`;
        console.log(`Creazione di una nuova settimana: ${newWeekKey}`);
        data[newWeekKey] = {
            "giornate": [],
            "minutiCredito": 0
        };
    } else {
        console.log("Non è necessario creare una nuova settimana.");
    }
}

// Funzione per formattare la data nel formato dd-mm-yyyy
module.exports.formatDate = (date) => {
    let day = String(date.getDate()).padStart(2, '0');
    let month = String(date.getMonth() + 1).padStart(2, '0'); // I mesi sono 0-indexed, quindi aggiungiamo 1
    let year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

// Funzione per formattare l'orario nel formato hh:mm
module.exports.formatTime = (date) => {
    let hours = String(date.getHours()).padStart(2, '0');
    let minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

module.exports.recalculateMinutiCredito = (week) => {
    console.log("Ricalcolo dei minutiCredito per la settimana:", week);
    
    // Resetta minutiCredito prima di ricalcolare
    week.minutiCredito = 0;

    // Somma correttamente i crediti delle giornate
    week.giornate.forEach(giornata => {
        console.log(`Giornata: ${giornata.data}, Credito: ${giornata.credito}`);
        week.minutiCredito += giornata.credito;
    });

    // Converte i minutiCredito da minuti a ore e minuti per l'output
    let oreCredito = Math.floor(Math.abs(week.minutiCredito) / 60);
    let minutiCredito = Math.abs(week.minutiCredito) % 60;
    let segno = week.minutiCredito < 0 ? "-" : "";

    console.log(`minutiCredito aggiornati: ${segno}${oreCredito}h ${minutiCredito}m`);
    
    return `${segno}${oreCredito}h ${minutiCredito}m`;
};

// Funzione per inserire una nuova entry nella settimana corretta e mantenere l'ordine cronologico
module.exports.insertAndSortByDate = (data, newEntry) => {
    // Recupera la settimana dalla data della nuova entry
    let [day, month, year] = newEntry.data.split('-').map(Number);
    let newEntryDate = new Date(year, month - 1, day);  // Converte in oggetto Date
    let newWeekNumber = module.exports.getWeekNumber(newEntryDate);

    // Trova o crea la settimana corrispondente nel file JSON
    let weekKey = `settimana ${newWeekNumber}`;
    if (!data[weekKey]) {
        // Se la settimana non esiste, creala
        data[weekKey] = {
            "giornate": [],
            "minutiCredito": 0
        };
    }

    // Cerca se esiste già una entry con la stessa data
    let existingEntryIndex = data[weekKey].giornate.findIndex(g => g.data === newEntry.data);

    if (existingEntryIndex !== -1) {
        // Modifica l'entry esistente
        data[weekKey].giornate[existingEntryIndex] = newEntry;
    } else {
        // Aggiungi la nuova entry alla settimana
        data[weekKey].giornate.push(newEntry);
    }

    // Ordina le giornate all'interno della settimana in base alla data
    data[weekKey].giornate.sort((a, b) => {
        let [dayA, monthA, yearA] = a.data.split('-').map(Number);
        let dateA = new Date(yearA, monthA - 1, dayA);

        let [dayB, monthB, yearB] = b.data.split('-').map(Number);
        let dateB = new Date(yearB, monthB - 1, dayB);

        return dateA - dateB;
    });

    // Ricalcola i minutiCredito per la settimana
    module.exports.recalculateMinutiCredito(data[weekKey]);

    // Restituisce i dati aggiornati
    return data;
};