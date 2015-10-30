Template.menuHome.helpers({
    // Existing project sorted by categories
    categories: function () {
        var projects   = Projects.find().fetch(),
            categories = _.groupBy(projects, 'category');

        return _.map(categories, function(value, index) {
            // If index is not defined (no category)
            if (index === null || index === 'null' ||
                index === 'undefined' || typeof(index) === 'undefined') {
                index = 'Uncategorized';
            }
            return {projects: value, category: index};
        });
    },
    // Check if given id should be marked as selected or not
    isProjectSelected: function (id) {
        var reg = new RegExp(id, 'i');
        return reg.test(Iron.Location.get().pathname);
    }
});

Template.menuHome.events({
    'click .menuHome .logo': function() {
        Router.go('home');
    },
    // Create a new project
    'click .menuHome .create': function(e) {
        Router.go('projectCreate');
    },
    // Click on category will collapse/expend like an accordion
    'click .project-list .category': function (e) {
        var target   = $(e.target).parent().parent(),
            init     = target,
            collapse = init.attr('data-collapse') === 'true';

        // We go to sibling elements until find another category
        while (true) {
            // End of list, we stop
            // Category is stop also
            if (target.next().length === 0 || target.next().hasClass('category')) {
                break;
            }

            target = target.next();

            if (collapse) {
                target.show('fast');
            } else {
                target.hide('fast');
            }
        }

        // Finally we exchange the collapse state
        if (collapse) {
            init.attr('data-collapse', 'false');
        } else {
            init.attr('data-collapse', 'true');
        }
    },

    // Access to overview of a single project
    'click .project-list .item': function (e) {
        var id = $(e.target).closest('.item').attr('data-id');
        Router.go('projectOverview', {
            _id: id
        });
    }
});