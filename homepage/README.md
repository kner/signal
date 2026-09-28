# Local Signal archive

Open `dist/index.html` directly in your browser. No installation or internet connection is needed. Keep the `export` folder in its existing location alongside `homepage` so media links work.

Alternatively, run `python3 homepage/serve.py` from the workspace, then open http://127.0.0.1:8765/homepage/dist/index.html.

The viewer groups the original conversations, shows incoming messages on the left and your messages in blue on the right, preserves captions, quotes and reactions, and plays available videos/audio. Click photos to enlarge them. Use “Load earlier messages” to browse older history, and “Photos & videos” to show media messages with their captions.

This is a read-only snapshot, not a live Signal client. Missing attachments are labeled. No messages are sent or synced. The generated display data excludes account keys and credentials but still contains private message content; keep the folder private.

After replacing the export, run `python3 homepage/import_export.py` to refresh the viewer.

## Message search

The message filter searches the entire selected conversation, including older messages that have not been loaded yet. Choose **Sender & text**, **Sender only**, or **Text only**. Patterns are case-insensitive regular expressions, entered without `/` delimiters. Examples: `Lukas|Anni`, `Guten.*Morgen`, or `^You$` with Sender only for your replies. Invalid patterns show an error; Clear restores all messages. The filter also works together with Photos & videos.

Filtered views show all matching messages at once, without a loading limit or “Load earlier messages” button. This also applies to the Photos & videos filter.

## Self-contained conversation pages

Open `dist/pages.html` for the index of all 33 individual conversation pages. The main viewer also has an “Eigene Seite” link for the selected conversation.

Each HTML file in `dist/conversations/` contains only that conversation, with embedded CSS, JavaScript, messages and available media. You can copy an individual HTML file anywhere and open it offline without the original export or any companion files. Missing media remain marked. Pages containing videos can be large.

`python3 homepage/import_export.py` refreshes both the common viewer and individual pages. After changing only the interface, run `python3 homepage/build_pages.py` to regenerate the individual pages.


## Einzelne Beiträge ausblenden

Jeder Beitrag hat eine Schaltfläche **x** (Ausblenden). Die Originaldaten und Medien bleiben unverändert erhalten. **Alle Beiträge** ist bei jedem Öffnen/Neuladen standardmäßig ausgeschaltet. Einschalten zeigt ausgeblendete Beiträge markiert an; mit **Wiederherstellen** erscheinen sie wieder in der normalen Ansicht. Text-/Absender- und Medienfilter gelten weiterhin. Ältere Beiträge sind über „Load earlier messages“ erreichbar.

Die Auswahl liegt im lokalen Browserspeicher. Hauptansicht und einzelne Chatseiten teilen sie unter derselben Webadresse (gleicher Host und Port); geöffnete Tabs werden synchronisiert. Stabile Beitragskennungen erhalten die Auswahl bei einer Neuerstellung derselben Archivdaten. Ein anderer Browser, gelöschte Browserdaten oder eine andere Adresse übernehmen sie nicht. Direkt über `file://` geöffnete Dateien können je nach Browser einen getrennten oder gesperrten Speicher haben; für verlässliche gemeinsame Einstellungen `python3 homepage/serve.py` verwenden. Die Auswahl wird nicht in exportierte HTML-Dateien eingebettet.

Wenn der Browser das Speichern verweigert, erscheint eine Fehlermeldung und der Beitrag bleibt sichtbar. Funktionstest: `node homepage/tests/visibility.cjs`.
