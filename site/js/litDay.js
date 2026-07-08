// Get the information needed for the Office:
// from the Ordo, get:
// - the default day
// - the options for memoria
// - and the underlying ferial day if outranked
// Also provide today's date in a standardised readable format

function suffixMe(num) {
  // adds suffix to day number
  const j = num % 10,
    k = num % 100;
  // return respective suffix accordingly
  if (j == 1 && k != 11) {
    return `${num}st`;
  } else if (j == 2 && k != 12) {
    return `${num}nd`;
  } else if (j == 3 && k != 13) {
    return `${num}rd`;
  } else {
    return `${num}th`;
  }
}

function nthIndex(str, pat, n) {
  var L = str.length, i = -1;
  while (n-- && i++ < L) {
    i = str.indexOf(pat, i);
    if (i < 0) break;
  }
  return i;
}

function getLiturgicalDayOptions(theDate){
  var todaysRows = calendar[theDate];
  // The default celebration is the first row
  var todaysDefault = todaysRows[0];
  var todaysPriority = todaysDefault[calPriority];

  // Find the ferial (tty) day in the list - it may be the default, of course
  var todaysFerial = todaysDefault[2];
  // If its standardised name contains a '+' it's the TTY day
  if (!(todaysFerial.includes("+"))) {
    // If todays default isn't actually ferial, then find a ferial if one exists
    var todaysFerialRow = todaysRows.find((element) => element[calStatus] == "F");
    if(todaysFerialRow != undefined) {
      todaysFerial = todaysFerialRow[calStandardName];
    }
  }
  // List todays OMs 
  var todaysOMs = [];
  for (row of todaysRows) {
    if (row[calName] == todaysDefault[calName]) { continue };
    // Add Days of Prayer at top of list of options
    if (row[calType] == 'P') {
      todaysOMs.unshift([row[calName], "P"]);
    }
    else {
      // If appropriate, add OMs
      if (todaysPriority >= row[calPriority]) {
        todaysOMs.push([row[calName], row[calPriority], row[calType], false ,row[calStandardName]]);
      }
    }
  }
  // Set the ldOption so far
  var ldOptions = {
    Default: [todaysDefault[calName], todaysDefault[calPriority], todaysDefault[calType], false, todaysDefault[calStandardName]],
    Active:  [todaysDefault[calName], todaysDefault[calPriority], todaysDefault[calType], false, todaysDefault[calStandardName]],
    Eve:     ['', '', '', false, ''],
    OMs:     todaysOMs,
    ttyDay:  todaysFerial
  }
  // If we are after noon (ie not mattins), ascertain whether tomorrow has a Default outranking today and an EP1; setup Eve if it does
  if(ourOffice != 'm'){
    var tomorrow = dateOffset(theDate, 1);
    var tomorrowsRows = calendar[tomorrow];
    var tomorrowsDefault = tomorrowsRows[0];
    var tomorrowsPriority = tomorrowsDefault[calPriority];
    var tomorrowIsSunday = (getDay(tomorrow) == 0);
    var tomorrowOutranks = tomorrowsPriority < todaysPriority;
    if (tomorrowOutranks) {
      var tomorrowsStandardName = tomorrowsDefault[calStandardName];
      // Need to trim the '+e' suffix from Advent ember days to compare ranks
      if ((tomorrowsStandardName.substring(0, 7) == 'trinity') && (tomorrowsStandardName.slice(-2) == "+e")) {
        tomorrowsStandardName = tomorrowsStandardName.slice(0, -2);
      }
      var hasEP1 = (calReadings[tomorrowsStandardName][crEP1II] != '') || (calReadings[tomorrowsStandardName][crPPEv] != '');
      if (hasEP1 || tomorrowIsSunday) {
        // At this point an Eve exists
        ldOptions.Eve = [tomorrowsDefault[calName], tomorrowsDefault[calPriority], tomorrowsDefault[calType], true,tomorrowsDefault[calStandardName]];
      }
    }
  }
  console.log(ldOptions);
  return(ldOptions);
}

