// Scoped var
var pickaday = null;

Template.taskMessage.onRendered(function() {
    this.$('.ui.checkbox').checkbox();
    this.$('.ui.corner, .ui.noUser, .ui.datepicker.calendar, .ui.avatar').popup();

    var picker = this.$('.datepicker');
    pickaday = new Pikaday({
        field: picker.get(0),
        format: 'YYYY-MM-DD',
        onSelect: function (date) {
            // TODO: send to server the update
            picker.html(moment(date).calendar(null, {
                sameDay: '[Today]',
                nextDay: '[Tomorrow]',
                nextWeek: 'dddd',
                lastDay: '[Yesterday]',
                lastWeek: '[Last] dddd'
            }));
        }
    });
});
Template.taskMessage.onDestroyed(function() {
    if (pickaday) {
        pickaday.destroy();
        pickaday = null;
    }
    this.$('.ui.checkbox').checkbox('destroy');
    this.$('.ui.corner, .ui.noUser, .ui.datepicker.calendar, .ui.avatar').popup('destroy');
});

Template.taskMessage.helpers({
    active: function(id) {
        return id === Router.current().params._tid;
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
    hasDue: function(task) {
        if (task.dueAt) {
            return true;
        }
        return false;
    },
    isOld: function(task) {
        if (task.dueAt) {
            var now = moment(),
                tmp = moment(task.dueAt);

            return (!tmp.isSame(now, 'day') && !tmp.isAfter(now, 'day'));
        }
        return false;
    },
    momentDate: function (date) {
        return moment(date).calendar(null, {
            sameDay: '[Today]',
            nextDay: '[Tomorrow]',
            nextWeek: 'dddd',
            lastDay: '[Yesterday]',
            lastWeek: '[Last] dddd'
        });
    },
    isDone: function(task) {
        if (task.doneAt) {
            return true;
        }
        return false;
    },
    isInProgress: function(task) {
        if (!task.doneAt && task.progressAt) {
            return true;
        }
        return false;
    }
});

Template.taskMessage.events({
    'click .taskMessage .checkbox': function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('we checkbox it');
        return false;
    }
});