/**
 * This object can buffer seen state of many type of objects, and apply the
 * seen state for a group, in a buffer way.
 *
 * Example of usage:
 *   // We assume projectId is from this scope...
 *   window.bufferSeen.register('message', function(messagesIds) {
 *     Meteor.call('seenMessages', projectId, messagesIds);
 *   });
 *
 *   Then you can, any time anywhere:
 *   window.bufferSeen.add('message', 'mySuperIdToRegisterAsSeen...');
 *
 *   The system will automatically handle it (usually within the second)
*/
window.bufferSeen = {
    /**
     * Temporary data store.
    */
    _store: {},

    /**
     * Store function which can proceed the seen state.
    */
    _register: {},

    /**
     * If a proceed instance is already started.
    */
    _proceed: false,

    /**
     * The time to wait for every seen to be marked as.
    */
    _delay: 500,

    /**
     * Proceed function which will mark as "seen" every needed elements.
    */
    _mark: function() {
        // Removing proceed state
        var that     = window.bufferSeen,
            register = that._register,
            store    = that._store,
            func     = null;

        that._proceed = false;

        // Proceeding each type
        for (var type in store) {
            if (!register[type]) {
                console.error('bufferSeen: the type "' + type + '" cannot be' +
                    'proceed as there is not registred function for...');
                break;
            }

            func = register[type];
            if (typeof(func) === 'function') {
                func.call(null, store[type].slice(0));
                // Rewind
                store[type] = [];
            }
        }
    },

    /**
     * Register a new function to proceed a specific type.
     *
     * @param type {String}                 The type of seen this function
     *                                      should proceed.
     * @param func {Function}               The associated function.
    */
    register: function(type, func) {
        this._register[type] = func;
    },

    /**
     * Add to buffer seen a new id to mark as seen.
     *
     * @param type {String}                 The type of seen.
     * @param id {String}                   The id to mark as seen.
    */
    add: function (type, id) {
        if (!type) {
            console.error('bufferSeen: type is not valid (see below)');
            console.error(type);
            return;
        }
        if (!this._store[type]) {
            this._store[type] = [];
        }
        this._store[type].push(id);

        if (!this._proceed) {
            this._proceed = true;
            window.setTimeout(this._mark, this._delay);
        }
    }
};