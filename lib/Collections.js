if (!Schemas) {
    var Schemas = {};
}

Projects   = new Mongo.Collection('projects');
Activities = new Mongo.Collection('activities');
Messages   = new Mongo.Collection('messages');
Echelons   = new Mongo.Collection('echelons');
Tasks      = new Mongo.Collection('tasks');
Comments   = new Mongo.Collection('comments');

/*
-----------------------
  HELPERS
-----------------------
*/
Projects.helpers({
    // The owner for current project
    owner: function() {
        return Meteor.users.findOne({
            _id: this.ownerId,
            deletedAt: null
        });
    },
    // Admin for current project (including owner)
    administrators: function() {
        var adminsId = [this.ownerId];

        if (!this.users) {
            return null;
        }

        for (var i = 0, l = this.users.length; i < l; ++i) {
            if (this.users[i].isAdmin === true) {
                adminsId.push(this.users[i]._id);
            }
        }

        // Find all users id related to
        return Meteor.users.find({
            _id: {
                $in: adminsId
            },
            deletedAt: null
        });
    },
    // Normal user for current project
    contributors: function() {
        var usersId = [];

        if (!this.users) {
            return null;
        }

        for (var i = 0, l = this.users.length; i < l; ++i) {
            if (this.users[i].isAdmin === false) {
                usersId.push(this.users[i]._id);
            }
        }

        // Find all users id related to
        return Meteor.users.find({
            _id: {
                $in: usersId
            },
            deletedAt: null
        });
    },
    isUser: function(userId) {
        userId = userId || Meteor.userId();
        for (var i = 0, l = this.users.length; i < l; ++i) {
            if (this.users[i]._id === userId) {
                return true;
            }
        }
        return (this.ownerId === userId);
    },
    isAdmin: function(userId) {
        userId = userId || Meteor.userId();
        for (var i = 0, l = this.users.length; i < l; ++i) {
            if (this.users[i]._id === userId && this.users[i].isADmin === true) {
                return true;
            }
        }
        return (this.ownerId === userId);
    },
    echelons: function() {
        return Echelons.find({
            projectId: this._id,
            deletedAt: null
        }, {
            fields: {
                createdAt: 0,
                updatedAt: 0,
                deletedAt: 0
            }
        });
    },
    // Get the last 50 feeds
    latestActivities: function() {
        // Feeds not deleted, related to project ID and user ID.
        return Activities.find({
            projectId: this._id,
            relatedUsers: Meteor.userId(),
            deletedAt: null
        }, {
            sort: [['createdAt', 'desc']],
            limit: 50,
            fields: {
                updatedAt: 0,
                deletedAt: 0
            }
        });
    }
});

Echelons.helpers({
    owner: function() {
        return Meteor.users.findOne({
            _id: this.ownerId,
            deletedAt: null
        });
    },
    project: function() {
        return Projects.findOne({
            _id: this.projectId,
            deletedAt: null
        });
    },
    children: function() {
        return Echelons.find({
            _id: {
                $in: this.links
            },
            projectId: this.projectId,
            deletedAt: null
        });
    },
    parents: function() {
        // We search all echelons which are linked to it
        return Echelons.find({
            links: this._id,
            projectId: this.projectId,
            deletedAt: null
        });
    },
    // Present data for chart
    chart: function() {
        if (!this.statistics || !this.statistics.tasks) {
            return null;
        }

        var data = this.statistics.tasks;

        return [{
            value: data.done,
            color: '#46BFBD',
            highlight: '#5AD3D1',
            label: 'Done'
        }, {
            value: data.unfinish,
            color: '#FDB45C',
            highlight: '#FFC870',
            label: 'Unfinished'
        }, {
            value: (data.total - data.done - data.unfinish),
            color:'#F7464A',
            highlight: '#FF5A5E',
            label: 'Waiting'
        }];
    }
});

Messages.helpers({
    owner: function() {
        return Meteor.users.findOne({
            _id: this.ownerId,
            deletedAt: null
        });
    },
    project: function() {
        return Projects.findOne({
            _id: this.projectId,
            deletedAt: null
        });
    }
});

