function makeTabbedDiv(sections) {
    /*sections is an array of tab details containing an object for each section
        the object contains:
        tab title, 
        text name (* in char 1 for 'as is', + for HTML, otherwise is in OtherTexts), 
        Psalm (if a number then psalm n is used), 
        tabgroup (name of tab group), 
        isDefault (which tab is default), 
        extraClass (add class to the tab content?), 
        addGloria (add gloria to tab contents?)
    */
    //Build the tabs
    tabsText = "<ul class='nav nav-tabs'>\n";
    for (let i = 0; i < sections.length; i++) {
        tabId = sections[i]['tabgroup'] + '-' + i;
        tabTitle = sections[i]['title'];
        if (sections[i]['extraClass']) {
            tabClass = " class = '" + sections[i]['extraClass'];
            if (sections[i]['isDefault']) { tabClass += " active"; }
            tabClass += "'";
        }
        else {
            tabClass = sections[i]['isDefault'] ? " class='active'" : "";
        }
        tabsText += "<li" + tabClass + "><a href='#" + tabId + "'>" + tabTitle + "</a></li>\n";
    }
    tabsText += "</ul>\n";

    //Build the content areas
    contentText = "<div class='tab-content'>\n";
    for (let i = 0; i < sections.length; i++) {
        contentId = sections[i]['tabgroup'] + '-' + i;
        contentActive = sections[i]['isDefault'] ? " active" : "";
        contentText += "<div id='" + contentId + "' class='tab-pane " + sections[i]['extraClass'] + contentActive + "'>\n";
        if (sections[i]['Psalm'] != 0) {
            contentText += PsalmHTML(sections[i]['Psalm'], "", false, true);
        }
        else {
            if (sections[i]['textName'].charAt(0) == '*') {
                //Wrap provided text as is - used for collects
                contentText += "<p class='collect firstline'>" + sections[i]['textName'].substring(1) + "</p>";
            }
            else if (sections[i]['textName'].charAt(0) == '+'){
                // Use provided text directly as HTML
                contentText += sections[i]['textName'].substring(1);
            }
            else {
                contentText += otherTextHTML(sections[i]['textName'], "", false, 3, "", false);
            }
        }
        if (sections[i]['addGloria']) {
            contentText += doGloria("");
        }
        contentText += "</div>\n";
    }
    contentText += "</div>\n";
    return "<div class='container--tabs'>" + tabsText + contentText + "</div>\n";
}

function doOfficeTitle() {
    let offices = { "m": "Mattins", "e": "Evensong" };
    let divText = "<h1>" + offices[ourOffice] + "</h1>";
    let element = document.getElementById("officeTitle");
    element.innerHTML += divText;
}

function doSentences() {
    let output = "<div>\n<h3 class=\"caption\">The Sentences</h3>\r\n";
    output += "<p class='speaker'>Officiant</p>";
    let thisText = otherTexts.find((e) => e.Title == 'Introduction - Sentences');
    let Verses = thisText.verses;

    //Select three sentences at random
    var randomSelection = [];
    while (randomSelection.length < 3) {
        var r = Math.floor(Math.random() * 11) + 1;
        if (randomSelection.indexOf(r) === -1) randomSelection.push(r);
    }

    for (i = 0; i < 3; i++) {
        j = randomSelection[i] - 1;
        let text = Verses[j]['text'];
        text = text.replace("[", " <span class='ref'>(");
        text = text.replace("]", ")</span>");
        output += "<p>" + text + "</p>\n</div>\n";
    }
    return output;
}

function doComplineChapter(div) {
    var output = "<table>\n<tr>\n<td class='speaker'>Officiant</td>\n";
    let thisText = otherTexts.find((e) => e.Title == 'Compline - Chapters');
    let Verses = thisText.verses;
    //Select one chapter at random
    var r = Math.floor(Math.random() * 3);
    let text = Verses[r]['text'];
    text = text.replace("[", " <span class='ref'>(");
    text = text.replace("]", ")</span>");
    output += "<td class='chapter'>" + text + "</td>\n</tr>\n";
    output += "<tr>\n<td class='speaker'>People</td>\n<td>Thanks be to God</td>\n</tr>\n</table>\n"
    let element = document.getElementById(div);
    element.innerHTML += output;
}

