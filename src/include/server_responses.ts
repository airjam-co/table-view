
export enum ViewComponentType {
    TableView = "table_view"
}

export enum ViewType {
    Board = "view_board",
    List = "view_list",
    Feed = "view_feed"
}

export enum PaginationStyle {
    Paged = "pagination_paged",
    InfiniteScroll = "pagination_infinite",
    NoPagination = "pagination_none"
}

export enum TableViewStyle {
    List = "table_view_list",
    Gallery = "table_view_gallery",
    Graph = "table_view_graph",
    Table = "table_view_table",
}

export enum DataSourceFieldType {
    Text = "text",
    Number = "number",
    DateTime = "datetime",
    Currency = "currency",
    Percent = "percent",
    Link = "link",
    Email = "email"
}

export interface DataSourceField {
    columnIdx: number; // for tabular data sources
    fieldName: string;
    variableName: string;
    displayAs: DataSourceFieldType;
    show: boolean;
}

export interface dataResponse {
    title: string,
    componentType: ViewComponentType,
    type: ViewType,
    paginationStyle: PaginationStyle,
    viewStyle: TableViewStyle,
    fieldMapping: {[id: string]: DataSourceField},
    data: {[id: string]: dataField}[],
    templateId: string,
    templateVersion: number,
    styleId: string,
    styleVersion: string,
    cssOverride: string,
    totalPages: number,
    currentPage: number,
    templateFields: {[id: string]: string},
    templateProperties: {[id: string]: any}
}

export interface dataField {
    display_as: DataSourceFieldType,
    raw_value: string
}