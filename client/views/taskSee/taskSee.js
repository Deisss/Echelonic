// Scoped var
var pickaday = null;

Template.taskSee.onRendered(function () {
    this.$('.ui.dropdown').dropdown();

    pickaday = new Pikaday({
        field: this.$('.button.datepicker').get(0),
        format: 'YYYY-MM-DD',
        onSelect: function (date) {
            $('.button.datepicker').attr('data-select', moment(date).format('YYYY-MM-DD'));
        }
    });
});

Template.taskSee.onDestroyed(function () {
    if (pickaday) {
        pickaday.destroy();
        pickaday = null;
    }
    try {
        delete Sessions.keys['echelon-tasks:search'];
    } catch(e) {}
});

Template.taskSee.helpers({
    comments: function() {
        var query = {
            projectId: Router.current().params._id,
            echelonId: Router.current().params._eid,
            taskId:   Router.current().params._tid
        };

        var comments = Comments.find(query, {
            sort: [['createdAt', 'asc']]
        }).fetch();

        // Now we create tree from them
        var subComments = _.filter(comments, function (comment) {
                return typeof(comment.referId) === 'string' && comment.referId;
            }),
            rootComments = _.difference(comments, subComments);

        // Time to create tree
        for (var i = 0, l = rootComments.length; i < l; ++i) {
            var referId = rootComments[i]._id;

            var children = [];
            for (var j = 0, k = subComments.length; j < k; ++j) {
                if (subComments[j].referId === referId) {
                    children.push(subComments[j]);
                }
            }
            rootComments[i].children = children;
        }

        return rootComments;
    },
    priorityToColor: function(priority) {
        if (priority === 0) {
            return 'grey';
        } else if (priority === 1) {
            return 'olive';
        } else if (priority <= 2) {
            return 'yellow';
        } else if (priority <= 3) {
            return 'orange';
        } else {
            return 'red';
        }
    },
    priorityToText: function(priority) {
        if (priority === 0) {
            return 'None';
        } else if (priority === 1) {
            return 'Low';
        } else if (priority <= 2) {
            return 'Medium';
        } else if (priority <= 3) {
            return 'High';
        } else {
            return 'Urgent';
        }
    },
    priorityToShortText: function(priority) {
        if (priority === 0) {
            return 'N';
        } else if (priority === 1) {
            return 'L';
        } else if (priority <= 2) {
            return 'M';
        } else if (priority <= 3) {
            return 'H';
        } else {
            return 'U';
        }
    },
    isSelected: function(id) {
        return id === Router.current().params._tid;
    },
    tasks: function(limit) {
        var search = Session.get('echelon-tasks:search');
        limit = limit || 0;

        if (search) {
            return Tasks.find({
                projectId: Router.current().params._id,
                echelonId: Router.current().params._eid,
                title: {
                    $regex: search
                },
                deletedAt: null
            }, {
                limit: limit
            });
        } else {
            return Tasks.find({
                projectId: Router.current().params._id,
                echelonId: Router.current().params._eid,
                deletedAt: null
            }, {
                limit: limit
            });
        }
    }
});



Template.taskSee.events({
    // Search in tasks
    'click .search.item .search.icon': function (e) {
        var value = $(e.target).closest('.item').find('input').val();
        Session.set('echelon-tasks:search', value || '');
    },
    'keydown .search.item .prompt': function (e) {
        var value = $(e.target).val();
        Session.set('echelon-tasks:search', value || '');
    },


    // Reveal new task
    'click .formAddTask': function (e) {
        var root = $(e.target).closest('.formAddTask');
        root.find('.newTask').hide();
        root.find('.form').show();

        var input = root.find('.form input');
        input.focus();
        /*input.on('focusout', function() {
            input.off('focusout');
            root.find('.newTask').show();
            root.find('.form').hide();
        });*/
    },
    // Create a new task (short way)
    'keydown .formAddTask input': function (e) {
        var key = e.keyCode || e.which;
        if (key === 13) {
            var title     = $(e.target).val(),
                projectId = Router.current().params._id,
                echelonId = Router.current().params._eid;

            if (title) {
                Meteor.call('addTask', projectId, echelonId, null, title, null, null, null, function (error, result) {
                    if (error) {
                        FlashMessages.sendError('Error while creating task: ' + error);
                    } else {
                        $(e.target).val('');
                    }
                });
            } else {
                $('#modal-task-empty').modal('show');
            }
        }
    },
    // Create a new task (long way)
    'click .formAddTask .taskCreate': function (e) {
        var form      = $(e.target).closest('.formAddTask'),
            projectId = Router.current().params._id,
            echelonId = Router.current().params._eid,
            dueAt     = form.find('.button.datepicker').attr('data-select') || null,
            title     = form.find('input[name="title"]').val() || '',
            priority  = form.find('.priority .text').find('input[name="priority"]').val() || 0,
            assignId  = form.find('.assign .text').find('input[name="assignId"]').val() || null;

        priority = parseInt(priority, 10);

        // TODO: raise error if title is null

        if (title) {
            Meteor.call('addTask', projectId, echelonId, assignId, title, null, priority, dueAt, function (error, result) {
                if (error) {
                    FlashMessages.sendError('Error while creating task: ' + error);
                } else {
                    // TODO: clear calendar, priority and assign
                    $(e.target).val('');
                }
            });
        } else {
            $('#modal-task-empty').modal('show');
        }
    },
    // See a task in depth
    'click .taskMessage': function(e) {
        var id = $(e.target).closest('.taskMessage').attr('data-id');

        Router.go('taskSee', {
            _id: Router.current().params._id,
            _eid: Router.current().params._eid,
            _tid: id
        });
    },
    // Edit a task
    'click .taskShow .edit': function(e) {
        e.preventDefault();
        var id = $(e.target).attr('data-id');
        Router.go('taskEdit', {
            _id: Router.current().params._id,
            _eid: Router.current().params._eid,
            _tid: id
        });
    },
    // Add comment
    'keydown .taskShow #createComment': function(e) {
        var key = e.keyCode || e.which;
        if (key === 13) {
            var comment   = $(e.target).val(),
                projectId = Router.current().params._id,
                echelonId = Router.current().params._eid,
                taskId    = Router.current().params._tid;

            if (comment) {
                Meteor.call('addComment', projectId, echelonId, taskId, 'task', comment, null, function (error, result) {
                    if (error) {
                        FlashMessages.sendError('Error while creating comment: ' + error);
                    } else {
                        $(e.target).val('');
                    }
                });
            } else {
                $('#modal-comment-empty').modal('show');
            }
        }
    },
    // Sub comments
    'keydown .taskShow .subComment': function(e) {
        var key = e.keyCode || e.which;
        if (key === 13) {
            var comment   = $(e.target).val(),
                referId   = $(e.target).attr('data-id'),
                projectId = Router.current().params._id,
                echelonId = Router.current().params._eid,
                taskId    = Router.current().params._tid;

            if (comment) {
                Meteor.call('addComment', projectId, echelonId, taskId, 'task', comment, referId, function (error, result) {
                    if (error) {
                        FlashMessages.sendError('Error while creating comment: ' + error);
                    } else {
                        $(e.target).val('');
                    }
                });
            } else {
                $('#modal-comment-empty').modal('show');
            }
        }
    }
});