function doAnthem(div) {
    var name;
    // Check the time of year and pick the anthem accordingly
    // Eve of Advent 1 and before Eve of Christmas - Alma Redemptoris Mater (1)
    // Eve of Christmas to Candlemas (2 Feb) - Alma Redemptoris Mater (2)
    // After Candlemas to Weds in Holy week -  Ave Regina Caelorum
    // Maundy/Good Friday -  return, no anthem
    // Holy Saturday to before Saturday in Whitsun week - Regina Caeli
    // Eve of Trinity to before Eve of Advent - Salve Regina
    // Eve of nextAdvent 1 (end of year) - Alma Redemptoris Mater (1)
    if (ourDate < dateOffset(christmas, -1)) { name = 'Alma Redemptoris Mater'; }
    else {
        if (ourDate < dateInYear(year, 2, 2)) { name = '+Alma Redemptoris Mater'; }
        else {
            if (ourDate < maundy) { name = 'Ave Regina Caelorum'; }
            else {
                if (ourDate < dateOffset(easter, -1)) { return; }
                else {
                    if (ourDate < dateOffset(easter, 48)) { name = 'Regina Caeli'; }
                    else {
                        if (ourDate < dateOffset(nextAdvent1, -1)) { name = 'Salve Regina'; }
                        else {
                            name = 'Alma Redemptoris Mater';
                        }
                    }
                }
            }
        }
    }
    
    // Build output
    const sectionHeading = "<h3 class='caption'>The Marian Anthem</h3>\n";
    const headingPrefix = "<h4" + " class=\"caption\">";
    const headingEnd = "</h4>\n";
    const linePrefix = "<p class='psalm chapter'>";
    const lineSplit = "&nbsp;:<br />\n";
    const lineEnd = "</p>\n";
    const languages = ["English","Latin"];
    let thisText = anthems.find((e) => e.Title == name);
    var sections = [];
    
    // Cycle over Latin and English version, creating input for the Make Tabbed Div function
    // Lay out the title of the anthem and the verses
    //Get the text from the array, and turn it into output, appending to the named div
    for (let i = 0; i < 2; i++) {
        let lang = languages[i].charAt(0);
        let output = "+";
        var trueTitle = thisText.Title;
        if (trueTitle.charAt(0) == "+") {
            //Strip off the '~' which is there to allow two similarly named but different texts
            trueTitle = trueTitle.substring(1);
        }
        output += headingPrefix + trueTitle + headingEnd;
        let Text = thisText[lang+"Text"];
        var outputText = linePrefix;
        outputText += Text.replace(" :", lineSplit).replaceAll('//', '<br />');
        outputText += lineEnd;
        output += outputText;
        //Lay out the responsory and final prayer
        output += "<table>\n<tr class='lineabove'>\n";
        output += "<td class='speaker'>Officiant</td>\n<td>" + thisText[lang+"Versicle"] + "</td>\n</tr>";
        output += "<td class='speaker'>People</td>\n<td>" + thisText[lang+"Response"] + "</td>\n</tr>";
        let oremus = (lang == 'E') ? "Let us pray" : "Oremus" ;
        output += "<td class='speaker'>Officiant</td>\n<td>"+oremus+"</td>\n</tr>";
        output += "<td class='speaker'>All</td>\n<td>" + thisText[lang+"Prayer"] + "</td>\n</tr>";
        output += "\n</table>\n";
        sections.push({ "title": languages[i], "textName": output, "Psalm": 0, "tabgroup": "anthemtabs", "isDefault": lang=='E', extraClass: languages[i], "addGloria": false })
    }
    var divtext = sectionHeading + makeTabbedDiv(sections);

    //Pass it to MAkeTabbedDivs to create the tab group it all in the div
    let element = document.getElementById(div);
    element.innerHTML += divtext;
}

function doExhortation() {
    let output = "<div>\n<h3 class=\"caption\">The Exhortation</h3>\r\n";
    output += "<p class='speaker'>Officiant</p>";

    let sections = [
        { "title": "Exhortation", "textName": "Introduction - Exhortation", "Psalm": 0, "tabgroup": "exh", "isDefault": true },
        { "title": "Alternative exhortation", "textName": "Introduction - Alternative Exhortation", "Psalm": 0, "tabgroup": "exh", "isDefault": false }
    ];

    output += makeTabbedDiv(sections) + "</div>\n";
    return output;
}

function doConfession() {
    let output = "<div>\n<h3 class=\"caption\">The Confession</h3>\r\n";
    output += "<p class='speaker'>All</p>\r\n";
    let thisText = otherTexts.find((e) => e.Title == 'Introduction - Confession');
    let Verses = thisText.verses;
    output += "<p>" + Verses[0]['text'] + "</p>\n</div>\n";
    return output;
}

function doAfterConfession() {
    let output = "<div>\n";

    let sections = [
        { "title": "Priest", "textName": "Introduction - ConfessionResponse Priest", "Psalm": 0, "tabgroup": "iac", "isDefault": true, "extraClass": 'opriest' },
        { "title": "Lay Officiant", "textName": "Introduction - ConfessionResponse Lay", "Psalm": 0, "tabgroup": "iac", "isDefault": false, "extraClass": 'olay' }
    ];

    output += makeTabbedDiv(sections) + "</div>\n";
    return output;
}

function doOurFather() {
    let output = "<h3 class=\"caption\">The Lord's Prayer</h3>\r\n";
    output += "<p class='speaker'>All</p>\r\n";
    output += otherTextHTML("The Lord's Prayer", "", false, 3, "", false);
    return output;
}

function doIntroduction() {
    if (ld.Type != 'S' && ld.Type != 's') {
        //  Introduction only shown on Sundays and Solemnities
    }
    else {
        divText = "<h2 class='caption'>The Introduction</h2>\r\n";
        divText += doSentences();
        divText += doExhortation();
        divText += doConfession();
        divText += doAfterConfession();
        divText += doOurFather();

        switch (ourOffice) {
            case 'm': h = 'Morning'; break;
            case 'e': h = 'Evening'; break;
        }

        divText += "\n<h2 class='caption'>" + h + " Prayer</h2>\n";

        let element = document.getElementById('introduction');
        element.innerHTML = divText;
    }
}

