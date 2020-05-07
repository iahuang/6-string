"use strict";
class HLElement {
    constructor(tagName, children = []) {
        this.classes = [];
        this.attrs = {};
        this.inlineStyle = {};
        this.children = [];
        this.flexboxStyle = null;
        this.tagName = tagName;
        this.children = children;
        this.eventListeners = [];
    }
    setAttr(attr, val = true) {
        this.attrs[attr] = val;
        return this;
    }
    setFlexboxStyle(buildFunction) {
        this.flexboxStyle = buildFunction(new FlexboxConfig());
        return this;
    }
    onEvent(event, cb, capture = true) {
        this.eventListeners.push({
            type: event,
            callback: cb,
            capture: capture,
        });
        return this;
    }
    // Global attribute wrappers
    id(id) {
        return this.setAttr("id", id);
    }
    contentEditable(i = true) {
        return this.setAttr("contenteditable", i);
    }
    draggable(i = true) {
        return this.setAttr("draggable", i);
    }
    spellcheck(i) {
        return this.setAttr("spellcheck", i);
    }
    appendStyleRule(style) {
        for (let [attr, value] of style.entries()) {
            this.inlineStyle[attr] = value;
        }
        return this;
    }
    style(style) {
        this.appendStyleRule(style);
        return this;
    }
    buildStyleAttribute() {
        return (this.inlineStyle
            .entries()
            .map((entry) => {
            let styleAttr = entry[0];
            let value = entry[1];
            return styleAttr + ": " + value + ";";
        })
            .join(";") + ";");
    }
    class(className) {
        if (className) {
            this.classes.push(className);
        }
        return this;
    }
    // Text formatting syntactic sugar
    italicized() {
        return new HLElement("em", [this]);
    }
    strikethrough() {
        return new HLElement("s", [this]);
    }
    bold() {
        return new HLElement("strong", [this]);
    }
    superscripted() {
        return new HLElement("sup", [this]);
    }
    subscripted() {
        return new HLElement("sub", [this]);
    }
    // Event listener wrappers for common events
    onClick(cb) {
        this.onEvent("click", cb);
        return this;
    }
    // Represent this HLElement as an HTML Element
    render() {
        if (this.flexboxStyle) {
            this.appendStyleRule(this.flexboxStyle.getStylesheetObject());
        }
        let htmlElement = document.createElement(this.tagName);
        // Set element class(es)
        if (this.classes.length > 0) {
            htmlElement.classList.add(...this.classes);
        }
        // Set HTML attributes
        for (let [attr, e] of this.attrs.entries()) {
            htmlElement.setAttribute(attr, e);
        }
        // Set element style
        for (let [attr, value] of this.inlineStyle.entries()) {
            htmlElement.style[attr] = value;
        }
        // Build content
        for (let child of this.children) {
            let childNode = htmless.valueToNode(child);
            htmlElement.appendChild(childNode);
        }
        // Add event listeners
        for (let listener of this.eventListeners) {
            htmlElement.addEventListener(listener.type, listener.callback, listener.capture);
        }
        return htmlElement;
    }
}
class HTMLess {
    constructor() {
        // A component-DOM lookup table
        // key: Component instance
        // value: array of DOM elements that correspond to each rendered instance of the component
        this.trackedNodes = new Map();
        this.inlineComponents = {};
        this.inlineComponentLabels = {};
    }
    renderComponent(component) {
        let rendered = this.valueToNode(component.body());
        if (rendered instanceof DocumentFragment) {
            throw new Error("For simplicity, component bodies cannot be document fragments (a node representing multiple elements). Try encapsulating it inside a div");
        }
        this.trackedNodes.set(rendered, component);
        return rendered;
    }
    inlineComponent(f) {
        let comp = new InlineComponent();
        comp.body = f;
        return comp;
    }
    getInlineComponent(id) {
        let component = this.inlineComponents[id];
        if (component === undefined) {
            throw new Error("No inline component with id '" + id + "' exists");
        }
        return component;
    }
    getInlineComponentsByLabel(label) {
        let componentIds = this.inlineComponentLabels[label];
        if (componentIds === undefined) {
            throw new Error("No such label '" + label + "' exists");
        }
        return componentIds.map((id) => this.getInlineComponent(id));
    }
    rerenderComponent(component) {
        let elementsToReplace = [];
        for (let [element, associatedComponent,] of this.trackedNodes.entries()) {
            if (component === associatedComponent) {
                elementsToReplace.push(element);
            }
        }
        for (let element of elementsToReplace) {
            this.trackedNodes.delete(element); // remove
            let rendered = component.body().render();
            element.replaceWith(rendered);
            this.trackedNodes.set(rendered, component);
        }
        // garbage collection
        for (let element of this.trackedNodes.keys()) {
            if (!document.contains(element)) {
                this.trackedNodes.delete(element);
            }
        }
    }
    rerenderInlineComponent(id) {
        this.rerenderComponent(this.getInlineComponent(id));
    }
    rerender(x) {
        if (x instanceof Component) {
            this.rerenderComponent(x);
        }
        else {
            this.rerenderInlineComponent(x);
        }
    }
    rerenderLabel(label) {
        let components = this.getInlineComponentsByLabel(label);
        for (let c of components) {
            this.rerender(c);
        }
    }
    valueToNode(value) {
        // Take a value of an arbitrary type and represent it as an HTML element
        if (typeof value !== "object") {
            return document.createTextNode(value);
        }
        if (value instanceof Component) {
            let rendered = htmless.renderComponent(value);
            return rendered;
        }
        if (value instanceof Array) {
            let frag = document.createDocumentFragment();
            for (let n of value) {
                frag.appendChild(this.valueToNode(n));
            }
            return frag;
        }
        if (value.render) {
            return value.render();
        }
        throw new Error("Invalid child type");
    }
    getComponentId(c) {
        for (let [id, component] of this.inlineComponents.entries()) {
            if (component === c) {
                return id;
            }
        }
    }
    labelComponent(c, label) {
        if (c instanceof InlineComponent) {
            let id = this.getComponentId(c);
            if (!id) {
                throw new Error("Cannot label component with no associated ID");
            }
            if (this.inlineComponentLabels[label]) {
                this.inlineComponentLabels[label].push(id);
            }
            else {
                this.inlineComponentLabels[label] = [id];
            }
        }
        else {
            throw new Error("Cannot label non-inline component");
        }
    }
}
/* HTMLess - a lightweight Javascript library for writing UI elements in JS */
/// <reference path="htmless/core.ts" />
function elementFunction(tagName, type = HLElement) {
    return (...children) => {
        return new type(tagName, children);
    };
}
// Misc
let inlineHTML = function (html) {
    return new InlineHTMLElement(html);
};
// Organization
let div = elementFunction("div");
let span = elementFunction("span");
let hr = new HLElement("hr");
// Text
let paragraph = elementFunction("p");
let hyperlink = function (...children) {
    return new HLHyperlinkElement("a", children);
};
let headers = {
    h1: elementFunction("h1"),
    h2: elementFunction("h2"),
    h3: elementFunction("h3"),
    h4: elementFunction("h4"),
    h5: elementFunction("h5"),
    h6: elementFunction("h6"),
};
let newline = new HLElement("br");
let smallText = elementFunction("small");
let superscript = elementFunction("sup");
let subscript = elementFunction("sub");
let codeBlock = elementFunction("code");
// Media
let image = function (src) {
    return new HLImageElement(src);
};
let video = function () {
    return new HLVideoElement();
};
// Form
let button = elementFunction("button");
// text fields
// date / time
// other
let input = {
    // text fields
    text: () => {
        return new HLTextField("text");
    },
    numeric: () => {
        return new HLTextField("number");
    },
    email: () => {
        return new HLTextField("email");
    },
    password: () => {
        return new HLTextField("password");
    },
    search: () => {
        return new HLTextField("search");
    },
    phoneNumber: () => {
        return new HLTextField("tel");
    },
    url: () => {
        return new HLTextField("url");
    },
    // buttons
    checkbox: () => {
        return new HLInputElement("checkbox");
    },
    radio: () => {
        return new HLInputElement("radio");
    },
    // date/time
    date: () => {
        return new HLInputElement("date");
    },
    datetimeLocal: () => {
        return new HLInputElement("datetime-local");
    },
    month: () => {
        return new HLInputElement("month");
    },
    week: () => {
        return new HLInputElement("week");
    },
    // other
    file: () => {
        return new HLFileUpload();
    },
    color: () => {
        return new HLInputElement("color");
    },
};
// Misc
let htmless = new HTMLess();
class Component {
    body() {
        throw new Error("No render method specified for this component");
    }
    render() {
        return htmless.renderComponent(this);
    }
    rerender() {
        return htmless.rerender(this);
    }
}
class InlineComponent extends Component {
    constructor() {
        super();
    }
    id(id) {
        htmless.inlineComponents[id] = this;
        return this;
    }
    label(l) {
        htmless.labelComponent(this, l);
        return this;
    }
}
let inlineComponent = htmless.inlineComponent.bind(htmless);
if (!Object.entries) {
    Object.entries = function (obj) {
        var ownProps = Object.keys(obj), i = ownProps.length, resArray = new Array(i); // preallocate the Array
        while (i--)
            resArray[i] = [ownProps[i], obj[ownProps[i]]];
        return resArray;
    };
}
Object.prototype.entries = function () {
    return Object.entries(this);
};
class FlexboxConfig {
    constructor() {
        this.direction = "row";
        this.justify = "start";
        this.align = "center";
        this.alignContent = "stretch";
        this.wrapMode = "nowrap"; // flex-wrap
    }
    vertical() {
        this.direction = "column";
        return this;
    }
    justifyStart() {
        this.justify = "flex-start";
        return this;
    }
    justifyEnd() {
        this.justify = "flex-end";
        return this;
    }
    justifyCenter() {
        this.justify = "center";
        return this;
    }
    justifySpaceApart() {
        this.justify = "space-between";
        return this;
    }
    justifySpaceEven() {
        this.justify = "space-evenly";
        return this;
    }
    justifySpaceAround() {
        this.justify = "space-around";
        return this;
    }
    alignStretch() {
        this.align = "stretch";
        return this;
    }
    alignStart() {
        this.align = "flex-start";
        return this;
    }
    alignEnd() {
        this.align = "flex-end";
        return this;
    }
    alignBaseline() {
        this.align = "baseline";
        return this;
    }
    alignCenter() {
        this.align = "center";
        return this;
    }
    getStylesheetString() {
        return `display: flex; flex-direction: ${this.direction}; justify-content: ${this.justify}; align-items: ${this.align}; align-content: ${this.alignContent}; flex-wrap: ${this.wrapMode}`;
    }
    getStylesheetObject() {
        return {
            display: "flex",
            flexDirection: this.direction,
            justifyContent: this.justify,
            alignItems: this.align,
            alignContent: this.alignContent,
            flexWrap: this.wrapMode,
        };
    }
}
class StyleClassManager {
    constructor() {
        this.styles = new Set();
    }
    compressStyle(style) {
        return style.replace(" ", "");
    }
    addStyle(style) {
        this.styles.add(this.compressStyle(style));
    }
}
class HLInputElement extends HLElement {
    constructor(type) {
        super("input", []);
        this.attrs["type"] = type;
    }
    disabled(d = true) {
        return this.setAttr("disabled", d);
    }
    readonly(d = true) {
        return this.setAttr("readonly", d);
    }
    placeholder(p) {
        return this.setAttr("placeholder", p);
    }
    autocomplete(a = true) {
        return this.setAttr("autocomplete", a);
    }
    name(n) {
        return this.setAttr("name", n);
    }
    initialValue(v) {
        return this.setAttr("value", v);
    }
}
class HLDateField extends HLInputElement {
    constructor() {
        super("checkbox");
    }
}
class HLFileUpload extends HLInputElement {
    constructor() {
        super("file");
    }
    allowedFileTypes(types) {
        return this.setAttr("accept", types.join(","));
    }
    multiple(x = true) {
        return this.setAttr("multiple", x);
    }
    capture(x) {
        return this.setAttr("capture", x);
    }
}
class HLTextField extends HLInputElement {
    constructor(type) {
        super(type);
    }
    maxlength(l) {
        return this.setAttr("maxlength", l);
    }
    minlength(l) {
        return this.setAttr("minlength", l);
    }
    min(x) {
        return this.setAttr("min", x);
    }
    max(x) {
        return this.setAttr("max", x);
    }
    pattern(p) {
        return this.setAttr("pattern", p);
    }
    multiple(x = true) {
        return this.setAttr("multiple", x);
    }
    size(x) {
        return this.setAttr("size", x);
    }
}
class InlineHTMLElement {
    // Represents HTML code as a string literal
    constructor(content) {
        this.content = content;
    }
    render() {
        var tpl = document.createElement("template");
        tpl.innerHTML = this.content;
        return tpl.content;
    }
}
class HLImageElement extends HLElement {
    constructor(src) {
        super("img");
        this.setAttr("src", src);
    }
    alt(value) {
        return this.setAttr("alt", value);
    }
    crossorigin(mode) {
        return this.setAttr("crossorigin", mode);
    }
    decoding(mode) {
        return this.setAttr("decoding", mode);
    }
    height(h) {
        return this.setAttr("height", h);
    }
    width(w) {
        return this.setAttr("width", w);
    }
    loading(mode) {
        return this.setAttr("loading", mode);
    }
}
class HLVideoElement extends HLElement {
    constructor() {
        super("video");
    }
    autoplay() {
        return this.setAttr("autoplay");
    }
    controls() {
        return this.setAttr("autoplay");
    }
    width(x) {
        return this.setAttr("width", x);
    }
    height(x) {
        return this.setAttr("height", x);
    }
    loop() {
        return this.setAttr("loop");
    }
    muted() {
        return this.setAttr("muted");
    }
    poster(p) {
        return this.setAttr("poster", p);
    }
    src(s) {
        return this.setAttr("src", s);
    }
}
class HLHyperlinkElement extends HLElement {
    href(dest) {
        return this.setAttr("href", dest);
    }
    download(value) {
        return this.setAttr("download", value);
    }
    target(where) {
        return this.setAttr("target", where);
    }
}
