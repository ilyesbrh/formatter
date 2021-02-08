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
        items.not(el).removeClass('focus');
        if (count > 1) el.addClass('focus');
        else el.toggleClass('focus');
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
//ghost element when releaseing the mouse
function select_inside(x, y, w, h) {
    var box = {
        top: parseInt(y),
        left: parseInt(x),
        bottom: parseInt(y) + parseInt(h),
        right: parseInt(x) + parseInt(w)
    }

    if (!state.multiselect && !state.rangeselect) {
        items.removeClass('focus');
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
            $(this).addClass('focus');
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

            row.append($("<li class='tile'>" + (i * r + j + 1) + "</li>"))

        }

    }
    items = $("li");
    init_drag_selection($(document));

})