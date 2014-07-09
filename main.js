
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
            {name: 'tiny', columns: 3, rows: 3, title: 'Small Size'},
            {name: 'small', columns: 9, rows: 9, title: 'Medium Size'},
            {name: 'medium', columns: 27, rows: 27, title: 'Large Size'}
            // {name: 'large', columns: 40, rows: 40, title: 'Large Size'}
            // {name: 'small', columns: 10, rows: 10, title: 'Small Size'},
            // {name: 'medium', columns: 20, rows: 20, title: 'Medium Size'},
            // {name: 'large', columns: 40, rows: 40, title: 'Large Size'}
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
    CanvasSize.set('tiny');


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
        'click #sizes>a': function(e) {
            e.preventDefault();
            Session.set('canvasSize', this);
        },
        'click .tool': function(e) {
            ToolType.set(this.name);
        }
    });

    //
    // Web Images
    //

    function getImages() {
        var images = Session.get('webImages');
        return images ? images.gifs : [];

        // var first = {
        //     title: 'hello',
        //     url: '/hello.gif',
        //     permalink: null,
        //     author: null
        // };
        // var list = [first];
        // if (images && images.gifs) {
        //     list = _.flatten([list, images.gifs]);
        // }
        // return list;
    }

    function getText(diff) {
        return function() {
            var images = getImages(),
                index = (Session.get('imagesIndex') || 0) + diff,
                image = images[index];
            return image ? image.title : '';
        };
    }

    Template.images.prevText = getText(-1);
    Template.images.nextText = getText(1);

    Template.images.curImage = function() {
        return Session.get('animateUrl');
    };

    var helpers = {
        authorLink: function(author) {
            return 'http://www.reddit.com/user/' + author;
        },
        redditLink: function(permalink) {
            return 'http://www.reddit.com' + permalink;
        }
    };

    Template.images.helpers(helpers);
    Template.currentImage.helpers(helpers);

    Template.images.events({
        'click .image': function(e) {
            e.preventDefault();
            Session.set('animateUrl', this);
        },
        'click .next, click .prev': function(e) {
            var diff = $(e.target).closest('.prev').size() ? -1 : 1,
                index = (Session.get('imagesIndex') || 0) + diff,
                webImages = getImages();

            if (index < webImages.length) {
                Session.set('imagesIndex', index);
                Session.set('animateUrl', webImages[index]);
            }
        }
    });

    Meteor.startup(function() {
        Meteor.call('webImages', function(error, results) {
            Session.set('webImages', results);
            var images = getImages();
            Session.set('animateUrl', images[0]);
        });
    });


    //
    // Viewer
    //

    Template.viewer.images = function() {
        var size = Session.get('canvasSize');
        var url = Session.get('animateUrl');
        if (url) {
            return _.map(_.range(size.columns * size.rows), function(x) {
                return {src: url.url};
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

    var loadedFirstImg = false;

    Template.viewer.events({
        'click .hoverable': _draw(function(e) {
            $(e.target).closest('.hoverable').trigger('toggle.stopgifs');
        }),
        'load img': function(e) {
            if (!loadedFirstImg) {
                $('html').addClass('loaded');
                loadedFirstImg = true;
            }
        }
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
        var mouseDown = false;

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
        var $imgs = $('#viewer').find('img');

        $($imgs[Math.ceil($imgs.size()/2)-1]).parent().data('animating', true); // .trigger('animate.stopgifs');
        $imgs.stopgifs({hoverAnimate: false});

        var size = Session.get('canvasSize');
        $('body').attr('class', '').addClass(size.className);

        var scrollStyles = {
            top: 5,
            left: 5,
            width: 90,
            height: 90
        };

        // if "wide" is a query string parameter
        if (/(^|&)wide(&|$)/.test(window.location.href.split('?')[1])) {
            scrollStyles = {
                top: -20,
                left: -20,
                width: 140,
                height: 140
            };
        }

        $('#viewer').scrollZoom({
            styles: scrollStyles
        });
    };

    function $getPixel(index, y, numColumns) {
        index = y === undefined ? index : y * numColumns + index;
        return $('#viewer').find('.hoverable:eq('+index+')');
    }

    // Meteor.startup(function() {
    //     // setup key codes
    //     var codeMap = {};
    //     _.each('Q W E A S D Z X C'.split(' '), function(letter, i) {
    //         var code = String.charCodeAt(letter);
    //         codeMap[code] = i;
    //     });
    //     $(window).on('keyup', function(e) {
    //         var index = codeMap[e.keyCode];
    //         if (index !== undefined) {
    //             $('#viewer')
    //                 .find('.hoverable:eq(' + index + ')')
    //                 .trigger('toggle.stopgifs');
    //         }
    //     });
    // });
}

if (Meteor.isServer) {
    Meteor.startup(function () {
        // code to run on server at startup
    });

    Meteor.methods({
        webImages: function() {
            this.unblock();

            var urls = [
                'http://www.reddit.com/r/perfectLoops.json',
                'http://www.reddit.com/r/woahdude.json',
                'http://www.reddit.com/r/gifs.json'
            ];

            var results = [];

            urls.forEach(function(url) {

                if (results.length > 1) {
                    return;
                }

                var resp = Meteor.http.call('GET', url);
                var _rImgur = /^https?:\/\/([^\/]*\.)?imgur.com/i;
                var _rSuffix = /\.[^\/]+$/i;

                // filter out "bad" posts that aren't gifs
                var gifs = _.filter(resp.data.data.children, function(x) {
                    return ((x.data.link_flair_text == 'gif' ||
                             x.data.subreddit == 'gifs' ||
                             x.data.subreddit == 'perfectloops'
                            ) &&
                            !/imgur\.com\/a\//.test(x.data.url) &&
                           _rImgur.test(x.data.url));
                });

                // clean up results
                gifs = _.map(gifs, function(x) {

                    // extra work to cleanup imgur urls
                    var image = x.data.url;
                    if (_rImgur.test(image) && !_rSuffix.test(image)) {
                        var t = image.split('/').pop();
                        x.data.url = 'http://i.imgur.com/' + t + '.gif';
                    }

                    return x.data;
                });

                results.push.apply(results, gifs);
            });

            return {gifs: results};
        }
    });
}