function doResponsory(name, divName, heading) {
    var output = (heading == "") ? "" : "<h3 class='caption'>" + heading + "</h3>";
    output += "<table>";
    let thisText = responsories.find((e) => e.Title == name);
    let Verses = thisText.verses;
    let i = 0;
    while (i < Verses.length) {
        var outputVerse = "";
        var rowclass = "";
        var cellclass = "";
        if(Verses[i].hasOwnProperty('u')) {
            outputVerse += "<tr><td colspan='2' class='rubric'>"+Verses[i]['u']+"</td></tr>";
        }
        if (Verses[i].hasOwnProperty('v')) {
            if (Verses[i]['v'].substring(0, 1) == "*") {
                rowclass = " class='lineabove'";
                Verses[i]['v'] = Verses[i]['v'].substring(1);
            }
            if (Verses[i]['v'].substring(0, 1) == "^") {
                cellclass = " class='chapter'";
                Verses[i]['v'] = Verses[i]['v'].substring(1);
            }
            if (Verses[i]['v'].substring(0, 1) == ">") {
                cellclass = " class='inset'";
                Verses[i]['v'] = Verses[i]['v'].substring(1);
            }
            outputVerse += "<tr" + rowclass + ">\n<td class='speaker'>Officiant</td>\n";
            outputVerse += "<td" + cellclass + ">" + Verses[i]['v'] + "</td>\n</tr>\n";
        }
        rowclass = "";
        cellclass = "";
        let speaker = "People";
        if (Verses[i].hasOwnProperty('r')) {
            if (Verses[i]['r'].substring(0, 1) == "*") {
                rowclass = " class='lineabove'";
                Verses[i]['r'] = Verses[i]['r'].substring(1);
            }
            if (Verses[i]['r'].substring(0, 1) == ">") {
                cellclass = " class='inset'";
                Verses[i]['r'] = Verses[i]['r'].substring(1);
            }
            if (Verses[i]['r'].substring(0, 1) == "&") {
                speaker = "Officiant<br\>and People"
                Verses[i]['r'] = Verses[i]['r'].substring(1);
            }
            outputVerse += "<tr" + rowclass + ">\n<td class='speaker'>" + speaker + "</td>\n";
            outputVerse += "<td" + cellclass + ">" + Verses[i]['r'] + "</td>\n</tr>\n";
        }
        output += outputVerse.replaceAll('//', '<br />').replaceAll('[', "<span class='ref'>(").replaceAll(']', ")</span>");
        i++;
    }
    output += "</table>";
    if (divName != ""){
        let element = document.getElementById(divName);
        element.innerHTML += output;
    }
    else {
        return output;
    }
}

function doLesserLitany() {
    let divName = 'LesserLitany';
    let litany = `
    <h3 class="caption">The Lesser Litany</h3>
    <div class="container--tabs">
      <ul class="nav nav-tabs">
        <li class="active opriest"><a href="#ll-0">Priest</a></li>
        <li class="olay"><a href="#ll-1">Lay Officiant</a></li>
      </ul>
      <div class="tab-content">
        <div id="ll-0" class="opriest tab-pane active">
          <table>
            <tr>
              <td class="speaker">Officiant:</td>
              <td class="text">The Lord be with you.</td>
            </tr>
            <tr>
              <td class="speaker">People:</td>
              <td class="text">And with thy spirit.</td>
            </tr>
            <tr>
              <td class="speaker">Officiant:</td>
              <td class="text">Let us pray.<br />Lord, have mercy upon us.</td>
            </tr>
            <tr>
              <td class="speaker">People:</td>
              <td class="" text">Christ, have mercy upon us.</td>
            </tr>
            <tr>
              <td class="speaker">Officiant:</td>
              <td class="text">Lord, have mercy upon us.</td>
            </tr>
          </table>
        </div>
        <div id="ll-1" class="olay tab-pane ">
          <table>
            <tr>
              <td class="speaker">Officiant:</td>
              <td class="text">O Lord, hear our prayer.</td>
            </tr>
            <tr>
              <td class="speaker">People:</td>
              <td class="text">And let our cry come unto thee.</td>
            </tr>
            <tr>
              <td class="speaker">Officiant:</td>
              <td class="text">Let us pray.<br />Lord, have mercy upon us.</td>
            </tr>
            <tr>
              <td class="speaker">People:</td>
              <td class="" text">Christ, have mercy upon us.</td>
            </tr>
            <tr>
              <td class="speaker">Officiant:</td>
              <td class="text">Lord, have mercy upon us.</td>
            </tr>
          </table>
          </p>
        </div>
      </div>
    </div>`;
    let element = document.getElementById(divName);
    element.innerHTML += litany;
}

function doInvitatory(divName) {

    //Mattins only!
    if (ourOffice == 'e') { return; }

    //During the Triduum, the Venite is omitted (p89)
    if ((ld.Season == 'L') && (ourDate >= maundy)) {
        return;
    }

    //During the Easter Octave, the Easter Anthems replace the Venite (p90)
    if (ld.FTitle.substring(0, 8) == 'easter+1') {
        divText = "<h3 class=\"caption\">Invitatory: The Easter Anthems</h3>\n";
        divText += otherTextHTML("The Easter Anthems", '', true, 4, 'psalm', false);
        let element = document.getElementById(divName);
        element.innerHTML += divText;
        return;
    }

    divText = "<h3 class=\"caption\">Invitatory</h3>";
    // TODO: If there is a proper initatory, do it here
    // --see also Octave of Easter (p90)
    // If the day is the 19th AND the psalms for the day are not overridden, thn the Venite is not used at the invitatiry
    dayOfMonth = getDom(ourDate);
    if ((dayOfMonth == 19) && !(ld.Overrides.includes("P"))) {
        divText += "<div id=\"JubilateDeo\">";
        divText += PsalmHTML(100, "", false);
        divText += "</div>";
    }
    else {
        let sections = [
            { "title": "Venite Exultemus", "textName": "", "Psalm": 95, "tabgroup": "inv", "isDefault": true, "addGloria": false },
            { "title": "Jubilate Deo", "textName": "", "Psalm": 100, "tabgroup": "inv", "isDefault": false, "addGloria": false }
        ];
        divText += makeTabbedDiv(sections);
    }
    let element = document.getElementById(divName);
    element.innerHTML += divText;

    // The Gloria Patri is omitted in the Venite from Passion Sunday until Easter (p87)
    if ((ld.Season == 'L') && (ourDate >= passion)) {
        element.innerHTML += "<p class='gloria'>The Gloria Patri is omitted</p>"
        return;
    }
    else {
        doGloria(divName);
    }
}

