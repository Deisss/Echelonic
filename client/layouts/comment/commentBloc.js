Template.commentBloc.onRendered(function() {
    var that = this;
    this.autorun(function() {
        var route  = Router.current().route.getName(),
            params = Router.current().params;

        if (route !== 'taskSee') {
            alert('Please update code in commentBloc/main comments for supporting this route...');
        } else {
            if (!Session.get('task-comment:' + params._tid + ':limit')) {
                Session.setDefault('task-comment:' + params._tid + ':limit', 4);
            }
            var limit = Session.get('task-comment:' + params._tid + ':limit');

            that.subscribe('commentsCount', params._id, params._eid, params._tid, 'task');
            // Task related - does not need to be on subs and cached...
            that.subscribe('comments', params._id, params._eid, params._tid, 'task', limit);
        }
    });

    function onResize() {
        var root = $('.commentBloc'),
            compute = $(window).height() - root.offset().top - 60;

        // min height
        if (compute < 60) {
            compute = 60;
        }
        root.css('max-height', compute + 'px');
        root.perfectScrollbar('update');
    }

    $(window).on('resize', onResize);
    onResize();
    setTimeout(onResize, 100);
    setTimeout(onResize, 200);
    setTimeout(onResize, 500);
    setTimeout(onResize, 1000);

    $('.commentBloc').perfectScrollbar({
        minScrollbarLength: 20
    });
});

Template.commentBloc.onDestroyed(function() {
    $(window).off('resize');
});

Template.commentBloc.helpers({
    md5MyselfPrettyEmail: function () {
        var user = Meteor.users.findOne(Meteor.userId());

        if (user === null || typeof(user) === 'undefined') {
            return md5('');
        }

        if (user.emails && user.emails[0].address) {
            return md5(user.emails[0].address);
        } else if (user.email) {
            return md5(user.email);
        } else {
            return md5('');
        }
    },
    hasMoreComments: function(comments) {
        var counter = Counts.get('commentsCount');
        return (counter > comments.length);
    },
    // Same as getPublishedCount, but with a limit
    getLimitCount: function(comments, maximum) {
        if (!maximum || maximum < 0 || !isFinite(maximum)) {
            maximum = 50;
        }
        var counter = Counts.get('commentsCount'),
            subs = counter - comments.length;
        return (subs > maximum) ? '' + maximum + '+' : subs;
    }
});

Template.commentBloc.events({
    // Global comments add
    'keydown .mainComment input': function(e) {
        var key = e.keyCode || e.which;
        if (key === 13) {
            var comment   = $(e.target).val(),
                route      = Router.current().route.getName(),
                projectId  = Router.current().params._id,
                echelonId  = Router.current().params._eid,
                resourceId = null,
                type       = null;

            if (route === 'taskSee') {
                type = 'task';
                resourceId = Router.current().params._tid;
            } else {
                alert('Please update code in commentBloc/main comments for supporting this route...');
            }

            if (comment) {
                Meteor.call('addComment', projectId, echelonId, resourceId, type, comment, null, function (error, result) {
                    if (error) {
                        FlashMessages.sendError('Error while adding comment: ' + error);
                    } else {
                        $(e.target).val('');
                    }
                });
            } else {
                $('#modal-comment-empty').first().modal('show');
            }
        }
    },
    // Global comments load more
    'click .commentBloc .loadMore': function(e) {
        var route  = Router.current().route.getName(),
            params = Router.current().params;

        if (route !== 'taskSee') {
            alert('Please update code in commentBloc/main comments for supporting this route...');
        }

        var id = params._tid;
        if (!Session.get('task-comment:' + id + ':limit')) {
            Session.setDefault('task-comment:' + id + ':limit', 4);
        }
        Session.set('task-comment:' + id + ':limit', Session.get('task-comment:' + id + ':limit') + 5);

        setTimeout(function() {
            $('.commentBloc').perfectScrollbar('update');
        }, 100);
    }
});