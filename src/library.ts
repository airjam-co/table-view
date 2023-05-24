import Chart from 'chart.js/auto';
import { ChartType } from "chart.js";
import { dataField, tableViewResponse, DataSourceFieldType, PaginationStyle, ViewType, template_cache, style_cache, PageTypes, TemplateProperty } from "@airjam/types";
import {Loader, LoaderOptions} from "google-maps";

const SERVING_DATA_URL: string = "https://airjam.co/s/data?id=";
//const SERVING_DATA_URL: string = "http://localhost:3001/s/data?id=";
const PAGINATION_SHOW_SIZE: number = 7;
let currentPage: {[id: string]: number} = {}; // global variable that keeps track of current page.
let refreshInterval: number = 0; // 0 disables refreshes

export default function fetchAndRenderData() {
  if (window && window.document) {
    const tableViews = document.querySelectorAll('[display="airjam-tableview"]');
    tableViews.forEach(view => {
      if (!view.getAttribute("id")) {
        view.innerHTML = "Please set id attribute to a valid table view id.";
        return;
      }
      const viewId = view.getAttribute("id")!;
      const page: number = 1;
      currentPage[viewId] = 1;
      fetch(SERVING_DATA_URL + viewId + "&page=" + page).then(result => {
        result.json().then((fetchedData: tableViewResponse) => {
          const template = getTemplate(fetchedData);
          const style = getStyle(fetchedData);
          if (style) {
            // todo -- choose a first style if style is not chosen for the user.
            if (style && style.containerClassNames && Array.isArray(style.containerClassNames)) view.className += " " + style.containerClassNames.join(" ");
            const styleElement = document.createElement('style');
            styleElement.appendChild(window.document.createTextNode(style.style));
            window.document.head.appendChild(styleElement);
          }
          if (fetchedData.templateProperties && fetchedData.templateProperties.refreshInterval) {
            refreshInterval = Number(fetchedData.templateProperties.refreshInterval) * 1000; // convert seconds to milliseconds
          }
          if (refreshInterval > 0) infiniteRefresh(viewId, view, page);
          
          const viewType = ViewType[fetchedData.type.valueOf() as keyof typeof ViewType];
          switch(viewType) {
            case ViewType.Graph:
              renderGraphToView(viewId, view, fetchedData, template, style);
              break;
            case ViewType.Table:
              renderTableToView(viewId, view, fetchedData, template, style);
              break;
            case ViewType.List:
            case ViewType.Gallery:
              renderCollectionToView(viewId, view, fetchedData, template, style);
              break;
            case ViewType.Map:
              renderMapToView(viewId, view, fetchedData, template, style);
            default:
              // not yet implemented
          }
          loadAndEvaluateScript(viewId, view, fetchedData, template, style);
        });
      });
    });
  }
}

function fetchAndRerenderData(viewId: string, view: Element, page: number = 1) {
  if (window && window.document) {
    currentPage[viewId] = page;
    fetch(SERVING_DATA_URL + viewId + "&page=" + page).then(result => {
      result.json().then((fetchedData: tableViewResponse) => {
        const template = getTemplate(fetchedData);
        const style = getStyle(fetchedData);
        view.innerHTML = ""; // clear out just the content and reload
        const viewType = ViewType[fetchedData.type.valueOf() as keyof typeof ViewType];
        if (fetchedData.templateProperties && fetchedData.templateProperties.refreshInterval) {
          refreshInterval = Number(fetchedData.templateProperties.refreshInterval) * 1000; // convert seconds to milliseconds
        }
        switch(viewType) {
          case ViewType.Graph:
            renderGraphToView(viewId, view, fetchedData, template, style);
            break;
          case ViewType.Table:
            renderTableToView(viewId, view, fetchedData, template, style);
            break;
          case ViewType.List:
          case ViewType.Gallery:
            renderCollectionToView(viewId, view, fetchedData, template, style);
            break;
          case ViewType.Map:
            renderMapToView(viewId, view, fetchedData, template, style);
          default:
            // not yet implemented
        }
      });
    });
  }
}

