var CMD_CODE = 91;
var CTRL_CODE = 17;
var SHIFT_CODE = 16;
var DRAG_THRESHOLD = 5;
var items = $("li");
var ghost = $(".ghost");

var state = {
    dragging: false,
    mousedown: false,
    multiselect: false,
    rangeselect: false,
    last_clicked: null
}


$(document).on('keydown', function (e) {

    if (e.keyCode == CMD_CODE || e.keyCode == CTRL_CODE) {
        state.multiselect = true;
    }
    if (e.keyCode == SHIFT_CODE) {
        state.rangeselect = true;
    }
}).on('keyup', function (e) {
    if (e.keyCode == CMD_CODE || e.keyCode == CTRL_CODE) {
        state.multiselect = false;
    }
    if (e.keyCode == SHIFT_CODE) {
        state.rangeselect = false;
    }
});


function update_focus(el) {
    var count = $('li.focus').length;
    //shift key
    if (!state.multiselect && state.rangeselect) {
        if (!state.last_clicked) {
            items.not(el).removeClass('focus');
            el.toggleClass('focus');
            state.last_clicked = el;
        } else {
            items.removeClass('focus');
            var bounds = el.add(state.last_clicked);
            var range = bounds.first().nextUntil(bounds.last());
            range.addClass('focus');
            bounds.addClass('focus');
        }
    }
    //cmd/ctrl key
    else if (state.multiselect && !state.rangeselect) {
        el.toggleClass('focus');
        state.last_clicked = el;
    }
    //no modifiers
    else {
        let c = $('#class')[0].value;
        el.text(c);
        el.css('background-color', c.toHex())

        state.last_clicked = el;
    }
}


init_drag_selection($(document));

//initialize dragging transparent ghost element 
function init_drag_selection(el) {
    var x_start = 0;
    var y_start = 0;
    var w = 0;
    var h = 0;

    el.on('mousedown', function (e) {

        x_start = e.pageX;
        y_start = e.pageY;
        state.mousedown = true;
        ghost.css({ 'left': x_start, 'top': y_start });
    });

    el.on("mouseup", function (e) {
        state.mousedown = false;
        ghost.css({ 'width': 0, 'height': 0 });
        if (state.dragging) {
            select_inside(ghost.css('left'), ghost.css('top'), w, h);
            state.dragging = false;
        }
        //deselect by clicking outside a tile
        else {
            if (!$(e.target).hasClass('tile')) {
                items.removeClass('focus');
            }
        }
    });

    el.on("mousemove", function (e) {
        e.pageY = e.pageY;
        if (state.mousedown) {
            w = Math.abs(x_start - e.pageX);
            h = Math.abs(y_start - e.pageY);

            if ((w > DRAG_THRESHOLD && h > DRAG_THRESHOLD) && !state.dragging) {
                state.dragging = true;
            }

            ghost.css({ 'width': w, 'height': h });
            if (e.pageX <= x_start && e.pageY >= y_start) {
                ghost.css({ 'left': e.pageX });
            } else if (e.pageY <= y_start && e.pageX >= x_start) {
                ghost.css({ 'top': e.pageY });
            } else if (e.pageY < y_start && e.pageX < x_start) {
                ghost.css({ 'left': e.pageX, "top": e.pageY });
            }
        }
    });

    //bind tile click
    items.on('click', function () {
        update_focus($(this));
    });
}

//select the files that are inside the
//ghost element when releasing the mouse
function select_inside(x, y, w, h) {
    var box = {
        top: parseInt(y),
        left: parseInt(x),
        bottom: parseInt(y) + parseInt(h),
        right: parseInt(x) + parseInt(w)
    }

    if (!state.multiselect && !state.rangeselect) {
    }
    items.each(function () {
        var inside = (function (el) {
            var tile = el.getBoundingClientRect();
            //check intersection
            return (
                (tile.left <= box.right) &&
                (box.left <= tile.right) &&
                (tile.top <= box.bottom) &&
                (box.top <= tile.bottom)
            );
        })(this);

        if (inside) {
            let c = $('#class')[0].value;
            $(this).text(c);
            $(this).css('background-color', c.toHex())
            $(this).css('color', invertColor(c.toHex()))
        }
    });
}

$('#update').on('click', function (e) {

    $("#items-container").empty();
    let col = $('#column')[0].value;
    let r = $('#row')[0].value;

    let ic = $("#items-container");
    for (let i = 0; i < col; i++) {

        let row = $("<div class='row'></div>");
        ic.append(row);
        for (let j = 0; j < r; j++) {

            row.append($("<li class='tile'></li>"))

        }

    }
    items = $("li");
    init_drag_selection($(document));

})

$('#copy').on('click', (e) => {

    let classes = new Set();

    let I = [...$('li')]; // items

    let row_length = $('#row')[0].value;
    let column_length = $('#column')[0].value;

    let longest_worlds = I.reduce((a, b) => {

        classes.add(a.innerText);
        classes.add(b.innerText);

        return a.innerText.length > b.innerText.length ? a : b;

    }).innerText.length;

    let parsed_result = '';

    spacer = (length) => {
        let txt = '';
        for (let index = 0; index < length; index++) {
            txt += ' ';
        }
        return txt;
    }

    I.forEach((i, index) => {

        let c = i.innerText.length === 0 ? '.' : i.innerText;

        parsed_result += (c + spacer(longest_worlds - c.length + 2));

        if ((index + 1) % row_length === 0) parsed_result += '"\n        "';

    })


    let text_to_copy =
        `
    .container {
        display: grid;
        
        grid-template-rows: repeat(1fr, ${row_length});
        grid-template-columns: repeat(1fr, ${column_length});
        
        grid-template-areas:
        "${parsed_result}";
    }
    `;

    // lazy fix 
    text_to_copy = text_to_copy.replace('"";', ';');

    // add

    navigator.clipboard.writeText(text_to_copy).then(function () {
        console.log('Async: Copying to clipboard was successful!');
    }, function (err) {
        console.error('Async: Could not copy text: ', err);
    });
    console.log(text_to_copy);

})

String.prototype.toHex = function () {
    var hash = 0;
    if (this.length === 0) return hash;
    for (var i = 0; i < this.length; i++) {
        hash = this.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
    }
    var color = '#';
    for (var i = 0; i < 3; i++) {
        var value = (hash >> (i * 8)) & 255;
        color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
}

function invertColor(hex) {
    if (hex.indexOf('#') === 0) {
        hex = hex.slice(1);
    }
    // convert 3-digit hex to 6-digits.
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
        throw new Error('Invalid HEX color.');
    }
    // invert color components
    var r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16),
        g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16),
        b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);
    // pad each with zeros and return
    return '#' + padZero(r) + padZero(g) + padZero(b);
}

function padZero(str, len) {
    len = len || 2;
    var zeros = new Array(len).join('0');
    return (zeros + str).slice(-len);
}