

NUM_COLUMNS = 12;
NUM_ROWS = NUM_COLUMNS;

IMAGE_SRCS = [
    '/car-exchange.gif',
    '/ben-fly.gif'
];

if (Meteor.isClient) {
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

    Session.set('animateSize', Template.toggles.sizes[0]);

    Template.toggles.events({
        'click #images>a': function(e) {
            e.preventDefault();
            Session.set('animateUrl', this.src);
        },
        'click #sizes>a': function(e) {
            e.preventDefault();
            Session.set('animateSize', this);
        }
    });

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

    Template.viewer.events({
        'click .hoverable': function(e) {
            $(e.target).closest('.hoverable').trigger('toggle.stopgifs');
        }
    });

    var oldAnimateInterval = null;

    Template.viewer.rendered = function() {
        console.log('rendered!!!!!!!!!!!!'); //REM
        //$('#viewer').find('img').stopgifs({hoverAnimate: false});

        Meteor.clearInterval(oldAnimateInterval);

        var size = Session.get('animateSize');
        $('body').attr('class', '').addClass(size.className);

        var first = true,
            curIndex = 0,
            maxIndex = size.columns * size.rows,
            gap = 20,
            intervalTime = 100;
        oldAnimateInterval = Meteor.setInterval(function() {
            return; //REM
            $getPixel(curIndex).trigger('toggle.stopgifs');
            var backIndex = curIndex - gap;
            if (backIndex < 0 && !first) {
                backIndex += maxIndex;
            }
            if (backIndex >= 0) {
                $getPixel(backIndex).trigger('toggle.stopgifs');
            }
            curIndex++;
            if (curIndex >= maxIndex) {
                first = false;
                curIndex = 0;
            }
        }, intervalTime);
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