function doLesson(number, divName) {
    var output = "";
    var lessonRef = "";
    var dayOfWeek = getDay(ourDate);

    lessonRef = ld.Readings[number - 1];
    output += lessonRef;

    const lessonName = ['The First Lesson', 'The Second Lesson'][number - 1];
    const lessonClass = ((number == 1) && (ourOffice == 'm')) ? 'firstlesson' : '';
    output = "<h3 class='caption " + lessonClass + "'>" + lessonName + "</h3>";

    //In two cases, the readings are unavailable (or inconsistenly numbered) in Bible GAteway, so we take then from the Other Texts array  Flag this now.
    var specialReading = false;
    if (lessonRef.substring(0, 3) == "[O]") {
        lessonRef = lessonRef.substring(3);
        specialReading = true;
    }

    // Get the Book, Chapter and Verse
    var bookName = "";
    var chapterNumber = 0;
    var verseNumber = 0;
    var colonPosition = lessonRef.indexOf(":");
    // Book name ends with a number after a space; unless there is no number at all.  If no number, no chapter
    var re = / \d/;
    var bookNameEnd = lessonRef.search(re);
    if (bookNameEnd == -1) {
        bookName = lessonRef;
    }
    else {
        bookName = lessonRef.substring(0, bookNameEnd);
    }
    //Chapter - if present - is between bookNameEnd and a colon.  If no colon, then no verse.
    if (bookNameEnd != -1) {
        if (colonPosition == -1) {
            chapterNumber = lessonRef.substring(bookNameEnd).trim();
        }
        else {
            chapterNumber = lessonRef.substring(bookNameEnd, colonPosition).trim();
        }
    }
    var punctPosition = lessonRef.substring(colonPosition).indexOf("-");
    //Verse is after the colon and before any other punctuation.  
    if (colonPosition != -1) {
        verseNumber = lessonRef.substring(colonPosition + 1, punctPosition + colonPosition).trim();
    }
    //Now we want "Here beginneth (the nth verse of) (the mth Chapter of) [Book]"
    var lessonIntro = "Here beginneth ";
    if (verseNumber > 1) {
        lessonIntro += "the " + ordinal(verseNumber) + " Verse of ";
    }
    if (chapterNumber > 0) {
        lessonIntro += "the " + ordinal(chapterNumber) + " Chapter of ";
    }
    lessonIntro += "the " + bookNames[bookName];

    const lessonEnd = "Here endeth the " + ['First', 'Second'][number - 1] + " Lesson.";
    var readingContent = "";
    if (specialReading) {
        //If special, we get text from  Other Texts
        readingContent = otherTextHTML(lessonRef, "", false, 4, "psalm", false);
        output = "<p class='lessonintro'>" + lessonIntro + "</p>" + readingContent;
        output += "<p class='lessonintro lessonend'>" + lessonEnd + "</p>";
    }
    else {
        // The reading text is embedded locally (lessonText, keyed by the raw reference, e.g. "Isaiah 2:10-100").
        var rawRef = lessonRef;
        output += "<p class='lessonintro'>" + lessonIntro + "</p>";
        if (typeof lessonText !== 'undefined' && lessonText[rawRef]) {
            output += "<div class='lessonbody'>" + lessonText[rawRef] + "</div>";
            output += "<p class='lessonintro lessonend'>" + lessonEnd + "</p>";
        }
        else {
            // Fallback: if the text isn't embedded, link out to Bible Gateway (RSVCE).
            var refURL = "https://www.biblegateway.com/passage/?search=" + encodeURIComponent(rawRef) + "&version=RSVCE";
            output += "<p class='rubric lessonintro'><a target='blank' href='" + refURL + "'>Read this passage on Bible Gateway &rsaquo;</a></p>";
        }
    }

    let element = document.getElementById(divName);
    element.innerHTML = output;
}

function doTD() {
    let divName = "TeDeumOrMagnificat"
    let divText = "<h3 class='caption'>The Canticle</h3>\n";
    if (ourOffice == 'e') {
        //Evensong - so Magnificat
        divText = otherTextHTML("The Magnificat", "", true);
    }
    else {
        //Mattins - so rather more complicated
        //Standard daily options
        dailyCanticle = ["Canticle of the Three Holy Children", "Canticle of Isaiah",
            "Canticle of Hezekiah", "Canticle of Hannah", "A Canticle of Moses",
            "Canticle of Habakkuk", "Canticle of Moses (A)"];

        let sections = [
            { "title": "Te Deum", "textName": "Te Deum Laudamus", "Psalm": 0, "tabgroup": "td", "isDefault": true, "addGloria": false },
            { "title": "Benedicite", "textName": "Benedicite Omnia Opera", "Psalm": 0, "tabgroup": "td", "isDefault": false, "addGloria": true }
        ];

        //Add the Daily Canticle
        switch (getDay(ourDate)) {
            case 0: sections.push({ "title": "Daily Canticle", "textName": "Canticle of the Three Holy Children", "Psalm": 0, "tabgroup": "inv", "isDefault": false, "addGloria": false });
                break;
            case 1: sections.push({ "title": "Daily Canticle", "textName": "Canticle of Isaiah", "Psalm": 0, "tabgroup": "inv", "isDefault": false, "addGloria": true });
                break;
            case 2: sections.push({ "title": "Daily Canticle", "textName": "Canticle of Hezekiah", "Psalm": 0, "tabgroup": "inv", "isDefault": false, "addGloria": true });
                break;
            case 3: sections.push({ "title": "Daily Canticle", "textName": "Canticle of Hannah", "Psalm": 0, "tabgroup": "inv", "isDefault": false, "addGloria": true });
                break;
            case 4: sections.push({ "title": "Daily Canticle", "textName": "A Canticle of Moses", "Psalm": 0, "tabgroup": "inv", "isDefault": false, "addGloria": true });
                break;
            case 5: sections.push({ "title": "Daily Canticle", "textName": "Canticle of Habakkuk", "Psalm": 0, "tabgroup": "inv", "isDefault": false, "addGloria": true });
                break;
            case 6: sections.push({ "title": "Daily Canticle", "textName": "Canticle of Moses (A)", "Psalm": 0, "tabgroup": "inv", "isDefault": false, "addGloria": true });
                break;
        }

        // If betwen Septuagesima and Easter, Te Deum is excluded on Sandays and feria (p79)
        // Equates to seasons P and L, and classes s and f
        thisSeason = ld.Season;
        thisClass = ld.Type;
        if ((thisSeason == 'P' || thisSeason == 'L') && (thisClass == 's' || thisClass == 'f')) {
            sections.shift(); //remove first element (which is the Te Deum)
            sections[0].isDefault = true; //make Benedicite default
        }
        divText += makeTabbedDiv(sections);
    }

    let element = document.getElementById(divName);
    element.innerHTML += divText;
}

