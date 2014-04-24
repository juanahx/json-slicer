(function() {
    var scrollDelta = function(scrollbarData, delta) {
        var positionStart = scrollbarData.position;
        var newPosition = positionStart + delta;
        if (newPosition + scrollbarData.viewportHeight > scrollbarData.totalHeight) {
            newPosition = scrollbarData.totalHeight - scrollbarData.viewportHeight;
        }
        if (newPosition < 0) {
            newPosition = 0;
        }
        scrollbarData.scrollToPosition(newPosition);
        return newPosition;
    };

    var updateScrollbar = function(element) {
        var scrollbarData = $(element).data("scrollbar-data");
        if (scrollbarData === null) {
            $(element).hide();
        }
        else {
            $(element).show();
            var scrollbarHeight = $(element).parent().height();
            var pxPerPosition = scrollbarHeight / scrollbarData.totalHeight;
            var viewportRatio = scrollbarData.viewportHeight / scrollbarData.totalHeight;
            var scrollbarViewportHeight = Math.max(Math.round(viewportRatio * scrollbarHeight), 10);
            var scrollbarViewportTop = Math.min(Math.round(pxPerPosition * scrollbarData.position), scrollbarHeight - scrollbarViewportHeight);
            $(element).css({
                top: scrollbarViewportTop + "px",
                height: scrollbarViewportHeight + "px"
            });
            $(element).data("px-per-position", pxPerPosition);


            var mousewheelAreaInitialized = $(element).data("wheel-initialized");
            if (!mousewheelAreaInitialized && $($(element).data("mousewheel-area-selector")).length > 0) {
                var mouseWheelArea = $($(element).data("mousewheel-area-selector"));
                mouseWheelArea.mousewheel(function(event) {
                    var currentScrollbarData = $(element).data("scrollbar-data");
                    if (currentScrollbarData !== null) {
                        scrollDelta(currentScrollbarData, -event.deltaY);
                    }
                    
                });
                $(element).data("wheel-initialized", true);
            }
        }

    };

    ko.bindingHandlers.scrollbarWheel = {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        },
        update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var value = valueAccessor();
            var valueUnwrapped = ko.unwrap(value);
            $(element).data("mousewheel-area-selector", valueUnwrapped);
            updateScrollbar(element);
        }
    };

    ko.bindingHandlers.scrollbar = {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            $(element).data("px-per-position", null);
            $(element).data("scrollbar-data", null);
            $(element).mousedown(function(event) {
				$(document.body).addClass("unselectable");
				$(element).addClass("active");
                var yDragStart = event.pageY;
                var scrollbarData = $(element).data("scrollbar-data");
                var pxPerPosition = $(element).data("px-per-position");
                if (scrollbarData !== null && pxPerPosition !== null) {
                    var positionStart = scrollbarData.position;
                    var handler = function(event) {
                        var y = event.pageY;
                        var deltaPx = y - yDragStart;
                        var deltaPosition = Math.round(deltaPx / pxPerPosition);
                        scrollDelta(scrollbarData, deltaPosition);
                    };

                    $(document).on("mousemove", handler);
                    $(document).one("mouseup", function() {
                        $(document).unbind("mousemove", handler);
						$(document.body).removeClass("unselectable");
						$(element).removeClass("active");
                    });
                }
            });
        },
        update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var value = valueAccessor();
            var valueUnwrapped = ko.unwrap(value);
            $(element).data("scrollbar-data", valueUnwrapped);
            updateScrollbar(element);
        }
    };
})();

