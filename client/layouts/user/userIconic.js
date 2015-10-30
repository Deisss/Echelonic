Template.userIconic.onRendered(function() {
    this.$('.user[data-content]').popup();
});

Template.userIconic.onDestroyed(function() {
    this.$('.user[data-content]').popup('destroy');
});

Template.userIconic.helpers({
    prettyOnline: function(online, idle) {
        if (online && idle) {
            return 'idle';
        } else if (online) {
            return 'online';
        }
        return 'offline';
    },
    iconOnline: function(online, idle) {
        if (online && idle) {
            return 'history';
        } else if (online) {
            return 'checkmark';
        }
        return 'radio';
    }
});