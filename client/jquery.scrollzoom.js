
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

    var _styles = cfg && cfg.styles;

    return this.each(function() {
        var styles = $.extend({}, $.scrollZoom.defaultStyles, _styles),
            wheelRate = $.scrollZoom.wheelRate,
            $this = $(this);

        function draw() {
            $this.css({
                width: percent(styles.width * styles.scale),
                height: percent(styles.height * styles.scale),
                left: percent(styles.left),
                top: percent(styles.top)
            });
        }

        draw();

        $this.on('mousewheel', function(e) {
            e.preventDefault();
            e.stopPropagation();

            var orig = e.originalEvent,
                offset = $this.offset(),
                xOffset = orig.pageX - offset.left,
                yOffset = orig.pageY - offset.top,
                width = $this.width(),
                height = $this.height(),
                oldScale = styles.scale,
                newScale = oldScale * Math.pow(wheelRate, orig.wheelDelta/120),
                scaleChange = (newScale - oldScale) / oldScale,
                baseWidthScale = styles.width * oldScale,
                baseHeightScale = styles.height * oldScale;

            var nl = styles.left - baseWidthScale * scaleChange * (xOffset/width),
                nt = styles.top - baseHeightScale * scaleChange * (yOffset/height);

            // var ol = styles.left, ot = styles.top;
            // console.log('xOffset', xOffset, 'yOffset', yOffset);
            // console.log('width', width, 'height', height);
            // console.log('xFrac', xOffset/width, 'yFrac', yOffset/height);
            // console.log('oldScale', oldScale, 'newScale', newScale, scaleChange);
            // console.log('left', styles.left, 'top', styles.top);
            // console.log('nl', nl, 'nt', nt);

            $.extend(styles, {
                scale: newScale,
                left: nl,
                top: nt
            });
            draw();
        });

        function ifEnabled(fn) {
            return function(e,x) {
                if (!$this.data(disabledKey) && !$.scrollZoom.disabled) {
                    fn.call(this, e, x);
                }
            };
        }

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
                    y1 = curPos.pageY,
                    dx = x1 - x0,
                    dy = y1 - y0,
                    width = $this.width(),
                    height = $this.height(),
                    scale = styles.scale;

                var nl = styles.left + 100 * (dx / width),
                    nt = styles.top + 100 * (dy / height);

                styles.left = nl;
                styles.top = nt;
                draw();

                lastPos = e.originalEvent;
            }
        }));

        $(window).on('mouseup', function(e) {
            mouseDown = false;
            $('html').removeClass('grabbing'); // GENERALIZE
        });
    });
};