function infiniteRefresh(viewId: string, view: Element, page: number = 1) {
  setTimeout(() => {
    console.log("repeating");
    fetchAndRerenderData(viewId, view, page);
    if (refreshInterval > 0) infiniteRefresh(viewId, view, page);
  }, refreshInterval);
}

function renderMapToView(viewId: string, view: Element, fetchedData: tableViewResponse, template: any, style: any) {
  if (!template.templateFields || !fetchedData.templateFields) {
    console.log(viewId + " will not be rendered because it does not have required template attributes.");
    return;
  }

  // make the control section. do not add things directly to the controlElement, instead, create a wrapper div on top of control element to add things to the control pane
  const controlElement = window.document.createElement("div");
  controlElement.className = "map-control";
  view.appendChild(controlElement);

  // make the map section
  const options: LoaderOptions = {/* todo */};
  const loader = new Loader("AIzaSyA8xMW1giwvraqrUpM7bLQeURGjr5VUrBw", options);
  loader.load().then(function (google) {
    const mapElement = window.document.createElement("div");
    mapElement.className = "map-container";
    view.appendChild(mapElement);
    if (fetchedData.paginationStyle === PaginationStyle.Paged) {
      renderPagination(viewId, view, fetchedData);
    }
    const map = new google.maps.Map(mapElement, {
        zoom: 9,
        zoomControl: false,
        panControl: false,
        scaleControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: style.jsonContent ? style.jsonContent : []
    });

    const geocoder = new google.maps.Geocoder();

    // three associative maps below are used to associate between markers and their info windows and their container items
    let markers: {[index: number]: google.maps.Marker} = {};
    let infoWindows: {[index: number]: google.maps.InfoWindow} = {};
    let containerElements: {[index: number]: HTMLDivElement | string} = {};

    if (fetchedData.templateFields["location"]) {
      const locationField = fetchedData.templateFields["location"];
      fetchedData.data.forEach((currentDataRow: {[id: string]: dataField}, index: number) => {
        if (index === 0) {
          return;
        }
        if (currentDataRow[locationField]) {
          let locationData = currentDataRow[locationField];
          if (locationData.display_as === DataSourceFieldType.Address) {
            // geocode then add to map
            // random waiting added because google geocode rate limits
            setTimeout( () => {
              geocoder.geocode({address: locationData.raw_value}, function(results, status) {
                if (status === 'OK') {
                  map.setCenter(results[0].geometry.location);

                  const templateMap: {[id: string]: string} = {};
                  Object.keys(template.templateFields).forEach((field: string) => {
                    if (fetchedData.templateFields[field] && currentDataRow[fetchedData.templateFields[field]]) {
                      templateMap[field] = currentDataRow[fetchedData.templateFields[field]].raw_value;
                    }
                  });
                  const entryElement = window.document.createElement("div");
                  entryElement.className = "map-control-entry";
                  entryElement.id = viewId + ".map.entry." + index;

                  let containerPageContent = template.pageContent[PageTypes.LIST];
                  containerPageContent = containerPageContent.replaceAll( "{{index}}", index);
                  Object.entries(templateMap).forEach((entry: any[]) => {
                    const key = entry[0];
                    const value = entry[1];
                    containerPageContent = containerPageContent.replaceAll( "{{" + key + "}}", value);
                  });
                  entryElement.innerHTML += containerPageContent;
                  containerElements[index] = entryElement;
                  populateContainerElementsIfFull(fetchedData.data.length - 1, controlElement, containerElements);

                  let markerPageContent = template.pageContent[PageTypes.MARKER];
                  markerPageContent = markerPageContent.replaceAll( "{{index}}", index);
                  Object.entries(templateMap).forEach((entry: any[]) => {
                    const key = entry[0];
                    const value = entry[1];
                    markerPageContent = markerPageContent.replaceAll( "{{" + key + "}}", value);
                  });

                  // set up info window
                  const infoWindow = new google.maps.InfoWindow({
                    content: markerPageContent,
                  });
                  infoWindows[index] = infoWindow;

                  let marker = new google.maps.Marker({
                    map: map,
                    position: results[0].geometry.location,
                    label: index.toString()
                  });
                  markers[index] = marker;

                  entryElement.addEventListener("mouseover", e => {
                    map.panTo(results[0].geometry.location);
                    closeInfoWindows(infoWindows);
                    if (infoWindows[index]) infoWindows[index].open(map, marker);
                  });
                  marker.addListener("click", () => {
                    closeInfoWindows(infoWindows);
                    infoWindow.open(map, marker);
                    let topPos = entryElement.offsetTop;
                    controlElement.scrollTop = topPos;
                  });
                  updateMapBoundToFit(map, markers);
                } else {
                  console.log("geocode was unsuccessful:" + status);
                  containerElements[index] = "failed";
                }
              });
            }, Math.floor(Math.random() * 100));
          } else {
            console.log("will not display this row: ");
            console.log(currentDataRow);
            containerElements[index] = "failed";
          }
        } else {
          containerElements[index] = "failed";
        }
      });
    }
  });
}

