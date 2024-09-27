// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: magic;
// Accesso al file JSON nella directory di Scriptable su iCloud
let fileManager = FileManager.iCloud();
let filePath = fileManager.joinPath(fileManager.documentsDirectory(), "badge-log.json");

// Verifica se il file esiste
if (fileManager.fileExists(filePath)) {
  // Scrive un array vuoto come contenuto del file
  fileManager.writeString(filePath, "")
  console.log("File badge-log.json svuotato.");
  Script.setShortcutOutput("File log.json svuotato con successo.");
} else {
  console.log("Il file badge-log.json non esiste.");
  Script.setShortcutOutput("Il file badge-log.json non esiste.");
}

Script.complete();