Template.home.helpers({
    projects: function() {
        return Projects.find({}, {
            sort: [['category', 'asc'], ['search', 'asc']]
        });
    }
});