// Warning: This is a destructive rendering function for the containerElement.
function populateContainerElementsIfFull(fullCount: number, containerElement: HTMLDivElement, containerElements: {[index: number]: HTMLDivElement | string}) {
  if (Object.keys(containerElements).length !== fullCount) {
    return;
  }
  containerElement.innerHTML = ""; //remove all child node and clear container for new elements.
  Object.keys(containerElements).map((sKey) => parseInt(sKey)).sort((a,b)=> a - b).forEach((key) => {
    if ((typeof containerElements[key]) !== (typeof "")) {
      containerElement.appendChild(containerElements[key] as HTMLDivElement);
    } else {
      console.log(key + " is not renderable");
      console.log(typeof containerElements[key]);
      console.log(containerElements[key]);
    }
  });
}

function updateMapBoundToFit(map: google.maps.Map, markerMap: {[index: number]: google.maps.Marker}) {
    let bounds = new google.maps.LatLngBounds();
    const markers = Object.values(markerMap);
    for (var i = 0; i < markers.length; i++) {
      if (markers[i].getPosition())  bounds.extend(markers[i].getPosition()!);
    }
    map.fitBounds(bounds);
}

function closeInfoWindows(infoWindows: {[index: number]: google.maps.InfoWindow}) {
  Object.values(infoWindows).forEach((infoWindow) => { infoWindow.close(); });
}

function loadAndEvaluateScript(viewId: string, view: Element, fetchedData: tableViewResponse, template: any, style: any) {
  console.log("Checking scripts");
  if (template.pageContent[PageTypes.SCRIPT]) {
    let scriptContent = template.pageContent[PageTypes.SCRIPT];
    const propertiesMap: {[id: string]: TemplateProperty} = {};
    Object.keys(fetchedData.templateProperties).forEach((property: any) => { propertiesMap[property] = fetchedData.templateProperties[property]; });
    Object.keys(propertiesMap).forEach((key: string) => {
      const value = propertiesMap[key];
      scriptContent = scriptContent.replaceAll( "{{" + key + "}}", value);
    });
    var newScript = window.document.createElement("script");
    newScript.innerHTML = scriptContent;
    view.appendChild(newScript);
    eval(scriptContent);
  }
}

function renderCollectionToView(viewId: string, view: Element, fetchedData: tableViewResponse, template: any, style: any) {
  if (!template.templateFields || !template.pageContent || !fetchedData.templateFields) {
    console.log(viewId + " will not be rendered because it does not have required template attributes.");
    return;
  }
  // ignore the first row in data, since it is assumed to be a label row
  console.log(fetchedData);
  if (template.pageContent[PageTypes.LIST]) {
    view.innerHTML += renderList(fetchedData, template);
    if (fetchedData.paginationStyle === PaginationStyle.Paged) {
      renderPagination(viewId, view, fetchedData);
    }
  } else if (template.pageContent[PageTypes.LANDING]) {
    view.innerHTML += renderLanding(fetchedData, template);
  }
}

