<?php declare(strict_types=1); ?>
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>Verwaltung · MHK Next Generation</title>
  <link rel="icon" href="../images/logo.png">
  <link rel="stylesheet" href="admin.css">
</head>
<body>
  <header class="topbar">
    <a href="../" class="brand"><img src="../images/logo-nav.png" alt="MHK Next Generation Stiftung"></a>
    <div class="top-actions" id="top-actions" hidden>
      <span class="save-state" id="save-state" aria-live="polite">Alles gespeichert</span>
      <button class="button ghost" id="logout" type="button">Abmelden</button>
    </div>
  </header>

  <main>
    <section class="login panel" id="login-view">
      <span class="eyebrow">Geschützter Bereich</span>
      <h1>Verwaltung</h1>
      <p>Hier können berechtigte Mitglieder Projekte und Unterstützer verwalten.</p>
      <form id="login-form">
        <label for="password">Passwort</label>
        <div class="password-row">
          <input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
          <button class="button primary" type="submit">Anmelden</button>
        </div>
        <p class="message" id="login-message" role="alert"></p>
      </form>
    </section>

    <section id="admin-view" hidden>
      <nav class="admin-sections" aria-label="Verwaltungsbereiche">
        <button type="button" class="button primary" id="show-projects" aria-current="page" aria-controls="projects-section">Projekte</button>
        <button type="button" class="button ghost" id="show-supporters" aria-controls="supporters-section">Unterstützer</button>
      </nav>
      <section id="projects-section">
      <div class="intro">
        <div><span class="eyebrow">Inhalte pflegen</span><h1>Projekte</h1><p>Entwürfe bleiben unsichtbar, bis sie veröffentlicht werden.</p></div>
        <button class="button primary" id="new-project" type="button">＋ Neues Projekt</button>
      </div>
      <div class="workspace">
        <aside class="project-sidebar panel">
          <label class="search"><span>Projekte durchsuchen</span><input id="search" type="search" placeholder="Titel oder Jahr"></label>
          <div id="project-list" class="project-list"></div>
        </aside>
        <form id="editor" class="editor panel" hidden>
          <div class="editor-heading">
            <div><span class="eyebrow" id="editor-kicker">Projekt bearbeiten</span><h2 id="editor-title">Projekt</h2></div>
            <label class="publish"><input id="published" type="checkbox"><span>Veröffentlicht</span></label>
          </div>
          <div class="form-grid">
            <label class="wide">Überschrift <input id="title" maxlength="160" required></label>
            <label>Jahr <input id="year" type="number" min="2000" max="2100" required></label>
            <label class="wide">Vorschautext <textarea id="teaser" maxlength="500" rows="3" required></textarea><small>Kurz und aussagekräftig für die Projektkarte.</small></label>
            <label class="wide">Ausführlicher Text <textarea id="text" maxlength="15000" rows="10" required></textarea><small>Leerzeilen erzeugen Absätze.</small></label>
            <label>Weiterführender Link <input id="link-url" type="url" placeholder="https://…"><small>Wird im Projekt-Popup am Ende des ausführlichen Textes angezeigt.</small></label>
            <label>Linktext <input id="link-label" placeholder="Mehr erfahren"></label>
            <label class="wide">Alternativtext für Bilder <input id="alt" maxlength="300" placeholder="Was ist auf den Bildern zu sehen?"></label>
          </div>
          <fieldset>
            <legend>Bilder</legend>
            <p class="hint">JPG, PNG, WebP oder GIF, höchstens 8 MB. Die Reihenfolge bestimmt die Bildergalerie. Das Titelbild kannst du unabhängig davon auswählen.</p>
            <div id="image-list" class="image-list"></div>
            <section id="cover-editor" hidden aria-label="Titelbild bearbeiten">
              <h3>Titelbild · Bildausschnitt</h3>
              <p class="hint">Vorschau im Teaserformat 5:2. Bild mit Maus oder Finger verschieben oder die Regler verwenden.</p>
              <div id="cover-preview" class="cover-preview"><img id="cover-image" alt="Vorschau des Titelbildausschnitts" draggable="false"></div>
              <label>Zoom <input id="cover-zoom" type="range" min="1" max="4" step="0.01" value="1"></label>
              <label>Horizontaler Ausschnitt <input id="cover-x" type="range" min="0" max="100" step="0.1" value="50"></label>
              <label>Vertikaler Ausschnitt <input id="cover-y" type="range" min="0" max="100" step="0.1" value="50"></label>
              <button id="cover-reset" class="button ghost" type="button">Ausschnitt zurücksetzen</button>
            </section>
            <label class="upload button ghost">＋ Bilder auswählen<input id="image-upload" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple></label>
          </fieldset>
          <div class="editor-actions">
            <button class="button danger" id="delete-project" type="button">Projekt löschen</button>
            <div><a class="button ghost" href="../#projects" target="_blank">Seite ansehen ↗</a><button class="button primary" type="submit">Änderungen speichern</button></div>
          </div>
          <p class="message" id="editor-message" role="status"></p>
        </form>
        <div class="empty panel" id="empty-state"><strong>Noch kein Projekt ausgewählt</strong><span>Wähle links ein Projekt aus oder lege ein neues an.</span></div>
      </div>
      </section>
      <section id="supporters-section" hidden aria-labelledby="supporters-heading">
        <div class="intro">
          <div><span class="eyebrow">Inhalte pflegen</span><h1 id="supporters-heading">Unterstützer</h1><p>Namen für die öffentliche Unterstützerliste verwalten.</p></div>
        </div>
        <form id="supporters-form" class="panel supporters-editor">
          <fieldset id="supporters-fields" disabled>
            <legend>Unterstützerliste</legend>
            <div id="supporter-list"></div>
            <p id="supporters-empty" class="hint" hidden>Noch keine Unterstützer eingetragen.</p>
            <button type="button" id="add-supporter" class="button ghost">＋ Name hinzufügen</button>
            <div class="editor-actions"><button type="submit" class="button primary">Unterstützer speichern</button></div>
          </fieldset>
          <p id="supporters-message" class="message" role="status"></p>
        </form>
      </section>
    </section>
  </main>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <script src="admin.js"></script>
</body>
</html>
