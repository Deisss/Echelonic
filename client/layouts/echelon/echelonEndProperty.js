// Scoped var
var pickaday = null;

Template.echelonEndProperty.onRendered(function () {
    var root = this.$('#datepicker');
    pickaday = new Pikaday({
        field: root.get(0),
        format: 'YYYY-MM-DD'
    });
});

Template.echelonEndProperty.onDestroyed(function () {
    if (pickaday) {
        pickaday.destroy();
        pickaday = null;
    }
});

Template.echelonEndProperty.helpers({
    realDate: function (date) {
        return moment(date).format('YYYY-MM-DD');
    }
});

Template.echelonEndProperty.events({
    'click .echelonEndProperty .button.orange': function (e) {
        e.preventDefault();

        var target    = $(e.target),
            value     = target.closest('form').find('input').val(),
            projectId = Router.current().params._id,
            echelonId = this._id,
            date      = moment(value),
            valid     = date.isValid(),
            tooOld    = date.isBefore(moment('1900-01-01')),
            tooNew    = date.isAfter(moment('2100-01-01'));

        target.addClass('loading');

        if (valid && !tooOld && !tooNew) {
            Meteor.call('editEchelon', projectId, echelonId, this.title, this.description, date.toDate(), date.toDate(), function (error, result) {
                target.removeClass('loading');
                if (error) {
                    FlashMessages.sendError('Error while updating echelon: ' + error);
                } else {
                    FlashMessages.sendSuccess('The echelon has been updated successfully.');
                }
            });
        } else {
            // We erase the value to set the right one.
            pickaday.setDate(moment().format('YYYY-MM-DD'));
            $('#modal-wrong-date').modal('show');
        }

        return false;
    }
})