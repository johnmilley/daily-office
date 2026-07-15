# DW:DO — local edition (with embedded lessons)

A private, self-contained copy of the [DW:DO webapp](https://dwdo.uk/) — the Ordinariate's
**Divine Worship: Daily Office** (Mattins, Evensong, Compline, Commonwealth Edition).

This copy differs from the live site in two ways:

1. **The scripture lessons are embedded in the page.** The live site links each First and
   Second Lesson out to Bible Gateway. Here, the full text of every First and Second Lesson —
   at both **Mattins and Evensong**, for every day of the liturgical year — is baked into the
   app so it reads inline, with no network needed. The text is the **RSV Catholic Edition
   (RSVCE)**, the same translation the live site links to.
2. **Book-styled appearance.** The design follows the printed *Divine Worship: Daily Office*
   (CTS Commonwealth Edition): white paper, burgundy-and-gold chrome, liturgical-red rubrics
   with pilcrows, and centred small-caps headings. The dark theme is a "book at night" —
   plum-black with gold and brick-rose accents. Lessons are printed as clean prose (verse
   and chapter numerals are stripped at render time, so copied text is clean too).
3. **The Hymnal.** The Texts view includes the traditional seasonal office hymns
   (English Hymnal translations) plus a selection of common morning, evening and general
   hymns — all public-domain texts (`site/jsdata/hymns.js`).
4. **The Introduction daily.** The Sentences, Exhortation, Confession, Absolution and
   Lord's Prayer open Mattins and Evensong every day (upstream showed them only on
   Sundays and Solemnities).
5. **Collapsible sections & PDF export.** Each section of the office folds up behind its
   caption; the PDF button in the toolbar lays the page out for print (browser
   "Save as PDF"), optionally appending chosen hymns.

> ⚠️ **Keep this repository private.** The embedded lesson text is RSVCE, which is copyrighted
> (© National Council of the Churches of Christ). This copy is for personal, local use only —
> do not publish it or serve it publicly.

## Running it

It's a static site — no build step, no server-side code. Either:

- Open `site/office.html` directly, **or**
- Serve the `site/` folder over any static server, e.g.:

  ```sh
  cd site && python3 -m http.server 8000
  # then visit http://localhost:8000/office.html
  ```

`site/index.html` is the information/landing page; `site/office.html` is the app.

## What's where

| Path | Purpose |
|------|---------|
| `site/` | The complete webapp (a mirror of dwdo.uk) |
| `site/jsdata/lessonText.js` | **Generated** — RSVCE text for every lesson, keyed by reference |
| `site/jsdata/calReadings.js` | The lectionary: which passages are read each day |
| `site/js/officeFunctions.js` | Office rendering (`doLesson()` was modified to inline the text) |
| `site/css/styles.css` | Theming — redesigned light/dark palette + settings |
| `fetch_rsvce.js` | **Build tool** — scrapes & parses the RSVCE text into `lessonText.js` |

## Regenerating the lesson text

`site/jsdata/lessonText.js` is produced by `fetch_rsvce.js`, which reads the unique passage
references out of the lectionary and fetches each from Bible Gateway (RSVCE), parsing the HTML
into clean verse markup. It is resumable (progress is cached) and re-emits the data file when done:

```sh
node fetch_rsvce.js
```

## Credit

The DW:DO app is the work of David Aldred (davidaldred@gmail.com). This is a personal local
adaptation of it.
