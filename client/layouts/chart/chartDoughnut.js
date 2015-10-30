Template.chartDoughnut.helpers({
    prettyProgress: function (progress) {
        return progress || 0;
    },
    drawChart: function(series) {
        if (!series) {
            series = [{
                value: 100,
                color:'#F7464A',
                highlight: '#FF5A5E',
                label: 'Waiting'
            }];
        }

        var that = Template.instance();
        // We delay a little to have a nice looking
        window.setTimeout(function() {
            var ctx = that.$('.canvas').get(0).getContext('2d');

            new Chart(ctx).Doughnut(series, {
                percentageInnerCutout : 90,
                animationSteps : 80
            });
        }, 500);
        return null;
    },
    autoSize: function(size) {
        return size ? size: 150;
    }
});
