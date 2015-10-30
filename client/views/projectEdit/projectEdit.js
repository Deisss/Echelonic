Template.projectEdit.onRendered(function () {
    $('.ui.dropdown').dropdown();

    // Drag/Drop feature
    $('.draggable').draggable({
        revert: 'invalid',
        cursor: 'move'
    });
    $('.droppable').droppable({
      drop: function(event, ui) {
        var drop = $(this),
            drag = ui.draggable;
        drag.detach().css({top: 0,left: 0}).appendTo(drop);
      }
    });
});

Template.projectEdit.helpers({
    md5: function(value) {
        return md5(value);
    },
    projects: function() {
        return Projects.find({}, {
            sort: [['category', 'asc'], ['search', 'asc']]
        });
    },
    existsColor: function (color) {
        return !!color;
    },
    // Empty color should be printed "color"
    prettyColor: function (color) {
        return (!color) ? 'color': color;
    }
});


Template.projectEdit.events({
    // Cancel button
    'click .submit .cancel': function(e) {
        history.back();
    }
});