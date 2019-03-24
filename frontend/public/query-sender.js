/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = function(query) {
    return new Promise(function(fulfill, reject) {
        console.log("CampusExplorer.sendQuery start.");
        const xhttp =  new XMLHttpRequest();
        xhttp.open("POST", "/query", true);
        xhttp.setRequestHeader("Content-Type", "application/JSON");
        xhttp.onload = function() {
            let r = JSON.parse(xhttp.responseText);
            // console.log("xhhtp.STATUS IN QS: " + xhttp.status);
            if (xhttp.status === 200) {
                fulfill(r);}
            else { reject(r); }
        };
        xhttp.onerror = function() { reject("Failed request."); };
        xhttp.send(JSON.stringify(query));
    });
};
