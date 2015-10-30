Template.chatMessage.onRendered(function () {
    // Little bit ugly, but prevent from XSS failure
    var markdown = new showdown.Converter(),
        emoticons = $.emoticons;

    this.$('.parse-emoticons').each(function() {
        var that = $(this),
            tmp  = that.html();
        // Remove mark
        that.removeClass('parse-emoticons');

        // Parse markdown && emoticons
        that.html(emoticons.replace(markdown.makeHtml(tmp)));
    });
});

Template.chatMessage.onCreated(function () {
    // Event when creating a message (used for scroll system)
    events.fire('chat:message', [this.data]);
});

Template.chatMessage.helpers({
    isUnseen: function(unseenUsers) {
        return _.contains(unseenUsers, Meteor.userId()) ? 'unseen': '';
    },
    myselfOrOthers: function(id) {
        return (id === Meteor.userId()) ? 'myself': 'others';
    },
    prettyOnline: function(online, idle) {
        if (online && idle) {
            return 'idle';
        } else if (online) {
            return 'online';
        }
        return 'offline';
    }
})