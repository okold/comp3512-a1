// EVENTS
document.addEventListener("DOMContentLoaded", (doc_event) => {
    let list_div = document.querySelector(`#list ul`);
    let info_card = document.querySelector(`#card`);
    let logo_box = document.querySelector(`#logo`);
    let filter_box = document.querySelector(`#target`);

    let list_loaded = false;
    let company_selected = false;
    
    hide_element(list_div);
    hide_element(info_card);
    hide_element(logo_box);

    filter_box.value = null;

    // a function to populate the list in the sidebar
    // takes a list of Company objects and returns an array of li nodes
    populate_list = (company_list) => {
        let loader = document.querySelector(`#list .load`);

        hide_element(list_div);
        show_element(loader, "block");

        let li_array = [];
        
        for (let company of company_list) {
            let li = document.createElement("li");
            li.textContent = company.name;

            li_array.push(li);
            list_div.appendChild(li);

            // list item event: update info card
            li.addEventListener("click", (e) => {
                document.querySelector(`#logo img`).src = `logos/${company.symbol}.svg`;
                document.querySelector(`#description`).textContent = company.description;
                document.querySelector(`#symbol`).textContent = company.symbol;
                document.querySelector(`#name`).textContent = company.name;
                document.querySelector(`#sector`).textContent = company.sector;
                document.querySelector(`#subindustry`).textContent = company.subindustry;
                document.querySelector(`#address`).textContent = company.address;
                document.querySelector(`#exchange`).textContent = company.exchange;
            
                let url = document.querySelector(`#url`);
                url.textContent = company.website;
                url.href = company.website;

                if (!company_selected) {
                    show_element(info_card, "flex");
                    show_element(logo_box, "flex");
                    company_selected = true;
                }
            })
            
        }
        
        hide_element(loader);
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