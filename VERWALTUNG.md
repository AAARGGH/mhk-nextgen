# Projektverwaltung einrichten

Die öffentliche Seite liest ihre Projekte aus `data/projects.json`. Unter
`/verwaltung/` steht auf einem PHP-fähigen Webserver eine passwortgeschützte
Oberfläche zum Anlegen, Bearbeiten, Veröffentlichen und Löschen bereit.

## Einmalige Einrichtung

1. PHP 8.1 oder neuer mit den Erweiterungen `fileinfo`, `json`, `mbstring` und
   `session` aktivieren.
2. Ein langes, nur hierfür verwendetes Passwort wählen und den Hash erzeugen:

   ```bash
   php -r "echo password_hash('MEIN-PASSWORT', PASSWORD_DEFAULT), PHP_EOL;"
   ```

3. `verwaltung/config.example.php` nach `verwaltung/config.php` kopieren und
   dort den erzeugten Hash eintragen. Die lokale Datei ist per `.gitignore`
   ausgeschlossen. Alternativ kann der Hash ohne Datei als Umgebungsvariable
   `MHK_ADMIN_PASSWORD_HASH` gesetzt werden.
4. Dem PHP-Prozess Schreibrechte für `data/projects.json` und
   `images/projects/uploads/` geben. Der Upload-Ordner wird beim ersten Upload
   automatisch angelegt.
5. Die Verwaltung ausschließlich über HTTPS bereitstellen und den nicht
   erratbaren Link nur mit berechtigten Mitgliedern teilen.

## GitHub Pages

GitHub Pages führt kein PHP aus. Dort funktioniert die öffentliche Testseite
mit der JSON-Datei, nicht jedoch die Verwaltung. Das ist beabsichtigt: Eine nur
mit JavaScript umgesetzte Passwortabfrage würde das Passwort und die
Schreibfunktion öffentlich ausliefern und wäre kein Schutz. Zum Testen der
Verwaltung lokal im Projektordner starten:

```bash
cp verwaltung/config.example.php verwaltung/config.php
# Hash in verwaltung/config.php einsetzen
php -S 127.0.0.1:8080
```

Danach `http://127.0.0.1:8080/verwaltung/` öffnen.

## Betriebshinweise

- Das Passwort gehört nie ins Repository. Für Produktion und Testsystem können
  unterschiedliche Hashes verwendet werden.
- Änderungen werden atomar in der JSON-Datei gespeichert. Regelmäßige Backups
  des Ordners `data/` und der Uploads werden dennoch empfohlen.
- Gelöschte Projekte verschwinden sofort aus der JSON-Datei. Bereits
  hochgeladene Bilder werden bewusst nicht automatisch vom Server gelöscht,
  damit ein versehentlicher Klick keine Dateien unwiederbringlich entfernt.

## Bilder und Titelbild

- Mit den Pfeilen unter den Bildern die Reihenfolge der Detailgalerie ändern.
- Mit „Als Titelbild“ das Teaserbild unabhängig von der Galerie auswählen.
- Unter „Titelbild · Bildausschnitt“ den Ausschnitt im einheitlichen Format 5:2
  mit Maus oder Finger verschieben. Alternativ die Regler für die horizontale
  und vertikale Position verwenden; der Zoom reicht von 1× bis 4×.
- „Ausschnitt zurücksetzen“ stellt die zentrierte Ansicht ohne Zoom wieder her.
- Anschließend „Änderungen speichern“ anklicken. Ausschnitt und Zoom werden als
  `thumbnailCrop` in den Projektdaten gespeichert; die Originalbilder bleiben
  unverändert. Bestehende Projekte ohne diese Angaben werden zentriert angezeigt.


## Unterstützer und Projektlinks

Die Verwaltung hat die Bereiche **Projekte** und **Unterstützer**. Unter
Unterstützer können Namen hinzugefügt, bearbeitet und entfernt werden.
„Unterstützer speichern“ aktualisiert die öffentliche Liste aus
`data/supporters.json`. Der PHP-Prozess benötigt Schreibrechte im Ordner `data/`.
Beide Bereiche werden getrennt gespeichert; beim Wechsel bleiben noch nicht
gespeicherte Eingaben erhalten. Die bisherigen Namen sind als Anfangsbestand übernommen.

Der „Weiterführende Link“ eines Projekts erscheint im Projekt-Popup am Ende des
ausführlichen Textes, nachdem eine Projektkarte geöffnet wurde. „Linktext“ ist
die sichtbare Beschriftung; ohne Linktext wird die URL angezeigt.
