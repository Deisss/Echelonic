Template.projectOverview.helpers({
    // Get a MD5 hash from a given value (used for gravatar)
    md5: function(value) {
        return md5(value);
    },
    projects: function() {
        return Projects.find({}, {
            sort: [['category', 'asc'], ['search', 'asc']]
        });
    },
    activities: function() {
        return Activities.find({
            projectId: Router.current().params._id
        }, {
            sort: [['updatedAt', 'desc']]
        });
    }
});

Template.projectOverview.events({
    // Access the project (the first echelon panel)
    'click .actions .primary': function() {
        Router.go('projectEchelon', {
            _id: Router.current().params._id
        });
    },
    // Delete the project
    'click .actions .red': function() {
        $('#modal-delete-project').modal({
            onApprove: function() {
                var id = Router.current().params._id;
                Meteor.call('deleteProject', id, function (error, result) {
                    Router.go('home');
                });

                // Link: say to template it's a clickable element
                // data-href = follow the url
                // data-call = apply Meteor.call with data-param1, data-param2, ...
                FlashMessages.sendWarning('Project has been deleted. <a class="link" data-call="undeleteProject" data-param1="' + id + '">cancel</a>');
            }
        }).modal('show');
    },
    // Edit the project
    'click .actions .orange': function() {
        Router.go('projectEdit', {
            _id: Router.current().params._id
        });
    }
});
