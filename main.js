
IMAGE_SRCS = [
    '/hello.gif',
    '/car-exchange.gif',
    '/ben-fly.gif'
];

if (Meteor.isClient) {

    //
    // Toggles
    //

    var ToolType = {
        draw: true,
        move: false,
        set: function(toolType) {
            if (toolType === 'draw') {
                $.scrollZoom.disabled = true;
                this.move = false;
                this.draw = true;
                $('html').removeClass('move-tool').addClass('draw-tool');
            } else if (toolType === 'move') {
                $.scrollZoom.disabled = false;
                this.draw = false;
                this.move = true;
                $('html').removeClass('draw-tool').addClass('move-tool');
            } else {
                return;
            }
            Session.set('toolType', toolType);
        },
        charCodes: {
            V: function() { ToolType.set('move'); },
            B: function() { ToolType.set('draw'); }
        }
    };
    ToolType.set('draw');

    var CanvasSize = {
        size: null,
        baseSizes: _.map([
            {name: 'small', columns: 10, rows: 10, title: 'Small Size'},
            {name: 'medium', columns: 20, rows: 20, title: 'Medium Size'},
            {name: 'large', columns: 40, rows: 40, title: 'Large Size'}
        ], function(x) {
            x.className = x.name;
            return x;
        }),
        set: function(size) {
            var base = CanvasSize.baseSizes,
                data = null;
            CanvasSize.size = size;
            for (var i=0, len=base.length; i<len; i++) {
                if (base[i].name === size) {
                    data = base[i];
                }
            }
            if (data != null) {
                Session.set('canvasSize', data);
            }
        }
    };
    CanvasSize.set('small');


    Template.toggles.images = _.map(IMAGE_SRCS, function(x) {
        return {
            src: x,
            name: x
                .replace(/-+/g, ' ')
                .replace(/^\//, '')
                .replace(/\.gif$/, '')
        };
    });

    Template.toggles.sizes = function() {
        var canvasSize = Session.get('canvasSize');
        var sizes = _.map(CanvasSize.baseSizes, function(x) {
            return _.extend({
                selected: (x.className == canvasSize.className)
            }, x);
        });
        return sizes;
    };

    Template.toggles.tools = function() {
        var toolType = Session.get('toolType');

        return _.map([
            {name: 'move', title: 'Move Tool (V)'},
            {name: 'draw', title: 'Brush tool (B)'}
        ], function(x) {
            x.selected = (toolType === x.name);
            return x;
        });
    };

    Meteor.startup(function() {
        var charCodes = {};
        _.each(ToolType.charCodes, function(v, k) {
            charCodes[k.toUpperCase().charCodeAt(0)] = v;
        });
        $(window).on('keyup', function(e) {
            var fn = charCodes[e.keyCode];
            fn && fn();
        });
    });


    Template.toggles.events({
        'click #images>a': function(e) {
            e.preventDefault();
            Session.set('animateUrl', this.src);
        },
        'click #sizes>a': function(e) {
            e.preventDefault();
            Session.set('canvasSize', this);
        },
        'click .tool': function(e) {
            ToolType.set(this.name);
        }
    });


    //
    // Viewer
    //

    Template.viewer.images = function() {
        var size = Session.get('canvasSize');
        var url = Session.get('animateUrl');
        if (url) {
            return _.map(_.range(size.columns * size.rows), function(x) {
                return {src: url};
            });
        }
        return null;
    };


    function _draw(fn) {
        return function(e,x) {
            if (ToolType.draw) {
                fn.call(this, e, x);
            }
        };
    }

    var mouseDown = false;

    Template.viewer.events({
        'click .hoverable': _draw(function(e) {
            $(e.target).closest('.hoverable').trigger('toggle.stopgifs');
        })
    });

    if ($('html').hasClass('touch')) {
        var touching = false,
            eltPositions = [];

        Template.viewer.events({
            'touchstart': _draw(function(e) {
                e.preventDefault();
                e.stopPropagation();

                // TODO - use proper meteor doohickeys?
                eltPositions = $('.hoverable').map(function() {
                    var $elt = $(this);
                    return {
                        $elt: $elt,
                        offset: $elt.offset(),
                        width: $elt.width(),
                        height: $elt.height()
                    };
                }).get();

                $(e.target).closest('.hoverable').trigger('animate.stopgifs');
                touching = true;
            }),
            'touchend': _draw(function(e) {
                touching = false;
            }),
            'touchmove': _draw(function(e) {
                if (touching) {
                    e.preventDefault();
                    e.stopPropagation();
                    var x = e.pageX,
                        y = e.pageY,
                        i = 0,
                        len = eltPositions.length,
                        p;

                    for (; i<len; i++) {
                        p = eltPositions[i];
                        if ((x > p.offset.left && x < p.offset.left + p.width) &&
                            (y > p.offset.top && y < p.offset.top + p.height)) {
                            p.$elt.trigger('animate.stopgifs');
                            break;
                        }
                    }
                }
            })
        });
    } else {
        Template.viewer.events({
            'mousedown': _draw(function(e) {
                e.preventDefault();
                mouseDown = true;
            }),
            'mouseup': _draw(function(e) {
                mouseDown = false;
            }),
            'mousemove': _draw(function(e) {
                if (mouseDown) {
                    $(e.target).closest('.hoverable').trigger(
                        e.shiftKey ?
                            'still.stopgifs' :
                            'animate.stopgifs'
                    );
                }
            })
        });
    }

    Template.viewer.rendered = function() {
        $('#viewer').find('img').stopgifs({hoverAnimate: false});

        var size = Session.get('canvasSize');
        $('body').attr('class', '').addClass(size.className);

        $('#viewer').scrollZoom({
            styles: {
                top: 5,
                left: 5,
                width: 90,
                height: 90
            }
        });
    };

    function $getPixel(index, y, numColumns) {
        index = y === undefined ? index : y * numColumns + index;
        return $('#viewer').find('.hoverable:eq('+index+')');
    }

    Meteor.startup(function() {
        // load image
        $('<img>', {
            src: IMAGE_SRCS[0],
            load: function() {
                Session.set('animateUrl', this.src);
            }
        });

        // // setup key codes
        // var codeMap = {};
        // _.each('Q W E A S D Z X C'.split(' '), function(letter, i) {
        //     var code = String.charCodeAt(letter);
        //     codeMap[code] = i;
        // });
        // $(window).on('keyup', function(e) {
        //     var index = codeMap[e.keyCode];
        //     if (index !== undefined) {
        //         $('#viewer')
        //             .find('.hoverable:eq(' + index + ')')
        //             .trigger('toggle.stopgifs');
        //     }
        // });
    });
}

if (Meteor.isServer) {
    Meteor.startup(function () {
        // code to run on server at startup
    });
}
