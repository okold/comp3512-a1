/*******************************************************************************
* ASSIGNMENT 1 - SINGLE-PAGE APP
* OLGA KOLDACHENKO - okold525@mtroyal.ca
* COMP 3512 - Winter 2021 - Randy Connolly
*/

// MAP SETUP
var map;
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 0, lng: 0},
        zoom: 1
  });
}

var bar_chart;
var summary_chart;
var line_chart;

let list_loaded = false;

document.addEventListener("DOMContentLoaded", (e) => {

    summary_chart = echarts.init(document.querySelector(`#summary_chart`));

    // CREDITS
    document.querySelector("header div").addEventListener("click", (e) => {
        let credit_info = document.querySelector("#credits");
        show_element(credit_info,"block");
        setTimeout(() => {hide_element(credit_info)}, 5000);
    })

    // FILTER BOX
    let filter_box = document.querySelector(`#target`);
    let li_array = [];          // used for sorting
    filter_box.value = null;    // clears the filter on refresh

    filter_box.addEventListener("change", (e) => {
        if (list_loaded) {
            filter_list(li_array, e.target.value);
        }
    });

    document.querySelector(`#clear`).addEventListener("click", (e) => {
        if (list_loaded) {
            filter_box.value = null;
            filter_list(li_array)
        }
    });

    // CHART BUTTONS
    document.querySelector(`#open_chart`).addEventListener("click", (e) => {
        hide_element(document.querySelector(`#default_view`));
        show_element(document.querySelector(`#chart_view`), "grid");
    });

    document.querySelector(`#close_chart`).addEventListener("click", (e) => {
        hide_element(document.querySelector(`#chart_view`));
        show_element(document.querySelector(`#default_view`), "grid");
    });

    // SPEECH SYNTHESIS
    document.querySelector(`#speech`).addEventListener("click", (e) => {
        if (!speechSynthesis.speaking) {
            let utterance = new SpeechSynthesisUtterance(document.querySelector(`#chart_desc p`).textContent);
            speechSynthesis.speak(utterance);
        }
    });

    // LIST OF COMPANIES
    let ul = document.querySelector(`#list ul`);
    populate_list = (company_list) => {
        let list_spinner = document.querySelector(`#list .load`);
        
        hide_element(ul);
        show_element(list_spinner, "block");

        let li_array = [];
        
        for (let company of company_list) {
            let li = document.createElement("li");
            li.textContent = company.name;

            li_array.push(li);
            ul.appendChild(li);

            // event listener for when you click on a list item
            li.addEventListener("click", (e) => {
                // updates the default view card
                document.querySelector(`#logo img`).src = `logos/${company.symbol}.svg`;
                for (let value of ["description", "symbol", "name", "sector", "subindustry", "address", "exchange"]) {
                    document.querySelector(`#${value}`).textContent = company[value];
                }
            
                let url = document.querySelector(`#url`);
                url.textContent = company.website;
                url.href = company.website;

                // sets the map
                map.setCenter({lat: company.latitude, lng: company.longitude});
                map.setZoom(6);

                hide_element(document.querySelector(`#welcome`));
                show_element(document.querySelector(`#desc`), "flex");
                show_element(document.querySelector(`#map`), "flex");

                // updates the chart view info
                document.querySelector(`#chart_desc h2`).textContent = `${company.name} - ${company.symbol}`;
                document.querySelector(`#chart_desc p`).textContent = `${company.description}`;
                update_financials(company);
                
            });

            // fetches and displays stock data
            li.addEventListener("click", (e) => {
                let stock_spinner = document.querySelector(`#stock_spinner`);
                let stock_error = document.querySelector(`#stock_error`);
                let stock_div = document.querySelector(`#stock_data`);

                hide_element(stock_error);
                hide_element(stock_div);
                show_element(stock_spinner, "flex");

                async function fetch_stock() {
                    try {
                        const response = await fetch(`https://www.randyconnolly.com/funwebdev/3rd/api/stocks/history.php?symbol=${company.symbol}`);
                        const data = await response.json();

                        let table = document.querySelector(`#stock_table tbody`);
                        let summary = process_stocks(table, data);

                        if (data.length > 0) {
                            update_summary(summary);
                            for (let value of ["date", "open", "close", "low", "high", "volume"]) {
                                add_sort_listener(value, table, data);
                            }
    
                            hide_element(stock_spinner);
                            show_element(stock_div, "flex");
                        }
                        else {
                            hide_element(stock_div);
                            hide_element(stock_spinner);
                            show_element(stock_error, "flex");
                            stock_error.textContent = "No stock data available!"
                        }
                    }
                    catch(error) {
                        console.log(error);
                        show_element(stock_error, "flex");
                        stock_error.textContent = "Error fetching stock data!"
                    }
                    
                }

                fetch_stock();
            });
            
        }
        
        hide_element(list_spinner);
        show_element(ul, "block");
        show_element(document.querySelector(`#search`), "flex");
        show_element(document.querySelector(`#list h2`), "block");
        return li_array;
    };

    // fetches the company list
    let company_list = localStorage.getItem("company_list");
    if (company_list) {
        company_list = JSON.parse(company_list);
        li_array = populate_list(company_list);
        list_loaded = true;
    }
    else {
        async function fetch_companies() {
            try {
                const response = await fetch("https://www.randyconnolly.com/funwebdev/3rd/api/stocks/companies.php");
                const data = await response.json();

                data.sort(mozilla_sort);
                li_array = populate_list(data);
                localStorage.setItem("company_list", JSON.stringify(data));
                list_loaded = true;
            }
            catch(error) {
                console.log(error);
            }
        }

        fetch_companies();
    }
});

