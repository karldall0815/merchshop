export type FaqAudience = "all" | "requester" | "approver" | "agentur" | "admin";

export interface FaqEntry {
  id: string;
  question: string;
  audience: FaqAudience[];
  answer: string;
}

export const FAQ_ENTRIES: FaqEntry[] = [
  {
    id: "how-to-order",
    question: "Wie lege ich eine Bestellung an?",
    audience: ["requester", "all"],
    answer:
      `1. Im Shop nach Artikeln suchen und in den Warenkorb legen.\n` +
      `2. Im Warenkorb auf "Zur Kasse" klicken.\n` +
      `3. Anlass eingeben (Pflicht). Kostenstelle und Wunschtermin sind optional.\n` +
      `4. Lieferadresse wählen oder neu eingeben.\n` +
      `5. "Bestellung absenden" — die Bestellung geht zur Freigabe an einen Approver.`,
  },
  {
    id: "what-is-anlass",
    question: "Was bedeutet \"Anlass\"? Wofür wird das gebraucht?",
    audience: ["requester"],
    answer:
      `Der Anlass beschreibt kurz, wofür die Bestellung gebraucht wird (z.B. "Messe Berlin", ` +
      `"Mitarbeiter-Geschenk Jubiläum"). Approver brauchen die Information, um die Freigabe ` +
      `einordnen zu können, und für die spätere Abrechnung ist sie hilfreich.`,
  },
  {
    id: "what-is-cost-center",
    question: "Wozu dient die Kostenstelle? Was, wenn ich keine habe?",
    audience: ["requester"],
    answer:
      `Die Kostenstelle ordnet die Bestellung intern einer Abteilung oder einem Budget zu. ` +
      `Wenn dein Admin eine Default-Kostenstelle für dich hinterlegt hat, ist sie bereits ` +
      `vorbefüllt. Du kannst sie für die jeweilige Bestellung überschreiben oder leer lassen ` +
      `— sie ist optional.`,
  },
  {
    id: "wunsch-vs-deadline",
    question: "Was ist der Unterschied zwischen Wunschtermin und Deadline?",
    audience: ["requester"],
    answer:
      `Der Wunschtermin ist das Datum, an dem die Ware idealerweise beim Empfänger ankommen ` +
      `soll. Wenn die Lieferung wirklich nicht später erfolgen darf, setze zusätzlich das ` +
      `Häkchen "Als Deadline kennzeichnen" — das macht den Approvern und der Agentur sichtbar, ` +
      `dass der Termin hart ist und nicht überschritten werden darf.`,
  },
  {
    id: "save-address-favorite",
    question: "Wie speichere ich eine Lieferadresse als Favorit?",
    audience: ["requester"],
    answer:
      `Im Checkout-Formular unten den Haken bei "Adresse als Favorit speichern" setzen und ` +
      `eine kurze Bezeichnung (z.B. "Büro Berlin") eingeben. Bei der nächsten Bestellung kannst ` +
      `du die Adresse direkt aus dem Dropdown wählen.`,
  },
  {
    id: "after-order-submit",
    question: "Was passiert, nachdem ich \"Bestellung absenden\" geklickt habe?",
    audience: ["requester"],
    answer:
      `Die Bestellung erhält eine Bestellnummer und geht in den Status "Wartet auf Freigabe". ` +
      `Ein Approver wird benachrichtigt und prüft die Bestellung. Nach Freigabe übernimmt die ` +
      `Agentur den Versand. Den Stand siehst du jederzeit unter "Meine Bestellungen".`,
  },
  {
    id: "order-rejected",
    question: "Warum wurde meine Bestellung abgelehnt?",
    audience: ["requester"],
    answer:
      `Der Approver hat einen Grund für die Ablehnung hinterlegt, der im Bestelldetail unter ` +
      `dem Status angezeigt wird. Häufige Gründe sind falsche Kostenstelle, fehlende Begründung ` +
      `oder die Bestellmenge überschreitet ein internes Limit. Sprich gegebenenfalls deinen ` +
      `Approver direkt an oder lege eine korrigierte Bestellung neu an.`,
  },
  {
    id: "cancel-order",
    question: "Wie storniere ich eine Bestellung? Geht das überhaupt?",
    audience: ["requester"],
    answer:
      `Stornieren ist nur möglich, bevor die Bestellung in den Status "Wird verpackt" geht. ` +
      `Du findest den "Stornieren"-Button im Bestelldetail unter "Meine Bestellungen". Nach ` +
      `Verpackung wende dich an den Admin oder die Agentur.`,
  },
  {
    id: "order-status",
    question: "Wo sehe ich den Bearbeitungsstand meiner Bestellungen?",
    audience: ["requester"],
    answer:
      `Unter "Meine Bestellungen" siehst du jede Bestellung mit Status-Anzeige und "Wer ist als ` +
      `nächstes dran"-Hinweis. Im Bestelldetail gibt es eine Timeline mit allen Schritten ` +
      `(Erstellt → Freigegeben → Wird verpackt → Versandt → Zugestellt).`,
  },
  {
    id: "approve-reject",
    question: "Wie genehmige oder lehne ich eine Bestellung ab?",
    audience: ["approver"],
    answer:
      `Unter "Genehmigungen" siehst du alle Bestellungen, die auf dich warten. Klick auf eine ` +
      `Bestellung öffnet das Detail mit Artikelliste, Lieferadresse und Anlass. Per "Freigeben" ` +
      `geht die Bestellung an die Agentur; per "Ablehnen" mit Grund geht sie zurück an den ` +
      `Requester.`,
  },
  {
    id: "correct-after-approve",
    question: "Kann ich nach Freigabe noch korrigieren?",
    audience: ["approver"],
    answer:
      `Eine bereits freigegebene Bestellung kann nicht mehr durch den Approver geändert werden. ` +
      `Wende dich an den Admin oder die Agentur, falls die Bestellung im Status "Wird verpackt" ` +
      `oder später noch stoppbar ist.`,
  },
  {
    id: "fulfill-order",
    question: "Wie verarbeite ich eine Bestellung im Versand?",
    audience: ["agentur"],
    answer:
      `Unter "Fulfillment" siehst du alle freigegebenen Bestellungen. Beim Klick auf eine ` +
      `Bestellung kannst du die Artikel verpacken, eine Sendungsnummer eingeben und auf ` +
      `"Versandt" setzen. Der Requester wird automatisch per Mail informiert.`,
  },
  {
    id: "tracking-number",
    question: "Wo trage ich die Sendungsnummer ein?",
    audience: ["agentur"],
    answer:
      `Im Bestelldetail im Fulfillment-Bereich gibt es das Feld "Sendungsnummer" und ein ` +
      `Dropdown für den Versanddienstleister. Nach Eingabe und Klick auf "Versandt" wird die ` +
      `Bestellung mit Tracking-Link versendet.`,
  },
  {
    id: "create-user",
    question: "Wie lege ich einen neuen Nutzer an und welche Rolle gebe ich?",
    audience: ["admin"],
    answer:
      `Unter "Einstellungen → Benutzer → ＋ Neuer Benutzer". Vier Rollen stehen zur Auswahl: ` +
      `**Requester** bestellt, **Approver** genehmigt, **Agentur** verpackt und versendet, ` +
      `**Admin** verwaltet alles. Faustregel: wer nur Artikel bestellt → Requester. ` +
      `Vorgesetzte mit Budgetverantwortung → Approver. Die Marketing-Agentur → Agentur. ` +
      `Du selbst und IT-Verantwortliche → Admin.`,
  },
  {
    id: "default-cost-center",
    question: "Wie hinterlege ich eine Default-Kostenstelle für einen Nutzer?",
    audience: ["admin"],
    answer:
      `Unter "Einstellungen → Benutzer → Klick auf den Nutzer" gibt es das Feld ` +
      `"Default-Kostenstelle". Trag z.B. "KS-1234" ein und speichere. Bei der nächsten ` +
      `Bestellung dieses Nutzers ist die Kostenstelle vorbefüllt — überschreibbar pro ` +
      `Bestellung.`,
  },
  {
    id: "create-category",
    question: "Wie lege ich neue Kategorien an?",
    audience: ["admin"],
    answer:
      `Unter "Einstellungen → Kategorien → ＋ Neue Kategorie". Slug, Name und beliebig viele ` +
      `Custom-Felder definieren. Built-in-Kategorien (Lebensmittel, Kleidung, …) kannst du ` +
      `erweitern, aber nicht löschen — nur archivieren.`,
  },
  {
    id: "stock-management",
    question: "Wie funktioniert die Bestandsverwaltung? Was sind StockMovements?",
    audience: ["admin"],
    answer:
      `Bestand wird nicht direkt verändert, sondern als "StockMovement"-Einträge geschrieben ` +
      `(initial, restock, order, correction, return_to_stock). Der aktuelle Bestand ergibt ` +
      `sich aus der Summe aller Movements. Das ist nachvollziehbar und revisionssicher — du ` +
      `siehst jederzeit, wer wann was bewegt hat. Unter "Inventar → Artikel" siehst du die ` +
      `Movements pro Artikel.`,
  },
  {
    id: "audit-logs",
    question: "Wo finde ich die Audit-Logs / wer hat was wann gemacht?",
    audience: ["admin"],
    answer:
      `Unter "Einstellungen → Audit-Log". Jede wesentliche Aktion (Artikel anlegen, Bestellung ` +
      `freigeben, Kategorie ändern, …) wird mit Akteur, Zeitstempel und Diff geloggt. Filter ` +
      `nach Entity und Aktion möglich.`,
  },
  {
    id: "toggle-auto-error-report",
    question: "Wie schalte ich automatische Fehler-Reports ein/aus?",
    audience: ["admin"],
    answer:
      `Unter "Einstellungen → System" gibt es die drei Schalter ` +
      `**support.errorAutoReport** (automatisches Erzeugen von Fehlerberichten bei Crashes; ` +
      `Default an), **support.errorReportDedupeMinutes** (Dedupe-Fenster in Minuten, Default 5), ` +
      `**support.notifyAdminsByMail** (Mail an alle Admins bei manuellen Reports; Default an). ` +
      `Auto-Reports lösen niemals Mails aus.`,
  },
  {
    id: "what-if-not-working",
    question: "Was kann ich tun, wenn etwas nicht funktioniert?",
    audience: ["all"],
    answer:
      `Erst: Seite neu laden — viele Probleme lösen sich damit. Wenn es weiter klemmt, klick ` +
      `auf "Support" in der Navigation und dann "Fehler melden" — beschreib kurz, was du ` +
      `gerade gemacht hast und was schief ging. Dein Admin bekommt eine Benachrichtigung und ` +
      `kümmert sich.`,
  },
  {
    id: "find-help",
    question: "Wo finde ich Hilfe oder kann einen Fehler melden?",
    audience: ["all"],
    answer:
      `Über den Menüpunkt "Support" — dort findest du diese FAQ, kannst nach Stichworten ` +
      `filtern und einen Fehler melden. Bei kritischen Problemen sprich deinen Admin direkt ` +
      `an.`,
  },
];
