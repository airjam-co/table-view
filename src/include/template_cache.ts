export const template_cache = {
    "card_list": {
        shortId: "card_list",
        compatibleWith: "list",
        compatibleDisplayType: ["list", "gallery"],
        name: "Card List",
        owner_id: "",
        version: 1,
        previewImageUrls: [],
        description: "card list.",
        visibility: "PUBLIC",
        pages: ["LIST"],
        properties: {
        },
        templateContent: "<div class='container'><span class='title'>{{title}}</span><span class='image'><img src='{{thumbnail}}'/></span><span class='description'>{{description}}</span><span><a href='{{link}}'>{{linkText}}</a></span></div>", // use templating language in the future
        templateFields: {
            title: {
                name: "Title",
                description: "title",
                compatibleTypes: [], //empty for all
            },
            link: {
                name: "Link",
                description: "Link to open",
                compatibleTypes: ["link"]
            },
            linkText: {
                name: "Link Text",
                description: "Link text",
                compatibleTypes: [],
            },
            thumbnail: {
                name: "Thumbnail image",
                description: "thumbnail image",
                compatibleTypes: ["link"],
            },
            description: {
                name: "Description",
                descriptions: "descriptions",
                compatibleTypes: [],
            }
        },
        componentProperties: {
        }
    },
    "standard_table": {
        shortId: "standard_table",
        compatibleWith: "table_view",
        compatibleDisplayType: ["table"],
        name: "Standard Table",
        owner_id: "",
        version: 1,
        previewImageUrls: [],
        description: "table, as shown on the sheet itself.",
        visibility: "PUBLIC",
        pages: ["LIST"],
        properties: {
            caption: {
                name: "Caption",
                description: "Use component's title as a caption",
                default: false,
                type: "Boolean"
            },
            striped: {
                name: "Striped rows",
                description: "Do row colors alternate",
                default: true,
                type: "Boolean"
            },
        },
        componentProperties: {
        }
    },
    "barchart": {
        shortId: "barchart",
        compatibleWith: "table_view",
        compatibleDisplayType: ["graph"],
        name: "Bar Chart",
        owner_id: "",
        version: 1,
        previewImageUrls: [],
        description: "bar chart, rows must be horizontal and data in the second row to work.",
        visibility: "PUBLIC",
        pages: ["LIST"],
        properties: {
            useFirstColumnAsLabels: {
                name: "First Column is Labels",
                description: "Use first column as labels",
                default: true,
                type: "Boolean"
            },
            showLegends: {
                name: "Show Legends",
                description: "Show legends of labels in the graph",
                default: true,
                type: "Boolean"
            },
            showVertically: {
                name: "ShowVertically",
                description: "Display graph vertically, rather than horizontally",
                default: false,
                type: "Boolean"
            }
        },
        componentProperties: {
            chartType: "bar"
        }
    },
    "piechart": {
        shortId: "piechart",
        compatibleWith: "table_view",
        compatibleDisplayType: ["graph"],
        name: "Pie Chart",
        owner_id: "",
        version: 1,
        previewImageUrls: [],
        description: "pie chart, rows must be horizontal and data in the second row to work.",
        visibility: "PUBLIC",
        pages: ["LIST"],
        properties: {
            useFirstColumnAsLabels: {
                name: "First Column is Labels",
                description: "Use first column as labels",
                default: true,
                type: "Boolean"
            },
            showLegends: {
                name: "Show Legends",
                description: "Show legends of labels in the graph",
                default: true,
                type: "Boolean"
            },
            showVertically: {
                name: "ShowVertically",
                description: "Display graph vertically, rather than horizontally",
                default: false,
                type: "Boolean"
            }
        },
        componentProperties: {
            chartType: "pie"
        }
    },
    "linechart": {
        shortId: "linechart",
        compatibleWith: "table_view",
        compatibleDisplayType: ["graph"],
        name: "Line Chart",
        owner_id: "",
        version: 1,
        previewImageUrls: [],
        description: "line chart, rows must be horizontal and data in the second row to work.",
        visibility: "PUBLIC",
        pages: ["LIST"],
        properties: {
            useFirstColumnAsLabels: {
                name: "First Column is Labels",
                description: "Use first column as labels",
                default: true,
                type: "Boolean"
            },
            showLegends: {
                name: "Show Legends",
                description: "Show legends of labels in the graph",
                default: true,
                type: "Boolean"
            },
            showVertically: {
                name: "ShowVertically",
                description: "Display graph vertically, rather than horizontally",
                default: false,
                type: "Boolean"
            }
        },
        componentProperties: {
            chartType: "line"
        }
    }
}

