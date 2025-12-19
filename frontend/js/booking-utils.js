window.getBookingRealStatus = function (booking) {
    if (booking.status !== 'active') return booking.status;

    const now = new Date().getTime();
    const start = new Date(booking.start_time).getTime();
    const end = new Date(booking.end_time).getTime();

    if (now < start) return 'scheduled';
    if (now >= start && now <= end) return 'in_progress';
    return 'active';
};
