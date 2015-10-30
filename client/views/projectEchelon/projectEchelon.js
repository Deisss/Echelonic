// Scoped var
var currentPropertyTemplate = null;

Template.projectEchelon.onRendered(function() {
    $('#canvas-echelons').perfectScrollbar({
        minScrollbarLength: 20
    });

    // TODO: implements the touch events...
    // Transfert keypress
    $('#canvas-mask').on('mouseenter', function (e) {
        $('#canvas-echelons').addClass('hover');
    });
    $('#canvas-mask').on('mouseleave', function (e) {
        $('#canvas-echelons').removeClass('hover');
    });

    // As wheel event is now the official, and mousewheel event is old
    // we only take care of wheel event...
    $('#canvas-mask').on('wheel', function (e) {
        var ee = e.originalEvent,
            root = $('#canvas-echelons');

        if (ee.deltaY) {
            root.scrollTop(root.scrollTop() + (ee.deltaY / Math.abs(ee.deltaY)) * 100);
        }
        if (ee.deltaX) {
            root.scrollLeft(root.scrollLeft() + (ee.deltaX / Math.abs(ee.deltaX)) * 100);
        }
    });

    $('#canvas-mask').on('keydown keypress keyup', function (e) {
        // Faking selection so perfectScrollbar will catch event
        // as expected
        $('#canvas-echelons').focus();
        $('#canvas-echelons').trigger(e.type, e);
    });

    // Beginning of touch events
    var initScrollTop = 0,
        initScrolLeft = 0,
        initTop = 0,
        initLeft = 0;

    $('#canvas-mask').on('touchstart', function (e) {
        $('#canvas-echelons').addClass('hover');
        var orig = e.originalEvent;
        initLeft = parseInt(orig.changedTouches[0].clientX, 10);
        initTop = parseInt(orig.changedTouches[0].clientY, 10);
        initScrolLeft = $('#canvas-echelons').scrollLeft();
        initScrollTop = $('#canvas-echelons').scrollTop();
        e.preventDefault();
    });
    $('#canvas-mask').on('touchmove', function (e) {
        var orig = e.originalEvent,
            distanceLeft = parseInt(orig.changedTouches[0].clientX, 10) - initLeft,
            distanceTop = parseInt(orig.changedTouches[0].clientY, 10) - initTop;
        $('#canvas-echelons').scrollLeft(initScrolLeft - distanceLeft);
        $('#canvas-echelons').scrollTop(initScrollTop - distanceTop);
        e.preventDefault();
    });
    $('#canvas-mask').on('touchend', function (e) {
        $('#canvas-echelons').removeClass('hover');
        var orig = e.originalEvent;
        initScrollTop = 0;
        initScrolLeft = 0;
        initTop = 0;
        initLeft = 0;
        e.preventDefault();
    });

    /**
     * When something change, we ask the scrollbar to update
    */
    echelons.onUpdate = function(el) {
        $('#canvas-echelons').perfectScrollbar('update');
    };


    // Wait for an HTML element to exists, and when it exists, call callback
    function waitElementExists(id, data, counter, callback) {
        var el = document.getElementById(id);

        // In some case, we may need to exit...
        // We can wait approx 3 min until shut it down
        if (counter >= 2000) {
            return;
        }

        if (!el) {
            var that = this;
            window.setTimeout(function() {
                waitElementExists.call(that, id, data, counter + 1, callback);
            }, 100);
        } else if (typeof(callback) === 'function') {
            callback.call(this, el, data);
        }
    };

    // The function helps to avoid having cycle in the graphic
    echelons.onBeforeDropConnection = function (connection) {
        var sourceId = $('#' + connection.sourceId).attr('data-id'),
            targetId = $('#' + connection.targetId).attr('data-id');

        // We get all echelons existing
        var echelons = Echelons.find({
            projectId: Router.current().params._id,
            deletedAt: null
        }, {
            fields: {
                _id: 1,
                links: 1
            }
        }).fetch();

        // Now we add the new connection like if it exists currently
        var sourceEchelon = _.findWhere(echelons, {_id: sourceId});

        // Should be always true of course...
        if (sourceEchelon) {
            sourceEchelon.links.push(targetId);

            // If there is cycle/loop, toposort will send back null value
            if (Toposort(echelons) === null) {
                $('#modal-toposort-cycle').modal('show');
                return false;
            }
        }

        return true;
    };

    // Starting jsPlumb
    echelons.start('canvas-echelons');

    // Everytime an echelon is created, we register it to jsPlumb
    events.on('echelon:create', function (evt, data) {
        waitElementExists('echelon-' + data._id, data, 0, function(el, dat) {
            echelons.register(el);
        });
    });

    /*
     * ----------------------------------
     *   ECHELON EVENTS
     * ----------------------------------
    */
    events.on('echelon:move', function (evt, data) {
        Meteor.call('moveEchelon', Router.current().params._id, data._id,
            parseInt(data.top, 10), parseInt(data.left));
    });

    events.on('echelon:delete', function (evt, data) {
        // TODO: check how to delete properly
        // TODO: also check what's inside data...
    });

    events.on('echelon:render', function (evt, data) {
        var source = document.getElementById('echelon-' + data._id);

        // Create if not existing our temp store
        if (!echelons.connections[data._id]) {
            echelons.connections[data._id] = [];
        }

        // Get the elements which needs to be created
        var created = _.difference(data.links, echelons.connections[data._id]),
            deleted = _.difference(echelons.connections[data._id], data.links);

        // We need to create thoose
        for (var i = 0, l = created.length; i < l; ++i) {
            var target = document.getElementById('echelon-' + created[i]);
            if (source && target) {
                echelons.connect(source, target);
            }
        }

        // We need to delete thoose
        for (var i = 0, l = deleted.length; i < l; ++i) {
            var target = document.getElementById('echelon-' + deleted[i]);
            if (source && target) {
                echelons.disconnect(source, target);
            }
        }

        // We update tmp
        echelons.connections[data._id] = data.links;


        // We finally ask for a repaint
        echelons.refresh();
        setTimeout(function() {
            echelons.refresh();
        }, 100);
    });

    // TODO: events to do
    events.on('echelon:select', function (evt, data) {

    });

    /*
     * ----------------------------------
     *   LINK EVENTS
     * ----------------------------------
    */
    events.on('connector:create', function (evt, data) {
        Meteor.call('addConnector', Router.current().params._id, data.sourceId,
                data.targetId);
    });

    events.on('connector:move', function (evt, data) {
        Meteor.call('moveConnector', Router.current().params._id,
            data.oldSourceId, data.oldTargetId, data.newSourceId,
            data.newTargetId);
    });

    events.on('connector:delete', function (evt, data) {
        Meteor.call('deleteConnector', Router.current().params._id,
                data.sourceId, data.targetId);
    });
});

