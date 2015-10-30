Template.echelonProperty.events({
    // Edit
    'click .echelonProperty .formEchelon .button.orange': function(e) {
        e.preventDefault();

        var target      = $(e.target),
            form        = target.closest('form'),
            projectId   = Router.current().params._id,
            echelonId   = form.attr('data-id'),
            title       = form.find('input[name="title"]').val(),
            description = form.find('textarea').val();

        target.addClass('loading');

        Meteor.call('editEchelon', projectId, echelonId, title, description, function (error, result) {
            target.removeClass('loading');
            if (error) {
                FlashMessages.sendError('Error while updating echelon: ' + error);
            } else {
                FlashMessages.sendSuccess('The echelon has been updated successfully.');
            }
        });

        return false;
    },
    // Delete
    'click .echelonProperty .formEchelon .button.red': function(e) {
        e.preventDefault();

        var target = $(e.target),
            form   = target.closest('form');

        $('#modal-delete-echelon').modal({
            onApprove: function() {
                var projectId = Router.current().params._id,
                    echelonId = form.attr('data-id');

                Meteor.call('deleteEchelon', projectId, echelonId, function (error, result) {
                    if (!error) {
                        FlashMessages.sendWarning('Echelon has been deleted. <a class="link" data-call="undeleteEchelon" data-param1="' + projectId + '" data-param2="' + echelonId + '">cancel</a>');
                    }
                });
            }
        }).modal('show');

        return false;
    },
    // Seen
    'click .echelonProperty .button.green': function(e) {
        e.preventDefault();

        Router.go('echelonOverview', {
            _id: Router.current().params._id,
            _eid: this._id
        });

        return false;
    }
});