function renderList(fetchedData: tableViewResponse, template: any): string {
  let returning = "";
  for (let i = 1; i < fetchedData.data.length; i++) {
    const currentRow = fetchedData.data[i];
    console.log(currentRow);
    const templateMap: {[id: string]: string} = {};
    Object.keys(template.templateFields).forEach((field: string) => {
      if (fetchedData.templateFields[field] && currentRow[fetchedData.templateFields[field]]) {
        templateMap[field] = currentRow[fetchedData.templateFields[field]].raw_value;
      }
    });

    let pageContent = template.pageContent[PageTypes.LIST];
    Object.entries(templateMap).forEach((entry: any[]) => {
      const key = entry[0];
      const value = entry[1];
      pageContent = pageContent.replaceAll( "{{" + key + "}}", value); // todo templating engine will allow pass by map
    });
    returning += pageContent;
  }
  return returning;
}

function renderLanding(fetchedData: tableViewResponse, template: any): string {
  const renderedItems: {[category: string]: string} = {};
  let groupingField = "";
  // make a component property map.
  const propertiesMap: {[id: string]: TemplateProperty} = {};
  Object.keys(fetchedData.templateProperties).forEach((property: any) => { propertiesMap[property] = fetchedData.templateProperties[property]; });

  if (template.pageContent[PageTypes.ITEM]) {
    // use the groupingField to subgroup into categories, create an array of categories
    if (template.componentProperties && template.componentProperties["groupingField"] && fetchedData.templateFields[template.componentProperties["groupingField"]]) {
      groupingField = fetchedData.templateFields[template.componentProperties["groupingField"]];
    }
  }
  let displaySoldOut: boolean = true;
  if (fetchedData.templateProperties && fetchedData.templateProperties.displaySoldOut !== undefined) {
    displaySoldOut = fetchedData.templateProperties.displaySoldOut;
  }

  let featuredCount = (template.properties && template.properties.featuredCount && template.properties.featuredCount.default) ? Number(template.properties.featuredCount.default) : fetchedData.data.length - 1;
  if (fetchedData.templateProperties.featuredCount) {
    featuredCount = Number(fetchedData.templateProperties.featuredCount);
  }
  featuredCount = Math.min(fetchedData.data.length - 1, featuredCount); // minimum between the available data or inferred preference.

  let fieldNames: {[field: string]: string} = {};
  Object.keys(template.templateFields).forEach((field: string) => {
    // assumes the top row is for labels
    if (fetchedData.templateFields[field] && fetchedData.data[0] && fetchedData.data[0][fetchedData.templateFields[field]]) {
      fieldNames[field.toLowerCase()] = fetchedData.data[0][fetchedData.templateFields[field]].raw_value;
    }
  });

  let index = 1;
  for (let i = 1; (index <= featuredCount) && (i < fetchedData.data.length); i++) {
    const currentRow = fetchedData.data[i];
    const templateMap: {[id: string]: string} = {};
    let category = "";
    if (currentRow[groupingField]) category = currentRow[groupingField].raw_value;
    Object.keys(template.templateFields).forEach((field: string) => {
      if (fetchedData.templateFields[field] && currentRow[fetchedData.templateFields[field]]) {
        templateMap[field] = currentRow[fetchedData.templateFields[field]].raw_value;
      }
    });
    if (!displaySoldOut) {
      if (fetchedData.templateFields["soldOut"] && currentRow[fetchedData.templateFields["soldOut"]]) {
        const soldOut = currentRow[fetchedData.templateFields["soldOut"]].raw_value.toLowerCase() === "true";
        if (soldOut) continue;
      }
    }

    let pageContent = template.pageContent[PageTypes.LANDING];
    if (template.pageContent[PageTypes.DETAIL]) pageContent = template.pageContent[PageTypes.DETAIL];
    if (template.pageContent[PageTypes.ITEM]) pageContent = template.pageContent[PageTypes.ITEM];
    Object.entries(templateMap).forEach((entry: any[]) => {
      const key = entry[0];
      const value = entry[1];
      pageContent = pageContent.replaceAll( "{{" + key + "}}", value); // todo templating engine will allow pass by map
      if (fieldNames[key.toLowerCase()]) {
        pageContent = pageContent.replaceAll( "{{" + key + "-title}}", fieldNames[key.toLowerCase()]);
      }
    });
    if (propertiesMap) {
      Object.keys(propertiesMap).forEach((key: string) => {
        const value = propertiesMap[key];
        pageContent = pageContent.replaceAll( "{{" + key + "}}", value);
      });
    }
    pageContent = pageContent.replaceAll( "{{index}}", index);
    pageContent = pageContent.replaceAll( "{{itemCount}}", featuredCount);
    // console.log(pageContent);
    if (!renderedItems[category]) {
      renderedItems[category] = "";
    }
    renderedItems[category] += pageContent;
    index++;
  }
  console.log(renderedItems);
  if (template.pageContent[PageTypes.ITEM]) {
    let detailPages: string = "";
    Object.keys(renderedItems).forEach((category: string, index: number) => {
      const items = renderedItems[category];
      let pageContent = template.pageContent[PageTypes.DETAIL];
      if (propertiesMap) {
        Object.keys(propertiesMap).forEach((key: string) => {
          const value = propertiesMap[key];
          pageContent = pageContent.replaceAll( "{{" + key + "}}", value);
        });
      }
      pageContent = pageContent.replaceAll( "{{index}}", index);
      pageContent = pageContent.replaceAll( "{{category}}" , category);
      pageContent = pageContent.replaceAll( "[[ITEM]]" , items);
      detailPages += pageContent;
    });

    let landingContent = template.pageContent[PageTypes.LANDING];
    Object.keys(propertiesMap).forEach((key: string) => {
      const value = propertiesMap[key];
      landingContent = landingContent.replaceAll( "{{" + key + "}}", value);
    });
    landingContent = landingContent.replaceAll( "[[DETAIL]]" , detailPages);
    return landingContent;
  } else if (template.pageContent[PageTypes.DETAIL]) {
    let landingContent = template.pageContent[PageTypes.LANDING];
    let detailPages: string = "";
    Object.keys(renderedItems).forEach((itemKey: string) => {
      detailPages += renderedItems[itemKey];
    });
    if (propertiesMap) {
      Object.keys(propertiesMap).forEach((key: string) => {
        const value = propertiesMap[key];
        landingContent = landingContent.replaceAll( "{{" + key + "}}", value);
      });
    }
    landingContent = landingContent.replaceAll( "[[DETAIL]]" , detailPages);
    const stripRemaining = "\{\{.*?\}\}"; // strip everything not rendered.
    const re = new RegExp(stripRemaining, "g");
    return landingContent.replaceAll(re, "");
  } else {
    return Object(renderedItems).map((entry: any[]) => entry[1]);;
  }
}

