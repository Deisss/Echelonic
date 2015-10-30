/**
 * Topological sorting algorithm. Used to catch any cycle in the echelon graph,
 * or to render a topologically sorted graph in timeline.
 *
 * @param nodes {Array}                     A node list of echelons, each
 *                                          echelons should contains "_id" and
 *                                          "links" properties at least.
 * @return {Array | Null}                   Null if there is any cycle, the
 *                                          topologically sorted result...
*/
Toposort = function(nodes) {
    // Test if a node got any icoming edge
    function hasIncomingEdge(list, node) {
        for (var i = 0, l = list.length; i < l; ++i) {
            if (_.contains(list[i].links, node._id)) {
                return true;
            }
        }
        return false;
    };

    // Khan Algorithm
    var L = [],
        S = _.filter(nodes, function(node) {
            return !hasIncomingEdge(nodes, node);
        }),
        n = null;

    while(S.length) {
        // Remove a node NODE from S
        n = S.pop();
        // Add NODE to tail of L
        L.push(n);

        var i = n.links.length;
        while (i--) {
            // Getting the node associated to the current stored id in links
            var m = _.findWhere(nodes, {
                _id: n.links[i]
            });

            // Remove edge e from the graph
            n.links.pop();

            if (!hasIncomingEdge(nodes, m)) {
                S.push(m);
            }
        }
    }

    // If any of them still got links, there is cycle somewhere
    var nodeWithEdge = _.find(nodes, function(node) {
        return node.links.length !== 0;
    });

    return (nodeWithEdge) ? null: L;
};