Template.projectEchelon.onDestroyed(function () {
    // Destroying instance
    echelons.stop();
});

Template.projectEchelon.helpers({
    echelons: function() {
        return Echelons.find({
            projectId: Router.current().params._id,
            deletedAt: null
        });
    }
});

Template.projectEchelon.events({
    // Prevent creating an echelon when we double click on it...
    'dblclick #canvas-echelons .echelon': function (e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    },
    // See an echelon
    'click #canvas-echelons': function (e) {
        var target = $(e.target).closest('.echelon');
        // When we double click on an echelon, we load it's content
        if (target) {
            var id = target.attr('data-id'),
                container = $('.menuProject .tab-property');

            var echelon = Echelons.findOne({
                _id: id,
                deletedAt: null
            });

            if (echelon && echelon.isBegin) {
                if (currentPropertyTemplate) {
                    UI.remove(currentPropertyTemplate);
                }
                container.empty();
                currentPropertyTemplate = UI.renderWithData(Template.echelonBeginProperty, echelon, container.get(0));
                // Select the right tab
                $('.menuProject .menuEchelon .item[data-tab="properties"]').trigger('click');
            } else if (echelon && echelon.isEnd) {
                if (currentPropertyTemplate) {
                    UI.remove(currentPropertyTemplate);
                }
                container.empty();
                currentPropertyTemplate = UI.renderWithData(Template.echelonEndProperty, echelon, container.get(0));
                // Select the right tab
                $('.menuProject .menuEchelon .item[data-tab="properties"]').trigger('click');
            } else if (echelon) {
                if (currentPropertyTemplate) {
                    UI.remove(currentPropertyTemplate);
                }
                container.empty();
                currentPropertyTemplate = UI.renderWithData(Template.echelonProperty, echelon, container.get(0));
                // Select the right tab
                $('.menuProject .menuEchelon .item[data-tab="properties"]').trigger('click');
            }
        }
    },
    // Click on the mask (only user can do that)
    'click #canvas-mask': function(e) {
        var mask = $(e.target);

        try {
            mask.hide();
            var element = document.elementFromPoint(e.pageX, e.pageY);
            element = (element.nodeType == 3) ? element.parentNode: element; // opera
            $(element).trigger(e.type, e);
        } catch(err) {
        } finally {
            mask.show();
        }
    },
    // Click on alert (only user can do that)
    'click .alert .close': function(e) {
        $(e.target).closest('.alert').fadeOut('normal');
    },
    // Create a new echelon
    'dblclick #canvas-echelons': function(e) {
        // When we double click on an echelon, we load it's content
        if ($(e.target).hasClass('echelon')) {
            console.log('Loading content of echelon ' + $(e.target).attr('data-id'));
            return;
        }

        // After that, it's only allowed for administrators
        if (!this.project.isAdmin(Meteor.userId())) {
            return;
        }

        var canvas = $('#canvas-echelons'),
            offset = canvas.offset(),
            left = e.pageX - offset.left + canvas.scrollLeft(),
            top = e.pageY - offset.top + canvas.scrollTop();

        // Creating echelon on database, then it will populate automatically
        // on every clients
        Meteor.call('addEchelon', Router.current().params._id, 
            parseInt(top, 10), parseInt(left, 10), 'New Echelon', '');
    }
});