function renderPagination(viewId: string, view: Element, fetchedData: tableViewResponse) {
  const pagingSection = window.document.createElement("div");
  pagingSection.className = "pagination";
  view.appendChild(pagingSection);
  let leftPtr = currentPage[viewId] ? currentPage[viewId] : 1;
  let rightPtr = currentPage[viewId] ? currentPage[viewId] : 1;
  if (fetchedData.totalPages <= PAGINATION_SHOW_SIZE) {
    leftPtr = 1;
    rightPtr = fetchedData.totalPages;
  } else {
    let pagesLeft = PAGINATION_SHOW_SIZE;
    while (pagesLeft > 0) {
      if (leftPtr > 1) { leftPtr--; pagesLeft--; }
      if (rightPtr <= fetchedData.totalPages) { rightPtr++; pagesLeft--; }
    }
  }

  pagingSection.appendChild(makePageLink(viewId, view, 1, "<<"));
  for (let i = 1; i <= fetchedData.totalPages; i++) {
    pagingSection.appendChild(makePageLink(viewId, view, i, null));
  }
  pagingSection.appendChild(makePageLink(viewId, view, fetchedData.totalPages, ">>"));
}

function makePageLink(viewId: string, view: Element, pageNumber: number, linkText: string | null): Element {
  if (currentPage[viewId] === pageNumber) {
    const textElement = window.document.createElement("span");
    textElement.innerText = pageNumber.toString();
    textElement.className = "currentPage";
    if (linkText) textElement.innerText = linkText;
    return textElement;
  } else {
    const linkElement = window.document.createElement("a");
    linkElement.onclick = function() { fetchAndRerenderData(viewId, view, pageNumber); };
    linkElement.innerText = pageNumber.toString();
    if (linkText) linkElement.innerText = linkText;
    linkElement.style.cursor = "pointer";
    return linkElement
  }
}

