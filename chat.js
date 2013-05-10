// reference to http://socket.io/#how-to-use

var app = require('http').createServer(handler)
	, io = require('socket.io').listen(app)
	, fs = require('fs')
	, exec = require('child_process').exec
	, monitor = require('./service-monitor');

app.listen(8004);

function handler (req, res) {
    fs.readFile(__dirname + '/index.html',
    function (err, data) {
        if (err) {
            res.writeHead(500);
            return res.end('Error loading index.html');
        }
   
        res.writeHead(200);
        res.end(data);
    });
}

var service = {id: 'lucy', 
	name: 'Lucy\'s Gorgeous Proj.', 
	desc: 'Developed by heekyoung.oh', 
	url: 'http://lucy.dangsam.com',
	count: 0};
monitor.report(service);

(function schedule() {
	setTimeout(function() {
		monitor.report(service, function() {
			console.log('monitor response');
			schedule();
		});
		console.log('users: ' + service.count);
	}, 10000);
})();

var usernamelist = {};
var useridlist = {};

io.sockets.on('connection', function (socket) {
	socket.on('client chat', function (data) {
		console.log(data);
		socket.emit('server echo chat', data);
		socket.broadcast.emit("server chat", data);
	});
	
	function echo_exec(cmd, callback) {
		exec(cmd, function(err, stdout, stderr) {
			if (err) {
				console.log(stderr + '\nError:' + err.code, err.code);
			} else {
				console.log(stdout);
			}
			socket.emit('system report', {err: err, stdout: stdout, stderr: stderr});
			
			callback(arguments);
		});
	}
	
	socket.on('systemIn', function(data){
		if(data.name) {
			usernamelist[data.name] = socket.nickname = data.name;
			useridlist[data.name] = socket.id;
			
			io.sockets.emit('systemIn', data);
			io.sockets.emit('systemList', usernamelist);
		}
	});
	
	socket.on('git pull', function (data) {
		console.log('git pull');
		echo_exec('git pull', function() {});
	});

	socket.on('restart', function (data) {
		console.log('restart');
		echo_exec('forever restart chat.js', function() {});
	});

	socket.on('disconnect', function (socket) {
		console.log('disconnect');
		service.count--;
		monitor.report(service);
	});

	service.count++;
	monitor.report(service);
});

