
$.scrollZoom = {
    wheelRate: 1.01,
    defaultStyles: {
        width: 110,
        height: 110,
        scale: 1,
        left: -5,
        top: -5
    }
};


$.fn.scrollZoom = function() {
    function percent(x) {
        return x + '%';
    }

    return this.each(function(styles) {
        styles = $.extend({}, $.scrollZoom.defaultStyles, styles);

        var wheelRate = $.scrollZoom.wheelRate,
            $this = $(this);

        function draw() {
            $this.css({
                width: percent(styles.width * styles.scale),
                height: percent(styles.height * styles.scale),
                left: percent(styles.left),
                top: percent(styles.top)
            });
        }

        $.extend(styles, { //REM
            top: 5, left: 5, width: 90, height: 90
        });
        draw(); //REM

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

            window._e = e; //REM
            //REMconsole.log('wheel', orig.pageX, orig.pageY, 'scale', scaleChange, 'offset', xOffset/width, ol, ot, nl, nt); //REM

            draw();
            //REMconsole.log('drawn!', s1, styles.scale); //REM
        });
    });
};