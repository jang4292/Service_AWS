'use strict';

class Utils {
    _toTimeString(seconds) {
        if (seconds < 0) seconds = 0;

        if (seconds / 60 / 60 / 24 > 1) {
            return Math.ceil(seconds / 60 / 60 / 24) + ' DAYS';
        } else {
            return [
                parseInt(seconds / 60 / 60),
                parseInt(seconds / 60 % 60),
                parseInt(seconds % 60)
            ]
                .join(":")
                .replace(/\b(\d)\b/g, "0$1");
        }
    };
}


