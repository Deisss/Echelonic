(function() {
    var list = null,
        lastLoaded = null;

    /**
     * Ask Meteor.JS to grab more messages of this discussion.
     *
     * @param limit {Integer | Null}        The new limit to set, 50 by default 
    */
    function increateChatLimit(limit) {
        limit = limit || 50;
        Session.set('project-message:limit', Session.get('project-message:limit') + limit);
        Meteor.subscribe('projectMessages', Router.current().params._id, Session.get('project-message:limit'), {
            onReady: function() {
                // We place the scroll to previous loaded button
                list.scrollTop(lastLoaded.offset().top);
            }
        });
    }

    /**
     * Send an addMessage command to server.
     *
     * @param message {String}                   The message to send
     * @param errorFunction {Function | Null}    The error function
     * @param successFunction {Function | Null}  The success function
    */
    function addMessage(message, errorFunction, successFunction) {
        if (message) {
            Meteor.call('addMessage', Router.current().params._id, message, function (error, result) {
                if (!error) {
                    if (typeof(successFunction) === 'function') {
                        successFunction(error, result);
                    }
                } else if(typeof(errorFunction) === 'function') {
                    errorFunction(error, result);
                }
            });
        }
    }

    /**
     * Check the autoscroll load possibility. The autoscroll load is
     * responsible for extending the message list with previous messages.
     * This can be done once every 2 seconds, for avoiding too much recursion.
    */
    var last = parseInt((new Date()).getTime() / 1000, 10);
    function isReadyToLoad() {
        var current = parseInt((new Date()).getTime() / 1000, 10);
        // We allow loading old post every two seconds, not better
        if (last < (current - 2)) {
            last = parseInt((new Date()).getTime() / 1000, 10);
            return true;
        }
        return false;
    }

    /**
     * Check if message is visible by user or not. This helps to determine
     * if message should be marked as seen or not.
     *
     * @param parent {Object}               The parent (should be the list)
     * @param child {Object}                The child (should be a message)
    */
    function isMessageVisible(parent, child) {
        if (! (child instanceof jQuery)) {
            child = $(child);
        }
        if (! (parent instanceof jQuery)) {
            parent = $(parent);
        }

        // First, we check if element is seeable (not display: none...)
        if (!parent.is(':visible') || !child.is(':visible')) {
            return false;
        }

        // Detect if element is visible or not, can only work in some case
        // The good point, is that "some" is most of times :D
        var parentTop    = parent.offset().top,
            parentBottom = parentTop + parent.height(),
            childTop     = child.offset().top,
            childBottom  = childTop + child.height();

        return (
            (childTop >= parentTop && childTop <= parentBottom) ||
            (childBottom >= parentTop && childBottom <= parentBottom)
        );
    }

    /**
     * Check if any unseen message should be marked as seen.
    */
    function checkMessageVisible() {
        // We defer check
        window.setTimeout(function() {
            var list = $('.tab-chat .list');
            list.children('.unseen').each(function() {
                var that = $(this);
                if (isMessageVisible(list, that)) {
                    window.bufferSeen.add('message', that.attr('data-id'));
                    that.removeClass('unseen');
                }
            });
        }, 0);
    }





    Template.chatTab.onRendered(function() {
        /*
         * -------------------------
         *   REGISTER UNSEEN
         * -------------------------
        */
        window.bufferSeen.register('message', function(messagesIds) {
            Meteor.call('seenMessages', Router.current().params._id, messagesIds);
        });

        /*
         * -------------------------
         *   INFINITE SCROLL
         * -------------------------
        */
        // Scroll infinite load (the loading can appears only once per second)
        list = this.$('.tab-chat .list');
        list.scroll(function() {
            var that = $(this);

            // We are arriving at the top of chat, we load next part (if any)
            if (that.scrollTop() < 100 && isReadyToLoad()) {
                // We keep the last id loaded
                lastLoaded = list.find('.button').next();

                // We defer loading
                window.setTimeout(function () {
                    list.find('.button').addClass('loading');
                    increateChatLimit();
                }, 0);
            }

            // Every messages which are "unseen" will be marked seen while
            // scrolling
            checkMessageVisible();
        });

        /*
         * -------------------------
         *   FIRST SCROLL PLACEMENT
         * -------------------------
        */
        // We place the scrollTop at the end of div, on first time
        // seeing the chat
        var first = true;
        events.on('menu:tab:change', function(evt, tab) {
            // On first chat tab activation
            if (tab === 'chat' && first) {
                list.scrollTop(list[0].scrollHeight);
                // Setting the right height
                list.css('max-height', $(window).height() - $('.tab-chat').offset().top - 60 + 'px');
                first = false;
                // We check if any message should be marked as visible
                checkMessageVisible();
            }
        });

        /*
         * -------------------------
         *   NEW MESSAGE SCROLL
         * -------------------------
        */
        // We bind the new message creation, to the scrollTop system
        events.on('chat:message', function(evt, message) {
            // We auto-scroll only if user is close to latest message
            if ((list.scrollTop() + list.height()) > (list[0].scrollHeight - 20)) {
                var scrollToTop = function() {
                    list.scrollTop(list[0].scrollHeight);
                    checkMessageVisible();
                };

                window.setTimeout(scrollToTop, 50);
                window.setTimeout(scrollToTop, 150);
            }

            // When a message arrives, it means the loading finish
            list.find('.button').removeClass('loading');
        });

        /*
         * -------------------------
         *   BETTER SCROLL SYSTEM
         * -------------------------
        */
        // On window height, we refresh...
        $(window).on('resize', function() {
            if (!first) {
                list.css('max-height', $(window).height() - $('.tab-chat').offset().top - 60 + 'px');
                list.perfectScrollbar('update');
            }
        });
        list.perfectScrollbar({
            minScrollbarLength: 20
        });

        // Simple popup
        this.$('.tab-chat .input .button.orange').popup();
    });

    Template.chatTab.onDestroyed(function () {
        $(window).off('resize');
        this.$('.tab-chat .input .button.orange').popup('destroy');
    });

    Template.chatTab.helpers({
        messages: function() {
            if (!Session.get('project-message:limit')) {
                Session.setDefault('project-message:limit', 50);
            }

            var query = {
                projectId: Router.current().params._id,
                isGlobal: true,
                deletedAt: null
            };

            var limit = Session.get('project-message:limit'),
                count = Messages.find(query).count(),
                skip  = count - limit;

            if (limit > count) {
                limit = 0;
                skip  = 0;
            }

            return Messages.find(query, {
                limit: limit,
                skip: skip,
                sort: [['createdAt', 'asc']]
            });
        }
    });

    Template.chatTab.events({
        'click .tab-chat .list .button': function() {
            lastLoaded = list.find('.button').next();
            list.find('.button').addClass('loading');
            increateChatLimit();
        },
        'click .tab-chat .input .button.orange': function() {
            var root = $('.tab-chat .input input'),
                message = root.val();

            addMessage(root.val(), null, function (error, result) {
                root.val('');
            });
        },
        'keypress .tab-chat .input input': function(e) {
            e = e || window.event || {};
            var charCode = e.charCode || e.keyCode || e.which;

            if (charCode === 13) {
                var root = $('.tab-chat .input input'),
                    message = root.val();

                addMessage(root.val(), null, function (error, result) {
                    root.val('');
                });
            }
        }
    });
})();