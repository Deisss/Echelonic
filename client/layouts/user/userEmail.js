Template.userEmail.onRendered(function () {
    this.$('.email .ui.corner.label').popup();
});

Template.userEmail.onDestroyed(function () {
    this.$('.email .ui.corner.label').popup('destroy');
});

Template.userEmail.events({
    'click .email .ui.button': function(e) {
        var block = $(e.target).closest('.email');

        if (block.parent().hasClass('column')) {
            block.parent().remove();
        } else {
            block.remove();
        }
    }
});