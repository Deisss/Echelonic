Template.activityMessage.onRendered(function() {
    var data = this.data;
    // It's unseen, and should be marked as seen
    if (data.unseen && window.routeCompare.check(data.routeName, data.routeParameters)) {
        window.bufferSeen.add('activity', this.data._id);
    }
});

Template.activityMessage.helpers({
    getTemplate: function() {
        var type = this.type,
            pos  = type.indexOf(':');

        if (pos === -1) {
            // We create the template with name "activityType" + type
            // like: "activityTypeAddEchelon"
            return 'activityType' + type.charAt(0).toUpperCase() + type.slice(1);
        } else {
            // We need to remove the second part of it, which is
            // a id/variable path...
            var main = type.substr(0, pos);
            if (main) {
                // We create the template with name "activityType" + type
                // like: "activityTypeAddEchelon"
                return 'activityType' + main.charAt(0).toUpperCase() + main.slice(1);
            }
        }

        return 'NOT-EXISTING-TEMPLATE';
    },
    typeAsObject: function(type) {
        return {
            type: type
        };
    }
});

Template.activityMessage.events({
    // Following the right place to see the activity in real...
    'click .activityMessage': function() {
        Router.go(this.routeName, this.routeParameters);
    }
});