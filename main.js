
IMAGE_SRCS = [
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
        }
    };

    ToolType.set('draw');

    Template.toggles.images = _.map(IMAGE_SRCS, function(x) {
        return {
            src: x,
            name: x
                .replace(/-+/g, ' ')
                .replace(/^\//, '')
                .replace(/\.gif$/, '')
        };
    });

    Template.toggles.sizes = _.map([
        {
            name: 'small',
            columns: 10,
            rows: 10
        },
        {
            name: 'medium',
            columns: 20,
            rows: 20
        },
        {
            name: 'large',
            columns: 40,
            rows: 40
        }
    ], function(x) {
        x.className = x.name;
        return x;
    });

    Template.toggles.tools = function() {
        var toolType = Session.get('toolType');

        return _.map(['move', 'draw'], function(x) {
            return {
                name: x,
                selected: toolType == x
            };
        });
    };

    Session.set('animateSize', Template.toggles.sizes[0]);

    Template.toggles.events({
        'click #images>a': function(e) {
            e.preventDefault();
            Session.set('animateUrl', this.src);
        },
        'click #sizes>a': function(e) {
            e.preventDefault();
            Session.set('animateSize', this);
        },
        'click .tool': function(e) {
            ToolType.set(this.name);
        }
    });


    //
    // Viewer
    //

    Template.viewer.images = function() {
        var size = Session.get('animateSize');
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
        }),
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

    Template.viewer.rendered = function() {
        $('#viewer').find('img').stopgifs({hoverAnimate: false});

        var size = Session.get('animateSize');
        $('body').attr('class', '').addClass(size.className);

        $('#viewer').scrollZoom();
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

        //////////////////////////////////////////////

        /* //REM //REM
        function getStyles() {
            var $window = $(window);
            return {
                width: 110,
                height: 110,
                scale: 1,
                left: -5,
                top: -5
            };
        }

        function percent(x) {
            return x + '%';
        }

        var styles = getStyles();

        function drawStyles() {
            var $v = $('#viewer');
            $v.css({
                width: percent(styles.width * styles.scale),
                height: percent(styles.height * styles.scale),
                left: percent(styles.left),
                top: percent(styles.top)
            });
        }

        var WHEEL_RATE = 1.01;

        $(window).on('touchmove touchstart touchend mousedown mousewheel', function(e) {
            if (e.type == 'mousewheel') {
                e.preventDefault();
                e.stopPropagation();

                console.log('[EVT]', e.type);
                var origE = e.originalEvent;
                var s1 = styles.scale; //REM
                styles.scale *= Math.pow(WHEEL_RATE, origE.wheelDelta/120);
                window._e = e; //REM
                drawStyles();
                console.log('drawn!', s1, styles.scale); //REM
            }
        });
        */
    });
}

if (Meteor.isServer) {
    Meteor.startup(function () {
        // code to run on server at startup
    });
}
