Template.activityTab.onRendered(function() {
    var projectId = Router.current().params._id;

    window.bufferSeen.register('activity', function(activitiesIds) {
        Meteor.call('seenActivities', projectId, activitiesIds);
    });
});

Template.activityTab.helpers({
    activities: function() {
        /*if (!Session.get('project-message:limit')) {
            Session.setDefault('project-message:limit', 50);
        }

        var query = {
            projectId: Router.current().params._id,
            userId: this.userId,
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
        });*/
        return Activities.find({
            projectId: Router.current().params._id,
            userId: this.userId
        }, {
            sort: [['updatedAt', 'desc']]
        })
    }
});