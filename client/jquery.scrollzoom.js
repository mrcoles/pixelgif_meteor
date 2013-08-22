
$.scrollZoom = {
    wheelRate: 1.01,
    defaultStyles: {
        width: 100,
        height: 100,
        scale: 1,
        left: 0,
        top: 0
    },
    disabled: false
};


$.fn.scrollZoom = function(cfg) {

    // special commands
    var disabledKey = 'scrollZoom-disabled';
    if (typeof cfg === 'string') {
        if (cfg == 'disable' || cfg == 'enable') {
            this.data(disabledKey, cfg == 'disable');
        }
        return this;
    }

    // regular use-case

    function percent(x) {
        return x + '%';
    }

    function distance(g) {
        return Math.sqrt(Math.pow(g.xa - g.xb, 2) + Math.pow(g.ya - g.yb, 2));
    }

    function center(g) {
        return {x: (g.xa - g.xb) / 2 + g.xb, y: (g.ya - g.yb) / 2 + g.yb};
    }

    var _styles = cfg && cfg.styles;

    return this.each(function() {
        var styles = $.extend({}, $.scrollZoom.defaultStyles, _styles),
            wheelRate = $.scrollZoom.wheelRate,
            $this = $(this);


        function moveElt(x0, y0, x1, y1, scaleMove) {
            scaleMove = scaleMove || 1;
            var dx = x1 - x0,
                dy = y1 - y0,
                width = $this.width(),
                height = $this.height(),
                scale = styles.scale,
                nl = styles.left + 100 * (dx / width) * scale * scaleMove,
                nt = styles.top + 100 * (dy / height) * scale * scaleMove;
            styles.left = nl;
            styles.top = nt;
        }


        function scaleElt(x, y, scaleDiff) {
            var width = $this.width(),
                height = $this.height(),
                oldScale = styles.scale,
                newScale = oldScale * scaleDiff,
                scaleChange = (newScale - oldScale) / oldScale,
                baseWidthScale = styles.width * oldScale,
                baseHeightScale = styles.height * oldScale,
                nl = styles.left - baseWidthScale * scaleChange * (x/width),
                nt = styles.top - baseHeightScale * scaleChange * (y/height);

            $.extend(styles, {
                scale: newScale,
                left: nl,
                top: nt
            });
        }

        function draw() {
            $this.css({
                width: percent(styles.width * styles.scale),
                height: percent(styles.height * styles.scale),
                left: percent(styles.left),
                top: percent(styles.top)
            });
        }

        draw();


        //
        // Mouse scroll
        //

        $this.on('mousewheel', function(e) {
            e.preventDefault();
            e.stopPropagation();

            var orig = e.originalEvent,
                offset = $this.offset(),
                xOffset = orig.pageX - offset.left,
                yOffset = orig.pageY - offset.top,
                scaleDiff = Math.pow(wheelRate, orig.wheelDelta/120);

            scaleElt(xOffset, yOffset, scaleDiff);

            draw();
        });

        function ifEnabled(fn) {
            return function(e,x) {
                if (!$this.data(disabledKey) && !$.scrollZoom.disabled) {
                    fn.call(this, e, x);
                }
            };
        }

        var isTouch = $('html').hasClass('touch');

        if (isTouch) {

            //
            // Touch events
            //

            $this.on('touchstart', ifEnabled(function(e) {
                var touches = e.originalEvent.touches;
                if (touches.length > 0) {
                    e.stopPropagation();
                    e.preventDefault();
                }
                if (touches.length === 1) {
                    var lastPoint = {x: touches[0].pageX, y: touches[0].pageY};
                    $this.on('touchmove', function(e) {
                        var t = e.originalEvent.touches[0],
                            curPoint = {x: t.pageX, y: t.pageY};

                        moveElt(lastPoint.x, lastPoint.y,
                                curPoint.x, curPoint.y,
                                .75);

                        lastPoint = curPoint;
                        draw();
                    }).on('touchend', function(e) {
                        $this.off('touchmove touchend');
                        lastPoint = null;
                    });
                } else if (touches.length === 2) {
                    var lastGest = {
                        xa: touches[0].pageX, ya: touches[0].pageY,
                        xb: touches[1].pageX, yb: touches[1].pageY
                    };
                    var $w = $(window);
                    var firstGest = {
                        xa: 0, ya: 0,
                        xb: $w.width(), yb: $w.height()
                    };
                    var dist = distance(firstGest);

                    $this.on('touchmove', function(e) {
                        var t = e.originalEvent.touches,
                            curGest = {
                                xa: t[0].pageX, ya: t[0].pageY,
                                xb: t[1].pageX, yb: t[1].pageY
                            },
                            cent = center(curGest),
                            dist0 = distance(lastGest),
                            dist1 = distance(curGest),
                            lastPercent = dist0 / dist,
                            curPercent = dist1 / dist,
                            diff = curPercent / lastPercent;

                        // TODO - this isn't right...
                        scaleElt(cent.x, cent.y, diff);
                        draw();

                    }).on('touchend', function(e) {
                        $this.off('touchmove touchend');
                    });
                }
            }));

        } else {

            //
            // Mouse events
            //

            var mouseDown = false,
                lastPos = null;

            $this.on('mousedown', ifEnabled(function(e) {
                e.preventDefault();
                mouseDown = true;
                lastPos = e.originalEvent;
                $('html').addClass('grabbing'); // GENERALIZE
            })).on('mousemove', ifEnabled(function(e) {
                if (mouseDown) {
                    e.preventDefault();

                    var curPos = e.originalEvent,
                        x0 = lastPos.pageX,
                        y0 = lastPos.pageY,
                        x1 = curPos.pageX,
                        y1 = curPos.pageY;

                    moveElt(x0, y0, x1, y1);
                    draw();

                    lastPos = e.originalEvent;
                }
            }));
        }

        $(window).on('mouseup', function(e) {
            mouseDown = false;
            $('html').removeClass('grabbing'); // GENERALIZE
        });
    });
};