function doBND() {
    let divName = (ourOffice == 'c') ? "ComplineND" : "BenedictusorNuncDimittis";
    if (ourOffice == 'm') {
        divText = otherTextHTML("Benedictus", "", true, 3);
    }
    else {
        //Evensong or Compline - so Nunc Dimittis
        divText = otherTextHTML("Nunc Dimittis", "", true);
    }
    let element = document.getElementById(divName);
    element.innerHTML += divText;
}

function doCreed() {
    let divName = "creed";
    let divText = "";
    let element = document.getElementById(divName);
    //Feasts requiring the Athanasian Creed at Mattins
    const QVRequired = [
        "The Nativity of the Lord",
        "The Epiphany of the Lord",
        "Easter Sunday",
        "The Ascension of the Lord",
        "The Day of Pentecost (Whitsunday)",
        "St Matthias, Apostle",
        "The Nativity of St John the Baptist",
        "St James, Apostle",
        "St Bartholomew, Apostle",
        "St Matthew, Apostle and Evangelist",
        "Sts Simon and Jude, Apostles",
        "St Andrew, Apostle",
        "Trinity Sunday"
    ];
    if (QVRequired.includes(ld.Title) && ourOffice == 'm') {
        divText = otherTextHTML("The Creed of St Athanasius (Quicunque Vult)", "Creed");
    }
    else {
        divText = otherTextHTML("The Apostles' Creed", "Creed");
    }
}

function doLordsPrayer() {
    otherTextHTML("The Lord's Prayer", "LordsPrayer", false, 4);
}

function doSuffrages() {
    if (settings.country == "USA") {
    doResponsory("Suffrages-USA", "Suffrages", "The Suffrages");
    } else {
        doResponsory("Suffrages", "Suffrages", "The Suffrages");
    }
}

function doCollect(onlyone=false) {
    let divName = "Collect";
    let element = document.getElementById(divName);
    if(!onlyone) {element.innerHTML = "<h3 class='caption'>The Collects</h3>\n<h4 class='caption'>The Collect for the Day</h4>";}

    let output = ld.Collect;
    //Override with Eve Collect if extant
    //if ((ourOffice != 'm')&&(ld.EveCollect != "")){
    //    output = ld.EveCollect;
    //}

    if (output == "") {
        output = "Collect not found";
    }

    //If there is a | in the text, there are options.  We therefore need to do tabs.  Deal with the easy case first and return:
    let optionsExist = output.indexOf("|");
    if (optionsExist == -1) {
        //No options
        output = "<p class='collect firstline'>" + output + "</p>";
    }
    else {
        //Options exist.  Split the text into sections and present them in tabs
        var options = output.split("|");
        var optionSections = [];
        for (i = 0; i < options.length; i++) {
            var title = "Option " + (i + 1);
            var textname = "*" + options[i];
            var isdefault = (i == 0);
            optionSections.push({ "title": title, "textName": textname, "Psalm": 0, "tabgroup": "coll", "isDefault": isdefault, "addGloria": false });
        }
        output = makeTabbedDiv(optionSections);
    }

    //If there is something like [E1] in the collect replace it with the appropriate ending
    let endingRequired = output.match(/\[E\d\]/g);
    if (endingRequired) {
        endingRequired.forEach(element => {
            endingId = element.slice(2, 3);
            output = output.replace(element, " " + endings[endingId - 1]);
        });
    }

    if (onlyone) return(output);

    element.innerHTML += output; // now contains the collect of the day

    output = "";

    let secondplus = nthIndex(ld.FTitle, "+", 2);
    let lastSunday = ld.FTitle.substring(0, secondplus);
    //Additional collects in Advent and Lent (see n25, p73, p80)
    // If we are in Advent and the collect of the First Sunday is not already included, include it now (p73)
    if (ld.Season == "A" && ld.FTitle != "advent+1" && lastSunday != "advent+1") {
        output = "<h4 class='caption'>The Collect for the First Sunday of Advent</h4>";
        output += "<p class='collect'>" + calReadings['advent+1'][crCollect] + "</p>";
    }
    // If we are in Lent and not Ash Wednesday, then the collect of Ash Wednesday is included now (p80)
    if (ld.Season == "L" && ld.Title != "Ash Wednesday") {
        output += "<h4 class='caption'>The Collect for Ash Wednesday</h4>";
        output += "<p class='collect'>" + calReadings['ash-wednesday'][crCollect] + "</p>";
    }

    //Odd rule for feast of Our Lord, Eternal High Priest (p97)
    if (ld.Title == "Our Lord Jesus Christ, The Eternal High Priest") {
        output += "<h4 class='caption'>The Collect for the Thursday in Whitsun Week</h4>";
        output += "<p class='collect'>" + calReadings['whitsun+1+thu'][crCollect] + "</p>";
    }

    //Again, if there is something like [E1] in the collect replace it with the appropriate ending
    endingRequired = output.match(/\[E\d\]/g);
    if (endingRequired) {
        endingRequired.forEach(element => {
            endingId = element.slice(2, 3);
            output = output.replace(element, endings[endingId - 1]);
        });
    }
    // Add supplementary collects so far to the div
    element.innerHTML += output;

    // Add the regular collects for the Office
    if (ourOffice == 'm') {
        element.innerHTML += otherTextHTML("The Collect for Peace", divName, false, 4, 'collect');
        element.innerHTML += otherTextHTML("The Collect for Grace", divName, false, 4, 'collect');
    }
    else {
        element.innerHTML += otherTextHTML("+The Collect for Peace", divName, false, 4, 'collect');
        element.innerHTML += otherTextHTML("The Collect for Aid against all Perils", divName, false, 4, 'collect');
    }
}

