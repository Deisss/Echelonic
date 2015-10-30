Template.menuEchelon.events({
    // Breadcrumb
    'click .breadcrumb .project': function (e) {
        Router.go('projectEchelon', {
            _id: Router.current().params._id
        });
    },
    'click .breadcrumb .home': function (e) {
        Router.go('projectOverview', {
            _id: Router.current().params._id
        });
    },
    'click .breadcrumb .echelon': function (e) {
        var el = $(e.target).closest('.echelon');
        // Only if we are in sub-elements
        if (!el.hasClass('.active')) {
            Router.go('echelonOverview', {
                _id: Router.current().params._id,
                _eid: Router.current().params._eid,
            });
        }
    },
});