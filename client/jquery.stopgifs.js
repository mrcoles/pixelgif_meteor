

// Peter Coles - mrcoles.com - 2013

(function($, window, undefined) {

    $.stopgifs = {
        defaults: {
            hoverAnimate: true, // enable animate during hover
            redrawCanvas: false // redraw canvas on each still
        }
    };

    var cache = {};

    $.fn.stopgifs = function(opts) {
        opts = $.extend({}, $.stopgifs.defaults, opts);

        // no hover animate on touch
        if (navigator.userAgent.match(/(iPhone|iPad)/i)) {
            opts.hoverAnimate = false;
        }

        // put into groups so loading/setup can be optimized
        var srcGroups = {};
        this.hide().each(function() {
            var src = this.getAttribute('src');
            if (!srcGroups[src]) {
                srcGroups[src] = [];
            }
            srcGroups[src].push(this);
        });

        // handle each group
        $.each(srcGroups, function(k, imgs) {
            var $img = $(imgs[0]);

            var $parent = $(imgs).parent(),
                stretch = opts.stretch,
                fit = opts.fit,
                desiredWidth = opts.width ? opts.width : $parent.width(),
                desiredHeight = opts.height ? opts.height : $parent.height(),
                $canvases = $('<canvas>').insertAfter(imgs),
                canvas = $canvases.get(0),
                ctx = canvas.getContext('2d'),
                src = $img.attr('src'),
                cached = cache[src],
                finalWidth, finalHeight, finalImg;

            function drawCanvas($canvas, img) {
                // allow canvas to be drawn at image resolution
                // before inserting
                var $c = $('<canvas>'),
                    c = $c[0],
                    ctx = c.getContext('2d');
                c.width = img.width;
                c.height = img.height;
                ctx.drawImage(img, 0, 0);
                $canvas.replaceWith(c);

                if (finalWidth || finalHeight) {
                    c.width = finalWidth;
                    c.height = finalHeight;
                }
            }

            function updateDims(img) {
                finalImg = img;

                if (stretch) {
                    finalWidth = desiredWidth;
                    finalHeight = desiredHeight;
                } else if (fit) {
                    var w = img.width,
                        h = img.height,
                        ratioW = desiredWidth / w,
                        ratioH = desiredHeight / h,
                        ratio = ratioW < ratioH ? ratioW : ratioH;
                    finalWidth = w * ratio;
                    finalHeight = h * ratio;
                }

                $canvases.each(function() {
                    var $this = $(this),
                        $parent = $this.parent();
                    drawCanvas($this, img);

                    // HACK - if was triggered back on, then start up...
                    if ($parent.data('animating')) {
                        $parent.trigger('animate.stopgifs');
                    }
                });
            }

            $parent
                .on('animate.stopgifs', function(e) {
                    // bug in jquery? bad stuff happens if we don't prevent defaultthis goes through defaults (
                    // fixed in latest jquery #1486, #12518)
                    e.preventDefault();
                    var $this = $(this);
                    $this.find('canvas').hide();
                    $this.find('img').show();
                    $this.data('animating', true);
                })
                .on('still.stopgifs', function() {
                    var $this = $(this),
                        $img = $this.find('img'),
                        $canvas = $this.find('canvas');

                    $this.data('animating', false);

                    if (finalImg && opts.redrawCanvas) {
                        drawCanvas($canvas, finalImg);
                    } else {
                        $this.find('img').hide();
                        $this.find('canvas').show();
                    }
                })
                .on('toggle.stopgifs', function() {
                    var $this = $(this);
                    $this.trigger($this.data('animating') ?
                                    'still.stopgifs' :
                                    'animate.stopgifs');
                });

            if (opts.hoverAnimate) {
                $parent.hover(function() {
                    $(this).trigger('animate.stopgifs');
                }, function() {
                    $(this).trigger('still.stopgifs');
                });
            }

            if (cached) {
                updateDims(cached);
            } else {
                $('<img>', {
                    src: src,
                    load: function() {
                        cache[src] = this;
                        updateDims(cache[src]);
                    },
                    error: function() {
                        console.log('bad image src', src);
                    }
                });
            }
        });

        return this;
    };
})(jQuery, this);