function doConclusion() {
    let divName = 'Conclusion';
    let element = document.getElementById(divName);
    element.innerHTML = "<p class='rubric'>In quires and places where they sing, an Anthem may follow. Then these five Prayers may be read, or at least the Prayer of Saint Chrysostom and the Grace.</p>";
    switch (ourCountry) {
        case "ENG": case "WAL": case "SCO":
            otherTextHTML("A Prayer for the King's Majesty", "Conclusion", false, 4, 'collect');
            otherTextHTML("A Prayer for the Royal Family", "Conclusion", false, 4, 'collect');
            break;
        case "USA":
            otherTextHTML("A Prayer for The President of the United States, and all in Civil Authority", "Conclusion", false, 4, 'collect');
            break;
        case "CAN": case "AUS":
            if(settings.co_prayer){
                otherTextHTML("A Prayer for the King and the Parliaments of the Commonwealth", "Conclusion", false, 4, 'collect');
            } else {
                otherTextHTML("A Prayer for the King's Majesty", "Conclusion", false, 4, 'collect');
                otherTextHTML("A Prayer for the Royal Family", "Conclusion", false, 4, 'collect');
            }
    }

    otherTextHTML("A Prayer for the Clergy and People", "Conclusion", false, 4, 'collect');
    otherTextHTML("A Prayer of Saint Chrysostom", "Conclusion", false, 4, 'collect');
    otherTextHTML("The Grace", "Conclusion", false, 4, 'collect');
}

function getVerseList(rawVerselist) {
    verses = [];
    //  Parse a list in the form 'n-m' or 'n-m,p-r' etc into an array of numbers
    function expandRange(range) {
        var vv = [];
        // Take a single range n-m and turn it into an array from n to m
        // If there is no dash, return just the number given
        var ends = range.split('-');
        if (ends == range) {
            //there's no '-' so return the original argument
            return range;
        }
        //Otherwise use the split ends(!) to build a list of numbers
        for (var i = ends[0]; i <= ends[1]; i++) {
            vv.push(Number(i));
        }
        return (vv);
    }
    //If there's a series of ranges we need to break that out first
    if (rawVerselist.includes(';')) {
        ranges = rawVerselist.split(";");
        for (r of ranges) {
            verses.push(expandRange(r));
        }
        return (verses.flat());
    }
    else {
        return (expandRange(rawVerselist).flat());
    }
}

function PsalmHTML(numberstring, divName, psalmodyForm = true) {
    //Get the psalm text from the array, and turn it into output, appending to the named div
    const headingPrefix = "<h4 class=\"caption\">Psalm ";
    const headingEnd = "</h3>";
    const linePrefix = "<p class=\"psalm\">";
    const lineSplit = "&nbsp;:<br />\n";
    const lineEnd = "</p>\n";
    const numberPrefix = "<span class=\"pNumber\">";
    const numberEnd = " </span>";
    var n = numberstring;
    var notAllVerses = false;
    var versesRequired = [];
    var thisPsalm;

    n = n.toString();
    // TODO: allow complex refs (eg 112v34-38).  MAy be required for other Hours idc
    if (n.includes(":")) {
        var bits = n.split(":");
        n = bits[0];
        ranges = bits[1];
        versesRequired = getVerseList(ranges);
        notAllVerses = true;
    }

    var thisPsalmRef = (psalmsText.find((e) => e.Number === n));
    //Clone it to avoid changing the original!
    thisPsalm = { ...thisPsalmRef };
    let output = "";
    if (thisPsalm.Number.substr(0, 3) == '119') {
        //Unfudge the splitting of psalm 119.
        partNumber = thisPsalm.Number.charCodeAt(3) - 96;
        thisPsalm.Number = thisPsalm.Number.substr(0, 3) + " (part " + partNumber + ")";
        if (partNumber == 26) {
            //z used for vv1-32 on Mary Mother of God only
            thisPsalm.Number = thisPsalm.Number.substr(0, 3) + ":1-32 ";
        }
    }

    output += "<div class='psalm'>" + headingPrefix + thisPsalm.Number + ": " + thisPsalm.Title + headingEnd;

    let Verses = thisPsalm.verses;
    let i = 0;
    var isFirst = true;
    while (i < Verses.length) {
        if (notAllVerses && !(versesRequired.includes(i + 1))) {
            // Don't show unlisted verses if only some to be shown
            i++;
            continue;
        }
        outputVerse = linePrefix;
        if (psalmodyForm && !(isFirst)) {
            //If in the psalmody form, show the verse - but not the first verse number
            outputVerse += numberPrefix + Verses[i]['v'].trim() + numberEnd;
        }
        outputVerse += Verses[i]['text'] + lineEnd;
        isFirst = false;
        output += outputVerse.replace(" :", lineSplit);
        i++;
    }
    output += "</div>\n";
    if (divName != "") {
        let element = document.getElementById(divName);
        element.innerHTML += output;
    }
    return output;
}

function psalmodyForToday() {
    let day = Number(getDom(ourDate));
    let divName = 'Psalmody';
    let element = document.getElementById(divName);
    element.innerHTML = "<h3 class='caption'>The Psalmody</h3>";

    if (day == 31) { day = 30; }

    rawPsalmsList = (ld.Psalms == "") ? psalmsForDay["Days"][day][ourOffice] : ld.Psalms;
    psalmsList = rawPsalmsList.split(",");

    for (i = 0; i < psalmsList.length; i++) {
        psalmsList[i] = psalmsList[i].trim();
        PsalmHTML(psalmsList[i], 'Psalmody', true);
        doGloria('Psalmody');
    }
}