/*******************************************************************************
* HELPER FUNCTIONS
*/
hide_element = (element) => element.style.display = "none";
show_element = (element, property) => element.style.display = property;
dollar = (num) => Intl.NumberFormat('en-us', {style: 'currency', currency: 'USD'}).format(num);


// filter_list
// takes an array of <li>s and displays/hides them based on the target
filter_list = (li_array, target) => {
    for (let li of li_array) {
        if (!target || li.textContent.toUpperCase().startsWith(target.toUpperCase())) {
            li.style.display = "block";
        }
        else {
            li.style.display = "none";
        }
    }
};

/*******************************************************************************
* DATA DISPLAY
*/

// process_stocks
// takes a <table> node, stock information fetched from the API, and a boolean 
// use sort = true if you want to not redraw the chart
// THIS IS A HORRIBLE FUNCTION. I NEED TO DECOUPLE THE CHART AND THE TABLE
process_stocks = (node, dataset, sort) => {
    node.textContent = "";
    let date_list = [];
    let close_list = [];
    let volume_list = [];

    // the table headers used in the summary
    params = ["open", "close", "low", "high", "volume"];

    // creates the base summary object
    let summary = {};
    for (let param of params) {
        summary[param] = {sum: 0, avg: 0, min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY};
    };

    for (let row of dataset) {
        // creates the <tr> and adds it to the <table>
        new_row = create_row(row);
        node.appendChild(new_row);

        //updates chart lists
        date_list.push(row.date);
        close_list.push(row.close);
        volume_list.push(row.volume);

        // updates the summary
        for (let param of params) {
            if (Number(summary[param].min) > Number(row[param])) {
                summary[param].min = row[param];
            }
            if (Number(summary[param].max) < Number(row[param])) {
                summary[param].max = row[param];
            }
            summary[param].sum += Number(row[param]);
        }
    }

    // averages each summary element
    for (let param of params) {
        summary[param].avg = summary[param].sum / dataset.length;
    }
    
    if (!sort) {
        update_line_chart(date_list, close_list, volume_list);
    }

    return summary;
};

// update_summary
// takes a summary object from process_stocks and updates the table and
// the candlestick chart
update_summary = (summary) => {

    let types = ["open", "close", "low", "high", "volume"];
    let subtypes = ["max", "min", "avg"];

    for (let type of types) {
        for (let subtype of subtypes) {
            if (summary) {
                let value = summary[type][subtype];

                if (type == "volume") {
                    value = Math.trunc(value);
                }
                else {
                    value = dollar(value);
                }
                
                document.querySelector(`#${type}_${subtype}`).textContent = value;
            }
            else {
                document.querySelector(`#${type}_${subtype}`).textContent = "";
            }
        }   
    }

    update_candlestick_chart(summary);
};

// create_row
// creates a row in the default view table
create_row = (stock_data) => {
    let new_row = document.createElement("tr");

    add_cell = (key, is_currency) => {
        let cell = document.createElement("td");
        if (is_currency) {
            cell.textContent = dollar(stock_data[key]);
        }
        else{
            cell.textContent = stock_data[key];
        }

        new_row.appendChild(cell);
    };

    add_cell("date");
    add_cell("open", true);
    add_cell("close", true);
    add_cell("low", true);
    add_cell("high", true);
    add_cell("volume");

    return new_row;
};

