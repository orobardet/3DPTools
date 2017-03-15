module.exports = {
    duration: function (seconds) {
        var str = [];

        var minutes = Math.floor(seconds/60);
        seconds -= minutes*60;
        str.unshift(seconds + 'sec');
        if (minutes === 0) {
            return str.join(' ');
        }

        var hours = Math.floor(minutes/60);
        minutes -= hours*60;
        str.unshift(minutes + 'min');
        if (hours === 0) {
            return str.join(' ');
        }

        var days = Math.floor(hours/24);
        hours -= days*24;
        str.unshift(hours + 'hr');
        if (days === 0) {
            return str.join(' ');
        }

        str.unshift(days + 'd');

        return str.join(' ');
    },

    distance: function(distance) {
        var units = ['mm', 'm', 'km'];

        for (var i = 0; i < units.length; i++) {
            if (distance > 1000) {
                distance /= 1000;
            } else {
                return distance + units[i];
            }
        }

        return distance + units.pop();
    }
};
