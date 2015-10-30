Template.menuProject.onRendered(function() {
    // Tabs system
    $('.menuEchelon .item').tab({
        onVisible: function() {
            // The chat system use this trigger to place the scroll to
            // bottom (last chat message get) on first run
            events.fire('menu:tab:change', [arguments[0]]);
        }
    });
});

Template.menuProject.helpers({
    // Same as getPublishedCount, but with a limit
    getLimitCount: function(name, maximum) {
        if (!maximum || maximum < 0 || !isFinite(maximum)) {
            maximum = 50;
        }
        var counter = Counts.get(name);
        return (counter > maximum) ? '' + maximum + '+' : counter;
    }
});

Template.menuProject.events({
    'click .menuProject .logo': function() {
        Router.go('home');
    }
});