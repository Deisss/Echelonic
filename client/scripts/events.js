/**
 * Extremely tiny message system based on jQuery.
*/
window.events = {
    _system: $('<div />'),

    fire: function() {
        this._system.trigger.apply(this._system, arguments);
    },
    dispatch: function() {
        this._system.trigger.apply(this._system, arguments);
    },

    on: function() {
        this._system.on.apply(this._system, arguments);
    },
    bind: function() {
        this._system.on.apply(this._system, arguments);
    },

    off: function() {
        this._system.off.apply(this._system, arguments);
    },
    unbind: function() {
        this._system.off.apply(this._system, arguments);
    }
};