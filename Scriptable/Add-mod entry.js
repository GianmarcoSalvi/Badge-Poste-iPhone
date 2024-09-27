// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: magic;
let tools = importModule("tools");
let fileManager = FileManager.iCloud();
let path = fileManager.joinPath(fileManager.documentsDirectory(), "badge-log.json");

async function addOrModifyEntry(dateInput, type, ingresso = null, uscita = null) {
    // Forza il download del file aggiornato da iCloud
    fileManager.downloadFileFromiCloud(path);

    let data = tools.initializeOrFixJsonFile(fileManager, path);
    tools.checkAndCreateNewWeek(data);

    let [day, month, year] = dateInput.split('-').map(Number);
    let dateObj = new Date(year, month - 1, day);

    let daysOfWeek = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
    let dayOfWeek = daysOfWeek[dateObj.getDay()];

    // Cerca la settimana corretta
    let newWeekNumber = tools.getWeekNumber(dateObj);
    let weekKey = `settimana ${newWeekNumber}`;
    
    if (!data[weekKey]) {
        // Se la settimana non esiste, creala
        data[weekKey] = {
            "giornate": [],
            "minutiCredito": 0
        };
    }

    // Cerca se esiste già una entry con la stessa data
    let existingEntryIndex = data[weekKey].giornate.findIndex(g => g.data === tools.formatDate(dateObj));

    if (existingEntryIndex !== -1) {
        // Modifica l'entry esistente
        let todayEntry = data[weekKey].giornate[existingEntryIndex];
        let vecchioCredito = todayEntry.credito; // Memorizza il vecchio credito

        // Prima di modificare, sottrai il vecchio credito dal totale settimanale
        data[weekKey].minutiCredito -= vecchioCredito;

        todayEntry.tipologia = type;

        if (type === "p" && ingresso && uscita) {
            // Presenza: aggiorna orario di ingresso e uscita
            todayEntry.ingresso = tools.formatTime(new Date(year, month - 1, day, ...ingresso.split(':').map(Number)));
            todayEntry.uscita = tools.formatTime(new Date(year, month - 1, day, ...uscita.split(':').map(Number)));

            // Calcolo minuti lavorati e nuovo credito
            let [ingressoOre, ingressoMinuti] = ingresso.split(':').map(Number);
            let [uscitaOre, uscitaMinuti] = uscita.split(':').map(Number);

            let ingressoDate = new Date(year, month - 1, day, ingressoOre, ingressoMinuti);
            let uscitaDate = new Date(year, month - 1, day, uscitaOre, uscitaMinuti);
            let diff = Math.floor((uscitaDate - ingressoDate) / 60000);  // Differenza in minuti

            todayEntry.minutiLavorati = Math.max(diff, 0);

            let target = dayOfWeek === "ven" ? 360 : 480;
            todayEntry.credito = Math.max(diff - target, -target);
        } else if (type === "s") {
            // Smart working: imposta minuti lavorati e rimuovi ingresso/uscita
            todayEntry.minutiLavorati = (dayOfWeek === "ven") ? 360 : 480;
            todayEntry.credito = 0;
            delete todayEntry.ingresso;  // Rimuovi ingresso se esiste
            delete todayEntry.uscita;    // Rimuovi uscita se esiste
        }

        // Aggiungi il nuovo credito al totale settimanale
        data[weekKey].minutiCredito += todayEntry.credito;

        // Sostituisci l'entry modificata nell'array
        data[weekKey].giornate[existingEntryIndex] = todayEntry;
    } else {
        // Crea una nuova entry se non esiste
        let newEntry = {
            "data": tools.formatDate(dateObj),
            "giorno": dayOfWeek,
            "tipologia": type,
            "minutiLavorati": 0,
            "credito": 0
        };

        if (type === "p" && ingresso && uscita) {
            // Presenza: crea orario di ingresso e uscita
            newEntry.ingresso = tools.formatTime(new Date(year, month - 1, day, ...ingresso.split(':').map(Number)));
            newEntry.uscita = tools.formatTime(new Date(year, month - 1, day, ...uscita.split(':').map(Number)));

            // Calcolo minuti lavorati e credito
            let [ingressoOre, ingressoMinuti] = ingresso.split(':').map(Number);
            let [uscitaOre, uscitaMinuti] = uscita.split(':').map(Number);

            let ingressoDate = new Date(year, month - 1, day, ingressoOre, ingressoMinuti);
            let uscitaDate = new Date(year, month - 1, day, uscitaOre, uscitaMinuti);
            let diff = Math.floor((uscitaDate - ingressoDate) / 60000);  // Differenza in minuti

            newEntry.minutiLavorati = Math.max(diff, 0);

            let target = dayOfWeek === "ven" ? 360 : 480;
            newEntry.credito = Math.max(diff - target, -target);
        } else if (type === "s") {
            // Smart working: imposta minuti lavorati e rimuovi eventuali ingressi/uscite
            newEntry.minutiLavorati = (dayOfWeek === "ven") ? 360 : 480;
            newEntry.credito = 0;
        }

        // Usa la funzione insertAndSortByDate per inserire e ordinare la nuova entry
        data = tools.insertAndSortByDate(data, newEntry);
    }

    // Salva il file JSON aggiornato
    fileManager.writeString(path, JSON.stringify(data));

    // Forza nuovamente il download per sincronizzare eventuali modifiche su iCloud
    fileManager.downloadFileFromiCloud(path);

    Script.setShortcutOutput(`Giornata aggiunta o modificata: ${tools.formatDate(dateObj)} (${type === "p" ? "Presenza" : "Smart Working"}).`);
}

// Esegui la funzione, passando i parametri necessari come input
let dateInput = args.shortcutParameter.date;  // Data in formato "GG-MM-AAAA"
let type = args.shortcutParameter.type;  // "p" per presenza o "s" per smart working
let ingresso = args.shortcutParameter.ingresso;  // Orario di ingresso (solo per presenza)
let uscita = args.shortcutParameter.uscita;  // Orario di uscita (solo per presenza)

addOrModifyEntry(dateInput, type, ingresso, uscita);