export const style_cache = {
    "muted": {
        shortId: "muted",
        name: "Muted",
        compatibleWith: ["barchart"], // compatible templates
        owner_id: "",
        version: 1,
        previewImageUrls: [],
        description: "single green color theme set",
        visibility: "PUBLIC",
        style: ".muted>.table>tbody>tr:nth-child(odd)>td, .muted>.table>tbody>tr:nth-child(odd)>th { background-color: #F9F9FB; } .muted>.table th { font-size: smaller; color: #23262E; } .muted>.table>tbody>tr, .muted>.table>thead>tr { border: 0px solid transparent }",
        containerClassNames: ["muted"],
        properties: {
            borderWidth: {
                name: "Border Width",
                description: "Border width",
                default: 1,
                type: "Number"
            },
            chartColors: {
                name: "Chart Colors",
                description: "Chart colors",
                default: ["#D79922", "#EFE2BA", "#F13C20", "#4056A1", "#C5CBE3"],
                type: "Color",
                multiple: true,
                limit: 50
            }
        },
        componentProperties: {
            borderWidth: 1,
            chartColors: ["#D79922", "#EFE2BA", "#F13C20", "#4056A1", "#C5CBE3"],
        }
    },
    "earthy": {
        shortId: "earthy",
        name: "Earthy",
        compatibleWith: ["barchart"], // compatible templates
        owner_id: "",
        version: 1,
        previewImageUrls: [],
        description: "single green color theme set",
        visibility: "PUBLIC",
        style: ".earthy>.table { border: 0.1em solid #E1E0E2; border-radius: 10px !important; border-collapse: separate; border-spacing: 0; overflow: hidden; } .earthy>.table thead { background-color: #F9FBFC; } .earthy>.table th { font-size: smaller; color: #828286; } .earthy>.table>tbody>tr, .earthy>.table>thead>tr { border-color: #F6F5F8 } .earthy>.table>tbody>tr:last-child { border: 0px solid transparent }",
        containerClassNames: ["earthy"],
        properties: {
            borderWidth: {
                name: "Border Width",
                description: "Border width",
                default: 1,
                type: "Number"
            },
            chartColors: {
                name: "Chart Colors",
                description: "Chart colors",
                default: ["#E27D60", "#85CDCA", "#E8A87C", "#C38D9E", "#41B3A3"],
                type: "Color",
                multiple: true,
                limit: 50
            }
        },
        componentProperties: {
            borderWidth: 1,
            chartColors: ["#E27D60", "#85CDCA", "#E8A87C", "#C38D9E", "#41B3A3"],
        }
    },
    "outback": {
        shortId: "outback",
        name: "Outback",
        compatibleWith: ["barchart"], // compatible templates
        owner_id: "",
        version: 1,
        previewImageUrls: [],
        description: "single green color theme set",
        visibility: "PUBLIC",
        style: ".outback>.table th { font-size: smaller; color: #23262E; } .outback>.table>thead>tr { border: 0px solid transparent; border-top: 1px solid #EAE9EE; }",
        containerClassNames: ["outback"],
        properties: {
            borderWidth: {
                name: "Border Width",
                description: "Border width",
                default: 1,
                type: "Number"
            },
            chartColors: {
                name: "Chart Colors",
                description: "Chart colors",
                default: ["#8D8741", "#659DBD", "#DAAD86", "#BC986A", "#FBEEC1", "#C3C078", "#9978C3", "#82C378", "#DE67A0"],
                type: "Color",
                multiple: true,
                limit: 50
            }
        },
        componentProperties: {
            borderWidth: 1,
            chartColors: ["#8D8741", "#659DBD", "#DAAD86", "#BC986A", "#FBEEC1", "#C3C078", "#9978C3", "#82C378", "#DE67A0"],
        }
    },
    "concise_gallery": {
        shortId: "concise_gallery",
        name: "Concise gallery list",
        compatibleWith: ["card_list"], // compatible templates
        owner_id: "",
        version: 1,
        previewImageUrls: [],
        description: "Concision is the key.",
        visibility: "PUBLIC",
        style: ".concise_gallery .container { display: inline-grid; padding: 10px; width: 300px; border: 1px solid #ddd; border-radius: 10px; margin: 5px; } .concise_gallery .container .title { font-size: 1.2 rem; font-weight: 600; }  .concise_gallery .container .image img { width: 100% } .concise_gallery .container .description { display: block } .concise_gallery .pagination a, .concise_gallery .pagination span { margin: 2px; padding: 3px; }",
        containerClassNames: ["concise_gallery"],
        properties: {
        },
        componentProperties: {
        }
    }
}