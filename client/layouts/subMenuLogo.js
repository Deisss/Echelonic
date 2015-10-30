Template.subMenuLogo.onRendered(function() {
    this.$('.subMenuLogo .button').popup();
});

Template.subMenuLogo.onDestroyed(function() {
    this.$('.subMenuLogo .button').popup('destroy');
});

Template.subMenuLogo.events({
    'click .subMenuLogo .logoutButton': function() {
        Meteor.call('signout');
        window.location.reload();

        // Just in case
        setTimeout(function () {
            window.location.reload();
        }, 2000);

        // Just in case v2
        setTimeout(function () {
            window.location.reload();
        }, 4000);
    },
    'click .subMenuLogo .homeButton': function() {
        Router.go('home');
    },
    'click .subMenuLogo .settingsButton': function() {
        // Note: window.location.href = '/account/settings'
        // does work... but not Router.go... How come...
        Router.go('accountSettings');
    }
});