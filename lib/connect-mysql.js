module.exports = function (connect) {
		var Store = connect.session.Store;
		
		function MySQLStore(options) {
			var self  = this;
			var mysql = require("mysql");
			(function handleDisconnect() {
				var dbcon = mysql.createConnection(options.configuration);
				dbcon.on("error", function(err) {
					console.error(err);
					setTimeout(handleDisconnect,2000);
				});
				dbcon.connect(function(err) {
					if(err) { 
						console.error(err);
						setTimeout(handleDisconnect,2000); 
						return;
					};
					self.mysql = dbcon;
				});
			})();
			Store.call(self,options);
		}
		
		MySQLStore.prototype.__proto__ = Store.prototype;
		
		MySQLStore.prototype.get = function (sid, callback) {
			this.mysql.query('SELECT `session` FROM `sessions` WHERE `sid` = ?', [sid], function (err, result) {
				if(result && result[0] && result[0].session) {
						callback(null, JSON.parse(result[0].session));
				} else {
					callback(err);
				}
			}).on('error', function (err) { callback(err); });
		};
		
		MySQLStore.prototype.set = function (sid, session, callback) {
			var expires = new Date(session.cookie.expires).getTime() / 1000;
			session = JSON.stringify(session);
			this.mysql.query('INSERT INTO `sessions` (`sid`, `session`, `expires`) VALUES(?, ?, ?) ON DUPLICATE KEY UPDATE `session` = ?, `expires` = ?', [sid, session, expires, session, expires], function (err) {
					callback(err);
			});
		};
		
		MySQLStore.prototype.destroy = function (sid, callback) {
				this.mysql.query('DELETE FROM `sessions` WHERE `sid` = ?', [sid], function (err) {
						callback(err);
				});
		};
		
		return MySQLStore;
};
