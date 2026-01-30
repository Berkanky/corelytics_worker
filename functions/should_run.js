function should_run(type, now_date, track_date) {

    if (!now_date) return false;
    if (!track_date) return true;

    var now = new Date(now_date);
    var last = new Date(track_date);

    if (isNaN(now.getTime()) || isNaN(last.getTime())) return true;

    if (type === "daily") {
        return !(
            now.getFullYear() === last.getFullYear() &&
            now.getMonth() === last.getMonth() &&
            now.getDate() === last.getDate()
        );
    }

    if (type === "weekly") {
        var startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        return last < startOfWeek;
    }

    if (type === "monthly") {
        return !(
            now.getFullYear() === last.getFullYear() &&
            now.getMonth() === last.getMonth()
        );
    }

    return false;
};

module.exports = should_run;