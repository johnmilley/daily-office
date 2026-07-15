// Set up all the globals we need
var selectedOffice, ourCountry, today, ourDateD, ourTime, year, ourDate, ourOffice, ourOfficeTitle, eve;
var lent, maundy, passion, advent1, ctk, nextAdvent1, christmas, easter, lessonsYear, ordoYear;
const messagesEnabled = false;

// The main calendar object of arrays that will hold the ordo
var calendar = {};
var baseDate = new Date();
var baseYear = baseDate.getFullYear();

//The liturgical day options shell
var ldOptions = {};
// The liturgical day structure for the day
var ld = {};
// Enums & lookups:
// Priority levels of types of day.  Note that Optional Memorials are 'downgraded' to 13 from 12 so the feria can be shown by default.
const calPriorities = { O: 13, OG: 13, M: 11, P: 11, MG: 10, F: 8,  FG: 7, L: 5, LG: 5, S: 4, SG: 3, SGO: 3 };
const calTypes = {O: "Optional Memorial", M:"Memorial",F:"Feast", L: "Feast", S: "Solemnity", P:"Day of Prayer", f:"Feria", s: "Sunday"};
const calStatuses = {"D":"main","O":"optional","F":"outranked","X":"outranked"};
const monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
const days = ['', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const fullDays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const shortDays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
// Column numbers to names for calendar/readings arrays
const calStatus=0, calName=1, calStandardName=2, calType=3, calPriority=4;
const crTitle = 0, crDate = 1, crType = 2, crCollect = 3,
    crMP1 = 4, crMP1II = 5, crMP2 = 6, crMP2II = 7,
    crEP1 = 8, crEP1II = 9, crEP2 = 10, crEP2II = 11,
    crPPMP = 13, crPPEP = 14, crPPEv = 12, crOverrides = 15;
    crSeason = 16, crCountries = 17;
// Default settings
var settings = {opriest: false, country: 'ENG', co_prayer: false,
    fontsize: 15, m_dm: false, e_dm: false, c_dm: false,  
    ca_latin: false, c_time: 9, eve_time: 6, pb: false ,cal_show: false,
    lastMessageRequest: "", lastMessageDate: "0000-00-00", lastMessage: ""};

getSettingsFromCookies(true);

function initialise(theDate = "", newCal = false){
    // Set up time variables
    ourTime = baseDate.toTimeString().slice(0,2); // ourTime now contains an hour
    year = baseDate.getFullYear();
    today = dateToString(baseDate);
    if(theDate != ""){
        ourDate = theDate;
        year = getYear(theDate);
    }
    else{
        ourDate = today;
    }
    // Set which office to display
    ourOfficeTitle = ourTime < 12 ? 'Mattins' : (ourTime < (Number(settings.c_time) + 12)) ? 'Evensong' : 'Compline';
    selectedOffice = ourOfficeTitle.charAt(0);
    ourOffice =  selectedOffice.toLowerCase();
    //Set the button to show the current office
    document.getElementById('officeButton').innerHTML = selectedOffice;
    ourCountry = settings.country;
    if (newCal){
        if (Advent1(year) <= ourDate) {
            //We're after advent 1, so need to use next year to calculate the ordo
            year++;
        }
        advent1 = Advent1(year - 1);
        nextAdvent1 = Advent1(year);
        ctk = dateOffset(nextAdvent1, -7);
        christmas = dateInYear(year-1,12,25);
        easter = Easter(Number(year));
    
        // if we need to replace the existing calendar array with a blank one
        for (const prop of Object.getOwnPropertyNames(calendar)) {
            delete calendar[prop];
          }
        // Create an empty array for each day in the year
        for( var thisDay = advent1; thisDay <= nextAdvent1; thisDay = dateOffset(thisDay,1)){
            calendar[thisDay] = [];
        }
    }
    
    lessonsYear = 2;
    if (year % 2 != 0) {
      lessonsYear = 1;
    }
}

/*  Messages functionality - MESSAGES temporarily disabled  */
/*async function getMessages(){
    //Initial step.  Needs to:
    // Ask for messages, if not already done today
    // Add any unread messages to the messages panel
    //  show messages icon
    if(!messagesEnabled) {return}; //drop out if messages switched off via const 
    var message;
    var now = dateToString(baseDate);
    console.log("lmr:", settings.lastMessageRequest, " today:", now);
    if(settings.lastMessageRequest < now){
        console.log('request');
        settings.lastMessageRequest = now;
        setCookie('lastMessageRequest');
        var url = "http://localhost/dwdo2/messages.json";
        let response = await fetch(url);
        if (response.ok) { // if HTTP-status is 200-299
            // get the message(s) from the response body
            try{
                let json = await response.json();
                message = json.message;
                console.log(message, message.d, typeof(message.d));
                // Has the last message been read?  If so, drop out; otherwise update lastMessage & Date
                var incomingMessageDate = message.d;
                var lastMessageDate = settings.lastMessageDate.slice(0,10);
                if ((incomingMessageDate == lastMessageDate) && (lastMessageDate.length == 11)){
                    //We've already got the message and it's read so drop out
                    return;
                }
                // So we must have an unread message; thus store message details in settings
                settings.lastMessage = message.t;
                settings.lastMessageDate = message.d;
                setCookie('lastMessage');
                setCookie('lastMessageDate');
            }
            catch {} // fail silently if no valid json response
        } else {
        // fail silently if nothing to get or offline
        }
    }
    // If there is not a character after the (10char) date in lastMessageDate (ie read), add messages to panel
    if(settings.lastMessageDate.length == 10){
        addMessage();
    }
}

function addMessage(){
    var output = "<div class='messagediv'>\n";
    output += "<p class='messagedate'>"+settings.lastMessageDate+"</p>\n";
    output += "<p class='messagetext'>"+settings.lastMessage+"</p>\n";
    output += "</p>\n</div>\n";
    document.getElementById("messages").innerHTML +=output;
    document.getElementById("messagesaccordion").classList.remove("hidden");
    document.getElementById("textsButton").innerHTML = "<i class='icon-bell-alt'></i>";
}

function deleteMessage(){
}
/*

/* Change of date called for */

function changedate(newDate = ""){
    initialise(newDate);
    //If newDate is blank, and the ordo year is not the current year, reset the ordo
    if ((newDate == "") && (ordoYear != year)){doOrdo();}
    showLiturgicalDay();
    doOffice();
    resetToolbar(ourDate != today);
    if(ourOffice == 'c'){
        showDivs(["liturgicalDay","compline"]); 
    }
    else{
        showDivs(["liturgicalDay","office"]);  
    }
}

/*-------------PAGE MANIPULATION FUNCTIONS------------------*/
function showDivs(divsToShow){
    let allDivs = ["liturgicalDay","office","ordo","settings","texts","compline"];
    for (let div of allDivs){
        let element = document.getElementById(div);
        element.style.display = 'none';
    }
    for (let div of divsToShow){
        let element = document.getElementById(div);
        element.style.display = 'block';
    }
}

function showButton(button, show=true){
    let element = document.getElementById(button);
    if(show){
        element.classList.remove('hidden');
    }
    else {
        element.classList.add('hidden');
    }
}   

function resetToolbar(showtodaybutton = false){
    //Reset all tools in the bar to 'standard'

    for (tool of ["officeButton","ordoButton","textsButton","settingsButton"]){
        showButton(tool);
    }
    showButton("returnButton",false);
    showButton("todayButton", showtodaybutton);
    // Remove stickiness
    let element = document.getElementById('main-nav');
    element.classList.remove("stickynav");
    // Scroll back to top
    document.getElementById('navhead').scrollIntoView();
    //MESSAGES - icon temporarily disabled
    // If messages exist, make the messages icon appear
    // document.getElementById("textsButton").innerHTML = (messages === "") ? "<i class='icon-doc-text'></i>":"<i class='icon-bell-alt'></i>";
}

function toolbarReturn(){
    for (tool of ["officeButton","ordoButton","todayButton","textsButton","settingsButton"]){
        showButton(tool,false);
    }
    showButton("returnButton");
    // Set to sticky
    let element = document.getElementById('main-nav');
    element.classList.add("stickynav");
    // Go back to top
    document.getElementById('navhead').scrollIntoView();
}

function showView(view){
    if (view == "office"){
        // Reset office entriely and show
        initialise();
        doOrdo();
        showLiturgicalDay();
        doOffice();
        resetToolbar();
        if(ourOffice=='c'){
            showDivs (["liturgicalDay","compline"]);
        }
        else{
            showDivs (["liturgicalDay","office"]);
        }
    }
    else{
        toolbarReturn(); //set toolbar to show only return, and to be sticky
        showDivs([view]);
        if (view == 'ordo'){
            // Scroll to the row for today, if we're on the current year
            var rowToScroll = "R"+ourDate;
            document.getElementById(rowToScroll).scrollIntoView();
            window.scrollBy(0,-140); // back up 140px to allow space for header areas
        }
    }
}

function changePage(direction){
    var height = document.documentElement.clientHeight;
    window.scrollBy(0,direction * height);
}

function changeYear(direction){
    if (direction == 0) {doOrdo(); doOffice();}
    else { doOrdo(Number(year) + Number(direction)); layoutOrdo();}
}

/*----------------SETTINGS FUNCTIONS------------------------*/
function showCommonwealthOption(){
    const myElement = document.getElementById("commonwealthoption");
    if (["AUS","CAN"].includes(settings.country)){
        //Show the option for the commonwealth
        myElement.classList.remove('hidden');
    }
    else{
        myElement.classList.add('hidden');
    }
}

function getSettingsFromCookies(first=false){
    if (document.cookie == ''){
        return;  //no cookies
    }  
    var pairs = document.cookie.split(";");
    for (var i=0; i<pairs.length; i++){
        var pair = pairs[i].split("=");
        var settingName = pair[0].trim();
        var settingValue = pair.slice(1).join('=').trim();
        // Convert "true"/"false" to boolean
        if (settingValue === "true" || settingValue === "false") {settingValue = (settingValue === "true");}
        settings[settingName] = settingValue;
    }
}

function loadSettingstoForm(){
    for(thisSetting in settings){
        if ((thisSetting != 'fontsize') && (!thisSetting.includes('essage'))){ //font size & messages settings don't have form inputs
            var field = document.getElementById(thisSetting);
            if (!field) continue;
            if (field.type == 'checkbox'){
                field.checked = (settings[thisSetting]);
            }
            else {
                field.value = settings[thisSetting];
            }
        }
    }
}

function checkSettings(){
    checkTextsizeSetting();
    checkOfficiantSetting();
    checkCountrySetting();
    checkPBSetting();
    checkDMSetting();
    checkCalShowSetting();
    showCommonwealthOption();
}

function checkDMSetting() {
    let settingName = ourOffice + "_dm";
    if (settings[settingName]) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    else{
        document.documentElement.setAttribute('data-theme', 'light');
    }
}

function checkOfficiantSetting(){
    // Set classes on tab links and content so that specified officiant is 'active'
    var activeCollection, inactiveCollection; 
   // console.log ("checking opriest:" + settings.opriest);
    if (settings.opriest){
      activeCollection = document.getElementsByClassName("opriest");
      inactiveCollection = document.getElementsByClassName("olay");
    }
    else {
        activeCollection = document.getElementsByClassName("olay");
        inactiveCollection = document.getElementsByClassName("opriest");
    }
        for (let i = 0; i < activeCollection.length; i++) {
      activeCollection[i].classList.add("active");
    }
  
    for (let i = 0; i < inactiveCollection.length; i++) {
      inactiveCollection[i].classList.remove("active");
    }
}

function setCookie(item){
var oneYearFromNow = new Date();
oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
document.cookie = item + "=" + settings[item] +"; expires=" + oneYearFromNow + ";";
}

function doSetting(item,type){
    if(item == 'fontsize'){
        if (type == 0){
                settings.fontsize = 15;
            }
            else{
                settings.fontsize = Number(settings.fontsize)+Number(type);
            } 
        }
    else {
        let formitem = document.getElementById(item);
        if (type == 'checkbox'){
            settings[item] = formitem.checked;
        }
         else {
            settings[item] = formitem.value;
        }
    }
    setCookie(item);
    checkSettings();
}

function checkTextsizeSetting() {
    let el = document.body;
    el.style.fontSize = settings.fontsize+'px';
}

function checkCountrySetting() {
    if (ourCountry == settings.country) {
        return;  //country already set
    }
    ourCountry  = settings.country;
}

function checkCalShowSetting() {
    calShow = settings.calShow;
    layoutOrdo();
}

function checkPBSetting(){
    var pbDiv = document.getElementById("pagebuttons");
    if(!pbDiv) return;
    if(settings.pb){
        pbDiv.style.display = 'block';
    }
    else {
        pbDiv.style.display = 'none';
    }
}

function checkCaLangSetting(){
    // Set classes on tab links and content to specified language
    var activeCollection, inactiveCollection; 
    if (settings.ca_latin){
      activeCollection = document.getElementsByClassName("Latin");
      inactiveCollection = document.getElementsByClassName("English");
    }
    else {
        activeCollection = document.getElementsByClassName("English");
        inactiveCollection = document.getElementsByClassName("Latin");
    }
    
    for (let i = 0; i < activeCollection.length; i++) {
      activeCollection[i].classList.add("active");
    }
  
    for (let i = 0; i < inactiveCollection.length; i++) {
      inactiveCollection[i].classList.remove("active");
    }
}

/*-----------------------DATE FUNCTIONS-----------------------*/
function getDay(theDate){
    //Get the weekday of a date in yyyy-mm-dd format
    // Return 0 for Sunday ... 6 for Saturday
    var jdate = new Date(theDate + " 12:00:00");
    return jdate.getDay();
}

function getMonth(theDate){
    return theDate.slice(5,7);
}

function getDom(theDate, dropZero = false){
    let dom = theDate.slice(8,10);
    if (dropZero && (dom.charAt(0)=="0")) {
        dom = dom.charAt(1);
    }
    return dom;
}

function getYear(theDate){
    return theDate.slice(0,4);
}

function dateOffset(theDate,offsetDays){
    var newDate = new Date(theDate + " 12:00:00");
    newDate.setDate(newDate.getDate() + offsetDays);
    return dateToString(newDate);
}

function diff_indays(date1, date2) {
    // Return number of dsays between dates in yyyy-mm-dd, using UTC time to avoi timezone issues
    let dt1 = new Date(date1);
    let dt2 = new Date(date2);
    return Math.floor((Date.UTC(dt2.getFullYear(), dt2.getMonth(), dt2.getDate()) - Date.UTC(dt1.getFullYear(), dt1.getMonth(), dt1.getDate())) / (1000 * 60 * 60 * 24));
}

function dateToString(theDate){
    // Returns an ISO string representation of the date (not time) - YYYY-MM-DD
    let myDay = theDate.getDate();
    let myMonth = theDate.getMonth() + 1;
    let myYear = theDate.getFullYear();
    let myFormattedMonth = ("0" + myMonth).slice(-2);
    let myFormattedDay = ("0" + myDay).slice(-2);
    return (`${myYear}-${myFormattedMonth}-${myFormattedDay}`);
}

function dateInYear(y,m,d){
    return (String(y).padStart(4,'0')+"-"+String(m).padStart(2,'0')+"-"+String(d).padStart(2,'0'));
}

function nthWdayofMonth(year, month, n, dayOfWeekNo){
    // Get eg 4th Wednesday
    // Get first of month, then work out how many days to add
    //This will be (n-1)*7 for the complete weeks, plus diff between day1 and first relevant day
    var MonthDay1 = dateInYear(year, month, 1);
    var MonthDay1DOW = getDay(MonthDay1);
    var offsetToFirst = dayOfWeekNo - MonthDay1DOW;
    if (offsetToFirst < 0 ){offsetToFirst += 7;}
    var offset = offsetToFirst + (n-1) *7;
    return dateOffset(MonthDay1,offset);
}

/*-------------------TEXT AND NUMBER FUNCTIONS---------------------*/
function ucfirst(s) {
    return (s.substring(0, 1).toUpperCase() + s.substring(1));
}

function ordinal(n) {  //Return ordinal text for number.  Max required is 27, so no need to cater for bigger 
    var ordinalUnits = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth'];
    var ordinalTys = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if (n < 14) {
        return (ucfirst(ordinalUnits[n]));
    }
    if (n < 19) {
        return (ucfirst(ordinalUnits[n - 10].replace('th', 'teenth')));
    }
    if (n == 19) {
        return ('Nineteenth');
    }
    if (n % 10 == 0) {
        return ordinalTys[n / 10].replace("y", "ieth");
    }
    return (ordinalTys[Math.floor(n / 10)] + '-' + ordinalUnits[n % 10]);
}

function standardise(title) {
    // Standardised version is lowercase, truncated at any comma or bracket, spaces turned to hyphens
    var bracket = title.indexOf("(");
    var comma = title.indexOf(",");
    bracket = (bracket == -1) ? title.length : bracket;  //If no bracket use whole string
    comma = (comma == -1) ? title.length : comma;
    var truncate = Math.min(bracket, comma);
    var newTitle = title.substr(0, truncate).trim().toLowerCase().replace(/\ /g, "-");
    return newTitle;
}

function deStandardise(stitle) {
    //Given a standardised season title, turn it ito the formal titles
    //Standardised title consists of season+number+weekday
    var titlearray = stitle.split("+");
    var title = "";
    var season = titlearray[0];
    var number = titlearray[1];
    const longDays = { "mon": "Monday", "tue": "Tuesday", "wed": "Wednesday", "thu": "Thursday", "fri": "Friday", "sat": "Saturday" };
    var weekday = titlearray[2] ? longDays[titlearray[2]] : "";
    var ER = titlearray[3] ?? "";
    switch (season) {
        case "advent":
            title = ucfirst(ordinal(number)) + " Sunday of Advent"
            if (weekday != "") {
                title = weekday + " after the " + title;
            }
            break;
        case "christmas":
            if (number == 1) {
                title = weekday + " in the Octave of Christmas";
            }
            else {
                title = weekday + " in the Second week of Christmas"
            }
            break;
        case "epiphany":
            if (number == 1) {
                title = "The Epiphany of the Lord";
                if (weekday != "") {
                    title = weekday + " after the Epiphany";
                }
            } else {
                title = ucfirst(ordinal(number)) + " Sunday of Epiphany";
                if (weekday != "") {
                    title = weekday + " after the " + title;
                }
            }
            break;
        case "baptism": title = "The Baptism of the Lord";
            if (weekday != "") {
                title = weekday + " after the " + title;
            }
            break;
        case "septuagesima": case "sexagesima": case "quinquagesima": case "ash-wednesday":
            if (season == "ash-wednesday") { title = "Ash Wednesday" } else { title = ucfirst(season); }
            if (weekday != "") {
                title = weekday + " after " + title;
            }
            break;
        case "lent":
            if (number < 5) {
                title = ucfirst(ordinal(number)) + " Sunday in Lent";
                if (weekday != "") {
                    title = weekday + " in the " + ucfirst(ordinal(number)) + " week of Lent";
                }
            }
            else if (number == 5) {
                title = "Fifth Sunday in Lent (Passion Sunday)";
                if (weekday != "") {
                    title = weekday + " in Passion Week";
                }
            }
            else if (number == 6) {
                title = "Palm Sunday";
                if (weekday != "") {
                    title = weekday + " in Holy Week";
                }
            }
            break;
        case "easter":
            if (number == 1) {
                title = "Easter Day";
                if (weekday != "") {
                    title = weekday + " in the Octave of Easter";
                }
            }
            else {
                title = ucfirst(ordinal(number)) + " Sunday of Easter";
                if (weekday != "") {
                    title = weekday + " after the " + title;
                }
            }
            break;
        case "whitsun":
            title = "The Day of Pentecost (Whitsunday)";
            if (weekday != "") {
                title = weekday + " in Whitsun Week";
            }
            break;
        case "trinity":
            if (number == 1) {
                title = "Trinity Sunday";
                if (weekday != "") {
                    title = weekday + " after the Most Holy Trinity";
                }
            }
            else {
                title = ucfirst(ordinal(number - 1)) + " Sunday after Trinity";
                if (weekday != "") {
                    title = weekday + " after the " + title;
                }
            }
            break;
        case "christ-the-king":
            title = "Our Lord Jesus Christ, King of the Universe";
            if (weekday != "") {
                title = weekday + " before Advent";
            }
    }
    //Modify titles for Ember and Rogation days
    switch (ER) {
        case "e": switch(season) {
                case 'whitsun': title = "Ember " + weekday + " in Whitsun week"; break;
                case 'trinity': title = "Ember " + weekday + " in September"; break;
                default:        title = "Ember " + weekday + " in " + ucfirst(season); break;
            }
            break;
        case "r": title = "Rogation " + title; break;
        default: break;
    }
    return (title);
}

/*--------------------CALENDAR BUILDING FUNCTIONS--------------------*/
function Easter(Y) {
    //Get the date of easter in the year Y, returning yyyy-mm-dd
    var C = Math.floor(Y / 100);
    var N = Y - 19 * Math.floor(Y / 19);
    var K = Math.floor((C - 17) / 25);
    var I = C - Math.floor(C / 4) - Math.floor((C - K) / 3) + 19 * N + 15;
    I = I - 30 * Math.floor((I / 30));
    I = I - Math.floor(I / 28) * (1 - Math.floor(I / 28) * Math.floor(29 / (I + 1)) * Math.floor((21 - N) / 11));
    var J = Y + Math.floor(Y / 4) + I + 2 - C + Math.floor(C / 4);
    J = J - 7 * Math.floor(J / 7);
    var L = I - J;
    var M = 3 + Math.floor((L + 40) / 44);
    var D = L + 28 - 31 * Math.floor(M / 4);
    var y4 = String(Y).padStart(4,'0');
    var m2 = String(M).padStart(2,'0');
    var d2 = String(D).padStart(2,'0');
    return (y4+"-"+m2+"-"+d2);
}

function Advent1(Y) {
    // Get the date of the first Sunday of Advent in  year Y, returning yyyy-mm-dd
    var Dec1 = new Date(Y, 11, 1);
    var Dec1WeekDay = Dec1.getDay();
    var Offset = Dec1WeekDay > 4 ? 7 - Dec1WeekDay : -Dec1WeekDay;
    return dateOffset(dateToString(Dec1), Offset);
}

function doSeason(seasonName, seasonStart, endBy, startat = 1, sp = 6, fp = 13, excludefirst = false) {
   
    var thisDate = seasonStart;
   
    var startDay = getDay(seasonStart);
    var week = startat;
    var day = 0;
    var priority, type, standardisedTitle;

    while (thisDate < endBy) {
        var standardisedTitle = seasonName + "+" + week;
        if (day == 0) {
            priority = sp;
            type = 's';
        }
        else {
            priority = fp;
            type = 'f';
            standardisedTitle += "+" + days[day];
        }

        if(day > 0 || !(excludefirst)){
            setDay(thisDate, "", standardisedTitle, type, priority);
        }

        thisDate = dateOffset(thisDate,1);
        if (day == 0) {
            day = startDay + 1;
        }
        else {
            day++;
        }

        if (day == 7) {
            day = 0;
            week++;
        }
    }
}

function doChristmasSeason(christmas) {
    // Set the 'fixed' elements of the Christmas season, then override with Holy Family
    // Ferial name contians 'christmas-' to allow season to be read later
    var thisDate = christmas;
    var christmasDay = getDay(thisDate);
    var daynames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    setDay(thisDate, "*The Nativity of the Lord", "christmas+1", "S", 1); // Rank fudged to 1 to override Advent 4 sundays
    thisDate = dateOffset(thisDate, 1); //25
    setDay(thisDate, "St Stephen, The First Martyr", "christmas+1", "F", 7); thisDate = dateOffset(thisDate, 1); //26
    setDay(thisDate, "St John, Apostle and Evangelist", "christmas+1", "F", 7); thisDate = dateOffset(thisDate, 1); //27
    setDay(thisDate, "The Holy Innocents, Martyrs", "christmas+1", "F", 7); thisDate = dateOffset(thisDate, 1); //28
    for (var d = 29; d <= 31; d++) {
        var dayname = daynames[getDay(thisDate)];
        setDay(thisDate, "*" + dayname + " in the Octave of Christmas", "christmas+1+dec-" + d, "f", 9); thisDate = dateOffset(thisDate, 1); //29-31
    }
    setDay(thisDate, "Mary, Mother of God", "christmas+1", "S", 3); thisDate = dateOffset(thisDate, 1); //1 Jan
    for (var d = 2; d <= 7; d++) {
        var title = "*" + ordinal(thisDate.slice(9,10)) + " of January";
        setDay(thisDate, title, "christmas+2+jan-0" + d, "f", 13); thisDate = dateOffset(thisDate, 1); //2-7 Jan
    }
    // Holy Family - Sun in Octave of Christmas, or 30 Dec if there isn't one (ie if Christmas is a Sunday)
    if (christmasDay == 0) {
        setDay(dateInYear(year-1,12, 30), "The Holy Family of Jesus, Mary and Joseph", "christmas+1", "F", 5);
    }
    else {
        setDay(dateOffset(christmas, 7 - christmasDay), "The Holy Family of Jesus, Mary and Joseph", "christmas+1", "F", 5);
        setDay(dateOffset(christmas, 14 - christmasDay), "Second Sunday of Christmas", "christmas+2", "s", 6);
    }
}

function getHighestRank(theDate){
    let highRank = 14;
    for (var thisEvent of calendar[theDate]){
        if(thisEvent[calPriority]<highRank) {
            highRank = thisEvent[calPriority];
        }
    }
    return highRank;
}

function setDay(setDate, title, standardisedTitle, type = "", priority = 99) {
    //One or other of title and standardisedTitle must be set - if not fail silently - should raise error
    //setDate in yyyy-mm-dd
    if ( title=="" && standardisedTitle == "") {return true;}
    var calday = [];
    calday[calStatus] = 0;
    calday[calName] = title ? title :  deStandardise(title);
    calday[calStandardName] = standardisedTitle ? standardisedTitle : standardise(title);
    calday[calType] = type;
    calday[calPriority] = priority;
    try {
    calendar[setDate].push(calday);
    return true;
    }
    catch {
        console.log("Set failed", setDate);
    }
}

function addFixed(targetDate, title, type, country) {
    var sType = type.substring(0, 2);
    var priority = calPriorities[sType];
    if (type == "SG*" && ["ENG","WAL","SCO"].includes(country)) {
        //Transferable HolyDay of Obligation in OLW
        switch (getDay(targetDate)) {
            case 1: targetDate = dateOffset(targetDate, -1);
                break;
            case 6: targetDate = dateOffset(targetDate, 1);
                break;
            default: break;
        }
    }
    else
    {   if((type.includes("S") && (getHighestRank(targetDate)<=priority))){
            //Impeded Non-obligation Solemnity so standard rule
            //Outranked solemnity - try next days until it fits
            let n = 0;
            while(n < 7 && getHighestRank(targetDate)<=priority){
                targetDate = dateOffset(targetDate,1);
                n++;
            }
        }
    }
    //Add this to the calendar
    if (setDay(targetDate, title, "", sType, priority)) {
        return true;

    }
}

function adjustPriorites(start, end, type, newPriority, newType= "") {
    // Change the priority of a seasonal day - used in Easter and Christmas and for Ember days
    // Find the instances in the table where there is a matching date and type
    // Increase the priority on those days
    for ( var thisDate = start; thisDate <= end; thisDate = dateOffset(thisDate,1)){
        for (var thisEvent of calendar[thisDate]){
            if (thisEvent[calType] == type){
                if(newType != "") { thisEvent[calType] = newType;}
                thisEvent[calPriority] = newPriority;
            }
        }
    }
}

function doSeasons(country = "ENG") {
    // Insert the seasons of the year, and feasts directly related to the seasons rather than the date
    // Milestones for seasons
    var ashwednesday = dateOffset(easter, -46);
    lent = dateOffset(easter, -42);
    var septuagesima = dateOffset(lent, -21);
    var sexagesima = dateOffset(lent, -14);
    var quinquagesima = dateOffset(lent, -7);
    passion = dateOffset(easter, -14);
    maundy = dateOffset(easter, -3);
    var whitsun = dateOffset(easter, 49);
    var trinity = dateOffset(easter, 56);
    var epiphany, baptism, epiphany2;

    //Epiphany and Baptism are more complicated...
    // England and Wales
    if(["ENG","WAL","SCO"].includes(country)){
        //First, set epiphany, (via function) which goes to the Sunday if it falls on Mon or Sat
        epiphany = dateInYear(year,1,6);
        switch (getDay(epiphany)) {
            case 1: epiphany = dateInYear(year,1,5); break;
            case 6: epiphany = dateInYear(year,1,7);
        }
        //Standard date for Baptism is Sunday after epiphany - and in this case epiphany 2 is a week later
        // This will also apply if Epiphany is transferred to Sunday the 5th
        if((epiphany == dateInYear(year,1,6)) || (epiphany == dateInYear(year,1,5))){
            var d =  getDay(epiphany);
            baptism = dateOffset(epiphany,(7-d));
            epiphany2 = dateOffset(baptism, 7);
        }
        //But if Epiphany falls on Sun the 7th or 8th Jan, then Baptism is the day after - and the second epiphany is a week after epiphany
        else{
            baptism = dateOffset(epiphany, 1);
            epiphany2 = dateOffset(epiphany, 7);
        }
    }
    // CSP (see https://ordinariate.net/holy-days-of-obligation)
    // Epiphany transferred to Sunday between 2 and 8 Jan.  
    // Baptism on following Monday;  ep2 a week after Epiphany
    if (["CAN","USA"].includes(country)){
        //What day is 2 January?
        var d = dateInYear(year,1,2);
        var dday = getDay(d);
        if (dday !=0) d = dateOffset(d,7-dday);
        epiphany = d;
        //If Epipany falls on 7/1 or 8/1, then baptism is the following day; otherwise a week later. 
        var epiphanyDom  = getDom(epiphany);
        if (epiphanyDom == 7 || epiphanyDom == 8){
            baptism = dateOffset(d,1);
            epiphany2 = dateOffset(epiphany,7);
        }
        else{
            baptism = dateOffset(epiphany,7);
            epiphany2 = dateOffset(epiphany,14);
        }
    }

    //OLSC - Epiphany on 6 Jan, Baptism is Sunday after, Ep 2 follows Baptism. 
      if (["AUS"].includes(country)){
        epiphany = dateInYear(year,1,6);
        var d = dateInYear(year,1,7);
        var dday = getDay(d);
        if (dday !=0) d = dateOffset(d,7-dday);
        baptism = d;
        epiphany2 = dateOffset(baptism, 7);
    }

    doSeason("advent", advent1, christmas, 1, 2, 13);
    adjustPriorites(dateInYear(year-1,12,17), christmas, "f", 9);
    doSeason("epiphany", epiphany, baptism);  //done before Christmas to avoid early Jan days overriing days after Epiphany
    adjustPriorites(epiphany, epiphany, "s", 3, "S");
    doChristmasSeason(christmas);
    doSeason("baptism", baptism, epiphany2)
    doSeason("epiphany", epiphany2, septuagesima, 2);
    doSeason("septuagesima", septuagesima, sexagesima);
    doSeason("sexagesima", sexagesima, quinquagesima);
    doSeason("quinquagesima", quinquagesima, ashwednesday);
    setDay(ashwednesday, "Ash Wednesday", "ash-wednesday", "x", 2);
    doSeason("ash-wednesday",ashwednesday,lent,0,0,9,true);
    doSeason("lent", lent, easter,1,2,9);
    adjustPriorites(dateOffset(easter, -6), dateOffset(maundy,-1),'f',2,'x');
    doSeason("easter", easter, whitsun,1,2);
    adjustPriorites(easter, easter, "s", 1, "S");
    adjustPriorites(easter, dateOffset(easter, 7), "f", 2, "S");
    doSeason("whitsun", whitsun, trinity, 1, 2, 9);
    doSeason("trinity", trinity, ctk);
    doSeason("christ-the-king", ctk, nextAdvent1);

    //specifically add next year's Advent1 (so the last day of this year has a 'nextDay')
    setDay(nextAdvent1, "First Sunday of Advent", "advent+1", "s", 2);
    //Set other dates related to Easter
    setDay(dateOffset(easter, -9), "St Mary in Passiontide", "", "F", 7);
    setDay(dateOffset(easter, -3), "Maundy Thursday", "maundy-thursday", "x", 1);
    setDay(dateOffset(easter, -2), "Good Friday", "good-friday", "x", 1);
    setDay(dateOffset(easter, -1), "Holy Saturday", "holy-saturday", "x", 1);
    setDay(dateOffset(easter, 39), "The Ascension of the Lord", "ascension", "S", 3);
    if (!["USA","CAN"].includes(country)){
        setDay(dateOffset(whitsun, 4), "Our Lord Jesus Christ, The Eternal High Priest", "", "F", 7);
    }
    setDay(dateOffset(trinity, 12), "The Most Sacred Heart of Jesus", "the-most-sacred-heart-of-jesus", "S", 3);
    setDay(dateOffset(trinity, 13), "The Immaculate Heart of the Blessed Virgin Mary", "", "M", 10);
    setDay(dateOffset(trinity, 7), "The Most Holy Body and Blood of Christ", "", "S", 3);

    //Annunication - usually 25 March = but if falls on a Sunday in Lent, it transfers to the following day...
    annunciation = dateInYear(year, 3, 25);
    if (annunciation < easter && annunciation >= lent && getDay(annunciation) == 0) {
        console.log('Annunciation on Sunday in Lent transferred');
        annunciation = dateOffset(annunciation, 1);
    }
    //...and if annunication falls in Holy Week, it moves to the Monday after Easter 2
    if ((annunciation < easter) && annunciation > dateOffset(easter, -7)) {
        annunciation = dateOffset(easter, 8);
    }
    setDay(annunciation, "The Annunciation of the Lord", "", "S", 3);

    //OLW (E&W) only:
    // ==========If St George falls in the Triduum, or the Easter Octave Week, it moves to the Monday after Easter 2
    // (If impeded by a Sunday of Easter it moves to the next day but that's already standard handling)
    // St George is also in the calendar as a feast for other territories
    if (country == 'ENG' || country == 'WAL'){
        var stGeorge = dateInYear(year, 4, 23);
        if ((stGeorge < dateOffset(easter,7) && stGeorge >= maundy)) {
            stGeorge = dateOffset(easter, 8);
        }
        setDay(stGeorge, "St George, Martyr, Patron of England", "st-george", "S", 4);
    }


    if(["USA","CAN"].includes(country)){
    // CSP transfers to Sunday (CAN, US only) if it falls before lent
        var CSP = dateInYear(year,2,22);
        if(CSP < lent){
            var n = getDay(CSP)
            switch(n){
                case 0: break; // Sunday - leave it alone
                case 1: case 2 : case 3: CSP = dateOffset(CSP,  -n ); break;
                case 4: case 5 : case 6: CSP = dateOffset(CSP, 7-n ); break;
            };
        }
        setDay(CSP, "The Chair of St Peter, Apostle", "the-chair-of-st-peter-the-apostle","S", 4);
    // The Blessed Virgin Mary, Mother of the Church - Saturday after Ascension
        setDay(dateOffset(easter, 41 ),"The Blessed Virgin Mary, Mother of the Church","the-blessed-virgin-mary","M",10);
    }


    //===========Ember and Rogation Days
    // Ember: Days WFS after Adv1, Lent1, Whitsun and Holy Cross (14 Sep) if feria.
    //    Marked by appending 'e' to the standardised title 
    // What day is Sept 14?
    var holyCross = dateInYear(year,9,14);
    // If it's Weds or later, we need to count from following Sunday - otherwise the last Sunday
    var holyCrossDay = getDay(holyCross);
    var hCbaseSunday;
    if (holyCrossDay > 2){
        hCbaseSunday = dateInYear(year, 9, 21-holyCrossDay);
    } else {
        hCbaseSunday = dateInYear(year, 9, 14-holyCrossDay);
    }
    // Build a list of the dates we will want to make into Ember Days
    var edates = [];
    for (var baseDate of [advent1, lent, whitsun, hCbaseSunday]) {
        for (var i of [3, 5, 6]) {
            emberdate = dateOffset(baseDate,i);
            edates.push(emberdate);
        }
    }
    //Now iterate over the calendar for each ember day, modify the feria event title(s) and priority
    for (thisDate of edates){
        for(thisEvent of calendar[thisDate]){
            if (thisEvent[calType]== "f"){
                thisEvent[calStandardName] += "+e";
                thisEvent[calName] = deStandardise(thisEvent[calStandardName]);
                if(!thisEvent[calStandardName].includes("whitsun")){
                     thisEvent[calPriority] = 10; 
                     //10 - alongside oblig. mems;  Wihtin Pentecost Octave, stays at 9. 
                }
            }
        }
    }
    //  Rogation Days: the three days before Ascension, which in England and Wales is always the Thursday --
    //    So we need the 36th-38th days after Easter
    setDay(dateOffset(easter, 36), "Rogation Monday", "rogation-monday", "r", 10);
    setDay(dateOffset(easter, 37), "Rogation Tuesday", "rogation-tuesday", "r", 10);
    setDay(dateOffset(easter, 38), "Rogation Wednesday", "rogation-wednesday", "r", 10);
}

function doFeasts(country = 'ENG') {
    let exccode = "-"+country;

//Read the 'dated feasts' part of the calendar of readings and override as necessary
    for (let feastName in calReadings) {
        var thisFeast = calReadings[feastName];

        //If a feast has '-XXX' in the countries column, ignore it
        //If a feast starts '+' in the countries column and does not contain XXX, ignore it.
        let thisCountries = thisFeast[crCountries];
                if (thisCountries.includes(exccode)) {continue;}
        if ((thisCountries.substring(0,1) == '+') && !thisCountries.includes(country)) {continue;}

        // If we have a date in [1]
        var targetDate = thisFeast[crDate];
        if (targetDate != "") {
            // Check whether this is a duplicate (for a different status/date only outside England)
            if (thisFeast[crTitle].substring(0,3)=='DUP'){
                // If so we use the details for the underlying feast, but the status & date as for the duplicate
                thisFeast[crTitle] = calReadings[thisFeast[crTitle].substring(4)][crTitle];
            }
            // Attempt to add this feast for year-1 (to catch Advent feasts) and year (to catch the rest)
            for (thisyear  of [year-1,year] ){
                var fulltargetDate = String(thisyear).padStart(4,'0')+"-"+targetDate;
                if (fulltargetDate >= advent1 && fulltargetDate < nextAdvent1) {
                    addFixed(fulltargetDate, thisFeast[crTitle], thisFeast[crType],country);
                }
            }
        }
    }
    //Add Days of Prayer (CAN, USA, AUS) which are driven by calendar dates rathr than seasons
    // In CAN and USA, Labour day is the first Monday in September
    if(["CAN","USA"].includes(ourCountry)){
        var labourDay = nthWdayofMonth(year,9,1,1);
        addFixed(labourDay,"Labour Day","P",ourCountry);
    }
    // in USA, Thanksgiving is the fourth Thursday in November
    if(["USA"].includes(ourCountry)){
        var thanksgiving = nthWdayofMonth(year,11,4,4);
        addFixed(thanksgiving,"Thanksgiving","P",ourCountry);
    }
    // in CAN, Thanksgiving is the second Monday in October
    if(["CAN"].includes(ourCountry)){
        var thanksgiving = nthWdayofMonth(year,10,2,1);
        addFixed(thanksgiving,"Thanksgiving Day","P",ourCountry);
    }
}

function finaliseOrdo(){
    /*------------------------------------
    / Take calendar, complete titles, sort by prioriies and date
    / For each date, first line must have highest priority (0-high)
    / Flag that line as 'default' (D);
    / Flag the (overridden) Feria as we are likely to need elements from it (F)
    / If that line is a Feria and there are OMs, flag OMs as Options (O)
    / Flag other lines as 'outranked' (X);
    ---------------------------------------*/
    //Iterate over all date 'rows'
    for (var dateRow in calendar) {
        //Complete titles
        for (var thisEvent of calendar[dateRow]){
            if (thisEvent[calName] == "") {
                thisEvent[calName] = deStandardise(thisEvent[calStandardName]);
            }
        }
        //Sort events by priority
        calendar[dateRow].sort(function(a,b) {   
          if (a[calPriority] < b[calPriority]) return -1;
          if (a[calPriority] > b[calPriority]) return 1;
          return 0;
        });
        // Apply flags
        // First item is highest ranked; flag it and get its type and priority
        calendar[dateRow][0][calStatus] = "D";
        let topPriority = calendar[dateRow][0][calPriority];
        //Now loop over all the rows and apply
        for(var thisEvent of calendar[dateRow]){
            if(thisEvent[calStatus] == "D") {continue};
            //All outranked...
            if (thisEvent[calPriority] > topPriority) 
                    {thisEvent[calStatus] = "X";}
            //but if OM and top priority is 13, allow option
            if ((topPriority == 13) && (thisEvent[calPriority] == "14")) 
                    {thisEvent[calStatus] = "O";}
            //And finally if a feria or Sunday is overidden, flag it as the feria
            if((thisEvent[calStatus] == "X") && (thisEvent[calType] =='f' || thisEvent[calType == 's']))
                {thisEvent[calStatus] = "F";}
        }
    }
}

function layoutOrdo(defaultonly = false){
//Create the output
//console.log(calendar);
    var thisMonth = "";
    var textYear = year-1 + "/" + year % 100;
    var output = "<div id='ordoheader'><h1>The Calendar</h1>\n";
    output += "<div id='yearchanger'>";
    output += "<button class='sbtn' onclick = 'changeYear(-1);'><svg width='18' height='18' viewBox='0 0 18 18' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><polyline points='11,4 6,9 11,14'/></svg></button>";
    output += "<span>" + textYear + "</span>";
    output += "<button class='sbtn' onclick = 'changeYear(1);'><svg width='18' height='18' viewBox='0 0 18 18' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><polyline points='7,4 12,9 7,14'/></svg></button></div>\n";
    output += "</div>\n";
    output += "<div id='ordotable'>\n<table class='ordo' id='ordo'>\n";

    for (var dateRow in calendar) {
        // Create a table with a row for each date, the second column containing the options for teh day
        //...but don't show the row for nextAdvent1 since it's not in this year
        if(dateRow == nextAdvent1){continue;}
        // If we're in a new month, output a header row
        var currentMonth = monthNames[getMonth(dateRow)-1];
        if(currentMonth != thisMonth){
            thisMonth = currentMonth;
            output += "<tr><th class='stickyheader' colspan='2'>"+thisMonth+"</th></tr>";
        }
        // Add a row with the day and date in column 1
        output += "<tr id='R"+dateRow+"' onclick='changedate(\"" + dateRow + "\")'>\n<td>" + shortDays[getDay(dateRow)] + "&nbsp;" + getDom(dateRow,true) + "</td>\n";
        // Second cell contains a span with the name of the feast, classed to reflect its type
        output += "<td>";
        var firstline = true;
        for (thisEvent of calendar[dateRow]){
            let thisTitle = thisEvent[calName];
            if(thisTitle.charAt(0)=="*"){thisTitle = thisTitle.substring(1); }
            let lineStatus = calStatuses[thisEvent[calStatus]];
            if((lineStatus == "outranked") && (!settings.cal_show)){ continue;} 
            let lineType = thisEvent[calType].charAt(0);
            let lineClass = " class=\"line_"+lineStatus+" ltype_"+ lineType + "\"";
            if (firstline) {
                firstline = false;
            }
            else{
                output += "\n<br>";
            }
            output += "<span" + lineClass + ">" + thisTitle + "</span>";
        }
        output += "</td></tr>\n";
    }
    output += "</table>\n</div>\n";
   
    let element = document.getElementById("ordo");
    element.innerHTML = output; 
}

function doOrdo(newYear = 0){
    var newDate = (newYear == 0) ? "" : dateInYear(newYear, 1,1);
    ordoYear = (newYear == 0) ? baseYear : newYear;
    initialise(newDate,true);
    doSeasons(ourCountry);
    doFeasts(ourCountry);
    finaliseOrdo();
    layoutOrdo();
}

//Ordo is now set up and ready to be shown or used