(function() {
    window.DEFAULT_JSON_STRING = '{\n    "hint": "Paste JSON here"\n}'
            ;

    var treeviewViewModel = {
        treeview: null,
        position: 0,
        visibleLines: ko.observable([]),
        visibleWires: ko.observable([]),
        scrollbar: ko.observable(null),
        toggleNodeOpen: function(node) {
            if (node.canHaveChildren()) {
                node.setOpen(!node.open);
            }
            this.updateVisibleLines();
        },
        setTreeview: function(treeview) {
            this.treeview = treeview;
            this.updateVisibleLines();
        },
        scrollToPosition: function(position) {
            if (this.position !== position) {
                this.position = position;
                this.updateVisibleLines();
            }
        },
        updateVisibleLines: function() {
            console.log();
            var newHeight = $("#json-slicer").height();
            if (newHeight > 0) {
                var maxVisibleLines = Math.floor($("#json-slicer").height() / 20);
                var startIndex = this.position;
                var endIndex = this.position + maxVisibleLines;
                var view = this.treeview.getTreeLines(startIndex, endIndex + 1);
                this.visibleLines(view.viewLines);
                this.visibleWires(view.viewWires);
                this.scrollbar({
                    viewportHeight: endIndex - startIndex,
                    totalHeight: view.totalLines,
                    position: startIndex,
                    scrollToPosition: $.proxy(this.scrollToPosition, this)
                });
            }
            else {
                var self = this;
                setTimeout(function() {
                    self.updateVisibleLines();
                }, 100);
            }


        }
    };

    $(window).resize(function() {
        treeviewViewModel.updateVisibleLines();
    });


    var jsonSlicerViewModel = {
        width: ko.observable(null),
        treeview: ko.observable(null),
        jsonString: ko.observable(window.DEFAULT_JSON_STRING),
        showFromTextarea: function() {
            var json = this.jsonString();
            var value;
            try {
                value = JSON.parse(json);
            }
            catch (e) {
                alert("This JSON is invalid. Please try something else.");
                return;
            }
            var node = new Node(value);
            var treeview = new Treeview(node);
            treeviewViewModel.setTreeview(treeview);
            this.treeview(treeviewViewModel);
        },
        showExample: function() {
            $("head").append('<script type="text/javascript" src="js/example.js"></script>');
        }
    };

    window.slicer = window.slicer || {};

    window.slicer.plugins = window.slicer.plugins || {};

    window.slicer.getIcons = function(node) {
        var icons = [];
        _.each(this.plugins, function(plugin) {
            var icon = plugin.getIcon && plugin.getIcon(node);
            if (icon) {
                icons.push(icon);
            }
        });
        return _.sortBy(icons, "rank");
    };

    window.slicer.supports = function(node) {
        var supports = false;
        _.each(this.plugins, function(plugin) {
            supports = supports || plugin.supports(node);
        });
        return supports;
    };

    window.slicer.hasAction = function(node) {
        var hasAction = false;
        _.each(this.plugins, function(plugin) {
            hasAction = hasAction || plugin.hasAction(node);
        });
        return hasAction;
    };

    window.slicer.click = function(node) {
        var clicks = [];
        _.each(this.plugins, function(plugin) {
            var click = plugin.click && plugin.click(node);
            if (click) {
                clicks.push(click);
            }
        });
        clicks = _.sortBy(clicks, "rank");
        _.each(clicks, function(click) {
            click.callback(node);
        });
    };

    window.slicer.plugins.string = {
        supports: function(node) {
            return typeof node.value === "string";
        },
        hasAction: function(node) {
            return false;
        },
        getIcon: function(node) {
            if (window.slicer.plugins.string.supports(node)) {
                return {rank: 0, image: "string"};
            }
            else {
                return null;
            }
        }
    };

    window.slicer.plugins.number = {
        supports: function(node) {
            return typeof node.value === "number";
        },
        hasAction: function(node) {
            return false;
        },
        getIcon: function(node) {
            if (window.slicer.plugins.number.supports(node)) {
                return {rank: 0, image: "number"};
            }
            else {
                return null;
            }
        }
    };

    window.slicer.plugins.boolean = {
        supports: function(node) {
            return typeof node.value === "boolean";
        },
        hasAction: function(node) {
            return false;
        },
        getIcon: function(node) {
            if (window.slicer.plugins.boolean.supports(node)) {
                return {rank: 0, image: "boolean"};
            }
            else {
                return null;
            }
        }
    };

    window.slicer.plugins.empty = {
        supports: function(node) {
            return node.value === null;
        },
        hasAction: function(node) {
            return false;
        },
        getIcon: function(node) {
            if (window.slicer.plugins.empty.supports(node)) {
                return {rank: 0, image: "empty"};
            }
            else {
                return null;
            }
        }
    };

    window.slicer.plugins.nestedTables = {
        hasAction: function(node) {
            return _.isArray(node.value) || _.isObject(node.value);
        },
        click: function(node) {
            if (_.isArray(node.value) || _.isObject(node.value)) {
                var keys = {};
                _.each(node.value, function(line) {
                    var type = typeof line;
                    if (type === "object") {
                        _.each(line, function(value, key) {
                            keys[key] = true;
                        });
                    }
                    else {
                        var key = "<value>";
                        keys[key] = false;
                    }
                });
                var columns = _.sortBy(_.keys(keys), function(key) {
                    return key.toLowerCase();
                });
                var $table = $('<table><thead><tr></tr></thead><tbody></tbody></table>');
                var $headerLine = $table.find("thead > tr");
                var $tbody = $table.find("tbody");
                $headerLine.append($("<th>#</th>"));
                _.each(columns, function(column) {
                    $headerLine.append($("<th></th>").text(column));
                });
                _.each(node.value, function(line, key) {
                    var $line;
                    if (line === null || typeof line === "undefined") {
                        $line = $('<tr><td colspan="' + columns.length + '"></td></tr>');
                    }
                    else {
                        $line = $("<tr></tr>");
                        _.each(columns, function(column) {
                            $line.append($("<td></td>").text(keys[column] ? ((typeof line === "object") ? line[column] : "") : line));
                        });
                    }

                    $line.prepend($("<td></td>").text(key));
                    $tbody.append($line);
                });



                $("#detail-area").empty()
                        .append($('<button id="#copy-to-excel">Copy to Excel (TSV)</button>').click(function() {
                            var textarea = $("<textarea></textarea>");
                            var backdrop = $('<div class="popup-backdrop"></div>');
                            var popup = $('<div class="popup"><span>Now hit CTRL+C</span></div>');
                            var close = $("<button>Close</button>");
                            var sb = [];
                            _.each(columns, function(column) {
                                sb.push(column);
                                sb.push("\t");
                            });
                            sb.push("\n");
                            _.each(node.value, function(line) {
                                _.each(columns, function(column) {
                                    sb.push(keys[column] ? line[column] : line);
                                    sb.push("\t");
                                });
                                sb.push("\n");
                            });
                            textarea.val(sb.join(""));
                            var closeFunction = function() {
                                popup.remove();
                                backdrop.remove();
                            };
                            close.click(closeFunction);
                            popup.append(textarea).append(close);
                            $(document.body).append(backdrop).append(popup);
                            setTimeout(function() {
                                textarea.select();
                            }, 1);
                            textarea.keyup(function(event) {
                                if (event.which == 27) {
                                    closeFunction();
                                }
                            });
                        }))
                        .append($table);
            }
        }
    };

    window.slicer.plugins.array = {
        supports: function(node) {
            return _.isArray(node.value);
        },
        hasAction: function(node) {
            return false;
        },
        getIcon: function(node) {
            if (window.slicer.plugins.array.supports(node)) {
                return {rank: 0, image: "array"};
            }
            else {
                return null;
            }
        }
    };


    window.slicer.plugins.object = {
        supports: function(node) {
            return _.isObject(node.value) && !_.isArray(node.value);
        },
        hasAction: function(node) {
            return false;
        },
        getIcon: function(node) {
            if (window.slicer.plugins.object.supports(node)) {
                return {rank: 0, image: "object"};
            }
            else {
                return null;
            }
        }
    };

    var watchTextarea = function() {
        var oldValue = null;
        setInterval(function() {
            var currentValue = $('textarea').val();
            if (currentValue !== oldValue) {
                try {
                    var jsonData = eval("(" + currentValue + ")");
                    $('textarea').css("color", "inherit");
                    var node = new Node(jsonData);
                    if (node.canHaveChildren()) {
                        node.setOpen(true);
                    }
                    var treeview = new Treeview(node);
                    treeviewViewModel.setTreeview(treeview);
                    jsonSlicerViewModel.treeview(treeviewViewModel);
                    oldValue = currentValue;
                }
                catch (e) {
                    $('textarea').css("color", "red");
                }
            }
        }, 200);
    };

    var panelWidth = null;

    var setPanelWidth = function(width) {
        if (width !== panelWidth) {
            panelWidth = width;
            jsonSlicerViewModel.width(width);
        }
    };

    setPanelWidth(400);

    ko.applyBindings(jsonSlicerViewModel, document.body);

    $(function() {
        $('textarea').focus(function() {
            var $this = $(this);

            $this.select();

            window.setTimeout(function() {
                $this.select();
            }, 1);

            // Work around WebKit's little problem
            function mouseUpHandler() {
                // Prevent further mouseup intervention
                $this.off("mouseup", mouseUpHandler);
                return false;
            }

            $this.mouseup(mouseUpHandler);
        });

        $("#separator").mousedown(function(event) {
            $(document.body).addClass("unselectable");
            $("#separator").addClass("active");

            var panelWidthStart = panelWidth;

            var xDragStart = event.pageX;

            var handler = function(event) {
                var x = event.pageX;
                var deltaPx = x - xDragStart;
                var targetWidth = panelWidthStart + deltaPx;
                if (targetWidth < 80) {
                    targetWidth = 80;
                }
                if (targetWidth > $(window).width() - 100) {
                    targetWidth = $(window).width() - 100;
                }
                setPanelWidth(targetWidth);
            };

            $(document).on("mousemove", handler);
            $(document).one("mouseup", function() {
                $(document).unbind("mousemove", handler);
                $(document.body).removeClass("unselectable");
                $("#separator").removeClass("active");
            });
        });


        watchTextarea();
    });
})();