Activities.helpers({
    // Count number of notification
    // NOTE: the count is UNIQUE, only one notification counted per user
    // So a user appearing twice, is counted as one...
    // Two users creating one, is counter as two...
    notificationsUniqueCount: function(value) {
        var uniqueIds = _.uniq(this.notifications);
        return uniqueIds.length === value;
    },
    // Same as unique, but not unique (equal to notifications.length)
    notificationsCount: function(value) {
        return this.notifications.length === value;
    },
    // Count the number of 'real' users has participed to this notification
    // It can slightly differ from 'real' counter
    // The subtract remove to the final length (like if you want to make
    // User 1, User 2, and {{notificationUniqueCounter 2}} has...)
    notificationsUniqueCounter: function (subtract) {
        var uniqueIds = _.uniq(this.notifications);
        return uniqueIds.length - subtract;
    },
    // Get first unique user
    getFirstUniqueUser: function() {
        return Meteor.users.findOne({
            _id: this.notifications[0],
            deletedAt: null
        });
    },
    // Get second unique user
    getSecondUniqueUser: function() {
        var uniqueIds = _.uniq(this.notifications);

        return Meteor.users.findOne({
            _id: uniqueIds[1],
            deletedAt: null
        });
    }
});

Tasks.helpers({
    project: function() {
        return Projects.findOne({
            _id: this.projectId,
            deletedAt: null
        });
    },
    owner: function() {
        return Meteor.users.findOne({
            _id: this.ownerId,
            deletedAt: null
        });
    },
    reviewer: function() {
        return Meteor.users.findOne({
            _id: this.reviewerId,
            deletedAt: null
        });
    },
    assign: function() {
        return Meteor.users.findOne({
            _id: this.assignId,
            deletedAt: null
        });
    }
});

/*
-----------------------
  SCHEMAS
-----------------------
*/
Schemas.Project = new SimpleSchema({
    // The project icon - color, choosen from semantic ui icons
    color: {
        type: String,
        label: 'Color',
        optional: true,
        max: 25
    },
    // The project name
    title: {
        type: String,
        label: 'Title',
        min: 1,
        max: 255
    },
    // Same as title, but lowercase
    search: {
        type: String,
        label: 'Search',
        min: 1,
        max: 255
    },
    // The project category (optional)
    category: {
        type: String,
        label: 'Category',
        optional: true,
        max: 255
    },
    // the owner id (user id)
    ownerId: {
        type: String,
        label: 'Owner',
        index: 1,
        min: 1,
        max: 255
    },
    // Users linked to the project
    users: {
        type: [Object],
        optional: true
    },
    'users.$._id': {
        type: String,
        label: 'User id',
        max: 255
    },
    'users.$.email': {
        type: String,
        label: 'User email',
        max: 255
    },
    'users.$.isAdmin': {
        type: Boolean,
        label: 'User is an administrator'
    },
    createdAt: {
        type: Date,
        autoValue: function() {
            if (this.isInsert) {
                return new Date();
            } else if (this.isUpsert) {
                return {
                    $setOnInsert: new Date()
                };
            } else {
                this.unset();
            }
        }
    },
    updatedAt: {
        type: Date,
        autoValue: function() {
            if (this.isUpdate) {
                return new Date();
            }
        },
        denyInsert: true,
        optional: true
    },
    deletedAt: {
        type: Date,
        optional: true
    }
});

Schemas.Echelon = new SimpleSchema({
    // The echelon title (seeable on the graphic)
    title: {
        type: String,
        label: 'Title',
        min: 1,
        max: 255
    },
    // Not visible on graphic, may be visible on another side
    description: {
        type: String,
        label: 'Description',
        optional: true,
        max: 5000
    },
    // Position
    top: {
        type: Number,
        label: 'Top',
        min: 0
    },
    left: {
        type: Number,
        label: 'Left',
        min: 0
    },
    // Belongs to
    ownerId: {
        type: String,
        label: 'Owner',
        index: 1,
        min: 1,
        max: 255
    },
    projectId: {
        type: String,
        label: 'Project',
        index: 1,
        min: 1,
        max: 255
    },
    // Different statistics about anything...
    statistics: {
        type: Object,
        optional: true,
        // does not care what's inside this object...
        blackbox: true
    },
    links: {
        type: [String],
        label: 'Related echelon (children echelon)'
    },
    // If it's a begin point or end point (cannot remove either)
    isBegin: {
        type: Boolean,
        label: 'Is a project begin Echelon'
    },
    isEnd: {
        type: Boolean,
        label: 'Is a project end Echelon'
    },
    // The echelon start date
    beginAt: {
        type: Date,
        label: 'Echelon begin date',
        optional: true
    },
    endAt: {
        type: Date,
        label: 'Echelon end date',
        optional: true
    },
    createdAt: {
        type: Date,
        autoValue: function() {
            if (this.isInsert) {
                return new Date();
            } else if (this.isUpsert) {
                return {
                    $setOnInsert: new Date()
                };
            } else {
                this.unset();
            }
        }
    },
    updatedAt: {
        type: Date,
        autoValue: function() {
            if (this.isUpdate) {
                return new Date();
            }
        },
        denyInsert: true,
        optional: true
    },
    deletedAt: {
        type: Date,
        optional: true
    }
});

