/**
 * jsPlumb overlay to control Echelon system.
 * This class has the particularity to be resilient if jsPlumb takes time to
 * start, it can delay any operation if needed, allowing to never skip any
 * call to jsPlumb.
*/
window.echelons = {
    /**
     * The root element, a jQuery element designing the base canvas to draw in
    */
    root: null,

    /**
     * The jsPlumb instance.
    */
    instance: null,

    /**
     * Echelons already registered and ready.
    */
    echelons: [],

    /**
     * Everytime the system parse connections, we keep a trace
     * of previously parsed connections, it helps to know which one
     * we need to draw or not...
    */
    connections: {},

    /**
     * Can be used to allow -or not- a new connection arriving. This must
     * be a function with a single parameter: the connection correctly
     * created.
    */
    onBeforeDropConnection: null,

    /**
     * When user call for a refresh of the graphic, apply this function right
     * after.
    */
    onUpdate: null,

    /**
     * Starting a new jsPlumb at specified root location.
     * NOTE: this class can handle only a single jsPlumb instance at a time...
     *
     * @param root {String}                 MUST BE a string id, without '#'
    */
    start: function(root) {
        this.root = $('#' + root);
        var that = this;

        jsPlumb.ready(function() {
            that.instance = jsPlumb.getInstance({
                Endpoint: ['Dot', {
                    radius: 5
                }],
                HoverPaintStyle: {
                    strokeStyle: '#dc8d59'
                },
                ConnectionOverlays: [
                    ['Arrow', {
                        location: 1,
                        id: 'arrow',
                        length: 8,
                        width: 14,
                        foldback: 0.8
                    }]
                ],
                Container: root
            });



            // Bind many event related to connection, only jsPlumb can do it
            // But it's better that logic is on projectEchelon, so only an
            // event start from here...

            that.instance.bind('connection', function (info, mouseEvent) {
                // We allow to register this event only one, at first
                // creation! Not after, there is other events for...
                var ecp = info.connection.getParameter('_ec_p');

                // We check it's the first time wee see this event
                if (typeof(ecp) === 'undefined' || ecp === null) {
                    info.connection.setParameter('_ec_p', true);
                } else {
                    return;
                }

                // We check it's an event from user, not an event from server
                if (typeof(mouseEvent) !== 'undefined') {
                    var sourceId = $(info.source).attr('data-id'),
                        targetId = $(info.target).attr('data-id');

                    events.fire('connector:create', [{
                        sourceId: sourceId,
                        targetId: targetId
                    }]);
                }
            });

            that.instance.bind('connectionDetached', function (info) {
                var sourceId = $(info.source).attr('data-id'),
                    targetId = $(info.target).attr('data-id');

                events.fire('connector:delete', [{
                    sourceId: sourceId,
                    targetId: targetId
                }]);
            });

            that.instance.bind('connectionMoved', function (info) {
                var newSourceId = $('#' + info.newSourceId).attr('data-id'),
                    newTargetId = $('#' + info.newTargetId).attr('data-id'),
                    oldSourceId = $('#' + info.originalSourceId).attr('data-id'),
                    oldTargetId = $('#' + info.originalTargetId).attr('data-id');

                events.fire('connector:move', [{
                    newSourceId: newSourceId,
                    newTargetId: newTargetId,
                    oldSourceId: oldSourceId,
                    oldTargetId: oldTargetId
                }]);
            });

            that.instance.bind('beforeDrop', function (connection) {
                if (typeof(that.onBeforeDropConnection) === 'function') {
                    return that.onBeforeDropConnection(connection);
                }
                return true;
            });

            // Fire load
            jsPlumb.fire('EchelonsLoaded', that.instance);
        });
    },

    /**
     * Destroy an existing instance
    */
    stop: function() {
        if (this.instance) {
            this.instance.reset();
            this.root = null;
            this.instance = null;
            this.echelons = [];
            this.connections = {};
            this.onBeforeDropConnection = null;
        }
    },

    /**
     * Suspend drawing.
    */
    suspend: function() {
        if (this.instance) {
            this.instance.setSuspendDrawing(true);
        }
    },

    /**
     * Resume drawing.
    */
    resume: function() {
        if (this.instance) {
            this.instance.setSuspendDrawing(false, true);
        }
    },

    /**
     * INTERNAL USE ONLY
     *
     * Delay the call of any function using it, if jsPlumb is not ready. In 
     * this case, the system will try to start everything again in 200ms, and,
     * if it's still not ready, will continue to delay 200ms, until OK.
     *
     * @param func {String}                 The function string name to call
     *                                      again in 200ms
     * @param params {Array | Null}         The parameters associated to start
     *                                      again the call...
    */
    notYetReady: function(func, params) {
        var that = this;
        window.setTimeout(function() {
            var fct = window.echelons[func];
            fct.apply(that, params || []);
        }, 200);
    },

    /**
     * Ask for a full refresh of the graphic.
    */
    refresh: function(el) {
        if (!this.instance) {
            this.notYetReady('refresh', el);
            return;
        }
        if (el) {
            this.instance.repaint(el);
            if (typeof(this.onUpdate) === 'function') {
                this.onUpdate(el);
            }
        } else {
            this.instance.repaintEverything();
            if (typeof(this.onUpdate) === 'function') {
                this.onUpdate();
            }
        }
    },

    /**
     * Register a div or something as a Echelon related: can move, can bind
     * arrow from others and to others echelons, ...
     *
     * @param el {DOMElement}               Any element that represent a DOM
     *                                      element, like object you get when
     *                                      calling document.getElementById is
     *                                      perfect candidate...
    */
    register: function(el) {
        if (!this.instance) {
            this.notYetReady('register', [el]);
            return;
        }
        var jqel = (el instanceof jQuery) ? el: jQuery(el);

        // Already parsed
        if (_.contains(this.echelons, jqel.attr('data-id'))) {
            return;
        }

        this.instance.draggable(el, {
            drag: function(e, ui) {
                // TODO: maybe one day we will be able to live dragging also
                // for now it's time consuming for no reason...
                /*var position = jqel.position();
                events.fire('echelon:move', [{_id: jqel.attr('data-id'), top: position.top, left: position.left, stop: false}]);*/
            },
            stop: function() {
                // When the drag stop, we raise an event for that...
                var position = jqel.position(),
                    scrollLeft = echelons.root.scrollLeft(),
                    scrollTop  = echelons.root.scrollTop();
                events.fire('echelon:move', [{
                    _id: jqel.attr('data-id'), 
                    top: position.top + scrollTop,
                    left: position.left + scrollLeft,
                    stop: true
                }]);
            }
        });

        this.instance.makeSource(el, {
            filter: '.connector-creator',
            anchor: 'Continuous',
            connector: ['Flowchart', {
                stub: [40, 60],
                gap: 10,
                cornerRadius: 10,
                alwaysRespectStubs: true
            }],
            connectorStyle: {
                strokeStyle: '#5c96bc',
                lineWidth: 4,
                outlineColor: 'white',
                outlineWidth: 2
            },
            maxConnections: 128,
            onMaxConnections: function (info, e) {
                $('#modal-max-connections').modal('show');
            }
        });

        // initialise all '.w' elements as connection targets.
        this.instance.makeTarget(el, {
            dropOptions: {
                hoverClass: 'dragHover'
            },
            anchor: 'Continuous',
            allowLoopback: true
        });

        // Register as ready
        this.echelons.push(jqel.attr('data-id'));
    },

    /**
     * Add a new echelon: will create it (create the DOM for), and register
     * it as an Echelon...
     *
     * @param _id {String}                  A unique id (should come from
     *                                      server side).
     * @param top {Integer}                 Top position, in pixel related to
     *                                      top/left corner.
     * @param left {Integer}                Left position, in pixel, related to
     *                                      top/left corner.
     * @param title {String}                The echelon content.
    */
    add: function(_id, top, left, title) {
        if (!this.instance) {
            this.notYetReady('add', [_id, top, left, title]);
            return;
        }
        UI.renderWithData(Template.echelonBloc, {
            _id: _id,
            top: top,
            left: left,
            title: title
        }, this.root.get(0));

        // Now we bind it...
        var el = this.root.find('#echelon-' + _id).get(0);
        this.register(el);
    },

    /**
     * Connect two echelon together.
     *
     * @param source {Object}               The first echelon to connect with
     *                                      second (= parent)
     * @param target {Object}               The second echelon to recieve first
     *                                      (= child)
    */
    connect: function(source, target) {
        if (!this.instance) {
            this.notYetReady('connect', [source, target]);
            return;
        }

        // Only a single connection is allowed...
        // This also prevent a bug which create two connections (one with
        // mouse, and one with server...)
        var connections = this.instance.getConnections({
            source: source,
            target: target
        });
        if (connections.length > 0) {
            return;
        }

        if (! (source instanceof jQuery)) {
            source = $(source);
        }
        if (! (target instanceof jQuery)) {
            target = $(target);
        }

        this.instance.connect({
            source: source.attr('id'),
            target: target.attr('id'),
            anchor: 'Continuous',
            connector: ['Flowchart', {
                stub: [40, 60],
                gap: 10,
                cornerRadius: 10,
                alwaysRespectStubs: true
            }],
            paintStyle: {
                strokeStyle: '#5c96bc',
                lineWidth: 4,
                outlineColor: 'white',
                outlineWidth: 2
            },
        });
    },

    /**
     * Disconnect a link between a two echelon.
     *
     * @param source {Object}               The source echelon to disconnect
     * @param target {Object}               The target echelon
    */
    disconnect: function(source, target) {
        if (!this.instance) {
            this.notYetReady('disconnect', [source, target]);
            return;
        }

        var connections = this.instance.getConnections({
            source: source,
            target: target
        });

        for (var i = 0, l = connections.length; i < l; ++i) {
            this.instance.detach(connections[i]);
        }
    }
};