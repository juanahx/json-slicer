(function() {

var MAX_LABEL_LENGTH = 60;
var INDENTATION = "    ";

var Node = function(value, key) {
    this.value = value;
    this.key = key;
    this.open = false;
    this._children = null;
};
Node.prototype.canHaveChildren = function() {
    return _.isArray(this.value) || _.isObject(this.value);
};
Node.prototype.setOpen = function(open) {
    this.open = open;
};
Node.prototype.getChildren = function() {
    if(this._children === null) {
        this._children =_.sortBy(
            _.map(
                this.value, 
                function(value, key) {
                    return new Node(value, key);
                }
            ),
            function(node) {
                return node.key;
            }
        );
    }
    return this._children;
};
Node.prototype.getLabel = function() {
    var stringValue;
    if(_.isArray(this.value)) {
        stringValue = "Array[" + this.value.length + "]";
    }
    else if(_.isObject(this.value)) {
        stringValue = "Object(" + _.keys(this.value).join(",") + ")";
    }
    else if(_.isString(this.value)) {
        stringValue = '"' + this.value + '"';
    }
    else {
        stringValue = "" + this.value;
    }
    if(typeof this.key !== "undefined") {
        stringValue = this.key + ": " + stringValue;
    }
    if(stringValue.length > MAX_LABEL_LENGTH) {
        stringValue = stringValue.substring(0, MAX_LABEL_LENGTH - 3) + '...';
    }
    return stringValue;
};
Node.prototype.toStringWithIndentation = function(indentation) {
    var sbArray = [];
    sbArray.push(indentation);
    if(this.canHaveChildren()) {
        if(this.open) {
            sbArray.push('- ');
        }
        else {
            sbArray.push('+ ');
        }
    }
    sbArray.push(this.getLabel(), '\n');
    if(this.open) {
        var children = this.getChildren();
        for(var i = 0; i < children.length; i++) {
            var child = children[i];
            var childString = child.toStringWithIndentation(indentation + INDENTATION);
            sbArray.push(childString);
        }
    }
    return sbArray.join('');
};
Node.prototype.toString = function() {
    return this.toStringWithIndentation("");
};

var TreeviewLine = function(node, indentation) {
    this.indentation = indentation;
    this.node = node;
};
TreeviewLine.prototype.toString = function() {
    return '(' + this.indentation + ') ' + node.getLabel();
};

var Treeview = function(rootNode) {
    this.rootNode = rootNode;
};
Treeview.prototype.toString = function() {
    return this.rootNode.toString();
};
Treeview.prototype.getTreeLines = function(beginIndex, endIndex) {
    var lines = [];
    var wires = [];
    var currentIndex = 0;
    var addLine = function(node, indentation) {
        if(currentIndex >= beginIndex && currentIndex < endIndex) {
            lines.push(new TreeviewLine(node, indentation));
        }
        currentIndex++;
    };
    var addLines = function(node, indentation) {
        addLine(node, indentation);
        if(node.open) {
            var wireStartIndex = currentIndex - 1;
            var wireEndIndex = wireStartIndex;
            var children = node.getChildren();
            for(var i = 0; i < children.length; i++) {
                var child = children[i];
                wireEndIndex = currentIndex;
                addLines(child, indentation + 1);
            }
            if(wireEndIndex > wireStartIndex && wireEndIndex >= beginIndex && wireStartIndex <= endIndex) {
                if(wireStartIndex < beginIndex - 1) {
                    wireStartIndex = beginIndex - 1;
                }
                if(wireEndIndex > endIndex + 1) {
                    wireEndIndex = endIndex + 1;
                }
                wires.push({
                    offset: wireStartIndex - beginIndex,
                    height: wireEndIndex - wireStartIndex,
                    indentation: indentation
                });
            }
        }
    };
    addLines(this.rootNode, 0);
    return {viewLines: lines, totalLines: currentIndex, viewWires: wires};
};

window.Node = Node;
window.Treeview = Treeview;

})();