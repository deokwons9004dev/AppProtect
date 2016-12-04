var through = require('through');

module.exports = function (c, buffers) {
    c._upgraded = true;
    c.on('error', function () {
        s.destroy();
        c.destroy();
    });
    
    var s = through();
    s.buffers = buffers;
    s.pause();
    
    s.pause = (function () {
        var pause = s.pause;
        var paused = false;
        
        process.nextTick(function () {
            s.buffers.forEach(s.queue.bind(s));
            if (!paused) s.resume();
        });
        
        return function () {
            paused = true;
            return pause.apply(this, arguments);
        };
    })();
    
    c.pipe(s);
    return s;
};
