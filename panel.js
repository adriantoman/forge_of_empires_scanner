$(function() {
    var localStorage;
    // The "Block sites from setting any data" option prevents the extension
    // from accessing the localStorage. Any attempt to access window.localStorage
    // will raise a security exception.
    try {
        localStorage = window.localStorage;
    }
    catch (e) {
        localStorage = {};
    }

    function resizeLeftPanel(width) {
        $('#request-list').width(width);
        $('.split-view-resizer').css('left', width);
    }

    resizeLeftPanel(localStorage.sidePanelWidth || 200);

    function resizerDragMove(event) {
        resizeLeftPanel(event.pageX);
        event.preventDefault();
    }

    function resizerDragEnd(event) {
        resizeLeftPanel(event.pageX);
        localStorage.sidePanelWidth = event.pageX + 'px';

        $(document).off('mousemove', resizerDragMove);
        $(document).off('mouseup', resizerDragEnd);
    }

    $('.split-view-resizer').on('mousedown', function() {
        $(document).on('mousemove', resizerDragMove);
        $(document).on('mouseup', resizerDragEnd);
    });
});

function buildRequestEl(value) {
    return $('<div class="request"></div>').text(value)
}

function buildRequestEl2(value) {
    return $('<div class="request"></div>').text(value)
}

function findDistance(dayOfWeekA,dayOfWeekB){
    counter = 0
    while(dayOfWeekA != dayOfWeekB){
        dayOfWeekB = dayOfWeekB - 1;
        if (dayOfWeekB < 0){
            dayOfWeekB = 6
        }
        counter++;
    }
    return counter
}


function parseDate(date){
    // Lets start
    // Possible formats
    // dnes v 14:58
    // včera v 14:58
    // Ponděli v 14:58
    // dne 19.12.16 v 14:58 hod

    var weekday = ["Neděle","Pondělí","Úterý","Středa","Čtvrtek","Pátek","Sobota"]
    var today = new Date();
    identificator = date.split(/\s+/)[0];
    if (identificator == "dnes"){
        time = date.split(/\s+/)[2];
        hours = time.split(":")[0]
        minutes = time.split(":")[1]
        today.setMinutes(minutes)
        today.setHours(hours)
        today.setSeconds(0)
        return today
    }
    else if (identificator == "včera") {
        time = date.split(/\s+/)[2];
        hours = time.split(":")[0]
        minutes = time.split(":")[1]
        today.setMinutes(minutes)
        today.setHours(hours)
        today.setSeconds(0)
        today.setDate(-1)
        return today
    }else if (weekday.indexOf(identificator) > -1){
        dayIndex = weekday.indexOf(identificator);
        var currentDay = today.getDay();
        var distance = findDistance(dayIndex,currentDay)
        time = date.split(/\s+/)[2];
        hours = time.split(":")[0]
        minutes = time.split(":")[1]
        if (distance == 0) {
            if (hours < today.getHours){
                distance = 7
            }
            if (hours == today.getHours && minutes < today.getMinutes){
                distance = 7
            }
        }
        today.setDate(today.getDate() - distance);
        today.setMinutes(minutes)
        today.setHours(hours)
        today.setSeconds(0)
        return today
    } else{
        date_detail = date.split(/\s+/)[1]
        time = date.split(/\s+/)[3]
        console.log(date_detail.split("."))
        today.setMonth(date_detail.split(".")[1] - 1,date_detail.split(".")[0])
        today.setYear("20" + date_detail.split(".")[2])
        today.setMinutes(time.split(":")[1])
        today.setHours(time.split(":")[0])
        return today
    }

}

function exportToCsv(filename, rows) {
    var processRow = function (row) {
        var finalVal = '';
        for (var j = 0; j < row.length; j++) {
            var innerValue = row[j] === null ? '' : row[j].toString();
            if (row[j] instanceof Date) {
                innerValue = row[j].toLocaleString();
            };
            var result = innerValue.replace(/"/g, '""');
            if (result.search(/("|,|\n)/g) >= 0)
                result = '"' + result + '"';
            if (j > 0)
                finalVal += ',';
            finalVal += result;
        }
        return finalVal + '\n';
    };

    var csvFile = '';
    for (var i = 0; i < rows.length; i++) {
        csvFile += processRow(rows[i]);
    }

    var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

console.log([['name','description'],
    ['david','123'],
    ['jona','""'],
    ['a','b']])

//exportToCsv('export.csv', [
//    ['name','description'],
//    ['david','123'],
//    ['jona','""'],
//    ['a','b'],
//
//])


chrome.devtools.network.onRequestFinished.addListener(function(request) {
    var parser = document.createElement('a');
    var output = []
    parser.href = request.request.url;

    if (/forgeofempires\.com/g.test(parser.hostname)){
        $('#request-list').append(buildRequestEl(parser.hostname));
        request.getContent(function(body) {
            parsed = JSON.parse(body);
            parsed.forEach(function(body_element){
                if (body_element["requestMethod"] == 'getTreasuryLogs'){
                    body_element["responseData"]["logs"].forEach(function(element) {
                        line = [element["amount"],element["player"]["player_id"],parseDate(element["createdAt"]),element["resource"]]
                        console.log(line)
                        output.push(line);
                    });
                }
            })

            //console.log(body)

        });
    }
    console.log(output)
    exportToCsv('export.csv',output)
    //if(parser.hostname.split('.')[1] == "pubnub") {
    //      if (/^([a-z0-9]{5,})$/.test(parser.hostname)){
    //
    //
    //      }
    ////    params = parser.pathname.split('/');
    ////
    ////    if(params[1] == "publish") {
    ////        channel = params[5];
    ////        message = params[7];
    ////    }
    ////
    //}
});