function showLiturgicalDay(option = '') {
  // Display the currectly selected (active) liturgical day
  // Display options for all other available days 
  // If an eve, display the eve at evensong 
  ldOptions = getLiturgicalDayOptions(ourDate);
  var output = "";
  // set Active to be the option selected
  // If nothing selected, then D  - or E isf eve exists and time setting applies
  if(option === ''){
    option = (ldOptions.Eve[3] && (ourTime >= (Number(settings.eve_time) + 12)))? 'E' : 'D';
  }

  // Option is set by click on a define d button, with poss returns E,D,number
  // If it's  number then it's in the OMs, if D then it's the defult, if 'E' then the Eve
  switch(option){
    case 'D': ldOptions.Active = [...ldOptions.Default]; break;
    case 'E': ldOptions.Active = [...ldOptions.Eve]; break;
    default:  ldOptions.Active = [...ldOptions.OMs[option]]; break;
  }
  // Build the display of day etc
  var dayName = ldOptions.Active[0];
  // If the 'eve' flag is set on the active day, show this
  var evePart = (ldOptions.Active[3]) ? "<span class='eve'>Eve of</span>&nbsp;" : "";
  // Elements to display (calendar) day and date 
  var dayOfWeek = fullDays[getDay(ourDate)];
  var dayOfMonth = getDom(ourDate, true);
  var suffixedDay = suffixMe(dayOfMonth);
  var thisMonth = monthNames[getMonth(ourDate) - 1];
  var dayAndDate = dayOfWeek + ": The " + suffixedDay + " day of the month";
  if (ordoYear != baseYear) {  //Show the month and year if we're in a  different year
    dayAndDate += " (" + thisMonth + " " + year + ")";
  }
  var optionsLine = "";
  //Do we have options? 
  // If the active is not the default, or there are inactive OMs (and no eve), or there is an inactive eve
  if (((ldOptions.Active[0] != ldOptions.Default[0]) || ((ldOptions.OMs.length > 0) && !eve)) || (ldOptions.Eve[3] && !ldOptions.Active[3])){
    optionsLine += "<table class='ldoption'><tr><td class='ldOr'>Or:</td>";
    var options = 0;
    // If default is not active, show a line for default
    if (ldOptions.Active[0] != ldOptions.Default[0]) {
      optionsLine += "<td class='ldoption'><span class='ldoption' onclick = 'changeLiturgicalDayOption();'>" + ldOptions.Default[0] + "</span></td>";
      options++;
    }
    // If Eve exists and is not active, show a line for Eve (compline and evensong only)
    if (ldOptions.Eve[3] && !ldOptions.Active[3]) {
      if(options>0) {optionsLine += "</tr><tr><td></td>";}
      optionsLine += "<td class='ldoption'><span class='ldoption' onclick = 'changeLiturgicalDayOption(\"E\");'>Eve of " + ldOptions.Eve[0] + "</span></td>";
      options++;
    }
    for (OMn in ldOptions.OMs) {
      if (OMn[0] != option) {
        if(options>0) {optionsLine += "</tr><tr><td></td>";}
        optionsLine += "<td class='ldoption'><span class='ldoption' onclick = 'changeLiturgicalDayOption(\"" + OMn[0] + "\");'>" + ldOptions.OMs[OMn][0] + "</span></td>";
        options++;
      }
    }
    optionsLine += "</tr></table>";
  }
  //Set the line to display the feast type if appropriate
  var typeLine = "";
  var feastType = ldOptions.Active[2].charAt(0);
  if ("FSOPML".includes(feastType)) {
    var ldDisplayType = calTypes[feastType];
    typeLine = "<p class='feasttype'>" + ldDisplayType + "</p>";
  }
  let correctedDayName = dayName.charAt(0) == '*' ? dayName.substring(1) : dayName;
  output += "<h1 class=\"mainTitle\">" + evePart + correctedDayName + "</h1>" + typeLine + "<p class=\"liturgicalDay\">" + dayAndDate + "</p>";
  output += optionsLine;
  document.getElementById("liturgicalDay").innerHTML = output;

  setupLiturgicalDay();
}

function changeLiturgicalDayOption(option = 'D') {
  showLiturgicalDay(option);
  doOffice();
}