Schemas.Message = new SimpleSchema({
    // The feed message
    message: {
        type: String,
        label: 'Message',
        max: 2048
    },
    // User which didn't see this message, should be "everybody" at first.
    // Little by little this array should change to "nothing".
    // This is a list of user IDs.
    unseenUsers: {
        type: [String],
        label: 'Unseen users',
        index: 1
    },
    // the owner id (user id)
    ownerId: {
        type: String,
        label: 'Owner',
        index: 1,
        min: 1,
        max: 255
    },
    // The project id is separated from routeParameters as it's
    // needed for DB search.
    projectId: {
        type: String,
        label: 'Project',
        index: 1,
        min: 1,
        max: 255
    },
    // Boolean value, not used for now, will allow to create custom
    // chat not always related to project for example...
    isGlobal: {
        type: Boolean,
        label: 'Is Global'
    },
    createdAt: {
        type: Date,
        autoValue: function() {
            if (this.isInsert) {
                return new Date();
            } else if (this.isUpsert) {
                return {
                    $setOnInsert: new Date()
                };
            } else {
                this.unset();
            }
        }
    },
    updatedAt: {
        type: Date,
        autoValue: function() {
            if (this.isUpdate) {
                return new Date();
            }
        },
        denyInsert: true,
        optional: true
    },
    deletedAt: {
        type: Date,
        optional: true
    }
});

Schemas.Activity = new SimpleSchema({
    // Both respond to same idea, icon should override type if existing
    // Type is more an internal element to know if we can group or not elements
    // while icon is more for showing to user...
    type: {
        type: String,
        label: 'Type',
        optional: true,
        max: 50
    },
    icon: {
        type: String,
        label: 'Icon',
        optional: true,
        max: 50
    },
    // Number of time a message of same type has been seen.
    // NOTE: this counter count user's id, who raise this activity...
    notifications: {
        type: [String],
        label: 'Notification state'
    },
    // If the user have seen this group or not
    unseen: {
        type: Boolean,
        label: 'Unseen state'
    },
    // the owner id (user id) => the user destination for this message
    ownerId: {
        type: String,
        label: 'Owner',
        index: 1,
        min: 1,
        max: 255
    },
    // The project id is separated from routeParameters as it's
    // needed for DB search.
    projectId: {
        type: String,
        label: 'Project',
        index: 1,
        min: 1,
        max: 255
    },
    // The route name and route parameters can be used with Router.go
    // to go on the URL related to the feed
    routeName: {
        type: String,
        label: 'Route Name',
        optional: true,
        max: 50
    },
    routeParameters: {
        type: Object,
        label: 'Route Parameters',
        // does not care what's inside this object...
        blackbox: true,
        optional: true
    },
    createdAt: {
        type: Date,
        autoValue: function() {
            if (this.isInsert) {
                return new Date();
            } else if (this.isUpsert) {
                return {
                    $setOnInsert: new Date()
                };
            } else {
                this.unset();
            }
        }
    },
    seenAt: {
        type: Date,
        optional: true
    },
    updatedAt: {
        type: Date,
        autoValue: function() {
            // This is a special case: we need updatedAt
            // always set to have the right sort...
            if (this.isInsert || this.isUpdate) {
                return new Date();
            }
        },
        optional: true
    },
    deletedAt: {
        type: Date,
        optional: true
    }
});


