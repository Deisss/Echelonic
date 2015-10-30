Template.commentMessage.onCreated(function() {
    var name = Router.current().route.getName();

    if (name !== 'taskSee') {
        // Note: support for like/dislike functions, and various reply events
        alert('Please update code in commentMessage for supporting this route...');
    }
});

Template.commentMessage.helpers({
    // Add to an element a new property "isChildren" indicating it's the top
    // level and should not have any children attached to it.
    addIsChildren: function (scope) {
        scope.isChildren = true;
    },
    // Does the current comment has too many children ?
    hasTooManyChildren: function (id, children) {
        var key = 'task-comment:' + id + ':limit';
        if (!Session.get(key)) {
            Session.setDefault(key, 2);
        }
        if (!children) {
            return false;
        }
        return children.length > Session.get(key);
    },
    // Number of children not showed right now...
    leftChildren: function (id, children) {
        return children.length - Session.get('task-comment:' + id + ':limit');
    },
    // Limit the number of children to show...
    limitLastChildren: function (id, children) {
        return _.last(children, Session.get('task-comment:' + id + ':limit'));
    },

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
    md5OtherPrettyEmail: function (userId) {
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
    isLike: function(likes) {
        if (likes) {
            return _.contains(likes, Meteor.userId());
        }
        return false;
    },
    isDislike: function(dislikes) {
        if (dislikes) {
            return _.contains(dislikes, Meteor.userId());
        }
        return false;
    }
});

Template.commentMessage.events({
    'click .revealComment a': function (e) {
        var root = $(e.target).closest('.revealComment'),
            link  = root.find('a.link'),
            input = root.find('.ui.input');
        link.hide();
        input.css('display', 'flex');
        input.find('input').trigger('focus');
    },
    'click .reply': function (e) {
        var root  = $(e.target).closest('.commentMessage').find('.revealComment'),
            link  = root.find('a.link'),
            input = root.find('.ui.input');
        link.hide();
        input.css('display', 'flex');
        input.find('input').trigger('focus');
    },

    // Like
    'click .like': function (e) {
        var route      = Router.current().route.getName(),
            projectId  = Router.current().params._id,
            echelonId  = Router.current().params._eid,
            commentId  = $(e.target).closest('.like').attr('data-id'),
            resourceId = null,
            type       = null;

        if (route === 'taskSee') {
            type = 'task';
            resourceId = Router.current().params._tid;
        } else {
            alert('Please update code in commentMessage/like for supporting this route...');
        }

        Meteor.call('likeComment', projectId, echelonId, resourceId, type, commentId, function (error, result) {
            if (error) {
                FlashMessages.sendError('Error while liking comment: ' + error);
            }
        });
    },

    // Dislike
    'click .dislike': function (e) {
        var route      = Router.current().route.getName(),
            projectId  = Router.current().params._id,
            echelonId  = Router.current().params._eid,
            commentId  = $(e.target).closest('.dislike').attr('data-id'),
            resourceId = null,
            type       = null;

        if (route === 'taskSee') {
            type = 'task';
            resourceId = Router.current().params._tid;
        } else {
            alert('Please update code in commentMessage/dislike for supporting this route...');
        }

        Meteor.call('dislikeComment', projectId, echelonId, resourceId, type, commentId, function (error, result) {
            if (error) {
                FlashMessages.sendError('Error while liking comment: ' + error);
            }
        });
    },

    // Sub Comment
    'keydown .revealComment input': function (e) {
        var key = e.keyCode || e.which;
        if (key === 13) {
            var comment    = $(e.target).val(),
                route      = Router.current().route.getName(),
                referId    = $(e.target).attr('data-id'),
                projectId  = Router.current().params._id,
                echelonId  = Router.current().params._eid,
                resourceId = null,
                type       = null;

            if (route === 'taskSee') {
                type = 'task';
                resourceId = Router.current().params._tid;
            } else {
                alert('Please update code in commentMessage/sub comments for supporting this route...');
            }

            if (comment) {
                Meteor.call('addComment', projectId, echelonId, resourceId, type, comment, referId, function (error, result) {
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

    // Load more sub comments
    'click .commentMessage .loadMoreComments': function (e) {
        var key = 'task-comment:' + $(e.target).attr('data-id') + ':limit',
            previous = Session.get(key);

        if (!previous) {
            previous = 2;
        } else {
            previous = parseInt(previous, 10);
        }

        Session.set(key, previous + 5);
    }
});