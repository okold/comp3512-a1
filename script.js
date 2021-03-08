// MAP SETUP
var map;
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 0, lng: 0},
        zoom: 1
  });
}

let list_loaded = false;
let company_selected = false;

document.addEventListener("DOMContentLoaded", (e) => {

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
                document.querySelector(`#logo img`).src = `logos/${company.symbol}.svg`;
                for (let value of ["description", "symbol", "name", "sector", "subindustry", "address", "exchange"]) {
                    document.querySelector(`#${value}`).textContent = company[value];
                }
            
                let url = document.querySelector(`#url`);
                url.textContent = company.website;
                url.href = company.website;

                map.setCenter({lat: company.latitude, lng: company.longitude});
                map.setZoom(6);

                if (!company_selected) {
                    hide_element(document.querySelector(`#welcome`));
                    show_element(document.querySelector(`#desc`), "flex");
                    show_element(document.querySelector(`#map`), "flex");
                    company_selected = true;
                }
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
                        let summary = create_stock_table(table, data);

                        if (data.length > 0) {
                            create_summary_table(summary);
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

    // FETCHES THE COMPANY LIST
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

// HELPER FUNCTIONS
hide_element = (element) => element.style.display = "none";
show_element = (element, property) => element.style.display = property;
dollar = (number) => `$${Number(number).toFixed(2)}`;


// filter_list
// takes an array of lis and displays/hides them based on the target
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

// create_stock_table
// takes a <table> node and stock information fetched from the API
create_stock_table = (node, dataset) => {
    node.textContent = "";

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
    
    return summary;
};

// create_summary_table
// takes a summary object from create_stock_table
create_summary_table = (summary) => {

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
        create_stock_table(node, dataset);
    });
};

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

// sort function from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
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

// sort function from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
const date_sort = function(a, b) {
    var nameA = a.date;
    var nameB = b.date;
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
  
    // names must be equal
    return 0;
  };