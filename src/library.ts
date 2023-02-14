import Chart from 'chart.js/auto';
import { ChartType } from "chart.js";
import { dataField, tableViewResponse, DataSourceFieldType, PaginationStyle, TableViewStyle } from "@airjam/types";
import { template_cache, style_cache } from './include/template_cache';

// const SERVING_DATA_URL: string = "http://airjam.co/s/data?id=";
const SERVING_DATA_URL: string = "http://localhost:3001/s/data?id=";
const PAGINATION_SHOW_SIZE: number = 7;
let currentPage: {[id: string]: number} = {}; // global variable that keeps track of current page.

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
          if (style.containerClassNames && Array.isArray(style.containerClassNames)) view.className += " " + style.containerClassNames.join(" ");
          const styleElement = document.createElement('style');
          styleElement.appendChild(window.document.createTextNode(style.style));
          window.document.head.appendChild(styleElement);
          switch(fetchedData.viewStyle) {
            case TableViewStyle.Graph:
              renderGraphToView(viewId, view, fetchedData, template, style);
              break;
            case TableViewStyle.Table:
              renderTableToView(viewId, view, fetchedData, template, style);
              break;
            case TableViewStyle.List:
            case TableViewStyle.Gallery:
              renderCollectionToView(viewId, view, fetchedData, template, style);
              break;
            default:
              // not yet implemented
          }
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
        switch(fetchedData.viewStyle) {
          case TableViewStyle.Graph:
            renderGraphToView(viewId, view, fetchedData, template, style);
            break;
          case TableViewStyle.Table:
            renderTableToView(viewId, view, fetchedData, template, style);
            break;
          case TableViewStyle.List:
          case TableViewStyle.Gallery:
            renderCollectionToView(viewId, view, fetchedData, template, style);
            break;
          default:
            // not yet implemented
        }
      });
    });
  }
}

function renderCollectionToView(viewId: string, view: Element, fetchedData: tableViewResponse, template: any, style: any) {
  if (!template.templateFields || !template.templateContent || !fetchedData.templateFields) {
    console.log(viewId + " will not be rendered because it does not have required template attributes.");
    return;
  }
  // ignore the first row in data, since it is assumed to be a label row
  for (let i = 1; i < fetchedData.data.length; i++) {
    const currentRow = fetchedData.data[i];
    const templateMap: {[id: string]: string} = {};
    Object.keys(template.templateFields).forEach((field: string) => {
      if (fetchedData.templateFields[field] && currentRow[fetchedData.templateFields[field]]) {
        templateMap[field] = currentRow[fetchedData.templateFields[field]].raw_value;
      }
    });

    let templateContent = template.templateContent;
    Object.entries(templateMap).forEach((entry: any[]) => {
      const key = entry[0];
      const value = entry[1];
      templateContent = templateContent.replaceAll( "{{" + key + "}}", value); // todo templating engine will allow pass by map
    });
    view.innerHTML += templateContent;
    }
    if (fetchedData.paginationStyle === PaginationStyle.Paged) {
      renderPagination(viewId, view, fetchedData);
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
  let indexAxis: "x" | "y" = "x";
  if (fetchedData.templateProperties && fetchedData.templateProperties.showVertically && fetchedData.templateProperties.showVertically.toString().toLowerCase() === "true") {
    indexAxis = "y";
  }
  let borderWidth = 0;
  if (style.componentProperties && style.componentProperties.borderWidth) borderWidth = Number(style.componentProperties.borderWidth);
  let chartColors: string[] = [];
  if (style.componentProperties && style.componentProperties.chartColors && Array.isArray(style.componentProperties.chartColors)) chartColors = style.componentProperties.chartColors;

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
          borderWidth: borderWidth,
          borderColor: chartColors.slice(),
          backgroundColor: chartColors.slice()
      });
    }
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