function renderTableToView(viewId: string, view: Element, fetchedData: tableViewResponse, template: any, style: any) {
  let caption: string = "";
  if (fetchedData.templateProperties && fetchedData.templateProperties.caption) {
    caption = fetchedData.templateProperties.caption;
  }
  let striped: boolean = false;
  if (fetchedData.templateProperties && fetchedData.templateProperties.striped) {
    striped = fetchedData.templateProperties.striped.toLowerCase() === "true";
  }
  const dataMatrix = dataToTableMatrix(fetchedData);
  if (dataMatrix && dataMatrix.length) {
    let table = window.document.createElement("table");
    table.className="table table-hover";
    if (striped) table.className += " table-striped ";
    view.appendChild(table);
    if (caption) {
      let captionElem = window.document.createElement("caption");
      captionElem.innerHTML = caption;
    }
    let tableHead = window.document.createElement("thead");
    let tableBody = window.document.createElement("tbody");
    table.appendChild(tableHead);
    table.appendChild(tableBody);
    dataMatrix.forEach((dataRow: any[], rowIdx: number) => {
      let tableRow = window.document.createElement("tr");
      tableRow.className = evenOrOdd(rowIdx + 1);
      if (rowIdx === 0) {
        tableHead.appendChild(tableRow);
      } else {
        tableBody.appendChild(tableRow);
      }
      dataRow.forEach((data: any, colIdx: number) => {
        let cell = rowIdx === 0 ? window.document.createElement("th") : window.document.createElement("td");
        cell.appendChild(renderData(data));
        cell.className = evenOrOdd(colIdx + 1);
        tableRow.appendChild(cell);
      });
    });
  }
}

function renderData(data: dataField): HTMLElement {
  // todo(minjae): add more data renderer for data types
  const span = window.document.createElement("span");
  switch(data.display_as) {
    case DataSourceFieldType.Link:
      const linkElement = window.document.createElement("a");
      linkElement.href = data.raw_value;
      linkElement.innerText = data.raw_value;
      span.appendChild(linkElement);
      break;
    default:
      span.innerText = data.raw_value;
  }
  return span;
}

function renderGraphToView(viewId: string, view: Element, fetchedData: tableViewResponse, template: any, style: any) {
  if (!template.compatibleDisplayType || !Array.isArray(template.compatibleDisplayType)) return;
  if (template.compatibleDisplayType.filter((t: string) => t === "graph")) {
    renderChartToView(viewId, view, fetchedData, template, style);
  }
}

