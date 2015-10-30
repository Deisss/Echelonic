window.routeCompare = {
    /**
     * Check if the given route and given parameters, meets the current route
     * and parameters.
     * NOTE: the test only work if all elements inside searchedParams exists
     * and are the same in currentParams. If currentParams has more elements,
     * it has no effect on this test.
     *
     * @param {String} searchedRoute        The route we want to check
     * @param {Object} searchedParams       The parameters we are checking
     * @param {String | Null} currentRoute  The current route to compare
     * @param {Object | Null} currentParams The current params to compare
     * @return {Boolean} True if everything went fine (same route and all
     * parameters from searchedParams exists and equals the ones in current)
    */
    check: function(searchedRoute, searchedParams, currentRoute, currentParams) {
        if (!currentRoute) {
            currentRoute = Router.current().route.getName();
        }
        if (!currentParams) {
            currentParams = Router.current().params;
        }

        if (!searchedRoute || !searchedParams) {
            return false;
        }

        var sameRoute  = (searchedRoute === currentRoute);
        var sameParams = true;

        for (var prop in searchedParams) {
            if (!(prop in currentParams) || currentParams[prop] !== searchedParams[prop]) {
                sameParams = false;
                break;
            }
        }

        return (sameRoute === true && sameParams === true);
    }
};