// Scoped var
var pickaday = null;

Template.echelonOverview.onRendered(function () {
    this.$('.dropdown').dropdown();

    pickaday = new Pikaday({
        field: this.$('#datepicker').get(0),
        format: 'YYYY-MM-DD'
    });
});

Template.echelonOverview.onDestroyed(function () {
    if (pickaday) {
        pickaday.destroy();
        pickaday = null;
    }
    try {
        delete Sessions.keys['echelon-tasks:search'];
    } catch(e) {}
});

Template.echelonOverview.helpers({
    tasks: function(limit) {
        limit = limit || 0;

        var search = Session.get('echelon-tasks:search'),
            tomorrow = new Date((new Date()).getTime() + 86400000),
            query = {
            projectId: Router.current().params._id,
            echelonId: Router.current().params._eid,
            // The guy who should do the task is not set, or myself
            $or: [{
                assignId: Meteor.userId()
            }, {
                assignId: null
            }],
            // Currently seeking it for the current day
            dueAt: {
                $lt: tomorrow
            },
            // Not yet done
            doneAt: null,
            // Not deleted
            deletedAt: null
        };

        if (search) {
            query.title = {
                $regex: search
            };
        }

        return Tasks.find(query, {
            limit: limit
        });
    }
});

Template.echelonOverview.events({
    // Search in tasks
    'click .search.item .search.icon': function (e) {
        var value = $(e.target).closest('.item').find('input').val();
        Session.set('echelon-tasks:search', value || '');
    },
    'keydown .search.item .prompt': function (e) {
        var value = $(e.target).val();
        Session.set('echelon-tasks:search', value || '');
    },

    // navigate
    'click .overview .goTasks': function(e) {
        Router.go('tasksOverview', {
            _id: Router.current().params._id,
            _eid: Router.current().params._eid
        });
    },
    'click .overview .goPolls': function(e) {
        Router.go('pollsOverview', {
            _id: Router.current().params._id,
            _eid: Router.current().params._eid
        });
    },
    'click .overview .goFiles': function(e) {
        Router.go('filesOverview', {
            _id: Router.current().params._id,
            _eid: Router.current().params._eid
        });
    },

    // Click on a single task
    'click .overview .taskMessage': function(e) {
        var id = $(e.target).closest('.taskMessage').attr('data-id');

        Router.go('taskSee', {
            _id: Router.current().params._id,
            _eid: Router.current().params._eid,
            _tid: id
        });
    }
});