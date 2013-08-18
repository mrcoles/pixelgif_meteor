

// Peter Coles - mrcoles.com - 2013

(function($, window, undefined) {

    $.stopgifs = {
        defaults: {
            hoverAnimate: true // enable animate during hover
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
                cached = cache[src];

            function updateDims(img) {
                var finalWidth, finalHeight;

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
                    // this.width = finalWidth;
                    // this.height = finalHeight;
                    // var ctx = this.getContext('2d');
                    // ctx.clearRect(0, 0, img.width, img.height);
                    // ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

                    var $c = $('<canvas>'),
                        c = $c[0],
                        ctx = c.getContext('2d');
                    c.width = img.width;
                    c.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    $(this).replaceWith(c);

                    if (finalWidth || finalHeight) {
                        c.width = finalWidth;
                        c.height = finalHeight;
                    }
                });
            }

            $parent
                .on('animate.stopgifs', function() {
                    var $this = $(this);
                    $this.find('canvas').hide();
                    $this.find('img').show();
                    $this.data('animating', true);
                })
                .on('still.stopgifs', function() {
                    var $this = $(this);
                    $this.find('img').hide();
                    $this.find('canvas').show();
                    $this.data('animating', false);
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
