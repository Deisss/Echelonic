Template.echelonBloc.onCreated(function () {
    // Event when creating a message (used for scroll system)
    events.fire('echelon:create', [this.data]);
});

Template.echelonBloc.onRendered(function () {
    // Everytime a data changed, but the bloc is not redraw
    // We still raise an event for jsPlumb to update arrow, links & co
    this.autorun(function() {
        events.fire('echelon:render', [Template.currentData()]);
    });

    this.$('.progress').progress({
        total: 100
    });
    this.$('.due').popup();
    this.$('.progress').popup();
});

Template.echelonBloc.helpers({
    hasTasksStatistics: function (echelon) {
        return echelon.statistics && echelon.statistics.tasks;
    },
    isBegin: function (echelon) {
        return echelon.isBegin || false;
    },
    isEnd: function (echelon) {
        return echelon.isEnd || false;
    },
    isBeginOrEnd: function (echelon) {
        if (echelon.isBegin) {
            return true;
        } else if (echelon.isEnd) {
            return true;
        }
        return false;
    }
});

Template.echelonBloc.events({
    'click .echelon .connector-view': function(e) {
        e.stopPropagation();
        Router.go('echelonOverview', {
            _id: Router.current().params._id,
            _eid: this._id
        });
    }
});

Template.echelonBloc.onDestroyed(function () {
    // When a template is removed, we should unbind everything related to
    events.fire('echelon:delete', [this.data]);
    this.$('.progress').progress('destroy');
    this.$('.due').popup('destroy');
    this.$('.progress').popup('destroy');
});