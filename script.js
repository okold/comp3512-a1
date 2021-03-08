// MAP SETUP
var map;
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 0, lng: 0},
        zoom: 1
  });
}

// LIST EVENTS
document.addEventListener("DOMContentLoaded", (e) => {
    let list_div = document.querySelector(`#list ul`);
    let info_card = document.querySelector(`#card`);
    let logo_box = document.querySelector(`#logo`);
    let filter_box = document.querySelector(`#target`);

    let list_loaded = false;
    let company_selected = false;
    
    hide_element(list_div);


    filter_box.value = null;

    // CREDITS
    let credit_button = document.querySelector("header div");
    let credit_visible = false;

    credit_button.addEventListener("click", (e) => {
        let credit_info = document.querySelector("#credits");
        if (!credit_visible) {
            show_element(credit_info,"block");
            credit_visible = true;
        }
        else {
            hide_element(credit_info)
            credit_visible = false;
        }
    })

    // a function to populate the list in the sidebar
    // takes a list of Company objects and returns an array of li nodes
    populate_list = (company_list) => {
        let list_spinner = document.querySelector(`#list .load`);
        
        hide_element(list_div);
        show_element(list_spinner, "block");

        let li_array = [];
        
        for (let company of company_list) {
            let li = document.createElement("li");
            li.textContent = company.name;

            li_array.push(li);
            list_div.appendChild(li);

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
                    show_element(info_card, "flex");
                    show_element(logo_box, "flex");
                    show_element(document.querySelector(`#desc`), "flex");
                    show_element(document.querySelector(`#map`), "flex");
                    company_selected = true;
                }
            });

            // fetches and displays stock data
            li.addEventListener("click", (e) => {
                let stock_spinner = document.querySelector(`#stock_spinner`);
                let stock_div = document.querySelector(`#stock_data`);

                hide_element(stock_div);
                show_element(stock_spinner, "flex");

                let data_promise = fetch(`https://www.randyconnolly.com/funwebdev/3rd/api/stocks/history.php?symbol=${company.symbol}`);
                let stock_data = data_promise.then ((response) => {
                    return response.json();
                });
                stock_data.then ((fetched_data) => {
                    let table = document.querySelector(`#stock_table tbody`);
                    let summary = create_stock_table(table, fetched_data);
                    create_summary_table(summary);

                    for (let value of ["date", "open", "close", "low", "high", "volume"]) {
                        add_sort_listener(value, table, fetched_data);
                    }
                    hide_element(stock_spinner);
                    show_element(stock_div, "flex");
                });


            });
            
        }
        
        hide_element(list_spinner);
        show_element(list_div, "block");
        return li_array;
    };

    // grabs the company list
    let company_list = localStorage.getItem("company_list");
    let li_array = [];

    if (company_list) {
        company_list = JSON.parse(company_list);
        li_array = populate_list(company_list);
        list_loaded = true;
    }
    else {
        let list_promise = fetch("https://www.randyconnolly.com/funwebdev/3rd/api/stocks/companies.php");
        let list_data = list_promise.then ((response) => {
            return response.json();
        });
        list_data.then ((fetched_list) => {
            company_list = fetched_list;
            company_list.sort(mozilla_sort);
            li_array = populate_list(company_list);
            localStorage.setItem("company_list", JSON.stringify(company_list));
            list_loaded = true;
        });
    }
    
    // filter box events
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



});

// HELPER FUNCTIONS
hide_element = (element) => element.style.display = "none";
show_element = (element, property) => element.style.display = property;
dollar = (number) => `$${Number(number).toFixed(2)}`;

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
            let value = summary[type][subtype];

            if (type == "volume") {
                value = Math.trunc(value);
            }
            else {
                value = dollar(value);
            }
    
            document.querySelector(`#${type}_${subtype}`).textContent = value;
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