Schemas.Task = new SimpleSchema({
    // The task title
    title: {
        type: String,
        label: 'Title',
        min: 1,
        max: 2048
    },
    // The associated description
    description: {
        type: String,
        label: 'Description',
        optional: true,
        max: 4096
    },
    // Is the task is consider as ultra priority and should be treated
    // in priority or not.
    // 0: none, 1: low, 2: middle, 3: high, 4: urgent
    priority: {
        type: Number,
        label: 'Priority',
        allowedValues: [0, 1, 2, 3, 4],
        optional: true
    },
    // The person which will have to do the task
    assignId: {
        type: String,
        label: 'Assign person',
        optional: true,
        min: 1,
        max: 255
    },
    // The admin which has reviewed it...
    reviewerId: {
        type: String,
        label: 'Reviewer',
        denyInsert: true,
        optional: true,
        min: 1,
        max: 255
    },
    // the owner id (user id) - less important here
    ownerId: {
        type: String,
        label: 'Owner',
        index: 1,
        min: 1,
        max: 255
    },
    // The project id where the task is linked to
    projectId: {
        type: String,
        label: 'Project',
        index: 1,
        min: 1,
        max: 255
    },
    echelonId: {
        type: String,
        label: 'Echelon',
        index: 1,
        min: 1,
        max: 255
    },
    // When the task should get done
    dueAt: {
        type: Date,
        optional: true,
        label: 'Due date'
    },
    // When the task has been marked in progress by user
    progressAt: {
        type: Date,
        denyInsert: true,
        optional: true,
        label: 'Progress date'
    },
    // When the task has been marked as done by user
    doneAt: {
        type: Date,
        denyInsert: true,
        optional: true,
        label: 'Done date'
    },
    // When the admin has checked the job is done
    reviewedAt: {
        type: Date,
        denyInsert: true,
        optional: true,
        label: 'Reviewed date'
    },
    createdAt: {
        type: Date,
        autoValue: function() {
            if (this.isInsert) {
                return new Date();
            } else if (this.isUpsert) {
                return {
                    $setOnInsert: new Date()
                };
            } else {
                this.unset();
            }
        }
    },
    updatedAt: {
        type: Date,
        autoValue: function() {
            if (this.isUpdate) {
                return new Date();
            }
        },
        denyInsert: true,
        optional: true
    },
    deletedAt: {
        type: Date,
        optional: true
    }
});


Schemas.Comment = new SimpleSchema({
    comment: {
        type: String,
        label: 'Comment',
        min: 1,
        max: 4096
    },
    // List of people's ID who liked it.
    likes: {
        type: [String],
        label: 'Likes'
    },
    // List of people's ID who disliked it.
    dislikes: {
        type: [String],
        label: 'Dislikes'
    },
    // A comment may refer to another one (creating a parent/children relation).
    referId: {
        type: String,
        label: 'Refer',
        optional: true
    },
    // the owner id (user id) - less important here
    ownerId: {
        type: String,
        label: 'Owner',
        index: 1,
        min: 1,
        max: 255
    },
    // The project id where the task is linked to
    projectId: {
        type: String,
        label: 'Project',
        index: 1,
        min: 1,
        max: 255
    },
    echelonId: {
        type: String,
        label: 'Echelon',
        index: 1,
        min: 1,
        max: 255
    },
    // Comment can apply to various elements
    // You have to use at least one of them
    taskId: {
        type: String,
        label: 'Task',
        optional: true
    },
    pollId: {
        type: String,
        label: 'Poll',
        optional: true
    },
    fileId: {
        type: String,
        label: 'File',
        optional: true
    },
    // Date creation/update/delete
    createdAt: {
        type: Date,
        autoValue: function() {
            if (this.isInsert) {
                return new Date();
            } else if (this.isUpsert) {
                return {
                    $setOnInsert: new Date()
                };
            } else {
                this.unset();
            }
        }
    },
    updatedAt: {
        type: Date,
        autoValue: function() {
            if (this.isUpdate) {
                return new Date();
            }
        },
        denyInsert: true,
        optional: true
    },
    deletedAt: {
        type: Date,
        optional: true
    }
});

/*
-----------------------
  ATTACH
-----------------------
*/
Projects.attachSchema(Schemas.Project);
Activities.attachSchema(Schemas.Activity);
Messages.attachSchema(Schemas.Message);
Echelons.attachSchema(Schemas.Echelon);
Tasks.attachSchema(Schemas.Task);
Comments.attachSchema(Schemas.Comment);