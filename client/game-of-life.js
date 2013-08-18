
var board = [],
    rows = 0,
    cols = 0;

function getCoords(index) {
    return {
        x: parseInt(index/cols),
        y: index % cols
    };
}

function getIndex(x, y) {
    return y * cols + x;
}

GoL = {
    init: function(_cols, _rows) {
        var len = _cols * _rows;
        board = new Array(len);
        cols = _cols;
        rows = _rows;
        for (var i=0; i<len; i++) {
            board[i] = false;
        }
    },
    step: function() {
        var nextBoard = board.slice();
        _.each(board, function(state, index) {
            var dx, dy, coords = getCoords(index), neighbors = [];
            for (dx=-1; dx<=1; dx++) {
                for (dy=-1; dy<=1; dy++) {
                    if (dx != 0 && dy != 0) {
                        neighbors.push(board[getIndex(coords.x+dx, coords.y+dy)]);
                    }
                }
            }
            var numAlive = _.filter(neighbors, function(x) { return x.state; }).length;

            //TODO - rules here...
            nextBoard[index] = numAlive == 2;
        });
    },
    paused: true,
    play: function() {
        if (GoL.paused) {
            //TODO - build play support
        }
    },
    pause: function() {
        GoL.paused = true;
    }
};