function doGloria(divName = "") {
    var gloriaText = `<!-- BeginGloria -->
    <p class="gloria">GLORY be to the Father, and to the Son :<br />and to the Holy Ghost.</p>
    <p class="gloria">As it was in the beginning, is now and ever shall be :<br />world without end. Amen.</p>
    <!-- EndGloria -->`
    //Gloria is omitted between Maundy Thursday and Easter Day
    if ((ld.Season == 'R') && (ourDate >= maundy)) {
        gloriaText = "<p class='gloria'>The Gloria Patri is omitted</p>";
    }
    if (divName != "") {
        let element = document.getElementById(divName);
        element.innerHTML += gloriaText;
    }
    else {
        return (gloriaText);
    }
}

function otherTextHTML(name, divName, gloria = false, hlevel = 3, textclass = 'psalm', doHeading = true) {
    //Get the text from the array, and turn it into output, appending to the named div
    const headingPrefix = "<h" + hlevel + " class=\"caption\">";
    const headingEnd = "</h" + hlevel + ">";
    const linePrefix = "<p class=\"" + textclass + "\">";
    const linePrefix0 = "<p class=\"" + textclass + " firstline\">";
    const lineSplit = "&nbsp;:<br />\n";
    const lineEnd = "</p>\n";
    //console.log(name);
    let thisText = otherTexts.find((e) => e.Title == name);
    let output = "";
    if (doHeading) {
        var trueTitle = thisText.Title;
        if (trueTitle.charAt(0) == "+") {
            //Strip off the '~' which is there to allow two similarly named but different texts
            trueTitle = trueTitle.substring(1);
        }
        output += headingPrefix + trueTitle;
        if (thisText.Subtitle != "") {
            output += " <span class='ref'>(" + thisText.Subtitle + ")</span>";
        }
        output += headingEnd;
    }
    let Verses = thisText.verses;
    let i = 0;
    while (i < Verses.length) {
        outputVerse = (i == 0) ? linePrefix0 : linePrefix;
        outputVerse += Verses[i]['text'] + lineEnd;
        output += outputVerse.replace(" :", lineSplit).replaceAll('//', '<br />');
        i++;
    }
    if (gloria) { output += doGloria(); }
    if (divName != "") {
        let element = document.getElementById(divName);
        element.innerHTML += output;
    }
    return output;
}

function toggleOffice() {
    // Handles seelction of office
    // Options: A(uto),M(atins),E(vensong) - add Compline in future
    // Change button to show selection, override ourOffice, call doOffice
    var officeOptions = ['M', 'E', 'C'];
    let theButton = document.getElementById('officeButton');
    let officeSelected = theButton.innerHTML;
    var indexSelected = officeOptions.indexOf(officeSelected);
    let indexNew = (indexSelected == officeOptions.length - 1) ? 0 : indexSelected + 1;
    // Update the button to the next option
    selectedOffice = officeOptions[indexNew];
    theButton.innerHTML = selectedOffice;
    // Update and show the office, if M or E, or show Compline div if C
    if (selectedOffice == 'C') {
        ourOffice = selectedOffice.toLowerCase();
        doCompline();
        showDivs(["liturgicalDay", "compline"]);
    }
    else {
        // Set ourOffice
        ourOffice = selectedOffice.toLowerCase();
        showLiturgicalDay();
        doOffice();
        showDivs(["liturgicalDay", "office"]);
    }
    // Go to the top
    document.getElementById('navhead').scrollIntoView();
}

function doOffice() {
    if (ourOffice == 'c'){
        doCompline();
        showDivs(["liturgicalDay", "compline"]);
        document.getElementById('navhead').scrollIntoView();
        dispatchEvent(new Event('load'));
        return;
    }
    // clear out the divs of the office
    const myElement = document.getElementById("office");
    for (const child of myElement.children) {
        if (child.tagName == "DIV") {
            child.innerHTML = "";
        }
    }
    checkDMSetting();
    doOfficeTitle();
    doIntroduction();
    doResponsory("ME1", "Responsory", "The Responsory");
    doInvitatory("InvitatoryPsalm", ld);
    psalmodyForToday();
    doLesson(1, "FirstLesson");
    doTD();
    doLesson(2, "SecondLesson");
    doBND();
    doCreed();
    doLesserLitany();
    doLordsPrayer();
    doSuffrages();
    doCollect();
    doConclusion();
    let anthemSetting = "a_" + ourOffice;
    if(settings[anthemSetting]) {doAnthem("Anthem");}
    //Apply priest/lay officiant setting
    checkOfficiantSetting();
    //Scroll back to top
    document.getElementById('navhead').scrollIntoView();
    dispatchEvent(new Event('load')); // refire the load event to restore tab clicks
}

function addComplineHeadings() {
    var complineDivs = ["Heading", "Introduction", "Psalmody", "Chapter", "Hymn", "ND", "Creed", "LordsPrayer", "Confession", "Collects"];
    var headings = ["Compline", null, null, null, null, "The Nunc Dimittis", "The Apostles' Creed", "The Lord's Prayer", null];
    for (let i = 0; i < complineDivs.length; i++) {
        var divName = "compline" + complineDivs[i];
        var myElement = document.getElementById(divName);
        var thisHeading = headings[i] ?? "The " + complineDivs[i];
        var hclass = "<h3 class='caption'>";
        var hend = "</h3>";
        if (complineDivs[i] == 'Heading') {
            hclass = "<h1>";
            hend = "</h1>";
        }
        myElement.innerHTML += hclass + thisHeading + hend;
        if(complineDivs[i] == 'Hymn') {
            myElement.innerHTML += "<h4 class='caption'>Te lucis ante terminum</h4>";
        }
        if(complineDivs[i] == 'Collects') {
            myElement.innerHTML += "<p class='rubric-noborder'>Then shall one or more of the following collects be said:</p>";
        }
    }
}

