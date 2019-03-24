/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
const coursesFields = ["audit", "avg", "dept", "fail", "id", "instructor", "pass", "title", "uuid", "year"];
const roomsFields = ["address", "fullname", "furniture", "href", "lat", "lon", "name", "number", "seats", "shortname", "type"];

CampusExplorer.buildQuery = function() {
    let query = {};
    // TODO: implement!
    console.log("CampusExplorer.buildQuery start.");
    let activeTab = document.getElementsByClassName("tab-panel active")[0];
    let insightKind = activeTab.getAttribute("data-type");
    console.log("activeTab: " + activeTab.toString() + ", insightKind:" + insightKind);

    let fields = [];
    if (insightKind === "courses") { fields = coursesFields; }
    else { fields = roomsFields; }

    function buildFilters() {
        let logic = activeTab.querySelector("input[checked]").id;
        if (logic.includes("all")) { logic = "AND"; }
        else if (logic.includes("any")) { logic = "OR"; }
        else { logic = "NONE"; }
        console.log("LOGIC COND: " + logic.toString());

        let controlFilters = activeTab.getElementsByClassName("control-group condition");
        let selectedFilters = [];
        for (let i = 0; i < controlFilters.length; i++) {
            let f = {};

            let isNot = controlFilters[i].getElementsByClassName("control not")[0].querySelector("input[checked]");
            let field = controlFilters[i].getElementsByClassName("control fields")[0].querySelector("option[selected]").value; // TODO
            let op = controlFilters[i].getElementsByClassName("control operators")[0].querySelector("option[selected]").value; // TODO
            let term = controlFilters[i].getElementsByClassName("control term")[0].querySelector("input").value; // TODO

            field = insightKind + "_" + field;
            let outer = {};
            let inner = {};
            if (op === "IS") { inner[field] = term; } // string field
            else { inner[field] = Number(term); } // math field
            outer[op] = inner;

            if (logic === "NONE") {
                if (isNot) { f = outer; } // TODO
                else { f["NOT"] = outer; }
            } else {
                if (isNot) { f["NOT"] = outer; }
                else { f = outer; }
            }
            selectedFilters.push(f);
        }
        if (selectedFilters.length === 0) { return {}; }
        else if (selectedFilters.length === 1) { return selectedFilters[0]; }
        else {
            let q = {};
            if (logic === "NONE") {
                q["AND"] = selectedFilters; // NONE OF THE FOLLOWING
            } else { q[logic] = selectedFilters; }
            return q;
        }
    }

    function buildColumns() {
        let controlCols = activeTab.getElementsByClassName("form-group columns")[0].getElementsByClassName("control field");
        let controlTrans = activeTab.getElementsByClassName("form-group columns")[0].getElementsByClassName("control transformation");
        let selectedCols = [];
        for (let i = 0; i < controlCols.length; i++) {
            let field = controlCols[i].querySelector("input[checked]");
            if (field) {
                field = insightKind + "_" + field.value;
                selectedCols.push(field);
            }
        }
        for (let i = 0; i < controlTrans.length; i++) {
            let transField = controlTrans[i].querySelector("input[checked]");
            if (transField) {
                selectedCols.push(transField.value);
            }
        }
        return selectedCols;
    }

    function buildOrder() {
        let isDescending = activeTab.getElementsByClassName("control descending")[0].querySelector("input[checked]");
        let oFields = activeTab.getElementsByClassName("control order fields")[0].querySelectorAll("option[selected]");
        if (oFields.length === 0) { return null; } // TODO CAN IT STILL BE DESCENDING WITHOUT COLUMNS?

        let order = {};
        let selectedOrders = [];
        for (let i = 0; i < oFields.length; i++) {
            if (oFields[i].class === undefined) {
                let f = insightKind + "_" + oFields[i].value;
                selectedOrders.push(f);
            } else {
                selectedOrders.push(oFields[i].value);
            }
        }
        if (oFields.length > 1 || isDescending) { // can have dir and keys when using old order syntax
            order["dir"] = (isDescending) ? "DOWN" : "UP"; // TODO
            order["keys"] = selectedOrders;
        } else { order = selectedOrders[0]; }
        return order;
    }

    function buildGroups() {
        let controlGroups = activeTab.getElementsByClassName("form-group groups")[0];
        let controlFields = controlGroups.querySelectorAll("input[checked]"); // TODO
        let selectedGroups = [];
        for (let i = 0; i < controlFields.length; i++) { //changed controlGroups -> controlFields
                let field = insightKind + "_" + controlFields[i].value;
                // let controlField = controlFields[i].querySelector("data-key");
                // let field = insightKind + "_" + controlField;
                selectedGroups.push(field);
        }
        return selectedGroups;
    }

    function buildApply() {
        let controlApply = activeTab.getElementsByClassName("control-group transformation");
        let apply = [];
        for (let i = 0; i < controlApply.length; i++) {
            let term = controlApply[i].querySelectorAll("input")[0].value; // TODO
            let fn = controlApply[i].querySelectorAll("option[selected]")[0].value; // TODO
            let field = controlApply[i].querySelectorAll("option[selected]")[1].value; // TODO

            field = insightKind + "_" + field;
            let q = {};
            q[term] = {};
            q[term][fn] = field;
            apply.push(q);
        }
        return apply;
    }

    ///////////////////
    query["WHERE"] = buildFilters();
    query["OPTIONS"] = {};
    query.OPTIONS["COLUMNS"] = buildColumns();

    let ord = buildOrder();
    if (ord) { query.OPTIONS["ORDER"] = ord; }

    let g = buildGroups();
    if (g.length > 0) {
        query["TRANSFORMATIONS"] = {};
        query["TRANSFORMATIONS"]["GROUP"] = g;
        query["TRANSFORMATIONS"]["APPLY"] = buildApply();
    }

    console.log("built query: " + JSON.stringify(query));
    return query;
};