function setupLiturgicalDay() {
  console.log(ldOptions)
  var properName = ldOptions.Active[0];
  var ttyDay = ldOptions.ttyDay;
  var isEve = ldOptions.Active[3];

  // Are we in Evening Prayer/Compline, and on an Eve?
  if ((['e', 'c'].includes(ourOffice)) && ldOptions.Active[3]) {
    properName = ldOptions.Eve[4];
    isEve = true;
  }

  // Special cases:
  switch(properName){
    case "The Epiphany of the Lord": properName = "epiphany+1"; break;
    case "The Nativity of the Lord": properName = "christmas+1"; break;
    case "Maundy Thursday": 
    case "Good Friday": 
    case "Holy Saturday": ttyDay = standardise(properName); break;
    case "The Ascension of the Lord": ttyDay = 'ascension'; break;
  }

  // The September Ember Days can fall in different weeks of Trinity.  Remove the 'e' flag from the ttyDay
  if ((ttyDay.substring(0, 7) == 'trinity') && (ttyDay.slice(-2) == "+e")) {
    ttyDay = ttyDay.slice(0, -2);
  }

console.log(properName,standardise(properName),ttyDay)

 // Set the 'through the year' day.  
  var ttyRow = calReadings[ttyDay];
 // Do we have a row coresponding to the (feast) day name?  If so set ldRow to that; otherwise to the same as ttyRow
  var ldRow = calReadings.hasOwnProperty(standardise(properName)) ? calReadings[standardise(properName)] : ttyRow;
  var ftype = ldOptions['Active'][2];

  console.log(ldRow,isEve,ftype);

  //Get readings, collect and psalms (where applicable) 
  var collectFrom = ""; var readingsFrom = "";
  var dayOfWeekName = days[getDay(ourDate)];

  //Get the readings
  //Do we have a feastname in calendar col 1? (Some special cases marked by * in char0)
  var haveFeast = (ttyRow != ldRow) && (properName.charAt(0) != "*");
  if (haveFeast) {
    //Does the feast have proper readings?
    readingsFrom = ldRow;
    // Check whether it has proper readings (actually only check for MP1, and exclude Sunday eves)
    if (readingsFrom[crMP1] == "" || (ftype == 's')) {
      //No proper readings so fall back to the 'through the year' day
      readingsFrom = ttyRow;
    }
    // Likewise with the collect
    collectFrom = ldRow;
    if (collectFrom[crCollect] == "") {
      //No proper collect so fall back to the 'through the year' day
      collectFrom = ttyRow;
    }
  }
  else {
    // No feast - Fall back to 'through the year' day'
    readingsFrom = ttyRow;
    collectFrom = ttyRow;
  }

  // If there's no collect for the day we need the previous Sunday from the tty day
  // UNLESS it's between Ascension and Easter 6, in which case we use the one for Ascension
  if (collectFrom === ttyRow) {
    var hasProperCollect = collectFrom[crCollect] ?? "";
    if (hasProperCollect == "") {
      if(ourDate > (dateOffset(easter, 39)) && ourDate < (dateOffset(easter, 42))){
        console.log ("Ascension exception triggered");
        collectFrom = calReadings["ascension"];
      }
      else {
        //Get the previous Sunday using the standarised title
        secondplus = nthIndex(ttyDay, "+", 2);
        collectFrom = calReadings[ttyDay.substring(0, secondplus)];
      }
    }
  }
  var season = ttyRow[16];
  /* Now derive the readng and psalm columns for different situatons.
  MP/EP; Eve/normal, Sunday year 1/2.  
      Sunday: MP1/MP2/EP1/EP2, if year 2 and MP2 not blank then MP1II/MP2II/EP1II/EP1II
      Eve: EP1II/EP2II
      Otherwise MP1/MP2, EP1/EP2
  */
  var firstReading = (ourOffice == 'm') ? crMP1 : crEP1;
  var secondReading = (ourOffice == 'm') ? crMP2 : crEP2;
  var properPsalms = (ourOffice == 'm') ? crPPMP : crPPEP
  if (!isEve && ftype == 's') {
    //Sunday and not an Eve - if the year number is 2, and MP1II is not blank, we need the 'II' versions, which are one on.
    if ((lessonsYear == 2) && (ldRow[crMP1II])!="") {
      firstReading++; secondReading++;
    }
  } else {
    if (isEve && (ftype != 's')) {
      // Eve (and not of a Sunday) - so use the II versions (calReading puts eve readings there); also look for proper psalms in PPEv
      firstReading++; secondReading++;
      properPsalms = crPPEv;
    }
  }

  ld = {
    Title: properName,
    FTitle: ttyDay,
    Type: ftype,
    Season: season,
    Collect: collectFrom[crCollect],
    Readings: [readingsFrom[firstReading], readingsFrom[secondReading]],
    Psalms: readingsFrom[properPsalms],
    Overrides: readingsFrom[crOverrides]
  }

  //Modifications for final week of Trinity
  //If we're within a week of next Advent 1, then the first readings are those of the corresponding weekday in the 26th week after Trinity (p63)
  if (diff_indays(ourDate, ctk) < 7 && diff_indays(ourDate, ctk) > 0) {
    //We need to get the readings for "trinity+26+<day>"
    let txxviday = "trinity+27+" + dayOfWeekName.slice(0, 3).toLowerCase();
    if (ourOffice=='m') {
      ld.Readings[0] = calReadings[txxviday][crMP1];
    } else {
      ld.Readings[0] = calReadings[txxviday][crEP1];
    }
  }

  if (ld.Title.charAt(0) == "*") { ld.Title = ld.Title.substring(1); }
}