function doComplineNuncDimittis() {
    var divName = "complineND";
    var myElement = document.getElementById(divName);
    var output = "";
    // Add the antiphon (before)
    var antiphon = [];
    antiphon[0] = " Preserve us, *O Lord, while waking, and guard us while sleeping; that awake we may watch with Christ, and asleep we may rest in peace.";
    antiphon[1] = antiphon[0].replaceAll("*", "");
    for (var i = 1; i < 3; i++) {
        antiphon[i - 1] = "<p class='antiphon" + i + "'>" + antiphon[i - 1] + "</p>\n";
    }
    output += antiphon[0];
    output += otherTextHTML("Nunc Dimittis", "", true, 4, 'collect', false);
    output += antiphon[1];
    myElement.innerHTML += output
}

function doCompline() {
    //Clear out existing content in Compline div
    const myElement = document.getElementById("compline");
    for (const child of myElement.children) {
        if (child.tagName == "DIV") {
            child.innerHTML = "";
        }
    }
    checkDMSetting();
    addComplineHeadings();
    doResponsory('C1', 'complineIntroduction', "");
    PsalmHTML(4, 'complinePsalmody', true);
    PsalmHTML('31:1-6', 'complinePsalmody', true);
    PsalmHTML(91, 'complinePsalmody', true);
    PsalmHTML(134, 'complinePsalmody', true);
    doComplineChapter('complineChapter');
    doResponsory("C3", 'complineChapter', "");
    otherTextHTML('Before the Ending of the Day', 'complineHymn', false, 3, 'collect', false);
    doResponsory("C2", 'complineHymn', "");
    otherTextHTML("The Apostles' Creed", "complineCreed", false, 3, 'psalm', false);
    doResponsory("C4", 'complineCreed', "");
    otherTextHTML("The Lord's Prayer", "complineLordsPrayer", false, 3, 'psalm', false);
    doResponsory("C5", 'complineLordsPrayer', "");
    doComplineNuncDimittis();
    otherTextHTML("The Confession", "complineConfession", false, 3, 'psalm', false);
    doResponsory("C6", 'complineConfession', "");
    otherTextHTML("Vist we beseech thee", "complineCollects", false, 0, 'collect', false);
    otherTextHTML("O Lord Jesus Christ", "complineCollects", false, 0, 'collect', false);
    otherTextHTML("Look down O Lord", "complineCollects", false, 0, 'collect', false);
    otherTextHTML("Be Present", "complineCollects", false, 0, 'collect', false);
    otherTextHTML("Lighten our Darkness", "complineCollects", false, 0, 'collect', false);
    doResponsory("C7", 'complineCollects', "");
    doAnthem("complineAnthem");
    checkCaLangSetting();
    doResponsory("C8", "complineAnthem", "");
    dispatchEvent(new Event('load')); // refire the load event to restore tab clicks
}

function doLitany(){
    var output = "";
    output += doResponsory("Litany1","","");
    output += otherTextHTML("The Lord's Prayer", "", false, 4);
    output += "<p class='rubric'>Then shall the Priest say the Collect of the Day</h3>\n";
    output += "<h4 class='caption'>The Collect</h3>\n";
    output += doCollect(true);
    output += "<p class='rubric'>Following the Collect, the Priest may proceed to the Suplication</p>\n";
    output += doResponsory("Supplication","","A Supplication");
    output += "<p class='rubric'>The Suplication concludes with the following prayer and the Grace</p>\n";
    switch (ld.season){
        //case "A": output += doResponsory("litany_advent","",""); break;
        //case "L": output += doResponsory("litany_lent","",""); break;
        default:  //Two otpions so build tabs
            var sections = [];
            for (let i = 1; i < 3; i++) {
                sections.push({ "title": "Option "+ i, "textName": "+"+doResponsory("litany_other"+i,"",""), "Psalm": 0, "tabgroup": "litanytabs", "isDefault": i==1, extraClass: "", "addGloria": false })
            }
            output += makeTabbedDiv(sections);
    }
    output += otherTextHTML("The Grace", "", false, 4, 'collect');
    let element = document.getElementById("litany");
    element.innerHTML += output;
}

function doPsalmsList(divName = 'psalmsList'){
    const div = document.getElementById(divName);
    var output = "";
    for(let row=0; row<15; row++){
        for (let col=1; col<11; col++){
            let psalmNo = row*10+col;
            output += "<button class='psalmbutton' onclick='showPsalm("+psalmNo+");'>"+psalmNo+"</button>\n";
        }
    }
    div.innerHTML = output;
}

function showPsalm(n){
    const div = document.getElementById("thePsalm");
    div.innerHTML += "<button class='psalmClose sbtn' onclick = 'closePsalm()'><i class='icon-reply'></i></button>\n";
    if(n==119){
        //119 is split into parts, so we need to iterate over them
        for(let i=0; i<22; i++){
            let part = "119" + String.fromCharCode(97 + i);
            div.innerHTML += PsalmHTML(part,"");
        }
    }
    else {
        div.innerHTML += PsalmHTML(n,"");
    }
    div.innerHTML += "<button class='psalmClose sbtn' onclick = 'closePsalm()'><i class='icon-reply'></i></button>\n";
    const listDiv = document.getElementById('psalmsList');
    listDiv.classList.add('hidden');
}

function closePsalm(){
    const div = document.getElementById("thePsalm");
    div.innerHTML = "";
    const listDiv = document.getElementById('psalmsList');
    listDiv.classList.remove('hidden');
}
