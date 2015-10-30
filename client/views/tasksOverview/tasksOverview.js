// Scoped var
var pickaday = null;

Template.tasksOverview.onRendered(function () {
    this.$('.ui.dropdown').dropdown();

    pickaday = new Pikaday({
        field: this.$('.button.datepicker').get(0),
        format: 'YYYY-MM-DD',
        onSelect: function (date) {
            $('.button.datepicker').attr('data-select', moment(date).format('YYYY-MM-DD'));
        }
    });
});

Template.tasksOverview.onDestroyed(function () {
    if (pickaday) {
        pickaday.destroy();
        pickaday = null;
    }
    try {
        delete Sessions.keys['echelon-tasks:search'];
    } catch(e) {}
});

Template.tasksOverview.helpers({
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



Template.tasksOverview.events({
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
    }
});