// add_sort_listener
// column - string: name of the column to sort by
// node - Node:     <table> to place the object into
// dataset:         stock information to sort 
add_sort_listener = (column, node, dataset) => {
    document.querySelector(`#${column}`).addEventListener("click", (e) => {
        if (column == "date") {
            dataset.sort(date_sort);
        }
        else {
            dataset.sort((a, b) => a[column] - b[column]);
        }
        process_stocks(node, dataset);
    });
};

// update_financials
// updates the financial table and chart in the chart view
update_financials = (company) => {
    let table = document.querySelector(`#financials table`);
    let tbody = document.querySelector(`#financials table tbody`);
    let error = document.querySelector(`#financials div`);

    tbody.textContent = "";
    if (company.financials) {
        hide_element(error);
        show_element(table, "table");

        for (let i = 0; i < company.financials.years.length; i++) {
            let new_row = document.createElement(`tr`);

            for (let col of ["years", "revenue", "earnings", "assets", "liabilities"]) {
                let new_cell = document.createElement(`td`);

                if (col == "years") {
                    new_cell.textContent = company.financials[col][i];
                }
                else {
                    new_cell.textContent = dollar(company.financials[col][i]);
                }
                
                new_row.appendChild(new_cell);
            }

            tbody.appendChild(new_row);
            update_bar_chart(company);
        }
    }
    else
    {
        show_element(error, "flex");
        hide_element(table);
        if (bar_chart) {
            bar_chart.destroy();
        }
    }
};

/*******************************************************************************
* CHART UPDATE FUNCTIONS
*/

// update_bar_chart
// updates the bar chart with the given company
update_bar_chart = (company) => {
    let chart = document.querySelector(`#fin_chart`);

    if (bar_chart) {
        bar_chart.destroy();
    }

    bar_chart = new Chart(chart, {
        type: "bar",
        data: {
            labels: company.financials.years,
            datasets: [{
                label: "Revenue",
                data: company.financials.revenue,
                backgroundColor: "rgb(79, 137, 245)"
            },{
                label: "Earnings",
                data: company.financials.earnings,
                backgroundColor: "rgb(79, 196, 64)"
            },{
                label: "Assets",
                data: company.financials.assets,
                backgroundColor: "rgb(250, 213, 93)"
            },{
                label: "Liabilities",
                data: company.financials.liabilities,
                backgroundColor: "rgb(230, 103, 103)"
            }
            ]
        },
        options: {
            responsive: true
        }
    });
}

// update_line_chart
// needs lists of dates, close values, and volume values, with corresponding
// indices
update_line_chart = (date_list, close_list, volume_list) => {
    let chart = document.querySelector(`#line_chart`);
    if (line_chart) {
        line_chart.destroy();
    }

    line_chart = new Chart(chart, {
        type: "line",
        data: {
            labels: date_list,
            datasets: [{
                label: "Close Value",
                data: close_list,
                borderColor: "rgb(79, 137, 245)",
                backgroundColor: "rgba(0, 0, 0, 0)",
                yAxisID: "Close"
            },{
                label: "Volume",
                data: volume_list,
                borderColor: "rgb(230, 103, 103)",
                backgroundColor: "rgba(0, 0, 0, 0)",
                yAxisID: "Volume"
            }]
        },
        options: {
            responsive: true,
            scales: {
                yAxes: [{
                    id: "Close",
                    type: "linear",
                    position: "left"
                },{
                    id: "Volume",
                    type: "linear",
                    position: "right"
                }]
            }
        }
    });
}

// update_candlestick_chart
// needs a summary object, created in process_stocks
update_candlestick_chart = (summary) => {
    let option = {
        xAxis: {
            data: ['Min', 'Max', 'Avg']
        },
        yAxis: {
            min: summary.low.min - 5
        },
        series: [{
            type: 'k',
            data: [
                [summary.open.min, summary.close.min, summary.low.min, summary.high.min],
                [summary.open.max, summary.close.max, summary.low.max, summary.high.max],
                [summary.open.avg, summary.close.avg, summary.low.avg, summary.high.avg],
            ]
        }]
    };

    summary_chart.setOption(option);
    summary_chart.resize();
}
/*******************************************************************************
* SORTING FUNCTIONS 
*/

// mozilla_sort
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
const mozilla_sort = function(a, b) {
    var nameA = a.name.toUpperCase(); // ignore upper and lowercase
    var nameB = b.name.toUpperCase(); // ignore upper and lowercase
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
  
    // names must be equal
    return 0;
};

// date_sort
// there's gotta be a better way
const date_sort = function(a, b) {
    var nameA = a.date;
    var nameB = b.date;
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    return 0;
};