function renderChartToView(viewId: string, view: Element, fetchedData: tableViewResponse, template: any, style: any) {
  // initiate template and style data
  let chartType : ChartType = "bar";
  if (template.componentProperties && template.componentProperties.chartType) chartType = template.componentProperties.chartType;
  let firstColumnAsLabel = (fetchedData.templateProperties && fetchedData.templateProperties.useFirstColumnAsLabels && fetchedData.templateProperties.useFirstColumnAsLabels as Boolean);
  let showLegends: boolean = true;
  if (fetchedData.templateProperties && fetchedData.templateProperties.showLegends && (fetchedData.templateProperties.showLegends.toLowerCase() === "false")) {
    showLegends = false;
  }
  let stackedBars: boolean = false;
  if (fetchedData.templateProperties && fetchedData.templateProperties.stackedBars && (fetchedData.templateProperties.stackedBars.toLowerCase() === "true")) {
    stackedBars = true;
  }
  let roundedBars: boolean = false;
  if (fetchedData.templateProperties && fetchedData.templateProperties.roundedBars && (fetchedData.templateProperties.roundedBars.toLowerCase() === "true")) {
    roundedBars = true;
  }
  let indexAxis: "x" | "y" = "x";
  if (fetchedData.templateProperties && fetchedData.templateProperties.showVertically && fetchedData.templateProperties.showVertically.toString().toLowerCase() === "true") {
    indexAxis = "y";
  }
  let borderWidth = 0;
  if (style.componentProperties && style.componentProperties.borderWidth) borderWidth = Number(style.componentProperties.borderWidth);
  let chartColors: string[] = [];
  if (style.colorTheme && Array.isArray(style.colorTheme)) chartColors = style.colorTheme;

  // if fetchedData view as graph, and properties client component is chart
  const dataMatrix = dataToTableMatrix(fetchedData);
  if (dataMatrix && dataMatrix.length) {
    // first row is assumed to be labels for this component
    const labelRow = dataMatrix[0].map((value: dataField) => {
      return value.raw_value;
    });
    const dataRows = [];
    for (let i = 1; i < dataMatrix.length; i++) {
      const dataArr = dataMatrix[i].map((value: dataField) => {
        return value.raw_value;
      });
      fetchedData.data.forEach(() => { chartColors = rotateArray(chartColors, true) }); // rotate the colors far enough to hopefully not get duplicates
      dataRows.push({
          label: firstColumnAsLabel ? dataArr[0] : undefined,
          data: firstColumnAsLabel ? dataArr.slice(1) : dataArr,
          // fill: true,
          borderWidth: borderWidth,
          borderColor: chartColors.length > 0 ? chartColors.slice() : undefined,
          backgroundColor: chartColors.length > 0 ? chartColors.slice() : undefined,
          borderRadius: roundedBars ? 500 : 0
      });
    }
    console.log(dataRows);
    let canvas = window.document.createElement("canvas");
    canvas.id = viewId;
    view.appendChild(canvas);
    const chart = new Chart(canvas, {
      type: chartType,
      data: {
        labels: firstColumnAsLabel ? labelRow.slice(1) : labelRow,
        datasets: dataRows,
      },
      options: {
        indexAxis: indexAxis,
        scales: {
          x: {
            stacked: stackedBars,
          },
          y: {
            stacked: stackedBars
          }
        },
        plugins: {
          legend: {
            display: showLegends
          }
        }
      }
    });
  }
}

function dataToTableMatrix(fetchedData: tableViewResponse): dataField[][] {
  const dataRows: dataField[][] = [];
  if (fetchedData.data && fetchedData.data.length) {
    const keys = Object.keys(fetchedData.data[0]);
    const keyMap: {[id: string]: number} = {};
    keys.forEach((key: string, index: number) => { keyMap[key] = index });
    fetchedData.data.forEach((currentDataRow: {[id: string]: dataField}) => {
      const rowData: dataField[] = [];
      Object.entries(currentDataRow).forEach((entry: any[]) => {
        rowData[keyMap[entry[0]]] = entry[1];
      });
      dataRows.push(rowData);
    });
  }
  return dataRows;
}

function itemInRotatingWindow(window: any[], index: number): any {
  return window.length ? window[(index - 1) % window.length] : undefined
}

function evenOrOdd(index: number): string {
  return index % 2 ? "odd" : "even";
}

function rotateArray(arr: any[], reverse: boolean): any[] {
  if (arr.length === 0) return arr;
  if (reverse) arr.unshift(arr.pop());
  else arr.push(arr.shift());
  return arr;
}

function getTemplate(fetchedData: tableViewResponse): any {
  const cached_entry = Object.entries(template_cache).filter(value => value[0] === fetchedData.templateId);
  if (cached_entry && cached_entry[0] && cached_entry[0].length > 1) {
    return cached_entry[0][1];
  }
  // return the template data response returned itself.
}

function getStyle(fetchedData: tableViewResponse): any {
  const cached_entry = Object.entries(style_cache).filter(value => value[0] === fetchedData.styleId);
  if (cached_entry && cached_entry[0] && cached_entry[0].length > 1) {
    return cached_entry[0][1];
  }
  // return the style data response returned itself.
}

fetchAndRenderData();