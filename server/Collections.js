(function() {
    /**
     * Search for all projects related to user, or a single project.
     *
     * @param {Integer} userId              The user id to search related proj.
     * @param {Integer | Null} optionalId   A specific project id to search.
     * @param {Object | Null} optionalRest  Any restriction to append to
     *                                      data restriction.
     * @return {Array | Object}             A list of projects or a single
     *                                      project.
    */
    function searchProjects(userId, optionalId, optionalRest) {
        var user = Meteor.users.findOne(userId),
            emails = _.pluck(user.emails, 'address');

        // Building options
        var options = {
            deletedAt: null,
            $or: [
                {
                    ownerId: userId
                },
                {
                    users: {
                        $elemMatch: {
                            email: {
                                $in: emails
                            }
                        }
                    }
                }
            ]
        };

        var restrict = {
            createdAt: 0,
            updatedAt: 0,
            deletedAt: 0
        };

        if (optionalId) {
            options['_id'] = optionalId;
        }

        if (typeof(optionalRest) === 'object' && optionalRest !== null) {
            restrict = optionalRest;
        }

        return Projects.find(options, {
            fields: restrict
        });
    }

    // All users linked to given user (a user is linked to another if they
    // one time appear in a project together)
    Meteor.publish('globalUsers', function () {
        if (this.userId) {
            var projects = searchProjects(this.userId),
                project  = null,
                usersId  = [];

            for (var i = 0, l = projects.length; i < l; ++i) {
                project = projects[i];

                usersId = _.union(usersId, _.pluck(project.users, '_id'));
                usersId.push(project.ownerId);
            }

            // Remove duplicate
            usersId = _.uniq(usersId);

            // Removing himself
            usersId = _.without(usersId, this.userId);

            // Getting all users globally related
            return Meteor.users.find({
                _id: {
                    $in: usersId
                }
            }, {
                // TODO: add restriction to avoid too much data sended
                limit: 1000,
                fields: {
                    _id: 1,
                    emails: 1,
                    profile: 1
                }
            });
        } else {
            this.ready();
        }
    });

    // All users linked to given user, for given project
    Meteor.publish('projectUsers', function (id) {
        if (this.userId) {
            var projects = searchProjects(this.userId, id).fetch(),
                project  = null,
                usersId  = [];

            if (projects.length === 1) {
                project = projects[0];

                usersId = _.pluck(project.users, '_id');
                usersId.push(project.ownerId);

                // Remove duplicate
                usersId = _.uniq(usersId);

                // Removing himself
                usersId = _.without(usersId, this.userId);

                // Getting all users locally related
                return Meteor.users.find({
                    _id: {
                        $in: usersId
                    }
                }, {
                    limit: 1000,
                    fields: {
                        _id: 1,
                        emails: 1,
                        profile: 1,
                        status: 1
                    }
                });
            }
        } else {
            this.ready();
        }
    });

    // Available projects for given user
    Meteor.publish('projects', function () {
        if (this.userId) {
            // We restrict it to a few subset of possibilities
            return searchProjects(this.userId, null, {
                _id: 1,
                color: 1,
                title: 1,
                search: 1,
                category: 1
            });
        } else {
            this.ready();
        }
    });

    // A single project related to given user
    Meteor.publish('project', function (id) {
        if (this.userId) {
            return searchProjects(this.userId, id);
        } else {
            this.ready();
        }
    });

    // Last 50 messages seen (you can extend using limit parameter)
    Meteor.publish('projectMessages', function (id, limit) {
        if (this.userId) {
            var project = searchProjects(this.userId, id, {
                _id: 1
            }).fetch();

            if (project.length === 1) {
                var query = {
                    projectId: id,
                    isGlobal: true,
                    deletedAt: null
                };

                var limit = limit || 50,
                    count = Messages.find(query).count(),
                    skip  = count - limit;

                if (limit > count) {
                    limit = 0;
                    skip  = 0;
                }

                // Note: here we didn't set any limit
                // As we want new message still arriving (if we limit, new
                // messages will be outside this request...)
                return Messages.find(query, {
                    skip: skip,
                    fields: {
                        updatedAt: 0,
                        deletedAt: 0
                    }
                });
            }
        } else {
            this.ready();
        }
    });

    // This is a counter data for counting how many unread messages there is...
    Meteor.publish('projectUnseenMessages', function (id) {
        if (this.userId) {
            var project = searchProjects(this.userId, id, {
                _id: 1
            }).fetch();

            if (project.length === 1) {
                Counts.publish(this, 'projectUnseenMessages', Messages.find({
                    projectId: id,
                    isGlobal: true,
                    unseenUsers: this.userId,
                    deletedAt: null
                }));
            }
        } else {
            this.ready();
        }
    });

    // Latest 20 activities seen (you can extend using limit parameter)
    Meteor.publish('projectActivities', function (id, limit) {
        if (this.userId) {
            var project = searchProjects(this.userId, id, {
                _id: 1
            }).fetch();

            if (project.length === 1) {
                var query = {
                    projectId: id,
                    ownerId: this.userId,
                    deletedAt: null
                };

                limit = limit || 15;

                var count = Activities.find(query).count(),
                    skip  = count - limit;

                if (limit > count) {
                    limit = 0;
                    skip  = 0;
                }

                // Note: here we didn't set any limit
                // As we want new message still arriving (if we limit, new
                // messages will be outside this request...)
                return Activities.find(query, {
                    skip: skip,
                    fields: {
                        deletedAt: 0
                    }
                });
            }
        } else {
            this.ready();
        }
    });

    // This is a counter data for counting how many unread activities there is...
    Meteor.publish('projectUnseenActivities', function (id) {
        if (this.userId) {
            var project = searchProjects(this.userId, id, {
                _id: 1
            }).fetch();

            if (project.length === 1) {
                Counts.publish(this, 'projectUnseenActivities', Activities.find({
                    projectId: id,
                    ownerId: this.userId,
                    unseen: true,
                    deletedAt: null
                }));
            }
        } else {
            this.ready();
        }
    });

    // All echelons related to a project
    Meteor.publish('projectEchelons', function (id) {
        if (this.userId) {
            var project = searchProjects(this.userId, id, {
                _id: 1
            }).fetch();

            // User is allowed to see content of this project
            if (project.length === 1) {
                return Echelons.find({
                    projectId: id,
                    deletedAt: null
                }, {
                    fields: {
                        ownerId: 0,
                        createdAt: 0,
                        updatedAt: 0,
                        deletedAt: 0
                    }
                });
            }
        } else {
            this.ready();
        }
    });

    // A single echelon for a single project
    Meteor.publish('projectEchelon', function (id, eid) {
        if (this.userId) {
            var project = searchProjects(this.userId, id, {
                _id: 1
            }).fetch();

            // User is allowed to see content of this project
            if (project.length === 1) {
                return Echelons.find({
                    _id: eid,
                    projectId: id,
                    deletedAt: null
                }, {
                    fields: {
                        ownerId: 0,
                        createdAt: 0,
                        updatedAt: 0,
                        deletedAt: 0
                    }
                });
            }
        } else {
            this.ready();
        }
    });

    Meteor.publish('echelonTasks', function (id, eid) {
        if (this.userId) {
            var project = searchProjects(this.userId, id, {
                _id: 1
            }).fetch();

            // User is allowed to see content of this project
            if (project.length === 1) {
                return Tasks.find({
                    projectId: id,
                    echelonId: eid,
                    deletedAt: null
                }, {
                    fields: {
                        ownerId: 0,
                        createdAt: 0,
                        updatedAt: 0,
                        deletedAt: 0
                    }
                });
            }
        } else {
            this.ready();
        }
    });


    // This is a counter data for counting how many unread messages there is...
    Meteor.publish('commentsCount', function (id, eid, rid, type) {
        if (this.userId) {
            var project = searchProjects(this.userId, id, {
                _id: 1
            }).fetch(),
                query = {
                    projectId: id,
                    echelonId: eid,
                    referId: null,
                    deletedAt: null
                };

            if (project.length === 1) {
                if (type === 'task') {
                    query.taskId = rid;
                } else if (type === 'poll') {
                    query.pollId = rid;
                } else if (type === 'file') {
                    query.fileId = rid;
                }

                // Publishing available "root" comments
                Counts.publish(this, 'commentsCount', Comments.find(query));
            } else {
                this.ready();
            }
        } else {
            this.ready();
        }
    });

    // Any comments related to any resource
    // tid: the resource id, for a task, it would be it's _id for ex.
    // type: if it's related to a "task", a "poll", a "file"...
    Meteor.publishComposite('comments', function (id, eid, rid, type, limit) {
        if (this.userId) {
            var project = searchProjects(this.userId, id, {
                _id: 1
            }).fetch(),
                query = {
                    projectId: id,
                    echelonId: eid,
                    referId: null,
                    deletedAt: null
                };

            // Check if user is allowed to see this content
            if (project.length !== 1) {
                this.ready();
                return;
            }

            if (type === 'task') {
                query.taskId = rid;
            } else if (type === 'poll') {
                query.pollId = rid;
            } else if (type === 'file') {
                query.fileId = rid;
            }

            limit = limit || 4;
            var count = Comments.find(query).count(),
                skip  = count - limit;

            if (limit > count) {
                limit = 0;
                skip  = 0;
            }

            return {
                find: function() {
                    return Comments.find(query, {
                        fields: {
                            updatedAt: 0,
                            deletedAt: 0
                        },
                        sort: [['createdAt', 1]],
                        skip: skip
                    });
                },
                children: [
                    {
                        find: function(comment) {
                            var tmp = _.clone(query);
                            tmp.referId = comment._id;
                            return Comments.find(tmp, {
                                fields: {
                                    updatedAt: 0,
                                    deletedAt: 0
                                }
                            });
                        }
                    }
                ]
            };
        } else {
            this.ready();
        }
    });
})();

Meteor.publish('user', function () {
    if (this.userId) {
        return Meteor.users.find({
            _id: this.userId
        }, {
            limit: 1
        });
    } else {
        this.ready();
    }
});